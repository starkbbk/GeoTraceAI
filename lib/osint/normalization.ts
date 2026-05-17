import { CountryCode, parsePhoneNumberFromString } from "libphonenumber-js";
import { SearchInput, NormalizedInput, SupportedCountry } from "./types";

const countryAliases: Record<string, SupportedCountry> = {
  india: "IN",
  in: "IN",
  bharat: "IN",
  usa: "US",
  us: "US",
  "united states": "US",
  uk: "GB",
  gb: "GB",
  britain: "GB",
  "united kingdom": "GB",
  uae: "AE",
  ae: "AE",
  "united arab emirates": "AE",
  germany: "DE",
  deutschland: "DE",
  de: "DE"
};

export function normalizeSearchInput(input: SearchInput): NormalizedInput {
  const normalizedEmail = input.email?.trim().toLowerCase();
  const normalizedDomain = normalizeDomain(input.domain ?? input.email?.split("@")[1]);
  const normalizedIp = normalizeIp(input.ipAddress);
  const normalizedUsername = input.username?.trim().replace(/^@/, "").toLowerCase();
  const normalizedPincode = input.pincode?.replace(/\s+/g, "").toUpperCase();
  const phone = normalizePhone(input.phone, input.country);
  const inferredCountry = inferCountry(input, phone.normalizedPhone, normalizedPincode, phone.phoneCountry);
  const signals = buildSignals(input);

  return {
    ...input,
    fullName: clean(input.fullName),
    companyName: clean(input.companyName),
    cityState: clean(input.cityState),
    vehicleNumber: clean(input.vehicleNumber)?.toUpperCase(),
    inferredCountry,
    normalizedPhone: phone.normalizedPhone,
    phoneCountry: phone.phoneCountry,
    phoneNationalNumber: phone.phoneNationalNumber,
    phoneCarrierCode: phone.phoneCarrierCode,
    phoneValid: phone.phoneValid,
    normalizedEmail,
    normalizedDomain,
    normalizedIp,
    normalizedUsername,
    normalizedPincode,
    signals,
    confidence: Math.min(0.95, 0.25 + signals.length * 0.14)
  };
}

export function inferCountry(
  input: SearchInput,
  normalizedPhone?: string,
  normalizedPincode?: string,
  phoneCountry?: SupportedCountry
): SupportedCountry {
  const declared = input.country?.trim().toLowerCase();
  if (declared && countryAliases[declared]) return countryAliases[declared];
  if (phoneCountry) return phoneCountry;
  if (normalizedPhone?.startsWith("+91")) return "IN";
  if (normalizedPhone?.startsWith("+1")) return "US";
  if (normalizedPhone?.startsWith("+44")) return "GB";
  if (normalizedPhone?.startsWith("+971")) return "AE";
  if (normalizedPhone?.startsWith("+49")) return "DE";
  if (/^\d{6}$/.test(normalizedPincode ?? "")) return "IN";
  if (/^\d{5}(-\d{4})?$/.test(normalizedPincode ?? "")) return "US";
  if (/^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(normalizedPincode ?? "")) return "GB";
  return "GLOBAL";
}

export function normalizePhone(phone?: string, country?: string) {
  if (!phone) return {};
  const compact = phone.replace(/[^\d+]/g, "");
  const defaultCountry = toPhoneCountry(country);
  const parsed = parsePhoneNumberFromString(compact, defaultCountry);
  if (!parsed) {
    return {
      normalizedPhone: compact,
      phoneValid: false
    };
  }

  return {
    normalizedPhone: parsed.number,
    phoneCountry: toSupportedCountry(parsed.country),
    phoneNationalNumber: parsed.nationalNumber,
    phoneCarrierCode: parsed.carrierCode,
    phoneValid: parsed.isValid()
  };
}

function buildSignals(input: SearchInput) {
  return [
    input.fullName && "name",
    input.phone && "phone",
    input.pincode && "postal-code",
    input.country && "country",
    input.email && "email",
    input.domain && "domain",
    input.ipAddress && "ip",
    input.username && "username",
    input.companyName && "company",
    input.vehicleNumber && "vehicle",
    input.cityState && "city-state"
  ].filter(Boolean) as string[];
}

function clean(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\s+/g, " ") : undefined;
}

function normalizeDomain(value?: string) {
  const trimmed = value?.trim().toLowerCase();
  if (!trimmed) return undefined;
  try {
    const url = trimmed.includes("://") ? new URL(trimmed) : new URL(`https://${trimmed}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return trimmed.replace(/^www\./, "").replace(/[^a-z0-9.-]/g, "") || undefined;
  }
}

function normalizeIp(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(trimmed) || /^[a-f0-9:]+$/i.test(trimmed) ? trimmed : undefined;
}

function toPhoneCountry(country?: string): CountryCode | undefined {
  if (!country) return undefined;
  const alias = countryAliases[country.trim().toLowerCase()];
  return alias && alias !== "GLOBAL" ? alias : undefined;
}

function toSupportedCountry(country?: CountryCode): SupportedCountry | undefined {
  if (!country) return undefined;
  return country === "IN" || country === "US" || country === "GB" || country === "AE" || country === "DE"
    ? country
    : "GLOBAL";
}
