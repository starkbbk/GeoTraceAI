import { NormalizedInput, SourceEvidence, SupportedCountry } from "@/lib/osint/types";
import { cachedJson } from "./http";

type IpApiResult = {
  ip?: string;
  city?: string;
  region?: string;
  country_name?: string;
  country_code?: string;
  org?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  error?: boolean;
  reason?: string;
};

export type IpContext = {
  ip?: string;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: SupportedCountry;
  org?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
};

export async function lookupIpContext(input: NormalizedInput, clientIp?: string) {
  if (!clientIp || isPrivateIp(clientIp)) return { evidence: [], result: null };

  const url = `https://ipapi.co/${encodeURIComponent(clientIp)}/json/`;
  const response = await cachedJson<IpApiResult>({
    source: "ipapi",
    cacheKey: clientIp,
    url,
    ttlMs: 6 * 60 * 60_000,
    minIntervalMs: 1_000,
    init: {
      headers: {
        "User-Agent": "GeoTraceAI/1.0 authorized-osint"
      }
    }
  });

  const data = response.data;
  if (!response.ok || !data || data.error) {
    return {
      evidence: response.status
        ? [
            {
              source: "ipapi",
              type: "network",
              title: "Request network context unavailable",
              confidence: 0.2,
              summary: data?.reason ?? response.error ?? `ipapi returned HTTP ${response.status}.`,
              collectedAt: new Date().toISOString(),
              legalBasis: "public-api"
            } satisfies SourceEvidence
          ]
        : [],
      result: null
    };
  }

  const result: IpContext = {
    ip: data.ip,
    city: data.city,
    region: data.region,
    country: data.country_name,
    countryCode: toSupportedCountry(data.country_code),
    org: data.org,
    timezone: data.timezone,
    latitude: data.latitude,
    longitude: data.longitude
  };

  return {
    evidence: [
      {
        source: "ipapi",
        type: "network",
        title: "Request network context",
        url: "https://ipapi.co/api/",
        confidence: 0.48,
        summary:
          "Public IP context for the requesting connection. This is not asserted as the searched subject's ISP unless the IP was explicitly supplied as a target identifier.",
        collectedAt: new Date().toISOString(),
        legalBasis: "public-api",
        fields: {
          ip: result.ip ?? null,
          city: result.city ?? null,
          region: result.region ?? null,
          country: result.country ?? null,
          org: result.org ?? null,
          timezone: result.timezone ?? null,
          cached: response.cached
        }
      } satisfies SourceEvidence
    ],
    result
  };
}

function isPrivateIp(ip: string) {
  return (
    ip === "local" ||
    ip === "::1" ||
    ip === "127.0.0.1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip) ||
    /^fc|^fd/i.test(ip)
  );
}

function toSupportedCountry(country?: string): SupportedCountry | undefined {
  const value = country?.toUpperCase();
  return value === "IN" || value === "US" || value === "GB" || value === "AE" || value === "DE"
    ? value
    : value
      ? "GLOBAL"
      : undefined;
}
