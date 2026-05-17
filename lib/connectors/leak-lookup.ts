import { config } from "@/lib/security/config";
import { stableId } from "@/lib/utils";
import { cachedJson } from "./http";

export type LeakLookupIdentifierType = "email" | "username" | "domain" | "phone";
export type LeakLookupSeverity = "low" | "medium" | "high" | "critical";

export type LeakLookupBreachRecord = {
  id: string;
  source: string;
  sourceUrl: string;
  breachDate?: string;
  exposedFields: string[];
  riskScore: number;
  exposureCount: number;
  severity: LeakLookupSeverity;
  confidence: number;
  identifierType: LeakLookupIdentifierType;
  verified: boolean;
  inferred: boolean;
  recommendation: string;
  disclaimer: string;
};

export type LeakLookupSearchResult = {
  configured: boolean;
  ok: boolean;
  cached: boolean;
  provider: "Leak-Lookup";
  identifierType: LeakLookupIdentifierType;
  queryMasked: string;
  exposureCount: number;
  records: LeakLookupBreachRecord[];
  error?: string;
};

type RawLeakLookupResponse = unknown;

const TYPE_MAP: Record<LeakLookupIdentifierType, string> = {
  email: "email_address",
  username: "username",
  domain: "domain",
  phone: "phone"
};

const SENSITIVE_FIELD_PATTERN =
  /(^|[_\-\s])(pass(word)?|pwd|hash|salt|token|secret|credential|cookie|session|auth|api[_\-\s]?key|private[_\-\s]?key|otp|mfa|2fa)($|[_\-\s])/i;

const DEFAULT_FIELDS = ["Breach metadata"];

export async function searchLeakLookup({
  type,
  query
}: {
  type: LeakLookupIdentifierType;
  query: string;
}): Promise<LeakLookupSearchResult> {
  const normalizedQuery = query.trim();
  const masked = maskIdentifier(normalizedQuery, type);

  if (!config.leakLookupApiKey) {
    return {
      configured: false,
      ok: false,
      cached: false,
      provider: "Leak-Lookup",
      identifierType: type,
      queryMasked: masked,
      exposureCount: 0,
      records: [],
      error: "Leak-Lookup API key is not configured."
    };
  }

  const response = await cachedJson<RawLeakLookupResponse>({
    source: "leak-lookup",
    cacheKey: `${type}:${normalizedQuery.toLowerCase()}`,
    url: `${config.leakLookupApiUrl.replace(/\/$/, "")}/search`,
    ttlMs: 12 * 60 * 60_000,
    minIntervalMs: 1_200,
    timeoutMs: 8_000,
    retries: 2,
    retryDelayMs: 650,
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        "User-Agent": "GeoTraceAI"
      },
      body: new URLSearchParams({
        key: config.leakLookupApiKey,
        type: TYPE_MAP[type],
        query: normalizedQuery
      })
    }
  });

  if (!response.ok) {
    return {
      configured: true,
      ok: false,
      cached: response.cached,
      provider: "Leak-Lookup",
      identifierType: type,
      queryMasked: masked,
      exposureCount: 0,
      records: [],
      error: response.error ?? leakLookupError(response.data) ?? `Leak-Lookup returned HTTP ${response.status}.`
    };
  }

  const normalized = normalizeLeakLookupResponse(response.data, type);

  return {
    configured: true,
    ok: true,
    cached: response.cached,
    provider: "Leak-Lookup",
    identifierType: type,
    queryMasked: masked,
    exposureCount: normalized.exposureCount,
    records: normalized.records
  };
}

function normalizeLeakLookupResponse(raw: RawLeakLookupResponse, type: LeakLookupIdentifierType) {
  const entries = extractEntries(raw);
  const exposureCount = extractCount(raw) ?? entries.length;
  const records = entries
    .map((entry) => normalizeEntry(entry, type, exposureCount))
    .filter((record): record is LeakLookupBreachRecord => Boolean(record));

  if (!records.length && exposureCount > 0) {
    records.push({
      id: stableId("leaklookup"),
      source: "Leak-Lookup result",
      sourceUrl: "https://leak-lookup.com/",
      exposedFields: DEFAULT_FIELDS,
      riskScore: scoreRisk(DEFAULT_FIELDS, exposureCount),
      exposureCount,
      severity: severityFromScore(scoreRisk(DEFAULT_FIELDS, exposureCount)),
      confidence: 0.72,
      identifierType: type,
      verified: true,
      inferred: false,
      recommendation: recommendationFor(severityFromScore(scoreRisk(DEFAULT_FIELDS, exposureCount)), DEFAULT_FIELDS),
      disclaimer: legalDisclaimer()
    });
  }

  return {
    exposureCount: Math.max(exposureCount, records.reduce((sum, record) => sum + record.exposureCount, 0)),
    records
  };
}

