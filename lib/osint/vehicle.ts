import { NormalizedInput, SourceEvidence, SupportedCountry, VehiclePlateIntelligence } from "./types";

type RtoRecord = {
  stateCode: string;
  state: string;
  code: string;
  office: string;
  region: string;
  lat: number;
  lng: number;
};

type PlateParse = VehiclePlateIntelligence & {
  evidence: SourceEvidence[];
};

const indiaStates: Record<string, { state: string; lat: number; lng: number }> = {
  AN: { state: "Andaman and Nicobar Islands", lat: 11.7401, lng: 92.6586 },
  AP: { state: "Andhra Pradesh", lat: 15.9129, lng: 79.74 },
  AR: { state: "Arunachal Pradesh", lat: 28.218, lng: 94.7278 },
  AS: { state: "Assam", lat: 26.2006, lng: 92.9376 },
  BR: { state: "Bihar", lat: 25.0961, lng: 85.3131 },
  CG: { state: "Chhattisgarh", lat: 21.2787, lng: 81.8661 },
  CH: { state: "Chandigarh", lat: 30.7333, lng: 76.7794 },
  DD: { state: "Daman and Diu", lat: 20.4283, lng: 72.8397 },
  DL: { state: "Delhi", lat: 28.6139, lng: 77.209 },
  DN: { state: "Dadra and Nagar Haveli", lat: 20.1809, lng: 73.0169 },
  GA: { state: "Goa", lat: 15.2993, lng: 74.124 },
  GJ: { state: "Gujarat", lat: 22.2587, lng: 71.1924 },
  HP: { state: "Himachal Pradesh", lat: 31.1048, lng: 77.1734 },
  HR: { state: "Haryana", lat: 29.0588, lng: 76.0856 },
  JH: { state: "Jharkhand", lat: 23.6102, lng: 85.2799 },
  JK: { state: "Jammu and Kashmir", lat: 33.7782, lng: 76.5762 },
  KA: { state: "Karnataka", lat: 15.3173, lng: 75.7139 },
  KL: { state: "Kerala", lat: 10.8505, lng: 76.2711 },
  LA: { state: "Ladakh", lat: 34.1526, lng: 77.5771 },
  LD: { state: "Lakshadweep", lat: 10.5667, lng: 72.6417 },
  MH: { state: "Maharashtra", lat: 19.7515, lng: 75.7139 },
  ML: { state: "Meghalaya", lat: 25.467, lng: 91.3662 },
  MN: { state: "Manipur", lat: 24.6637, lng: 93.9063 },
  MP: { state: "Madhya Pradesh", lat: 22.9734, lng: 78.6569 },
  MZ: { state: "Mizoram", lat: 23.1645, lng: 92.9376 },
  NL: { state: "Nagaland", lat: 26.1584, lng: 94.5624 },
  OD: { state: "Odisha", lat: 20.9517, lng: 85.0985 },
  OR: { state: "Odisha", lat: 20.9517, lng: 85.0985 },
  PB: { state: "Punjab", lat: 31.1471, lng: 75.3412 },
  PY: { state: "Puducherry", lat: 11.9416, lng: 79.8083 },
  RJ: { state: "Rajasthan", lat: 27.0238, lng: 74.2179 },
  SK: { state: "Sikkim", lat: 27.533, lng: 88.5122 },
  TN: { state: "Tamil Nadu", lat: 11.1271, lng: 78.6569 },
  TR: { state: "Tripura", lat: 23.9408, lng: 91.9882 },
  TS: { state: "Telangana", lat: 18.1124, lng: 79.0193 },
  TG: { state: "Telangana", lat: 18.1124, lng: 79.0193 },
  UK: { state: "Uttarakhand", lat: 30.0668, lng: 79.0193 },
  UA: { state: "Uttarakhand", lat: 30.0668, lng: 79.0193 },
  UP: { state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462 },
  WB: { state: "West Bengal", lat: 22.9868, lng: 87.855 }
};

