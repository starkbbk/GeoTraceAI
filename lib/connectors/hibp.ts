import { ExposureRecord, NormalizedInput, SourceEvidence } from "@/lib/osint/types";
import { config } from "@/lib/security/config";
import { cachedJson } from "./http";

type HibpBreach = {
  Name: string;
  Title?: string;
  Domain?: string;
  BreachDate?: string;
  AddedDate?: string;
  ModifiedDate?: string;
  PwnCount?: number;
  Description?: string;
  DataClasses?: string[];
  IsVerified?: boolean;
  IsFabricated?: boolean;
  IsSensitive?: boolean;
  IsRetired?: boolean;
  IsSpamList?: boolean;
};

type HibpCatalogBreach = HibpBreach;

export async function lookupBreachExposure(input: NormalizedInput) {
  if (!input.normalizedEmail) {
    return { evidence: [], records: [], breachCount: 0, enabled: false };
  }

  if (!config.hibpApiKey) {
    return {
      evidence: [
        {
          source: "Have I Been Pwned",
          type: "breach",
          title: "Breach exposure check disabled",
          confidence: 0.5,
          summary: "Set HIBP_API_KEY to enable breach count checks. The app never displays leaked passwords.",
          collectedAt: new Date().toISOString(),
          legalBasis: "disabled-placeholder"
        } satisfies SourceEvidence
      ],
      breachCount: 0,
      records: [],
      enabled: false
    };
  }

  const response = await cachedJson<HibpBreach[]>({
    source: "hibp",
    cacheKey: input.normalizedEmail,
    url: `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(input.normalizedEmail)}?truncateResponse=false`,
    ttlMs: 24 * 60 * 60_000,
    minIntervalMs: 1_600,
    init: {
      headers: {
        "hibp-api-key": config.hibpApiKey,
        "User-Agent": "GeoTraceAI"
      }
    }
  });

  if (response.status === 404) {
    return {
      evidence: [
        {
          source: "Have I Been Pwned",
          type: "breach",
          title: "No breach exposure returned",
          url: "https://haveibeenpwned.com/API/v3",
          confidence: 0.78,
          summary: "HIBP returned no breach records for the submitted email address.",
          collectedAt: new Date().toISOString(),
          legalBasis: "public-api",
          fields: { count: 0, cached: response.cached }
        } satisfies SourceEvidence
      ],
      records: [],
      breachCount: 0,
      enabled: true
    };
  }

  if (!response.ok || !response.data) {
    return {
      evidence: [
        {
          source: "Have I Been Pwned",
          type: "breach",
          title: "Breach exposure check unavailable",
          confidence: 0.35,
          summary: response.error ?? `HIBP returned HTTP ${response.status}.`,
          collectedAt: new Date().toISOString(),
          legalBasis: "public-api"
        } satisfies SourceEvidence
      ],
      records: [],
      breachCount: 0,
      enabled: true
    };
  }

  const breaches = response.data;
  const records = breaches.map((breach) => hibpExposureRecord(breach, input));
  const evidence: SourceEvidence = {
    source: "Have I Been Pwned",
    type: "breach",
    title: "Breach exposure count",
    url: "https://haveibeenpwned.com/API/v3",
    confidence: 0.86,
    summary: `${breaches.length} breach references found for the submitted email address.`,
    collectedAt: new Date().toISOString(),
    legalBasis: "public-api",
    fields: {
      count: breaches.length,
      sources: breaches.map((breach) => breach.Name).slice(0, 10).join(", "),
      cached: response.cached
    }
  };

  return { evidence: [evidence], records, breachCount: breaches.length, enabled: true };
}

export async function lookupPublicBreachCatalog(input: NormalizedInput) {
  const response = await cachedJson<HibpCatalogBreach[]>({
    source: "hibp-catalog",
    cacheKey: "breaches",
    url: "https://haveibeenpwned.com/api/v3/breaches",
    ttlMs: 24 * 60 * 60_000,
    minIntervalMs: 1_600,
    init: {
      headers: {
        "User-Agent": "GeoTraceAI"
      }
    }
  });

  if (!response.ok || !response.data) return { evidence: [], records: [] };

  const domain = input.normalizedDomain;
  const username = input.normalizedUsername;
  const matches = response.data
    .filter((breach) => {
      const haystack = `${breach.Name} ${breach.Title} ${breach.Domain}`.toLowerCase();
      return (domain && haystack.includes(domain)) || (username && haystack.includes(username));
    })
    .slice(0, 8);

  return {
    records: matches.map((breach) => ({
      ...hibpExposureRecord(breach, input),
      id: `catalog:${breach.Name}`,
      verified: false,
      inferred: true,
      confidence: 0.42,
      summary:
        "Public breach catalog metadata matched the supplied domain or username term. This does not prove the identifier appears in the breach."
    })),
    evidence: matches.length
      ? [
          {
            source: "Have I Been Pwned breach catalog",
            type: "breach",
            title: "Public breach catalog metadata matches",
            url: "https://haveibeenpwned.com/API/v3#AllBreaches",
            confidence: 0.42,
            summary: `${matches.length} public breach catalog entries matched supplied non-secret terms.`,
            collectedAt: new Date().toISOString(),
            legalBasis: "public-api",
            fields: { count: matches.length, cached: response.cached }
          } satisfies SourceEvidence
        ]
      : []
  };
}

function hibpExposureRecord(breach: HibpBreach, input: NormalizedInput): ExposureRecord {
  const dataClasses = breach.DataClasses ?? [];
  const severity = severityFromClasses(dataClasses, breach);
  return {
    id: `hibp:${breach.Name}`,
    source: "Have I Been Pwned",
    sourceUrl: "https://haveibeenpwned.com/",
    breachName: breach.Title ?? breach.Name,
    exposureType: "breach",
    identifierTypes: affectedIdentifierTypes(dataClasses, input),
    categories: dataClasses.length ? dataClasses : ["Breach metadata"],
    breachYear: breach.BreachDate ? Number(breach.BreachDate.slice(0, 4)) : undefined,
    firstSeen: breach.BreachDate,
    lastSeen: breach.ModifiedDate ?? breach.AddedDate,
    severity,
    confidence: breach.IsVerified === false ? 0.72 : 0.9,
    verified: Boolean(breach.IsVerified ?? true),
    inferred: false,
    summary: stripHtml(breach.Description) || "Public breach metadata returned by HIBP. Password values are never displayed."
  };
}

function affectedIdentifierTypes(dataClasses: string[], input: NormalizedInput): ExposureRecord["identifierTypes"] {
  const classes = dataClasses.join(" ").toLowerCase();
  const types = new Set<ExposureRecord["identifierTypes"][number]>();
  if (input.normalizedEmail || classes.includes("email")) types.add("email");
  if (input.normalizedPhone || classes.includes("phone")) types.add("phone");
  if (input.normalizedUsername || classes.includes("username")) types.add("username");
  if (input.normalizedIp || classes.includes("ip")) types.add("ip");
  if (classes.includes("password")) types.add("password-metadata");
  return Array.from(types);
}

function severityFromClasses(dataClasses: string[], breach: HibpBreach): ExposureRecord["severity"] {
  const joined = dataClasses.join(" ").toLowerCase();
  if (breach.IsSensitive || joined.includes("password") || joined.includes("credit card")) return "critical";
  if (joined.includes("phone") || joined.includes("physical address") || joined.includes("ip address")) return "high";
  if (joined.includes("email") || joined.includes("username")) return "medium";
  return "low";
}

function stripHtml(value?: string) {
  return value?.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}
