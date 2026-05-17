import { listSearches } from "@/lib/db/memory-store";
import {
  DigitalFootprint,
  DomainIntelligence,
  ExposureCategory,
  ExposureIntelligence,
  ExposureRecord,
  NormalizedInput,
  PhoneIntelligence,
  RiskAnalysis,
  SourceEvidence
} from "./types";

type ExposureInput = {
  input: NormalizedInput;
  hibpRecords: ExposureRecord[];
  catalogRecords: ExposureRecord[];
  evidence: SourceEvidence[];
  footprint: DigitalFootprint;
  risk: RiskAnalysis;
  phoneIntel?: PhoneIntelligence;
  domainIntel?: DomainIntelligence;
};

export function buildExposureIntelligence({
  input,
  hibpRecords,
  catalogRecords,
  evidence,
  footprint,
  risk,
  phoneIntel,
  domainIntel
}: ExposureInput): ExposureIntelligence {
  const records = dedupeExposureRecords([
    ...hibpRecords,
    ...catalogRecords,
    ...publicProfileExposure(input, footprint),
    ...domainExposure(input, domainIntel),
    ...phoneExposure(input, phoneIntel),
    ...ipExposure(input),
    ...vehicleExposure(input),
    ...historyExposure(input)
  ]);
  const categories = buildCategories(records, risk);
  const timeline = records
    .map((record) => ({
      id: `timeline:${record.id}`,
      date: record.firstSeen ?? record.lastSeen ?? new Date().toISOString(),
      label: record.breachName,
      severity: record.severity,
      source: record.source,
      detail: record.summary
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 16);
  const breachCount = records.filter((record) => record.exposureType === "breach").length;
  const repeatedOverlap = repeatedIdentifierOverlap(records);
  const highestSeverity = maxSeverity(records.map((record) => record.severity));

  return {
    records,
    categories,
    timeline,
    breachCount,
    repeatedOverlap,
    highestSeverity,
    heatmap: buildHeatmap(records, evidence),
    alertHistory: buildAlerts(records, repeatedOverlap)
  };
}

function publicProfileExposure(input: NormalizedInput, footprint: DigitalFootprint): ExposureRecord[] {
  return [
    ...footprint.githubProfiles.map((profile) => ({
      id: `profile:github:${profile.login}`,
      source: "GitHub public API",
      sourceUrl: profile.url,
      breachName: `Public GitHub profile: ${profile.login}`,
      exposureType: "public-profile" as const,
      identifierTypes: ["username" as const],
      categories: ["Public profile", "Repository metadata"],
      severity: "low" as const,
      confidence: profile.confidence,
      verified: true,
      inferred: false,
      firstSeen: undefined,
      lastSeen: new Date().toISOString(),
      summary: "Public profile metadata found. This is not a breach and does not expose credentials."
    })),
    ...footprint.socialProfiles.map((profile) => ({
      id: `profile:${profile.platform}:${profile.handle}`,
      source: "Public social profile matching",
      sourceUrl: profile.url,
      breachName: `${profile.platform}: ${profile.handle}`,
      exposureType: "public-profile" as const,
      identifierTypes: ["username" as const],
      categories: ["Public social exposure"],
      severity: profile.confidence >= 0.5 ? ("low" as const) : ("medium" as const),
      confidence: profile.confidence,
      verified: profile.confidence >= 0.5,
      inferred: profile.confidence < 0.5,
      lastSeen: new Date().toISOString(),
      summary: profile.confidence >= 0.5 ? "Public profile endpoint matched." : "Public review link generated for analyst validation."
    })),
    ...(input.normalizedEmail
      ? [
          {
            id: `identifier:email:${input.normalizedEmail}`,
            source: "Submitted identifier",
            breachName: "Email identifier under monitoring",
            exposureType: "inferred-risk" as const,
            identifierTypes: ["email" as const],
            categories: ["Email exposure watch"],
            severity: "low" as const,
            confidence: 0.72,
            verified: false,
            inferred: true,
            lastSeen: new Date().toISOString(),
            summary: "Email added to local exposure monitoring. This record is an internal watch signal, not a breach."
          }
        ]
      : [])
  ];
}

function domainExposure(input: NormalizedInput, domainIntel?: DomainIntelligence): ExposureRecord[] {
  if (!input.normalizedDomain && !domainIntel) return [];
  const domain = input.normalizedDomain ?? domainIntel?.domain ?? "unknown-domain";
  return [
    {
      id: `domain:${domain}`,
      source: "Domain reputation intelligence",
      breachName: `Domain exposure posture: ${domain}`,
      exposureType: "reputation",
      identifierTypes: ["domain"],
      categories: domainIntel?.disposable ? ["Disposable email domain", "Credential reuse risk"] : ["Domain reputation"],
      severity: domainIntel?.disposable ? "high" : "low",
      confidence: domainIntel?.confidence ?? 0.42,
      verified: false,
      inferred: true,
      lastSeen: new Date().toISOString(),
      summary: domainIntel?.disposable
        ? "Disposable email domain increases public credential-reuse and attribution risk."
        : "No disposable-domain signal detected from the local public list."
    }
  ];
}

function phoneExposure(input: NormalizedInput, phoneIntel?: PhoneIntelligence): ExposureRecord[] {
  if (!input.normalizedPhone) return [];
  return [
    {
      id: `phone:${input.normalizedPhone}`,
      source: "Phone numbering intelligence",
      breachName: "Phone exposure watch",
      exposureType: "inferred-risk",
      identifierTypes: ["phone"],
      categories: ["Phone exposure", phoneIntel?.telecomCircle ?? "Telecom region"],
      severity: phoneIntel?.valid ? "low" : "medium",
      confidence: phoneIntel?.confidence ?? 0.28,
      verified: false,
      inferred: true,
      lastSeen: new Date().toISOString(),
      summary: "Phone format and broad region are derived from public numbering metadata only."
    }
  ];
}

function ipExposure(input: NormalizedInput): ExposureRecord[] {
  if (!input.normalizedIp) return [];
  return [
    {
      id: `ip:${input.normalizedIp}`,
      source: "Public IP reputation posture",
      breachName: "IP exposure watch",
      exposureType: "reputation",
      identifierTypes: ["ip"],
      categories: ["IP exposure"],
      severity: "medium",
      confidence: 0.42,
      verified: false,
      inferred: true,
      lastSeen: new Date().toISOString(),
      summary: "IP address accepted for monitoring posture. No private network or abuse database was queried."
    }
  ];
}

function vehicleExposure(input: NormalizedInput): ExposureRecord[] {
  if (!input.vehicleNumber) return [];
  return [
    {
      id: `vehicle:${input.vehicleNumber}`,
      source: "Vehicle format intelligence",
      breachName: "Vehicle identifier exposure watch",
      exposureType: "inferred-risk",
      identifierTypes: ["vehicle"],
      categories: ["Public identifier exposure"],
      severity: "low",
      confidence: 0.34,
      verified: false,
      inferred: true,
      lastSeen: new Date().toISOString(),
      summary: "Vehicle number is monitored as a public identifier only. Owner or RC records are not queried."
    }
  ];
}

function historyExposure(input: NormalizedInput): ExposureRecord[] {
  const overlaps = listSearches().filter(
    (profile) =>
      (input.normalizedEmail && profile.query.normalizedEmail === input.normalizedEmail) ||
      (input.normalizedPhone && profile.query.normalizedPhone === input.normalizedPhone) ||
      (input.normalizedUsername && profile.query.normalizedUsername === input.normalizedUsername) ||
      (input.normalizedDomain && profile.query.normalizedDomain === input.normalizedDomain)
  );
  if (!overlaps.length) return [];
  return [
    {
      id: `history-overlap:${overlaps.length}`,
      source: "Local monitoring history",
      breachName: "Repeated exposure search overlap",
      exposureType: "inferred-risk",
      identifierTypes: ["email", "phone", "username", "domain"].filter((type) =>
        overlaps.some((profile) => profile.query.signals.includes(type === "domain" ? "domain" : type))
      ) as ExposureRecord["identifierTypes"],
      categories: ["Repeated breach overlap", "Watchlist activity"],
      severity: overlaps.length > 2 ? "medium" : "low",
      confidence: Math.min(0.88, 0.42 + overlaps.length * 0.12),
      verified: false,
      inferred: true,
      lastSeen: new Date().toISOString(),
      summary: `${overlaps.length} local monitoring search overlap${overlaps.length === 1 ? "" : "s"} found.`
    }
  ];
}

function buildCategories(records: ExposureRecord[], risk: RiskAnalysis): ExposureCategory[] {
  const categoryDefs: Array<[ExposureCategory["key"], string, ExposureRecord["identifierTypes"][number] | "credential" | "social"]> = [
    ["email-exposure", "Email exposure", "email"],
    ["phone-exposure", "Phone exposure", "phone"],
    ["ip-exposure", "IP exposure", "ip"],
    ["username-exposure", "Username exposure", "username"],
    ["credential-reuse-risk", "Credential reuse risk", "credential"],
    ["social-exposure", "Public social exposure", "social"]
  ];
  return categoryDefs.map(([key, label, token]) => {
    const matches =
      token === "credential"
        ? records.filter((record) => record.categories.join(" ").toLowerCase().includes("password") || risk.breachExposureCount > 0)
        : token === "social"
          ? records.filter((record) => record.exposureType === "public-profile")
          : records.filter((record) => record.identifierTypes.includes(token));
    return {
      key,
      label,
      count: matches.length,
      severity: matches.length ? maxSeverity(matches.map((record) => record.severity)) : "low",
      confidence: matches.length ? matches.reduce((total, record) => total + record.confidence, 0) / matches.length : 0
    };
  });
}

function buildHeatmap(records: ExposureRecord[], evidence: SourceEvidence[]) {
  const labels = ["breach", "profile", "domain", "phone", "history", "manual"];
  return labels.map((label) => {
    const recordCount = records.filter((record) => record.source.toLowerCase().includes(label) || record.exposureType.includes(label)).length;
    const evidenceCount = evidence.filter((item) => item.source.toLowerCase().includes(label) || item.type.includes(label)).length;
    const value = recordCount + evidenceCount;
    return {
      label,
      value,
      severity: value >= 4 ? ("high" as const) : value >= 2 ? ("medium" as const) : ("low" as const)
    };
  });
}

function buildAlerts(records: ExposureRecord[], repeatedOverlap: number) {
  const critical = records.filter((record) => ["critical", "high"].includes(record.severity)).slice(0, 5);
  return [
    ...critical.map((record) => ({
      id: `alert:${record.id}`,
      label: `${record.severity.toUpperCase()} exposure: ${record.breachName}`,
      detail: record.summary,
      createdAt: record.lastSeen ?? record.firstSeen ?? new Date().toISOString(),
      severity: record.severity
    })),
    ...(repeatedOverlap
      ? [
          {
            id: "alert:repeated-overlap",
            label: "Repeated identifier overlap",
            detail: `${repeatedOverlap} repeated exposure overlaps detected across records.`,
            createdAt: new Date().toISOString(),
            severity: "medium" as const
          }
        ]
      : [])
  ];
}

function repeatedIdentifierOverlap(records: ExposureRecord[]) {
  const counts = new Map<string, number>();
  records.forEach((record) => {
    record.identifierTypes.forEach((type) => counts.set(type, (counts.get(type) ?? 0) + 1));
  });
  return Array.from(counts.values()).filter((count) => count > 1).length;
}

function dedupeExposureRecords(records: ExposureRecord[]) {
  return Array.from(new Map(records.map((record) => [record.id, record])).values()).sort((a, b) => b.confidence - a.confidence);
}

function maxSeverity(severities: ExposureRecord["severity"][]) {
  const order: ExposureRecord["severity"][] = ["low", "medium", "high", "critical"];
  return severities.reduce<ExposureRecord["severity"]>(
    (max, severity) => (order.indexOf(severity) > order.indexOf(max) ? severity : max),
    "low"
  );
}
