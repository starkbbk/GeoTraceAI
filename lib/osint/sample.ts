import { IdentityProfile } from "./types";

export const sampleProfile: IdentityProfile = {
  id: "demo",
  createdAt: new Date().toISOString(),
  query: {
    fullName: "Aarav Sharma",
    pincode: "226001",
    country: "India",
    email: "aarav@example.com",
    domain: "example.com",
    username: "aaravdev",
    vehicleNumber: "UP32 AB 1234",
    cityState: "Lucknow, Uttar Pradesh",
    authorizationAccepted: true,
    inferredCountry: "IN",
    normalizedEmail: "aarav@example.com",
    normalizedDomain: "example.com",
    normalizedUsername: "aaravdev",
    normalizedPincode: "226001",
    signals: ["name", "postal-code", "country", "email", "domain", "username", "vehicle", "city-state"],
    confidence: 0.88
  },
  possibleFullName: "Aarav Sharma",
  country: "India",
  city: "Lucknow",
  state: "Uttar Pradesh",
  approximateArea: "226001",
  timezone: "Asia/Kolkata",
  languages: ["Hindi", "English"],
  genderPrediction: {
    value: "not-inferred",
    confidence: 0,
    note: "GeoTrace AI does not infer gender from public identifiers because it is unreliable and privacy-sensitive."
  },
  confidence: 0.84,
  location: {
    country: "India",
    countryCode: "IN",
    city: "Lucknow",
    state: "Uttar Pradesh",
    approximateArea: "226001",
    timezone: "Asia/Kolkata",
    languages: ["Hindi", "English"],
    coordinates: { lat: 26.8467, lng: 80.9462, confidenceRadiusKm: 12 },
    nearbyLandmarks: ["Lucknow", "Uttar Pradesh", "India"]
  },
  phoneIntel: {
    e164: "+919876543210",
    country: "IN",
    valid: true,
    carrier: "Indian mobile number - provider not encoded reliably after MNP",
    telecomCircle: "India mobile circle not reliably encoded after number portability",
    region: "India",
    confidence: 0.46,
    provenance: "derived-inference",
    analysis: [
      "Indian mobile prefixes identify broad mobile numbering, but provider cannot be verified from the number because mobile number portability exists."
    ]
  },
  domainIntel: {
    domain: "example.com",
    disposable: false,
    category: "business-domain",
    reputation: "low-risk",
    confidence: 0.54,
    mxCheck: "not-run",
    analysis: ["Domain is not in the local disposable email provider list.", "Domain category: business-domain."]
  },
  avatars: [],
  possibleMatches: [
    {
      id: "demo-github",
      title: "GitHub: aaravdev",
      subtitle: "Software developer | public profile demo",
      confidence: 0.76,
      provenance: "verified-public-api",
      signals: ["username", "github-api"],
      profileUrl: "https://github.com/aaravdev"
    },
    {
      id: "demo-name-city",
      title: "Aarav Sharma",
      subtitle: "Name and city signal: Lucknow, Uttar Pradesh",
      confidence: 0.68,
      provenance: "derived-inference",
      signals: ["name", "city", "phone"]
    }
  ],
  confidenceFactors: [
    {
      label: "Identifier completeness",
      score: 0.86,
      weight: 0.2,
      provenance: "user-provided",
      detail: "Multiple signal groups supplied."
    },
    {
      label: "Location agreement",
      score: 0.82,
      weight: 0.18,
      provenance: "verified-public-api",
      detail: "Resolved city Lucknow."
    },
    {
      label: "Public profile matches",
      score: 0.58,
      weight: 0.22,
      provenance: "verified-public-api",
      detail: "GitHub and public search signals."
    },
    {
      label: "Contact reputation",
      score: 0.72,
      weight: 0.16,
      provenance: "derived-inference",
      detail: "Business domain; phone valid."
    },
    {
      label: "Verified public evidence",
      score: 0.64,
      weight: 0.24,
      provenance: "verified-public-api",
      detail: "Public evidence records available."
    }
  ],
  investigationTasks: [
    {
      id: "review-matches",
      label: "Review possible matches",
      status: "review",
      detail: "2 possible profile cards generated from public signals."
    },
    {
      id: "contact-reputation",
      label: "Assess contact reputation",
      status: "done",
      detail: "No disposable email signal was detected."
    },
    {
      id: "phone-region",
      label: "Check phone region",
      status: "done",
      detail: "India mobile circle not reliably encoded after number portability"
    },
    {
      id: "history-correlation",
      label: "Search history correlation",
      status: "done",
      detail: "No prior local search overlap found."
    }
  ],
  vehicle: {
    original: "UP32 AB 1234",
    normalized: "UP32AB1234",
    country: "IN",
    valid: true,
    confidence: 0.88,
    format: "India state/RTO/series/serial registration mark",
    state: "Uttar Pradesh",
    stateCode: "UP",
    rtoCode: "UP32",
    rtoOffice: "Lucknow RTO",
    region: "Lucknow",
    regionCoordinates: { lat: 26.847, lng: 80.946, confidenceRadiusKm: 35 },
    vehicleClassEstimate: {
      value: "General registration mark; class not encoded in text",
      confidence: 0.24,
      rationale: "Indian vehicle class is normally indicated by plate color or RC metadata, not by the text string."
    },
    fuelTypeEstimate: {
      value: "Not encoded in plate text",
      confidence: 0.08,
      rationale: "Indian plate text alone does not encode petrol, diesel, CNG, hybrid, or EV fuel type."
    },
    registrationYear: {
      confidence: 0.12,
      rationale: "Standard Indian state/RTO marks do not encode a registration year in the text."
    },
    analysis: [
      "State token: UP (Uttar Pradesh)",
      "RTO token: 32 (Lucknow RTO)",
      "Series token: AB",
      "Serial token: 1234"
    ],
    publicSources: [
      { label: "Parivahan", url: "https://parivahan.gov.in/" },
      { label: "VAHAN dashboard", url: "https://vahan.parivahan.gov.in/vahan4dashboard/" },
      { label: "data.gov.in transport datasets", url: "https://www.data.gov.in/" }
    ]
  },
  exposure: {
    records: [
      {
        id: "demo:breach",
        source: "Have I Been Pwned",
        sourceUrl: "https://haveibeenpwned.com/",
        breachName: "Demo breach metadata",
        exposureType: "breach",
        identifierTypes: ["email", "username", "password-metadata"],
        categories: ["Email addresses", "Usernames", "Passwords"],
        breachYear: 2021,
        firstSeen: "2021-04-01",
        lastSeen: new Date().toISOString(),
        severity: "critical",
        confidence: 0.9,
        verified: true,
        inferred: false,
        summary: "Demo breach metadata record. Password values are never displayed."
      },
      {
        id: "demo:profile",
        source: "GitHub public API",
        sourceUrl: "https://github.com/aaravdev",
        breachName: "Public GitHub profile: aaravdev",
        exposureType: "public-profile",
        identifierTypes: ["username"],
        categories: ["Public profile", "Repository metadata"],
        severity: "low",
        confidence: 0.76,
        verified: true,
        inferred: false,
        lastSeen: new Date().toISOString(),
        summary: "Public profile metadata found. This is not a breach."
      }
    ],
    categories: [
      { key: "email-exposure", label: "Email exposure", count: 1, severity: "critical", confidence: 0.9 },
      { key: "phone-exposure", label: "Phone exposure", count: 0, severity: "low", confidence: 0 },
      { key: "ip-exposure", label: "IP exposure", count: 0, severity: "low", confidence: 0 },
      { key: "username-exposure", label: "Username exposure", count: 2, severity: "critical", confidence: 0.83 },
      { key: "credential-reuse-risk", label: "Credential reuse risk", count: 1, severity: "critical", confidence: 0.9 },
      { key: "social-exposure", label: "Public social exposure", count: 1, severity: "low", confidence: 0.76 }
    ],
    timeline: [
      {
        id: "demo:t1",
        date: "2021-04-01",
        label: "Demo breach metadata",
        severity: "critical",
        source: "Have I Been Pwned",
        detail: "Public breach metadata detected. No password values shown."
      },
      {
        id: "demo:t2",
        date: new Date().toISOString(),
        label: "Public GitHub profile",
        severity: "low",
        source: "GitHub public API",
        detail: "Public username profile metadata available."
      }
    ],
    breachCount: 1,
    repeatedOverlap: 1,
    highestSeverity: "critical",
    heatmap: [
      { label: "breach", value: 1, severity: "medium" },
      { label: "profile", value: 1, severity: "medium" },
      { label: "domain", value: 1, severity: "low" },
      { label: "phone", value: 1, severity: "low" },
      { label: "history", value: 0, severity: "low" },
      { label: "manual", value: 2, severity: "medium" }
    ],
    alertHistory: [
      {
        id: "demo:alert",
        label: "CRITICAL exposure: Demo breach metadata",
        detail: "Demo critical breach metadata alert. No secrets displayed.",
        createdAt: new Date().toISOString(),
        severity: "critical"
      }
    ]
  },
  footprint: {
    socialProfiles: [
      {
        platform: "LinkedIn public search",
        handle: "aaravdev",
        url: "https://www.linkedin.com/search/results/all/?keywords=aaravdev",
        confidence: 0.28
      }
    ],
    githubProfiles: [
      {
        login: "aaravdev",
        url: "https://github.com/aaravdev",
        repositories: 18,
        followers: 42,
        bio: "Software developer",
        confidence: 0.76
      }
    ],
    websites: [{ domain: "gravatar.com", url: "https://gravatar.com/demo", confidence: 0.42 }],
    emails: [{ email: "aarav@example.com", source: "user-provided", confidence: 0.92 }],
    usernames: [{ username: "aaravdev", platform: "Generic handle", confidence: 0.75 }]
  },
  risk: {
    scamLikelihood: 0.24,
    spamReports: 0,
    breachExposureCount: 0,
    reputation: "low-risk",
    indicators: ["Multiple query signals improve correlation", "No private databases or leaked passwords were accessed"]
  },
  aiSummary:
    "This demo identity is likely associated with Lucknow, Uttar Pradesh, India. Multiple public-source style signals suggest a technical digital footprint, but all claims should be validated against source links.",
  evidence: [
    {
      source: "OpenStreetMap Nominatim",
      type: "map",
      title: "Public map geocoding match",
      confidence: 0.82,
      summary: "Lucknow, Uttar Pradesh, India",
      collectedAt: new Date().toISOString(),
      legalBasis: "public-api"
    },
    {
      source: "GitHub REST API",
      type: "repository",
      title: "GitHub profile: aaravdev",
      url: "https://github.com/aaravdev",
      confidence: 0.76,
      summary: "Public GitHub profile style demo record.",
      collectedAt: new Date().toISOString(),
      legalBasis: "public-api"
    },
    {
      source: "Vehicle registration format parser",
      type: "system",
      title: "Indian vehicle registration parser: valid format",
      confidence: 0.88,
      summary:
        "India state/RTO/series/serial registration mark. Estimated registration region: Lucknow. No private owner, chassis, engine, insurance, or protected RC records were accessed.",
      collectedAt: new Date().toISOString(),
      legalBasis: "derived"
    }
  ],
  graph: {
    nodes: [
      { id: "subject", label: "Aarav Sharma", type: "person", confidence: 0.88 },
      { id: "city", label: "Lucknow", type: "location", confidence: 0.72 },
      { id: "email", label: "aarav@example.com", type: "email", confidence: 0.92 },
      { id: "username", label: "aaravdev", type: "username", confidence: 0.82 },
      { id: "vehicle", label: "UP32 AB 1234", type: "vehicle", confidence: 0.7 },
      { id: "source-0", label: "OpenStreetMap", type: "source", confidence: 0.82 }
    ],
    edges: [
      { from: "subject", to: "city", label: "linked", confidence: 0.72 },
      { from: "subject", to: "email", label: "linked", confidence: 0.92 },
      { from: "subject", to: "username", label: "linked", confidence: 0.82 },
      { from: "subject", to: "vehicle", label: "linked", confidence: 0.7 },
      { from: "subject", to: "source-0", label: "map", confidence: 0.82 }
    ]
  },
  timeline: [
    {
      id: "normalize",
      label: "Normalize identifiers",
      status: "complete",
      detail: "6 signal groups parsed for India.",
      timestamp: new Date().toISOString()
    },
    {
      id: "sources",
      label: "Public-source connectors",
      status: "complete",
      detail: "Demo evidence records prepared.",
      timestamp: new Date().toISOString()
    },
    {
      id: "ai",
      label: "AI correlation",
      status: "complete",
      detail: "Generated cautious summary and confidence adjustment.",
      timestamp: new Date().toISOString()
    }
  ],
  compliance: {
    mode: "authorized-public-osint",
    sensitiveModules: [
      {
        name: "Face similarity search",
        status: "disabled",
        reason: "Placeholder only. Enable only for consented image matching with documented legal basis."
      }
    ],
    auditId: "audit_demo"
  }
};
