import { NormalizedInput, SupportedCountry } from "./types";

export type CountryRules = {
  country: SupportedCountry;
  label: string;
  phonePattern: RegExp;
  postalPattern: RegExp;
  languages: string[];
  timezoneHints: string[];
  publicRecordGuidance: string;
};

export const countryRules: Record<SupportedCountry, CountryRules> = {
  IN: {
    country: "IN",
    label: "India",
    phonePattern: /^\+91\d{10}$/,
    postalPattern: /^\d{6}$/,
    languages: ["Hindi", "English"],
    timezoneHints: ["Asia/Kolkata"],
    publicRecordGuidance: "Prefer MCA company records, local business listings, and consented phone intelligence."
  },
  US: {
    country: "US",
    label: "United States",
    phonePattern: /^\+1\d{10}$/,
    postalPattern: /^\d{5}(-\d{4})?$/,
    languages: ["English", "Spanish"],
    timezoneHints: ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles"],
    publicRecordGuidance: "Prefer state business registries, public map listings, and opt-in breach checks."
  },
  GB: {
    country: "GB",
    label: "United Kingdom",
    phonePattern: /^\+44\d{9,10}$/,
    postalPattern: /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/,
    languages: ["English"],
    timezoneHints: ["Europe/London"],
    publicRecordGuidance: "Prefer Companies House, public map listings, and opt-in breach checks."
  },
  AE: {
    country: "AE",
    label: "United Arab Emirates",
    phonePattern: /^\+971\d{8,9}$/,
    postalPattern: /^\d{0,6}$/,
    languages: ["Arabic", "English"],
    timezoneHints: ["Asia/Dubai"],
    publicRecordGuidance: "Prefer public business directories and map listings; postal data is usually sparse."
  },
  DE: {
    country: "DE",
    label: "Germany",
    phonePattern: /^\+49\d{6,13}$/,
    postalPattern: /^\d{5}$/,
    languages: ["German"],
    timezoneHints: ["Europe/Berlin"],
    publicRecordGuidance: "Prefer official transport authority guidance, public registration mark formats, and aggregate vehicle statistics."
  },
  GLOBAL: {
    country: "GLOBAL",
    label: "Global",
    phonePattern: /^\+?\d{7,15}$/,
    postalPattern: /^.{2,12}$/,
    languages: ["English"],
    timezoneHints: ["UTC"],
    publicRecordGuidance: "Use only globally available public APIs and user-provided identifiers."
  }
};

export function validateRegionalInput(input: NormalizedInput) {
  const rules = countryRules[input.inferredCountry];
  const issues: string[] = [];

  if (input.normalizedPhone && input.phoneValid === false) {
    issues.push(`Phone number could not be validated by libphonenumber-js for ${rules.label}.`);
  } else if (input.normalizedPhone && !rules.phonePattern.test(input.normalizedPhone)) {
    issues.push(`Phone number does not match common ${rules.label} format.`);
  }

  if (input.normalizedPincode && !rules.postalPattern.test(input.normalizedPincode)) {
    issues.push(`Postal code does not match common ${rules.label} format.`);
  }

  return {
    rules,
    issues,
    score: Math.max(0.2, 1 - issues.length * 0.2)
  };
}
