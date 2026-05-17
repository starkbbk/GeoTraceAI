import { SourceEvidence, NormalizedInput } from "@/lib/osint/types";
import { config } from "@/lib/security/config";
import { cachedJson } from "./http";

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
  importance?: number;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    country_code?: string;
    postcode?: string;
    suburb?: string;
    county?: string;
  };
};

export async function lookupLocation(input: NormalizedInput) {
  const query = [input.cityState, input.normalizedPincode, input.country].filter(Boolean).join(", ");
  if (!query) return { evidence: [], result: null };

  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "1",
    limit: "1",
    email: config.publicApiContactEmail
  });
  const response = await cachedJson<NominatimResult[]>({
    source: "nominatim",
    cacheKey: `search:${query.toLowerCase()}`,
    url: `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    ttlMs: 24 * 60 * 60_000,
    minIntervalMs: 1_100,
    init: {
      headers: {
        "User-Agent": userAgent(),
        Referer: config.appUrl
      }
    }
  });

  if (!response.ok) {
    return {
      evidence: response.status
        ? [
            {
              source: "OpenStreetMap Nominatim",
              type: "map",
              title: "Public map geocoding unavailable",
              url: "https://nominatim.openstreetmap.org/",
              confidence: 0.2,
              summary: response.error ?? `Nominatim returned HTTP ${response.status}.`,
              collectedAt: new Date().toISOString(),
              legalBasis: "public-api"
            } satisfies SourceEvidence
          ]
        : [],
      result: null
    };
  }

  const result = response.data?.[0];
  if (!result) return { evidence: [], result: null };

  const evidence: SourceEvidence = {
    source: "OpenStreetMap Nominatim",
    type: "map",
    title: "Public map geocoding match",
    url: "https://www.openstreetmap.org/",
    confidence: Math.min(0.88, result.importance ?? 0.64),
    summary: result.display_name,
    collectedAt: new Date().toISOString(),
    legalBasis: "public-api",
    fields: {
      lat: Number(result.lat),
      lon: Number(result.lon),
      postcode: result.address?.postcode ?? null,
      cached: response.cached
    }
  };

  return {
    evidence: [evidence],
    result: {
      lat: Number(result.lat),
      lng: Number(result.lon),
      displayName: result.display_name,
      city: result.address?.city ?? result.address?.town ?? result.address?.village,
      state: result.address?.state ?? result.address?.county,
      country: result.address?.country,
      countryCode: result.address?.country_code?.toUpperCase(),
      area: result.address?.suburb ?? result.address?.postcode ?? result.display_name.split(",").slice(0, 2).join(", ")
    }
  };
}

export async function reverseGeocode(lat: number, lng: number, label = "coordinates") {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "jsonv2",
    addressdetails: "1",
    email: config.publicApiContactEmail
  });
  const response = await cachedJson<NominatimResult>({
    source: "nominatim",
    cacheKey: `reverse:${lat.toFixed(4)},${lng.toFixed(4)}`,
    url: `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
    ttlMs: 24 * 60 * 60_000,
    minIntervalMs: 1_100,
    init: {
      headers: {
        "User-Agent": userAgent(),
        Referer: config.appUrl
      }
    }
  });

  const result = response.data;
  if (!response.ok || !result) return { evidence: [], result: null };

  return {
    evidence: [
      {
        source: "OpenStreetMap Nominatim",
        type: "map",
        title: `Reverse geocoding for ${label}`,
        url: "https://nominatim.openstreetmap.org/",
        confidence: 0.62,
        summary: result.display_name,
        collectedAt: new Date().toISOString(),
        legalBasis: "public-api",
        fields: {
          lat,
          lon: lng,
          city: result.address?.city ?? result.address?.town ?? result.address?.village ?? null,
          state: result.address?.state ?? result.address?.county ?? null,
          country: result.address?.country ?? null,
          cached: response.cached
        }
      } satisfies SourceEvidence
    ],
    result: {
      displayName: result.display_name,
      city: result.address?.city ?? result.address?.town ?? result.address?.village,
      state: result.address?.state ?? result.address?.county,
      country: result.address?.country,
      countryCode: result.address?.country_code?.toUpperCase(),
      area: result.address?.suburb ?? result.address?.postcode ?? result.display_name.split(",").slice(0, 2).join(", ")
    }
  };
}

function userAgent() {
  return `MarcoXFinder/1.0 (authorized public-source research; contact: ${config.publicApiContactEmail})`;
}
