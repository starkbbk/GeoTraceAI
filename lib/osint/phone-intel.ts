import { NormalizedInput, PhoneIntelligence, SourceEvidence } from "./types";

type IndiaCircle = {
  circle: string;
  region: string;
  codes: string[];
};

const indiaCircles: IndiaCircle[] = [
  { circle: "Delhi NCR", region: "Delhi", codes: ["11"] },
  { circle: "Mumbai", region: "Maharashtra", codes: ["22"] },
  { circle: "Kolkata", region: "West Bengal", codes: ["33"] },
  { circle: "Chennai", region: "Tamil Nadu", codes: ["44"] },
  { circle: "Uttar Pradesh East", region: "Uttar Pradesh", codes: ["522", "512", "542", "551"] },
  { circle: "Uttar Pradesh West", region: "Uttar Pradesh", codes: ["120", "121", "562", "571"] },
  { circle: "Karnataka", region: "Karnataka", codes: ["80", "824", "831"] },
  { circle: "Maharashtra and Goa", region: "Maharashtra/Goa", codes: ["20", "240", "253"] },
  { circle: "Gujarat", region: "Gujarat", codes: ["79", "261", "265"] },
  { circle: "Rajasthan", region: "Rajasthan", codes: ["141", "291", "294"] },
  { circle: "Punjab", region: "Punjab", codes: ["172", "161", "181"] },
  { circle: "Kerala", region: "Kerala", codes: ["471", "484", "495"] },
  { circle: "Tamil Nadu", region: "Tamil Nadu", codes: ["422", "431", "452"] },
  { circle: "Andhra Pradesh and Telangana", region: "Andhra Pradesh/Telangana", codes: ["40", "866", "891"] }
];

const indiaMobileProviderHints = [
  { prefixes: ["6", "7", "8", "9"], carrier: "Indian mobile number - provider not encoded reliably after MNP" }
];

export function buildPhoneIntelligence(input: NormalizedInput) {
  if (!input.normalizedPhone) return { phoneIntel: undefined, evidence: [] };

  const phoneIntel = input.inferredCountry === "IN" ? indiaPhoneIntel(input) : genericPhoneIntel(input);
  return {
    phoneIntel,
    evidence: [
      {
        source: "Phone numbering intelligence",
        type: "network",
        title: "Country-aware phone parser",
        confidence: phoneIntel.confidence,
        summary: `${phoneIntel.valid ? "Valid" : "Invalid"} phone format. ${phoneIntel.carrier ?? "Carrier not inferred."} ${
          phoneIntel.telecomCircle ? `Telecom circle: ${phoneIntel.telecomCircle}.` : ""
        }`,
        collectedAt: new Date().toISOString(),
        legalBasis: "derived",
        fields: {
          e164: phoneIntel.e164 ?? null,
          country: phoneIntel.country ?? null,
          carrier: phoneIntel.carrier ?? null,
          telecomCircle: phoneIntel.telecomCircle ?? null,
          region: phoneIntel.region ?? null,
          valid: phoneIntel.valid
        }
      } satisfies SourceEvidence
    ]
  };
}

function indiaPhoneIntel(input: NormalizedInput): PhoneIntelligence {
  const national = input.phoneNationalNumber ?? input.normalizedPhone?.replace(/^\+91/, "") ?? "";
  const landline = indiaCircles.find((circle) => circle.codes.some((code) => national.startsWith(code)));
  const mobile = indiaMobileProviderHints.find((hint) => hint.prefixes.some((prefix) => national.startsWith(prefix)));
  const isMobile = /^[6-9]\d{9}$/.test(national);

  return {
    e164: input.normalizedPhone,
    country: "IN",
    valid: Boolean(input.phoneValid),
    carrier: isMobile ? mobile?.carrier : landline ? "Indian fixed-line numbering area" : undefined,
    telecomCircle: landline?.circle ?? (isMobile ? "India mobile circle not reliably encoded after number portability" : undefined),
    region: landline?.region ?? (isMobile ? "India" : undefined),
    confidence: landline ? 0.72 : isMobile ? 0.46 : 0.28,
    provenance: "derived-inference",
    analysis: [
      isMobile
        ? "Indian mobile prefixes identify broad mobile numbering, but provider cannot be verified from the number because mobile number portability exists."
        : "Fixed-line STD code can provide an approximate telecom circle when present.",
      landline ? `Matched STD/circle prefix for ${landline.circle}.` : "No fixed-line STD circle prefix matched.",
      input.phoneValid ? "libphonenumber-js validated the supplied phone format." : "Phone format failed validation."
    ]
  };
}

function genericPhoneIntel(input: NormalizedInput): PhoneIntelligence {
  return {
    e164: input.normalizedPhone,
    country: input.phoneCountry ?? input.inferredCountry,
    valid: Boolean(input.phoneValid),
    carrier: "Carrier not available from public text-only number parsing",
    telecomCircle: input.phoneCountry ?? input.inferredCountry,
    region: input.phoneCountry ?? input.inferredCountry,
    confidence: input.phoneValid ? 0.38 : 0.18,
    provenance: "derived-inference",
    analysis: [
      "Country and validity were parsed from public numbering metadata.",
      "Carrier lookup is not performed against private telecom subscriber systems."
    ]
  };
}
