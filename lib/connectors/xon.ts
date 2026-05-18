import { ExposureRecord, NormalizedInput, SourceEvidence } from "@/lib/osint/types";
import { stableId } from "@/lib/utils";
import { cachedJson } from "./http";

export type XonBreach = {
  breach: string;
  details: string;
  domain: string;
  industry: string;
  logo: string;
  password_risk: string;
  searchable: string;
  verified: string;
  xposed_data: string;
  xposed_date: string;
  xposed_records: number;
};

type XonResponse = {
  ExposedBreaches: {
    breaches_details: XonBreach[];
  };
};

export async function lookupBreachExposureXon(input: NormalizedInput) {
  if (!input.normalizedEmail) {
    return { evidence: [], records: [], breachCount: 0, enabled: false };
  }

  const response = await cachedJson<XonResponse>({
    source: "xon",
    cacheKey: input.normalizedEmail,
    url: `https://api.xposedornot.com/v1/breach-analytics?email=${encodeURIComponent(input.normalizedEmail)}`,
    ttlMs: 24 * 60 * 60_000,
    minIntervalMs: 500, // XON allows 2 req/sec
    init: {
      headers: {
        "User-Agent": "GeoTraceAI"
      }
    }
  });

  if (response.status === 404 || !response.data?.ExposedBreaches?.breaches_details) {
    return {
      evidence: [
        {
          source: "XposedOrNot",
          type: "breach",
          title: "No breach exposure returned",
          url: "https://xposedornot.com/api_doc",
          confidence: 0.78,
          summary: "XposedOrNot returned no breach records for the submitted email address.",
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

  if (!response.ok) {
    return {
      evidence: [
        {
          source: "XposedOrNot",
          type: "breach",
          title: "Breach exposure check unavailable",
          confidence: 0.35,
          summary: response.error ?? `XposedOrNot returned HTTP ${response.status}.`,
          collectedAt: new Date().toISOString(),
          legalBasis: "public-api"
        } satisfies SourceEvidence
      ],
      records: [],
      breachCount: 0,
      enabled: true
    };
  }

  const breaches = response.data.ExposedBreaches.breaches_details;
  const records = breaches.map((breach) => xonExposureRecord(breach, input));
  
  const evidence: SourceEvidence = {
    source: "XposedOrNot",
    type: "breach",
    title: "Breach exposure count",
    url: "https://xposedornot.com/api_doc",
    confidence: 0.86,
    summary: `${breaches.length} breach references found for the submitted email address.`,
    collectedAt: new Date().toISOString(),
    legalBasis: "public-api",
    fields: {
      count: breaches.length,
      sources: breaches.map((breach) => breach.breach).slice(0, 10).join(", "),
      cached: response.cached
    }
  };

  return { evidence: [evidence], records, breachCount: breaches.length, enabled: true };
}

function xonExposureRecord(breach: XonBreach, input: NormalizedInput): ExposureRecord {
  const dataClasses = breach.xposed_data ? breach.xposed_data.split(";") : [];
  const severity = severityFromClasses(dataClasses, breach.password_risk);
  
  return {
    id: `xon:${breach.breach}`,
    source: "XposedOrNot",
    sourceUrl: "https://xposedornot.com/",
    breachName: breach.breach,
    exposureType: "breach",
    identifierTypes: affectedIdentifierTypes(dataClasses, input),
    categories: dataClasses.length ? dataClasses : ["Breach metadata"],
    breachYear: breach.xposed_date ? Number(breach.xposed_date) : undefined,
    firstSeen: breach.xposed_date ? `${breach.xposed_date}-01-01` : undefined,
    severity,
    confidence: breach.verified === "Yes" ? 0.9 : 0.72,
    verified: breach.verified === "Yes",
    inferred: false,
    summary: breach.details || "Public breach metadata returned by XposedOrNot. Password values are never displayed."
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

function severityFromClasses(dataClasses: string[], passwordRisk: string): ExposureRecord["severity"] {
  const joined = dataClasses.join(" ").toLowerCase();
  const risk = passwordRisk?.toLowerCase() || "";
  
  if (risk === "plaintext" || risk === "easytocrack" || joined.includes("password") || joined.includes("credit card")) return "critical";
  if (joined.includes("phone") || joined.includes("physical address") || joined.includes("ip address")) return "high";
  if (joined.includes("email") || joined.includes("username")) return "medium";
  return "low";
}