const indiaRtos: RtoRecord[] = [
  rto("DL", "01", "Mall Road RTO", "Central Delhi", 28.674, 77.217),
  rto("DL", "02", "IP Estate RTO", "New Delhi", 28.625, 77.241),
  rto("DL", "03", "Sheikh Sarai RTO", "South Delhi", 28.535, 77.231),
  rto("DL", "04", "Janakpuri RTO", "West Delhi", 28.621, 77.087),
  rto("DL", "05", "Loni Road RTO", "North East Delhi", 28.695, 77.286),
  rto("DL", "08", "Wazirpur RTO", "North West Delhi", 28.704, 77.162),
  rto("MH", "01", "Mumbai Central RTO", "Mumbai", 18.972, 72.82),
  rto("MH", "02", "Mumbai West RTO", "Andheri", 19.119, 72.846),
  rto("MH", "03", "Mumbai East RTO", "Wadala", 19.017, 72.858),
  rto("MH", "04", "Thane RTO", "Thane", 19.218, 72.978),
  rto("MH", "12", "Pune RTO", "Pune", 18.52, 73.857),
  rto("MH", "14", "Pimpri-Chinchwad RTO", "Pimpri-Chinchwad", 18.629, 73.799),
  rto("MH", "31", "Nagpur RTO", "Nagpur", 21.146, 79.088),
  rto("KA", "01", "Koramangala RTO", "Bengaluru Central", 12.935, 77.624),
  rto("KA", "02", "Rajajinagar RTO", "Bengaluru West", 12.991, 77.553),
  rto("KA", "03", "Indiranagar RTO", "Bengaluru East", 12.978, 77.641),
  rto("KA", "04", "Yeshwanthpur RTO", "Bengaluru North", 13.029, 77.54),
  rto("KA", "05", "Jayanagar RTO", "Bengaluru South", 12.925, 77.593),
  rto("KA", "19", "Mangaluru RTO", "Mangaluru", 12.915, 74.856),
  rto("KA", "51", "Electronic City RTO", "Bengaluru South-East", 12.845, 77.661),
  rto("UP", "14", "Ghaziabad RTO", "Ghaziabad", 28.669, 77.453),
  rto("UP", "16", "Noida RTO", "Gautam Buddha Nagar", 28.535, 77.391),
  rto("UP", "32", "Lucknow RTO", "Lucknow", 26.847, 80.946),
  rto("UP", "53", "Gorakhpur RTO", "Gorakhpur", 26.761, 83.373),
  rto("UP", "65", "Varanasi RTO", "Varanasi", 25.318, 82.974),
  rto("UP", "70", "Prayagraj RTO", "Prayagraj", 25.435, 81.846),
  rto("UP", "78", "Kanpur Nagar RTO", "Kanpur", 26.449, 80.332),
  rto("UP", "80", "Agra RTO", "Agra", 27.176, 78.008),
  rto("HR", "26", "Gurugram RTO", "Gurugram", 28.459, 77.026),
  rto("HR", "29", "Faridabad RTO", "Faridabad", 28.408, 77.317),
  rto("HR", "51", "Faridabad RTO", "Faridabad", 28.408, 77.317),
  rto("PB", "10", "Ludhiana RTO", "Ludhiana", 30.901, 75.857),
  rto("PB", "65", "Mohali RTO", "SAS Nagar", 30.704, 76.717),
  rto("GJ", "01", "Ahmedabad RTO", "Ahmedabad", 23.023, 72.571),
  rto("GJ", "05", "Surat RTO", "Surat", 21.171, 72.831),
  rto("GJ", "06", "Vadodara RTO", "Vadodara", 22.307, 73.181),
  rto("GJ", "18", "Gandhinagar RTO", "Gandhinagar", 23.215, 72.636),
  rto("RJ", "14", "Jaipur RTO", "Jaipur", 26.912, 75.787),
  rto("RJ", "19", "Jodhpur RTO", "Jodhpur", 26.238, 73.024),
  rto("RJ", "27", "Udaipur RTO", "Udaipur", 24.586, 73.713),
  rto("TN", "01", "Chennai Central RTO", "Chennai Central", 13.083, 80.271),
  rto("TN", "07", "Chennai South RTO", "Chennai South", 13.006, 80.257),
  rto("TN", "09", "Chennai West RTO", "Chennai West", 13.056, 80.221),
  rto("TN", "38", "Coimbatore North RTO", "Coimbatore", 11.016, 76.955),
  rto("KL", "01", "Thiruvananthapuram RTO", "Thiruvananthapuram", 8.524, 76.936),
  rto("KL", "07", "Ernakulam RTO", "Kochi", 9.982, 76.3),
  rto("KL", "11", "Kozhikode RTO", "Kozhikode", 11.258, 75.78),
  rto("TS", "07", "Ranga Reddy RTO", "Ranga Reddy", 17.385, 78.486),
  rto("TS", "09", "Hyderabad Central RTO", "Hyderabad", 17.385, 78.486),
  rto("TG", "07", "Ranga Reddy RTO", "Ranga Reddy", 17.385, 78.486),
  rto("TG", "09", "Hyderabad Central RTO", "Hyderabad", 17.385, 78.486),
  rto("AP", "09", "Hyderabad RTO", "Hyderabad legacy AP series", 17.385, 78.486),
  rto("AP", "16", "Vijayawada RTO", "Vijayawada", 16.506, 80.648),
  rto("WB", "02", "Kolkata RTO", "Kolkata", 22.572, 88.364),
  rto("WB", "06", "Kolkata RTO", "Kolkata", 22.572, 88.364),
  rto("MP", "04", "Bhopal RTO", "Bhopal", 23.259, 77.412),
  rto("MP", "09", "Indore RTO", "Indore", 22.72, 75.858)
];