function normalizeEntry(entry: unknown, type: LeakLookupIdentifierType, fallbackCount: number): LeakLookupBreachRecord | undefined {
  if (typeof entry === "string") {
    const source = sanitizeSource(entry);
    if (!source) return undefined;
    const riskScore = scoreRisk(DEFAULT_FIELDS, fallbackCount || 1);
    const severity = severityFromScore(riskScore);
    return {
      id: stableId("leaklookup"),
      source,
      sourceUrl: "https://leak-lookup.com/",
      exposedFields: DEFAULT_FIELDS,
      riskScore,
      exposureCount: 1,
      severity,
      confidence: 0.78,
      identifierType: type,
      verified: true,
      inferred: false,
      recommendation: recommendationFor(severity, DEFAULT_FIELDS),
      disclaimer: legalDisclaimer()
    } satisfies LeakLookupBreachRecord;
  }

  if (!isRecord(entry)) return undefined;

  const source =
    stringFrom(entry, ["source", "database", "breach", "leak", "name", "origin", "title"]) ?? "Leak-Lookup breach metadata";
  const date = parseDate(stringFrom(entry, ["date", "breach_date", "breachDate", "year", "last_breach", "first_seen"]));
  const exposedFields = extractExposedFields(entry);
  const exposureCount = numberFrom(entry, ["count", "records", "entries", "exposure_count", "exposureCount"]) ?? 1;
  const riskScore = scoreRisk(exposedFields, exposureCount);
  const severity = severityFromScore(riskScore);

  return {
    id: stableId("leaklookup"),
    source: sanitizeSource(source) || "Leak-Lookup breach metadata",
    sourceUrl: "https://leak-lookup.com/",
    breachDate: date,
    exposedFields,
    riskScore,
    exposureCount,
    severity,
    confidence: 0.82,
    identifierType: type,
    verified: true,
    inferred: false,
    recommendation: recommendationFor(severity, exposedFields),
    disclaimer: legalDisclaimer()
  } satisfies LeakLookupBreachRecord;
}

function extractEntries(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!isRecord(raw)) return [];

  const candidateKeys = ["result", "results", "data", "records", "sources", "breaches", "message"];
  for (const key of candidateKeys) {
    const value = raw[key];
    if (Array.isArray(value)) return value;
    if (isRecord(value)) return Object.entries(value).map(([source, detail]) => {
      if (isRecord(detail)) return { source, ...detail };
      return { source, fields: detail };
    });
  }

  const objectEntries = Object.entries(raw).filter(([key]) => !["error", "success", "found", "count"].includes(key));
  if (objectEntries.length && objectEntries.every(([, value]) => Array.isArray(value) || isRecord(value) || typeof value === "number")) {
    return objectEntries.map(([source, value]) => {
      if (isRecord(value)) return { source, ...value };
      return { source, count: typeof value === "number" ? value : undefined, fields: Array.isArray(value) ? value : undefined };
    });
  }

  return [];
}

function extractCount(raw: unknown) {
  if (!isRecord(raw)) return undefined;
  return numberFrom(raw, ["found", "count", "total", "exposure_count", "exposureCount"]);
}

function extractExposedFields(entry: Record<string, unknown>) {
  const fields = new Set<string>();
  const fieldContainers = ["fields", "columns", "data", "types", "exposed", "exposed_fields", "exposedFields"];

  for (const key of fieldContainers) {
    const value = entry[key];
    if (Array.isArray(value)) {
      for (const item of value) addField(fields, item);
    } else if (isRecord(value)) {
      for (const item of Object.keys(value)) addField(fields, item);
    } else if (typeof value === "string") {
      for (const item of value.split(/[,|;]/)) addField(fields, item);
    }
  }

  for (const key of Object.keys(entry)) {
    if (["source", "database", "breach", "leak", "name", "origin", "title", "date", "breach_date", "breachDate"].includes(key)) {
      continue;
    }
    if (SENSITIVE_FIELD_PATTERN.test(key)) {
      fields.add(maskFieldLabel(key));
      continue;
    }
    if (!["query", "email", "username", "domain", "phone"].includes(key.toLowerCase())) addField(fields, key);
  }

  return Array.from(fields).slice(0, 16).sort();
}

