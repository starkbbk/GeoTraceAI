import { generateAiSummary } from "@/lib/ai/providers";
import { lookupGithub } from "@/lib/connectors/github";
import { lookupGravatar } from "@/lib/connectors/gravatar";
import { lookupBreachExposure, lookupPublicBreachCatalog } from "@/lib/connectors/hibp";
import { lookupIndianPincode } from "@/lib/connectors/india-pincode";
import { lookupIpContext } from "@/lib/connectors/ipapi";
import { lookupLocation, reverseGeocode } from "@/lib/connectors/nominatim";
import { buildPublicSearchEvidence } from "@/lib/connectors/public-search";
import { lookupPublicUsername } from "@/lib/connectors/username-lookup";
import { writeAuditEvent } from "@/lib/security/audit";
import { stableId } from "@/lib/utils";
import { countryRules, validateRegionalInput } from "./country-engines";
import { buildDomainIntelligence } from "./domain-intel";
import { buildEntityLinking } from "./entity-linking";
import { buildExposureIntelligence } from "./exposure";
import { similarNameCandidates } from "./fuzzy";
import { buildPhoneIntelligence } from "./phone-intel";
import { buildVehicleIntelligence } from "./vehicle";
import {
  DigitalFootprint,
  IdentityProfile,
  LocationIntelligence,
  NormalizedInput,
  RelationshipGraph,
  RiskAnalysis,
  SearchTimelineEvent,
  SourceEvidence
} from "./types";