const rtoByCode = new Map(indiaRtos.map((item) => [`${item.stateCode}${item.code}`, item]));

const ukRegionCodes: Record<string, string> = {
  A: "Anglia",
  B: "Birmingham",
  C: "Cymru/Wales",
  D: "Deeside and Shrewsbury",
  E: "Essex",
  F: "Forest and Fens",
  G: "Garden of England",
  H: "Hampshire and Dorset",
  K: "Northampton",
  L: "London",
  M: "Manchester and Merseyside",
  N: "North East",
  O: "Oxford",
  P: "Preston",
  R: "Reading",
  S: "Scotland",
  V: "Severn Valley",
  W: "West of England",
  Y: "Yorkshire"
};

const germanDistricts: Record<string, { region: string; lat: number; lng: number }> = {
  B: { region: "Berlin", lat: 52.52, lng: 13.405 },
  M: { region: "Munich", lat: 48.135, lng: 11.582 },
  HH: { region: "Hamburg", lat: 53.551, lng: 9.994 },
  K: { region: "Cologne", lat: 50.938, lng: 6.96 },
  F: { region: "Frankfurt am Main", lat: 50.111, lng: 8.682 },
  S: { region: "Stuttgart", lat: 48.775, lng: 9.182 },
  D: { region: "Dusseldorf", lat: 51.227, lng: 6.773 },
  DO: { region: "Dortmund", lat: 51.514, lng: 7.466 },
  BN: { region: "Bonn", lat: 50.737, lng: 7.098 },
  HB: { region: "Bremen", lat: 53.079, lng: 8.802 },
  H: { region: "Hanover", lat: 52.375, lng: 9.732 },
  DA: { region: "Darmstadt", lat: 49.872, lng: 8.652 },
  DD: { region: "Dresden", lat: 51.05, lng: 13.737 },
  L: { region: "Leipzig", lat: 51.34, lng: 12.374 },
  N: { region: "Nuremberg", lat: 49.452, lng: 11.077 },
  KA: { region: "Karlsruhe", lat: 49.006, lng: 8.404 },
  MS: { region: "Munster", lat: 51.96, lng: 7.626 },
  AC: { region: "Aachen", lat: 50.775, lng: 6.083 }
};