function addField(fields: Set<string>, value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return;
  const label = String(value).trim();
  if (!label) return;
  fields.add(SENSITIVE_FIELD_PATTERN.test(label) ? maskFieldLabel(label) : toTitle(label));
}

function maskFieldLabel(label: string) {
  const normalized = label.replace(/[_-]+/g, " ").trim();
  if (/hash|salt/i.test(normalized)) return "Credential hash metadata";
  if (/token|secret|cookie|session|auth|api key|private key|otp|mfa|2fa/i.test(normalized)) return "Sensitive authentication field";
  return "Password field present";
}

function scoreRisk(fields: string[], exposureCount: number) {
  const joined = fields.join(" ").toLowerCase();
  let score = 28;
  if (joined.includes("password") || joined.includes("credential") || joined.includes("authentication")) score += 38;
  if (joined.includes("phone") || joined.includes("address") || joined.includes("ip")) score += 18;
  if (joined.includes("email") || joined.includes("username")) score += 12;
  if (exposureCount >= 5) score += 12;
  if (exposureCount >= 20) score += 8;
  return Math.min(100, score);
}

function severityFromScore(score: number): LeakLookupSeverity {
  if (score >= 82) return "critical";
  if (score >= 64) return "high";
  if (score >= 42) return "medium";
  return "low";
}

function recommendationFor(severity: LeakLookupSeverity, fields: string[]) {
  const joined = fields.join(" ").toLowerCase();
  if (severity === "critical" || joined.includes("password")) {
    return "Rotate reused passwords, enforce MFA, review account recovery settings, and monitor related identifiers.";
  }
  if (severity === "high") {
    return "Review exposed services, enable MFA, and add this identifier to watchlist monitoring.";
  }
  if (severity === "medium") {
    return "Monitor for repeated exposure and verify public profile reuse across related identifiers.";
  }
  return "Keep monitoring enabled and recheck if new public breach metadata appears.";
}

function leakLookupError(raw: unknown) {
  if (!isRecord(raw)) return undefined;
  const value = stringFrom(raw, ["error", "message", "detail"]);
  return value ? redact(value) : undefined;
}

function maskIdentifier(value: string, type: LeakLookupIdentifierType) {
  if (!value) return "";
  if (type === "email") {
    const [local = "", domain = ""] = value.split("@");
    return `${local.slice(0, 2)}${"*".repeat(Math.max(2, local.length - 2))}@${domain}`;
  }
  if (type === "phone") {
    const digits = value.replace(/\D/g, "");
    return digits.length > 4 ? `${"*".repeat(Math.max(4, digits.length - 4))}${digits.slice(-4)}` : "****";
  }
  if (type === "domain") {
    const [name = "", ...rest] = value.split(".");
    return `${name.slice(0, 2)}${"*".repeat(Math.max(2, name.length - 2))}${rest.length ? `.${rest.join(".")}` : ""}`;
  }
  return `${value.slice(0, 2)}${"*".repeat(Math.max(2, value.length - 2))}`;
}

function sanitizeSource(value: string) {
  return redact(value).replace(/\s+/g, " ").trim().slice(0, 120);
}

function redact(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(/(?:\+?\d[\s().-]?){8,}/g, "[redacted-phone]")
    .replace(/(password|pass|pwd|token|secret|hash|cookie|session|credential)\s*[:=]\s*[^\s,;]+/gi, "$1=[redacted]");
}

function parseDate(value?: string) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (/^\d{4}$/.test(trimmed)) return `${trimmed}-01-01`;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
}

function numberFrom(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value.replace(/,/g, ""));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function stringFrom(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return redact(value.trim());
    if (typeof value === "number") return String(value);
  }
  return undefined;
}

function toTitle(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function legalDisclaimer() {
  return "Public-source breach metadata only. Plaintext passwords, stolen credentials, and private records are not displayed or stored.";
}