export async function buildIdentityProfile(
  input: NormalizedInput,
  actor = "anonymous",
  clientIp?: string
): Promise<IdentityProfile> {
  const id = stableId("search");
  const createdAt = new Date().toISOString();
  const audit = writeAuditEvent({
    actor,
    action: "search.started",
    target: id,
    metadata: {
      signals: input.signals,
      inferredCountry: input.inferredCountry
    }
  });

  const regional = validateRegionalInput(input);
  const vehicleIntel = buildVehicleIntelligence(input);
  const phoneIntel = buildPhoneIntelligence(input);
  const domainIntel = buildDomainIntelligence(input);
  const [location, github, hibp, breachCatalog, gravatar, publicUsername, pincode, ipapi] = await Promise.all([
    lookupLocation(input),
    lookupGithub(input),
    lookupBreachExposure(input),
    lookupPublicBreachCatalog(input),
    lookupGravatar(input),
    lookupPublicUsername(input),
    lookupIndianPincode(input),
    lookupIpContext(input, clientIp)
  ]);
  const reverse = await reverseBestCoordinates(location.result, ipapi.result);
  const searchEvidence = buildPublicSearchEvidence(input);
  const systemEvidence = buildSystemEvidence(input, regional.issues);
  const evidence = [
    ...location.evidence,
    ...reverse.evidence,
    ...pincode.evidence,
    ...ipapi.evidence,
    ...github.evidence,
    ...gravatar.evidence,
    ...hibp.evidence,
    ...breachCatalog.evidence,
    ...publicUsername.evidence,
    ...phoneIntel.evidence,
    ...domainIntel.evidence,
    ...vehicleIntel.evidence,
    ...searchEvidence,
    ...systemEvidence
  ];

  const locationIntel = buildLocation(input, location.result, pincode.result, ipapi.result, reverse.result);
  const footprint = buildFootprint(
    input,
    github.profiles,
    gravatar.emails,
    gravatar.websites,
    publicUsername.profiles
  );
  const risk = buildRisk(input, evidence, hibp.breachCount);
  const exposure = buildExposureIntelligence({
    input,
    hibpRecords: hibp.records,
    catalogRecords: breachCatalog.records,
    evidence,
    footprint,
    risk,
    phoneIntel: phoneIntel.phoneIntel,
    domainIntel: domainIntel.domainIntel
  });
  const linking = buildEntityLinking({
    input,
    location: locationIntel,
    footprint,
    evidence,
    risk,
    phoneIntel: phoneIntel.phoneIntel,
    domainIntel: domainIntel.domainIntel
  });
  const graph = buildGraph(input, evidence, locationIntel, footprint, linking.possibleMatches);
  const timeline = buildTimeline(input, evidence, regional.issues);
  const confidence = calculateConfidence(input, evidence, regional.score, risk, linking.mergedConfidence);

  const ai = await generateAiSummary({
    querySummary: summarizeQuery(input),
    evidenceSummary: evidence
      .slice(0, 6)
      .map((item) => `${item.source}: ${item.title}`)
      .join("; "),
    riskSummary: `${risk.reputation}, exposure severity ${exposure.highestSeverity}, ${exposure.breachCount} breach metadata records, ${risk.breachExposureCount} direct breach references`
  });

  const profile: IdentityProfile = {
    id,
    createdAt,
    query: input,
    possibleFullName: input.fullName,
    companyName: input.companyName,
    country: locationIntel.country ?? regional.rules.label,
    city: locationIntel.city,
    state: locationIntel.state,
    approximateArea: locationIntel.approximateArea,
    timezone: locationIntel.timezone,
    languages: locationIntel.languages,
    genderPrediction: {
      value: "not-inferred",
      confidence: 0,
      note: "GeoTrace AI does not infer gender from public identifiers because it is unreliable and privacy-sensitive."
    },
    confidence: Math.min(0.98, confidence + ai.confidenceAdjustment),
    location: locationIntel,
    phoneIntel: phoneIntel.phoneIntel,
    domainIntel: domainIntel.domainIntel,
    avatars: linking.avatars,
    possibleMatches: linking.possibleMatches,
    confidenceFactors: linking.confidenceFactors,
    investigationTasks: linking.investigationTasks,
    vehicle: vehicleIntel.vehicle,
    exposure,
    footprint,
    risk,
    aiSummary: ai.summary,
    evidence,
    graph,
    timeline,
    compliance: {
      mode: "authorized-public-osint",
      sensitiveModules: [
        {
          name: "Face similarity search",
          status: "disabled",
          reason: "Placeholder only. Enable only for consented image matching with documented legal basis."
        },
        {
          name: "Truecaller-like phone metadata",
          status: "requires-review",
          reason: "Use only licensed public metadata providers with clear terms and consent controls."
        },
        {
          name: "Voter record aggregation",
          status: "requires-review",
          reason: "Jurisdiction-specific restrictions apply; no scraping or private databases are included."
        },
        {
          name: "Vehicle owner/RC record lookup",
          status: "disabled",
          reason: "Vehicle module parses public registration formats only. It does not expose owner data or protected RC records."
        }
      ],
      auditId: audit.id
    }
  };

  writeAuditEvent({
    actor,
    action: "search.completed",
    target: id,
    metadata: {
      confidence: profile.confidence,
      evidenceCount: profile.evidence.length,
      risk: profile.risk.reputation
    }
  });

  return profile;
}

function buildSystemEvidence(input: NormalizedInput, issues: string[]): SourceEvidence[] {
  const now = new Date().toISOString();
  const names = similarNameCandidates(input.fullName);
  return [
    {
      source: "GeoTrace regional parser",
      type: "system",
      title: `Country-aware parsing: ${countryRules[input.inferredCountry].label}`,
      confidence: input.confidence,
      summary:
        issues.length > 0
          ? `Validation warnings: ${issues.join(" ")}`
          : countryRules[input.inferredCountry].publicRecordGuidance,
      collectedAt: now,
      fields: {
        signals: input.signals.join(", "),
        nameVariants: names.join(", ") || null,
        normalizedPhone: input.normalizedPhone ?? null,
        phoneCountry: input.phoneCountry ?? null,
        phoneValid: input.phoneValid ?? null,
        phoneNationalNumber: input.phoneNationalNumber ?? null,
        vehicleNumber: input.vehicleNumber ?? null
      },
      legalBasis: "derived"
    }
  ];
}