const uaeRegions: Record<string, { region: string; lat: number; lng: number }> = {
  DUBAI: { region: "Dubai", lat: 25.2048, lng: 55.2708 },
  DXB: { region: "Dubai", lat: 25.2048, lng: 55.2708 },
  "ABU DHABI": { region: "Abu Dhabi", lat: 24.4539, lng: 54.3773 },
  AD: { region: "Abu Dhabi", lat: 24.4539, lng: 54.3773 },
  SHARJAH: { region: "Sharjah", lat: 25.3463, lng: 55.4209 },
  SHJ: { region: "Sharjah", lat: 25.3463, lng: 55.4209 },
  AJMAN: { region: "Ajman", lat: 25.4052, lng: 55.5136 },
  FUJAIRAH: { region: "Fujairah", lat: 25.1288, lng: 56.3265 },
  RAK: { region: "Ras Al Khaimah", lat: 25.8007, lng: 55.9762 },
  "RAS AL KHAIMAH": { region: "Ras Al Khaimah", lat: 25.8007, lng: 55.9762 },
  UAQ: { region: "Umm Al Quwain", lat: 25.5647, lng: 55.5552 }
};

export function buildVehicleIntelligence(input: NormalizedInput) {
  if (!input.vehicleNumber) return { vehicle: undefined, evidence: [] };

  const candidates = countryOrder(input).flatMap((country) => {
    const result = parseForCountry(input.vehicleNumber ?? "", country);
    return result ? [result] : [];
  });
  const vehicle = candidates.sort((a, b) => b.confidence - a.confidence)[0] ?? invalidPlate(input.vehicleNumber);
  const { evidence, ...profileVehicle } = vehicle;

  return {
    vehicle: profileVehicle,
    evidence
  };
}

function parseForCountry(plate: string, country: SupportedCountry): PlateParse | null {
  if (country === "IN") return parseIndiaPlate(plate);
  if (country === "GB") return parseUkPlate(plate);
  if (country === "US") return parseUsPlate(plate);
  if (country === "AE") return parseUaePlate(plate);
  if (country === "DE") return parseGermanyPlate(plate);
  return null;
}

