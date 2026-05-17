import { NormalizedInput, SourceEvidence } from "@/lib/osint/types";
import { cachedJson } from "./http";

type IndiaPostOffice = {
  Name?: string;
  Description?: string | null;
  BranchType?: string;
  DeliveryStatus?: string;
  Circle?: string;
  District?: string;
  Division?: string;
  Region?: string;
  Block?: string;
  State?: string;
  Country?: string;
  Pincode?: string;
};

type IndiaPincodeResponse = Array<{
  Message?: string;
  Status?: string;
  PostOffice?: IndiaPostOffice[] | null;
}>;

export type IndiaPincodeResult = {
  pincode: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  postOffices: Array<{
    name: string;
    branchType?: string;
    deliveryStatus?: string;
    district?: string;
    state?: string;
  }>;
};

export async function lookupIndianPincode(input: NormalizedInput) {
  const pincode = input.normalizedPincode;
  if (input.inferredCountry !== "IN" || !pincode || !/^\d{6}$/.test(pincode)) {
    return { evidence: [], result: null };
  }

  const response = await cachedJson<IndiaPincodeResponse>({
    source: "india-pincode",
    cacheKey: pincode,
    url: `https://api.postalpincode.in/pincode/${encodeURIComponent(pincode)}`,
    ttlMs: 7 * 24 * 60 * 60_000,
    minIntervalMs: 500,
    init: {
      headers: {
        "User-Agent": "GeoTraceAI/1.0 authorized-osint"
      }
    }
  });

  const record = response.data?.[0];
  const offices = record?.PostOffice ?? [];
  if (!response.ok || !record || record.Status !== "Success" || offices.length === 0) {
    return {
      evidence: response.status
        ? [
            {
              source: "Postal PIN Code API India",
              type: "map",
              title: "Indian pincode lookup returned no post offices",
              url: "https://api.postalpincode.in/",
              confidence: 0.3,
              summary: record?.Message ?? response.error ?? `Pincode ${pincode} was not resolved by the public API.`,
              collectedAt: new Date().toISOString(),
              legalBasis: "public-api"
            } satisfies SourceEvidence
          ]
        : [],
      result: null
    };
  }

  const first = offices[0];
  const result: IndiaPincodeResult = {
    pincode,
    city: first.Block || first.Region || first.District,
    district: first.District,
    state: first.State,
    country: first.Country,
    postOffices: offices.slice(0, 8).map((office) => ({
      name: office.Name ?? "Unnamed post office",
      branchType: office.BranchType,
      deliveryStatus: office.DeliveryStatus,
      district: office.District,
      state: office.State
    }))
  };

  return {
    evidence: [
      {
        source: "Postal PIN Code API India",
        type: "map",
        title: `Indian pincode ${pincode}`,
        url: "https://api.postalpincode.in/",
        confidence: 0.82,
        summary: `${offices.length} public post office record${offices.length === 1 ? "" : "s"} found for ${pincode}.`,
        collectedAt: new Date().toISOString(),
        legalBasis: "public-api",
        fields: {
          city: result.city ?? null,
          district: result.district ?? null,
          state: result.state ?? null,
          country: result.country ?? null,
          firstPostOffice: result.postOffices[0]?.name ?? null,
          postOfficeCount: offices.length,
          cached: response.cached
        }
      } satisfies SourceEvidence
    ],
    result
  };
}