function buildLocation(
  input: NormalizedInput,
  geocode: Awaited<ReturnType<typeof lookupLocation>>["result"],
  pincode: Awaited<ReturnType<typeof lookupIndianPincode>>["result"],
  ipapi: Awaited<ReturnType<typeof lookupIpContext>>["result"],
  reverse: Awaited<ReturnType<typeof reverseBestCoordinates>>["result"]
): LocationIntelligence {
  const rules = countryRules[input.inferredCountry];
  const cityState = input.cityState?.split(",").map((part) => part.trim());
  const city = geocode?.city ?? pincode?.city ?? reverse?.city ?? cityState?.[0];
  const state = geocode?.state ?? pincode?.state ?? reverse?.state ?? cityState?.[1];
  const country = geocode?.country ?? pincode?.country ?? reverse?.country ?? rules.label;
  const timezone = inferTimezone(input, city, state, ipapi);

  return {
    country,
    countryCode: input.inferredCountry,
    state,
    city,
    approximateArea: geocode?.area ?? pincode?.district ?? input.normalizedPincode ?? city,
    timezone,
    coordinates: geocode
      ? {
          lat: geocode.lat,
          lng: geocode.lng,
          confidenceRadiusKm: input.normalizedPincode ? 12 : 35
        }
      : fallbackCoordinates(input.inferredCountry),
    languages: rules.languages,
    nearbyLandmarks: buildLandmarks(geocode?.displayName, pincode),
    networkProvider: ipapi?.org,
    ipContext: ipapi ?? undefined
  };
}

function fallbackCoordinates(country: NormalizedInput["inferredCountry"]) {
  const coords = {
    IN: { lat: 22.9734, lng: 78.6569 },
    US: { lat: 39.8283, lng: -98.5795 },
    GB: { lat: 54.7024, lng: -3.2766 },
    AE: { lat: 23.4241, lng: 53.8478 },
    DE: { lat: 51.1657, lng: 10.4515 },
    GLOBAL: { lat: 20, lng: 0 }
  };
  return { ...coords[country], confidenceRadiusKm: country === "GLOBAL" ? 2500 : 450 };
}

function buildFootprint(
  input: NormalizedInput,
  githubProfiles: DigitalFootprint["githubProfiles"],
  emails: DigitalFootprint["emails"],
  websites: DigitalFootprint["websites"],
  publicProfiles: DigitalFootprint["socialProfiles"]
): DigitalFootprint {
  const usernames = dedupeUsernameEvidence([
    ...(input.normalizedUsername ? [{ username: input.normalizedUsername, platform: "Submitted handle", confidence: 0.82 }] : []),
    ...githubProfiles.map((profile) => ({
      username: profile.login,
      platform: "GitHub",
      confidence: profile.confidence
    })),
    ...publicProfiles.map((profile) => ({
      username: profile.handle,
      platform: profile.platform,
      confidence: profile.confidence
    }))
  ]);

  return {
    socialProfiles: dedupeSocialProfiles([
      ...publicProfiles,
      ...(input.normalizedUsername
        ? [
            {
              platform: "LinkedIn public search",
              handle: input.normalizedUsername,
              url: `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(input.normalizedUsername)}`,
              confidence: 0.28
            }
          ]
        : [])
    ]),
    githubProfiles,
    websites: dedupeWebsites(websites),
    emails,
    usernames
  };
}

function buildRisk(input: NormalizedInput, evidence: SourceEvidence[], breachCount: number): RiskAnalysis {
  const lowConfidenceEvidence = evidence.filter((item) => item.confidence < 0.45).length;
  const disposableEmail = evidence.some(
    (item) => item.source === "Domain intelligence" && item.fields?.disposable === true
  );
  const scamLikelihood = Math.min(
    0.92,
    0.12 +
      breachCount * 0.05 +
      (input.signals.length <= 1 ? 0.12 : 0) +
      (input.normalizedEmail?.includes("+") ? 0.05 : 0) +
      (disposableEmail ? 0.18 : 0) +
      (input.phoneValid === false ? 0.06 : 0) +
      lowConfidenceEvidence * 0.015
  );

  const reputation =
    breachCount >= 8 || scamLikelihood > 0.7
      ? "high-risk"
      : breachCount >= 3 || scamLikelihood > 0.45
        ? "elevated"
        : breachCount > 0 || scamLikelihood > 0.25
          ? "watch"
          : "low-risk";

  return {
    scamLikelihood,
    spamReports: 0,
    breachExposureCount: breachCount,
    reputation,
    indicators: [
      breachCount > 0 ? `${breachCount} breach exposure references found` : "No breach count returned by configured checks",
      disposableEmail ? "Disposable email domain detected" : "No local disposable email domain signal",
      input.phoneValid === false ? "Phone format failed libphonenumber-js validation" : "Phone parser completed when phone was supplied",
      input.vehicleNumber ? "Vehicle module used public format/RTO metadata only; no owner records were accessed" : "No vehicle plate supplied",
      input.signals.length <= 1 ? "Single-signal query has lower identity confidence" : "Multiple query signals improve correlation",
      "No private databases or leaked passwords were accessed"
    ]
  };
}

