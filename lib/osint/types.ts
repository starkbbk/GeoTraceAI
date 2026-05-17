export type SupportedCountry = "IN" | "US" | "GB" | "AE" | "DE" | "GLOBAL";

export type SearchInput = {
  fullName?: string;
  phone?: string;
  pincode?: string;
  country?: string;
  email?: string;
  domain?: string;
  ipAddress?: string;
  username?: string;
  companyName?: string;
  vehicleNumber?: string;
  cityState?: string;
  notes?: string;
  authorizationAccepted?: boolean;
  turnstileToken?: string;
};

export type NormalizedInput = SearchInput & {
  inferredCountry: SupportedCountry;
  normalizedPhone?: string;
  phoneCountry?: SupportedCountry;
  phoneNationalNumber?: string;
  phoneCarrierCode?: string;
  phoneValid?: boolean;
  normalizedEmail?: string;
  normalizedDomain?: string;
  normalizedIp?: string;
  normalizedUsername?: string;
  normalizedPincode?: string;
  signals: string[];
  confidence: number;
};

export type SourceEvidence = {
  source: string;
  type:
    | "map"
    | "profile"
    | "business"
    | "breach"
    | "repository"
    | "whois"
    | "network"
    | "search"
    | "document"
    | "system";
  title: string;
  url?: string;
  confidence: number;
  summary: string;
  collectedAt: string;
  fields?: Record<string, string | number | boolean | null>;
  legalBasis: "public-api" | "user-provided" | "derived" | "disabled-placeholder";
};