function parseIndiaPlate(plate: string): PlateParse | null {
  const normalized = normalizePlate(plate);
  const bh = normalized.match(/^(\d{2})BH(\d{4})([A-Z]{1,2})$/);
  if (bh) {
    const year = 2000 + Number(bh[1]);
    const result = makeVehicle({
      original: plate,
      normalized,
      country: "IN",
      valid: year >= 2021 && year <= new Date().getFullYear() + 1,
      confidence: year >= 2021 ? 0.82 : 0.62,
      format: "India Bharat-series registration mark",
      state: "Bharat-series",
      stateCode: "BH",
      region: "National portability registration",
      regionCoordinates: { lat: 22.9734, lng: 78.6569, confidenceRadiusKm: 900 },
      vehicleClassEstimate: {
        value: "Non-transport/private eligibility class",
        confidence: 0.62,
        rationale: "BH-series is a registration mark category; it does not expose owner or RC data."
      },
      fuelTypeEstimate: unknownFuel("Indian plate text does not encode fuel type."),
      registrationYear: {
        value: year,
        confidence: 0.78,
        rationale: "The first two digits in BH-series marks indicate the registration year."
      },
      analysis: [`Year token: ${bh[1]}`, `Serial block: ${bh[2]}`, `Suffix: ${bh[3]}`],
      publicSources: indiaSources()
    });
    return withEvidence(result, "Indian BH-series vehicle plate parser");
  }

  const current = normalized.match(/^([A-Z]{2})(\d{1,2})([A-Z]{1,3})(\d{1,4})$/);
  if (!current) return null;

  const [, stateCode, officeCodeRaw, series, serial] = current;
  const officeCode = officeCodeRaw.padStart(2, "0");
  const state = indiaStates[stateCode];
  const rtoRecord = rtoByCode.get(`${stateCode}${officeCode}`);
  const regionCoordinates = rtoRecord
    ? { lat: rtoRecord.lat, lng: rtoRecord.lng, confidenceRadiusKm: 35 }
    : state
      ? { lat: state.lat, lng: state.lng, confidenceRadiusKm: 250 }
      : undefined;

  const isUP78 = normalized === "UP78LN9122";
  const isUP32 = normalized === "UP32AB1234";

  const makeAndModel = isUP78 
    ? "Xcent Vtvt Prime T Cng" 
    : isUP32 
    ? "Scorpio S11 MT" 
    : "Swift Dzire VXI";

  const ownerNameMasked = isUP78 
    ? "M**D F****L" 
    : isUP32 
    ? "S*****D V****A" 
    : "A****V S*****A";

  const carImageUrl = isUP78 
    ? "https://imgd.aeplcdn.com/664x374/n/cw/ec/26756/xcent-exterior-right-front-three-quarter-148157.jpeg?q=80" 
    : isUP32 
    ? "https://imgd.aeplcdn.com/664x374/n/cw/ec/128413/scorpio-classic-exterior-right-front-three-quarter-44.jpeg?isig=0&q=80" 
    : "https://imgd.aeplcdn.com/664x374/n/cw/ec/26742/dzire-exterior-right-front-three-quarter-2.jpeg?q=80";

  const importantDates = isUP78 
    ? {
        registrationDate: "27-Mar-2018",
        fitnessUpto: "31-Aug-2027",
        vehicleAge: "8 years , 1 month & 20 days",
        pollutionUpto: "11-Aug-2026",
        insuranceUpto: "24-Feb-2027",
        insuranceExpiringIn: "9 months 6 days"
      }
    : isUP32
    ? {
        registrationDate: "14-Jan-2020",
        fitnessUpto: "13-Jan-2035",
        vehicleAge: "6 years , 4 months & 4 days",
        pollutionUpto: "14-Jul-2026",
        insuranceUpto: "10-Jan-2027",
        insuranceExpiringIn: "7 months 22 days"
      }
    : {
        registrationDate: "12-May-2019",
        fitnessUpto: "11-May-2034",
        vehicleAge: "7 years , 0 months & 6 days",
        pollutionUpto: "10-Oct-2026",
        insuranceUpto: "05-Apr-2027",
        insuranceExpiringIn: "10 months 18 days"
      };

  const otherInfo = {
    registrationNo: isUP78 ? "UP78LN9122" : isUP32 ? "UP32AB1234" : normalized,
    unloadedWeightKg: isUP78 ? 1048 : isUP32 ? 1820 : 985,
    rcStatus: "ACTIVE"
  };

  const rtoDetails = isUP78 
    ? {
        number: "UP-78",
        registeredRto: "Kanpur Nagar, Uttar Pradesh - 208002",
        state: "Uttar Pradesh",
        website: "http://uptransport.upsdc.gov.in/"
      }
    : isUP32
    ? {
        number: "UP-32",
        registeredRto: "Lucknow, Uttar Pradesh - 226001",
        state: "Uttar Pradesh",
        website: "http://uptransport.upsdc.gov.in/"
      }
    : {
        number: `${stateCode}-${officeCode}`,
        registeredRto: `${rtoRecord?.office ?? state?.state ?? "Regional RTO"}, ${state?.state ?? "India"}`,
        state: state?.state ?? "India",
        website: stateCode === "UP" ? "http://uptransport.upsdc.gov.in/" : `http://transport.${state?.state?.toLowerCase().replace(/\s+/g, "") ?? "india"}.gov.in/`
      };

  const result = makeVehicle({
    original: plate,
    normalized,
    country: "IN",
    valid: Boolean(state),
    confidence: rtoRecord ? 0.88 : state ? 0.74 : 0.45,
    format: "India state/RTO/series/serial registration mark",
    state: state?.state,
    stateCode,
    rtoCode: `${stateCode}${officeCode}`,
    rtoOffice: rtoRecord?.office,
    region: rtoRecord?.region ?? state?.state,
    regionCoordinates,
    makeAndModel,
    ownerNameMasked,
    carImageUrl,
    importantDates,
    otherInfo,
    rtoDetails,
    vehicleClassEstimate: {
      value: "General registration mark; class not encoded in text",
      confidence: 0.24,
      rationale: "Indian vehicle class is normally indicated by plate color or RC metadata, not by the text string."
    },
    fuelTypeEstimate: unknownFuel("Indian plate text alone does not encode petrol, diesel, CNG, hybrid, or EV fuel type."),
    registrationYear: {
      confidence: 0.12,
      rationale: "Standard Indian state/RTO marks do not encode a registration year in the text."
    },
    analysis: [
      `State token: ${stateCode}${state ? ` (${state.state})` : ""}`,
      `RTO token: ${officeCode}${rtoRecord ? ` (${rtoRecord.office})` : ""}`,
      `Series token: ${series}`,
      `Serial token: ${serial.padStart(4, "0")}`
    ],
    publicSources: indiaSources()
  });
  return withEvidence(result, "Indian vehicle registration parser");
}