function buildGraph(
  input: NormalizedInput,
  evidence: SourceEvidence[],
  location: LocationIntelligence,
  footprint: DigitalFootprint,
  possibleMatches: Array<{ id: string; title: string; confidence: number }>
): RelationshipGraph {
  const subjectId = "subject";
  const nodes: RelationshipGraph["nodes"] = [
    {
      id: subjectId,
      label: input.fullName ?? input.companyName ?? input.normalizedUsername ?? "Unknown subject",
      type: input.companyName ? "company" : "person",
      confidence: input.confidence
    }
  ];
  const edges: RelationshipGraph["edges"] = [];

  addNode(nodes, edges, subjectId, "country", location.country, "location", 0.78);
  addNode(nodes, edges, subjectId, "city", location.city, "location", 0.72);
  addNode(nodes, edges, subjectId, "isp", location.networkProvider, "source", 0.48);
  addNode(nodes, edges, subjectId, "email", input.normalizedEmail, "email", 0.9);
  addNode(nodes, edges, subjectId, "phone", input.normalizedPhone, "phone", 0.78);
  addNode(nodes, edges, subjectId, "username", input.normalizedUsername, "username", 0.82);
  addNode(nodes, edges, subjectId, "vehicle", input.vehicleNumber, "vehicle", 0.7);

  footprint.githubProfiles.forEach((profile) => {
    addNode(nodes, edges, subjectId, `github-${profile.login}`, profile.login, "username", profile.confidence);
  });

  footprint.socialProfiles.forEach((profile) => {
    addNode(nodes, edges, subjectId, `social-${profile.platform}-${profile.handle}`, profile.handle, "username", profile.confidence);
  });

  possibleMatches.slice(0, 4).forEach((match) => {
    addNode(nodes, edges, subjectId, `match-${match.id}`, match.title, "source", match.confidence);
  });

  evidence.slice(0, 8).forEach((item, index) => {
    const id = `source-${index}`;
    nodes.push({ id, label: item.source, type: "source", confidence: item.confidence });
    edges.push({ from: subjectId, to: id, label: item.type, confidence: item.confidence });
  });

  return { nodes, edges };
}

function addNode(
  nodes: RelationshipGraph["nodes"],
  edges: RelationshipGraph["edges"],
  from: string,
  id: string,
  label: string | undefined,
  type: RelationshipGraph["nodes"][number]["type"],
  confidence: number
) {
  if (!label) return;
  nodes.push({ id, label, type, confidence });
  edges.push({ from, to: id, label: "linked", confidence });
}

function buildTimeline(input: NormalizedInput, evidence: SourceEvidence[], issues: string[]): SearchTimelineEvent[] {
  const now = new Date().toISOString();
  return [
    {
      id: "normalize",
      label: "Normalize identifiers",
      status: "complete",
      detail: `${input.signals.length} signal groups parsed for ${countryRules[input.inferredCountry].label}.`,
      timestamp: now
    },
    {
      id: "regional",
      label: "Regional validation",
      status: issues.length ? "partial" : "complete",
      detail: issues.length ? issues.join(" ") : "Formats matched regional parser expectations.",
      timestamp: now
    },
    {
      id: "sources",
      label: "Public-source connectors",
      status: evidence.length ? "complete" : "partial",
      detail: `${evidence.length} evidence records generated from configured connectors.`,
      timestamp: now
    },
    {
      id: "ai",
      label: "AI correlation",
      status: "complete",
      detail: "Generated cautious summary and confidence adjustment.",
      timestamp: now
    }
  ];
}