export type LocationIntelligence = {
  country?: string;
  countryCode?: SupportedCountry;
  state?: string;
  city?: string;
  approximateArea?: string;
  timezone?: string;
  coordinates?: {
    lat: number;
    lng: number;
    confidenceRadiusKm: number;
  };
  languages: string[];
  nearbyLandmarks: string[];
  networkProvider?: string;
  ipContext?: {
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
};

export type Provenance = "verified-public-api" | "public-review-link" | "user-provided" | "derived-inference";

export type PhoneIntelligence = {
  e164?: string;
  country?: SupportedCountry;
  valid: boolean;
  carrier?: string;
  telecomCircle?: string;
  region?: string;
  confidence: number;
  provenance: Provenance;
  analysis: string[];
};

export type DomainIntelligence = {
  domain: string;
  disposable: boolean;
  category: "consumer-email" | "developer-platform" | "business-domain" | "disposable-email" | "unknown";
  reputation: "low-risk" | "watch" | "elevated";
  confidence: number;
  mxCheck: "not-run" | "configured" | "unavailable";
  analysis: string[];
};

export type PublicAvatar = {
  source: string;
  url: string;
  confidence: number;
  provenance: Provenance;
};

export type PossibleMatch = {
  id: string;
  title: string;
  subtitle: string;
  confidence: number;
  provenance: Provenance;
  signals: string[];
  profileUrl?: string;
  avatarUrl?: string;
};

export type ConfidenceFactor = {
  label: string;
  score: number;
  weight: number;
  provenance: Provenance;
  detail: string;
};

export type InvestigationTask = {
  id: string;
  label: string;
  status: "done" | "review" | "blocked";
  detail: string;
};

export type ExposureRecord = {
  id: string;
  source: string;
  sourceUrl?: string;
  breachName: string;
  exposureType: "breach" | "paste" | "reputation" | "public-profile" | "inferred-risk";
  identifierTypes: Array<"email" | "phone" | "username" | "domain" | "ip" | "vehicle" | "password-metadata">;
  categories: string[];
  breachYear?: number;
  firstSeen?: string;
  lastSeen?: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  verified: boolean;
  inferred: boolean;
  summary: string;
};

export type ExposureTimelineEvent = {
  id: string;
  date: string;
  label: string;
  severity: "low" | "medium" | "high" | "critical";
  source: string;
  detail: string;
};

export type ExposureCategory = {
  key:
    | "email-exposure"
    | "phone-exposure"
    | "ip-exposure"
    | "username-exposure"
    | "credential-reuse-risk"
    | "social-exposure";
  label: string;
  count: number;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
};

export type ExposureIntelligence = {
  records: ExposureRecord[];
  categories: ExposureCategory[];
  timeline: ExposureTimelineEvent[];
  breachCount: number;
  repeatedOverlap: number;
  highestSeverity: "low" | "medium" | "high" | "critical";
  heatmap: Array<{ label: string; value: number; severity: "low" | "medium" | "high" | "critical" }>;
  alertHistory: Array<{ id: string; label: string; detail: string; createdAt: string; severity: "low" | "medium" | "high" | "critical" }>;
};

export type VehiclePlateIntelligence = {
  original: string;
  normalized: string;
  country: SupportedCountry;
  valid: boolean;
  confidence: number;
  format: string;
  state?: string;
  stateCode?: string;
  rtoCode?: string;
  rtoOffice?: string;
  region?: string;
  regionCoordinates?: {
    lat: number;
    lng: number;
    confidenceRadiusKm: number;
  };
  vehicleClassEstimate: {
    value: string;
    confidence: number;
    rationale: string;
  };
  fuelTypeEstimate: {
    value: string;
    confidence: number;
    rationale: string;
  };
  registrationYear?: {
    value?: number;
    confidence: number;
    rationale: string;
  };
  analysis: string[];
  publicSources: Array<{ label: string; url: string }>;
};

export type DigitalFootprint = {
  socialProfiles: Array<{ platform: string; handle: string; url?: string; confidence: number }>;
  githubProfiles: Array<{
    login: string;
    url: string;
    repositories?: number;
    followers?: number;
    bio?: string;
    confidence: number;
  }>;
  websites: Array<{ domain: string; url: string; confidence: number }>;
  emails: Array<{ email: string; source: string; confidence: number }>;
  usernames: Array<{ username: string; platform: string; confidence: number }>;
};

export type RiskAnalysis = {
  scamLikelihood: number;
  spamReports: number;
  breachExposureCount: number;
  reputation: "low-risk" | "watch" | "elevated" | "high-risk" | "unknown";
  indicators: string[];
};

export type RelationshipGraph = {
  nodes: Array<{
    id: string;
    label: string;
    type: "person" | "company" | "location" | "email" | "username" | "phone" | "website" | "vehicle" | "source";
    confidence: number;
  }>;
  edges: Array<{
    from: string;
    to: string;
    label: string;
    confidence: number;
  }>;
};

export type SearchTimelineEvent = {
  id: string;
  label: string;
  status: "complete" | "partial" | "skipped";
  detail: string;
  timestamp: string;
};

export type IdentityProfile = {
  id: string;
  createdAt: string;
  query: NormalizedInput;
  possibleFullName?: string;
  companyName?: string;
  country?: string;
  city?: string;
  state?: string;
  approximateArea?: string;
  timezone?: string;
  languages: string[];
  genderPrediction?: {
    value: "not-inferred";
    confidence: 0;
    note: string;
  };
  confidence: number;
  location: LocationIntelligence;
  phoneIntel?: PhoneIntelligence;
  domainIntel?: DomainIntelligence;
  avatars: PublicAvatar[];
  possibleMatches: PossibleMatch[];
  confidenceFactors: ConfidenceFactor[];
  investigationTasks: InvestigationTask[];
  exposure: ExposureIntelligence;
  vehicle?: VehiclePlateIntelligence;
  footprint: DigitalFootprint;
  risk: RiskAnalysis;
  aiSummary: string;
  evidence: SourceEvidence[];
  graph: RelationshipGraph;
  timeline: SearchTimelineEvent[];
  compliance: {
    mode: "authorized-public-osint";
    sensitiveModules: Array<{ name: string; status: "disabled" | "requires-review"; reason: string }>;
    auditId: string;
  };
};

export type AnalyticsSnapshot = {
  totalSearches: number;
  apiUsage: Array<{ source: string; calls: number; status: "ok" | "degraded" | "disabled" }>;
  mostSearchedCountries: Array<{ country: string; count: number }>;
  riskDistribution: Array<{ label: string; value: number }>;
  trends: Array<{ day: string; searches: number; risk: number }>;
};