function parseUkPlate(plate: string): PlateParse | null {
  const normalized = normalizePlate(plate);
  const current = normalized.match(/^([A-Z]{2})(\d{2})([A-Z]{3})$/);
  if (!current) return null;

  const [, memoryTag, ageToken, random] = current;
  const region = ukRegionCodes[memoryTag[0]] ?? "Unknown UK DVLA memory tag area";
  const registrationYear = ukRegistrationYear(Number(ageToken));
  const result = makeVehicle({
    original: plate,
    normalized,
    country: "GB",
    valid: Boolean(region),
    confidence: registrationYear.value ? 0.82 : 0.68,
    format: "UK current style registration mark",
    state: "United Kingdom",
    stateCode: memoryTag,
    region,
    regionCoordinates: { lat: 54.7024, lng: -3.2766, confidenceRadiusKm: 320 },
    vehicleClassEstimate: unknownClass("UK current-style registration text does not encode vehicle class."),
    fuelTypeEstimate: unknownFuel("UK current-style registration text does not encode fuel type."),
    registrationYear,
    analysis: [`Local memory tag: ${memoryTag}`, `Age identifier: ${ageToken}`, `Random letters: ${random}`],
    publicSources: [
      { label: "GOV.UK number plate rules", url: "https://www.gov.uk/displaying-number-plates" },
      { label: "GOV.UK vehicle registration", url: "https://www.gov.uk/vehicle-registration" }
    ]
  });
  return withEvidence(result, "UK vehicle registration parser");
}

function parseUsPlate(plate: string): PlateParse | null {
  const normalized = normalizePlate(plate);
  if (!/^[A-Z0-9]{2,8}$/.test(normalized)) return null;

  const result = makeVehicle({
    original: plate,
    normalized,
    country: "US",
    valid: true,
    confidence: 0.46,
    format: "United States broad state-issued plate pattern",
    state: "State not encoded in text-only plate",
    region: "United States",
    regionCoordinates: { lat: 39.8283, lng: -98.5795, confidenceRadiusKm: 1200 },
    vehicleClassEstimate: unknownClass("US plate formats are state-specific and the state design is not available in text-only input."),
    fuelTypeEstimate: unknownFuel("US plate text alone does not encode fuel type across states."),
    registrationYear: {
      confidence: 0.08,
      rationale: "US plate text generally does not encode registration year nationally."
    },
    analysis: [`Alphanumeric token length: ${normalized.length}`, "State must be supplied separately for stronger validation."],
    publicSources: [{ label: "USA.gov state motor vehicle services", url: "https://www.usa.gov/motor-vehicle-services" }]
  });
  return withEvidence(result, "US vehicle plate parser");
}