function calculateConfidence(
  input: NormalizedInput,
  evidence: SourceEvidence[],
  regionalScore: number,
  risk: RiskAnalysis,
  mergedConfidence: number
) {
  const evidenceScore = evidence.length
    ? evidence.reduce((total, item) => total + item.confidence, 0) / evidence.length
    : 0.2;
  const signalScore = Math.min(1, input.signals.length / 5);
  const riskPenalty = risk.reputation === "high-risk" ? 0.08 : risk.reputation === "elevated" ? 0.04 : 0;
  const legacyScore = evidenceScore * 0.42 + signalScore * 0.24 + regionalScore * 0.14 + mergedConfidence * 0.2;
  const comboBoost =
    input.fullName && input.normalizedPhone && (input.cityState || input.normalizedPincode) ? 0.08 : 0;
  return Math.max(0.12, Math.min(0.95, legacyScore + comboBoost - riskPenalty));
}

function summarizeQuery(input: NormalizedInput) {
  return [
    input.fullName && `name=${input.fullName}`,
    input.companyName && `company=${input.companyName}`,
    input.normalizedUsername && `username=${input.normalizedUsername}`,
    input.normalizedEmail && `email-domain=${input.normalizedEmail.split("@")[1]}`,
    input.normalizedPhone && `phone-prefix=${input.normalizedPhone.slice(0, 4)}`,
    input.phoneCountry && `phone-country=${input.phoneCountry}`,
    input.vehicleNumber && `vehicle-plate=${input.vehicleNumber.replace(/\s+/g, "").toUpperCase()}`,
    input.cityState && `location=${input.cityState}`,
    `country=${input.inferredCountry}`
  ]
    .filter(Boolean)
    .join(", ");
}

async function reverseBestCoordinates(
  geocode: Awaited<ReturnType<typeof lookupLocation>>["result"],
  ipapi: Awaited<ReturnType<typeof lookupIpContext>>["result"]
) {
  if (geocode) return reverseGeocode(geocode.lat, geocode.lng, "detected location");
  if (ipapi?.latitude && ipapi.longitude) return reverseGeocode(ipapi.latitude, ipapi.longitude, "request IP context");
  return { evidence: [], result: null };
}

function buildLandmarks(
  displayName: string | undefined,
  pincode: Awaited<ReturnType<typeof lookupIndianPincode>>["result"]
) {
  const values = new Set<string>();
  displayName
    ?.split(",")
    .slice(0, 4)
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => values.add(item));
  pincode?.postOffices.slice(0, 4).forEach((office) => values.add(`${office.name} (${office.branchType ?? "Post office"})`));
  return Array.from(values);
}

function inferTimezone(
  input: NormalizedInput,
  city: string | undefined,
  state: string | undefined,
  ipapi: Awaited<ReturnType<typeof lookupIpContext>>["result"]
) {
  if (input.inferredCountry === ipapi?.countryCode && ipapi.timezone) return ipapi.timezone;
  if (input.inferredCountry === "US") {
    const location = `${city ?? ""} ${state ?? ""}`.toLowerCase();
    if (/(california|washington|oregon|nevada|los angeles|san francisco|seattle|portland)/.test(location)) {
      return "America/Los_Angeles";
    }
    if (/(colorado|utah|arizona|denver|phoenix|salt lake)/.test(location)) return "America/Denver";
    if (/(texas|illinois|chicago|dallas|houston|austin)/.test(location)) return "America/Chicago";
  }
  return countryRules[input.inferredCountry].timezoneHints[0];
}

function dedupeSocialProfiles(items: DigitalFootprint["socialProfiles"]) {
  return Array.from(new Map(items.map((item) => [`${item.platform}:${item.handle}`, item])).values());
}

function dedupeUsernameEvidence(items: DigitalFootprint["usernames"]) {
  return Array.from(new Map(items.map((item) => [`${item.platform}:${item.username}`, item])).values());
}

function dedupeWebsites(items: DigitalFootprint["websites"]) {
  return Array.from(new Map(items.map((item) => [item.url, item])).values());
}