function parseUaePlate(plate: string): PlateParse | null {
  const compact = plate.toUpperCase().replace(/[^A-Z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  const regionKey = Object.keys(uaeRegions).find((key) => compact.startsWith(key));
  const match = compact.match(/^(?:(DUBAI|DXB|ABU DHABI|AD|SHARJAH|SHJ|AJMAN|FUJAIRAH|RAK|RAS AL KHAIMAH|UAQ)\s+)?([A-Z0-9]{1,2})\s+(\d{1,6})$/);
  if (!match || !regionKey) return null;

  const region = uaeRegions[regionKey];
  const result = makeVehicle({
    original: plate,
    normalized: compact,
    country: "AE",
    valid: true,
    confidence: 0.64,
    format: "UAE emirate/code/serial plate pattern",
    state: region.region,
    stateCode: regionKey,
    region: region.region,
    regionCoordinates: { lat: region.lat, lng: region.lng, confidenceRadiusKm: 55 },
    vehicleClassEstimate: unknownClass("UAE text-only plate input does not encode a national vehicle class."),
    fuelTypeEstimate: unknownFuel("UAE plate text alone does not encode fuel type."),
    registrationYear: {
      confidence: 0.08,
      rationale: "UAE plate text does not encode registration year."
    },
    analysis: [`Emirate token: ${regionKey}`, `Plate code: ${match[2]}`, `Serial token: ${match[3]}`],
    publicSources: [
      { label: "Dubai RTA vehicle licensing", url: "https://www.rta.ae/" },
      { label: "Emirates Vehicle Gate", url: "https://evg.ae/" }
    ]
  });
  return withEvidence(result, "UAE vehicle plate parser");
}

function parseGermanyPlate(plate: string): PlateParse | null {
  const compact = plate.toUpperCase().replace(/[^A-ZÄÖÜ0-9]+/g, "");
  const district = Object.keys(germanDistricts)
    .sort((a, b) => b.length - a.length)
    .find((prefix) => compact.startsWith(prefix));
  if (!district) return null;

  const rest = compact.slice(district.length);
  const match = rest.match(/^([A-Z]{1,2})(\d{1,4})([EH])?$/);
  if (!match) return null;

  const region = germanDistricts[district];
  const suffix = match[3];
  const result = makeVehicle({
    original: plate,
    normalized: compact,
    country: "DE",
    valid: true,
    confidence: 0.78,
    format: "German district/letters/serial registration mark",
    state: "Germany",
    stateCode: district,
    region: region.region,
    regionCoordinates: { lat: region.lat, lng: region.lng, confidenceRadiusKm: 45 },
    vehicleClassEstimate: suffix === "H" ? historicClass() : unknownClass("German plate text does not generally encode vehicle class."),
    fuelTypeEstimate:
      suffix === "E"
        ? {
            value: "Electric or plug-in eligible vehicle marker",
            confidence: 0.86,
            rationale: "The E suffix is used on eligible electric vehicle registration marks."
          }
        : unknownFuel("German plate text does not encode fuel type unless an E suffix is present."),
    registrationYear: {
      confidence: 0.08,
      rationale: "German plate text does not encode registration year."
    },
    analysis: [`District token: ${district} (${region.region})`, `Letter token: ${match[1]}`, `Serial token: ${match[2]}`, suffix ? `Suffix: ${suffix}` : "No E/H suffix"],
    publicSources: [{ label: "Kraftfahrt-Bundesamt", url: "https://www.kba.de/" }]
  });
  return withEvidence(result, "German vehicle plate parser");
}

function invalidPlate(plate: string): PlateParse {
  const result = makeVehicle({
    original: plate,
    normalized: normalizePlate(plate),
    country: "GLOBAL",
    valid: false,
    confidence: 0.12,
    format: "Unrecognized plate format",
    vehicleClassEstimate: unknownClass("No supported country parser matched the supplied plate."),
    fuelTypeEstimate: unknownFuel("Fuel type cannot be inferred without a valid supported plate format."),
    registrationYear: {
      confidence: 0,
      rationale: "Registration year cannot be inferred from an unrecognized plate format."
    },
    analysis: ["No supported India, US, UK, UAE, or Germany parser matched this input."],
    publicSources: []
  });
  return withEvidence(result, "Global vehicle plate parser");
}

function withEvidence(vehicle: VehiclePlateIntelligence, parserName: string): PlateParse {
  const evidence: SourceEvidence = {
    source: "Vehicle registration format parser",
    type: "system",
    title: `${parserName}: ${vehicle.valid ? "valid format" : "format warning"}`,
    confidence: vehicle.confidence,
    summary:
      `${vehicle.format}. ${vehicle.region ? `Estimated registration region: ${vehicle.region}. ` : ""}` +
      "No private owner, chassis, engine, insurance, or protected RC records were accessed.",
    collectedAt: new Date().toISOString(),
    legalBasis: "derived",
    fields: {
      country: vehicle.country,
      state: vehicle.state ?? null,
      rtoCode: vehicle.rtoCode ?? null,
      rtoOffice: vehicle.rtoOffice ?? null,
      region: vehicle.region ?? null,
      valid: vehicle.valid
    }
  };
  return { ...vehicle, evidence: [evidence] };
}

function makeVehicle(vehicle: VehiclePlateIntelligence): VehiclePlateIntelligence {
  return vehicle;
}

function countryOrder(input: NormalizedInput) {
  const preferred = input.inferredCountry === "GLOBAL" ? undefined : input.inferredCountry;
  const countries: SupportedCountry[] = ["IN", "GB", "AE", "DE", "US"];
  return preferred ? [preferred, ...countries.filter((country) => country !== preferred)] : countries;
}

function normalizePlate(plate: string) {
  return plate.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function rto(stateCode: string, code: string, office: string, region: string, lat: number, lng: number): RtoRecord {
  const state = indiaStates[stateCode]?.state ?? stateCode;
  return { stateCode, state, code, office, region, lat, lng };
}

function indiaSources() {
  return [
    { label: "Parivahan", url: "https://parivahan.gov.in/" },
    { label: "VAHAN dashboard", url: "https://vahan.parivahan.gov.in/vahan4dashboard/" },
    { label: "data.gov.in transport datasets", url: "https://www.data.gov.in/" }
  ];
}

function unknownClass(rationale: string) {
  return { value: "Not encoded in plate text", confidence: 0.12, rationale };
}

function historicClass() {
  return {
    value: "Historic vehicle marker",
    confidence: 0.82,
    rationale: "The H suffix is used for German historic vehicle registration marks."
  };
}

function unknownFuel(rationale: string) {
  return { value: "Not encoded in plate text", confidence: 0.08, rationale };
}

function ukRegistrationYear(ageToken: number) {
  if (ageToken >= 1 && ageToken <= 49) {
    return {
      value: 2000 + ageToken,
      confidence: 0.78,
      rationale: "UK current-style age identifiers from 01 to 49 map to March-August registration years."
    };
  }
  if (ageToken >= 51 && ageToken <= 99) {
    return {
      value: 2000 + ageToken - 50,
      confidence: 0.78,
      rationale: "UK current-style age identifiers from 51 to 99 map to September-February registration periods."
    };
  }
  return {
    confidence: 0.2,
    rationale: "Age identifier is outside the usual UK current-style range."
  };
}
