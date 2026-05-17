import { NormalizedInput, DomainIntelligence, SourceEvidence } from "./types";

const disposableDomains = new Set([
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "yopmail.com",
  "trashmail.com",
  "getnada.com",
  "dispostable.com",
  "sharklasers.com"
]);

const consumerDomains = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com",
  "me.com",
  "yahoo.com",
  "proton.me",
  "protonmail.com"
]);

const developerDomains = new Set(["github.com", "gitlab.com", "users.noreply.github.com"]);

export function buildDomainIntelligence(input: NormalizedInput) {
  const domain = input.normalizedEmail?.split("@")[1];
  if (!domain) return { domainIntel: undefined, evidence: [] };

  const disposable = disposableDomains.has(domain);
  const category: DomainIntelligence["category"] = disposable
    ? "disposable-email"
    : developerDomains.has(domain)
      ? "developer-platform"
      : consumerDomains.has(domain)
        ? "consumer-email"
        : domain.includes(".")
          ? "business-domain"
          : "unknown";
  const reputation: DomainIntelligence["reputation"] =
    category === "disposable-email" ? "elevated" : category === "unknown" ? "watch" : "low-risk";

  const domainIntel: DomainIntelligence = {
    domain,
    disposable,
    category,
    reputation,
    confidence: disposable || consumerDomains.has(domain) || developerDomains.has(domain) ? 0.82 : 0.54,
    mxCheck: "not-run",
    analysis: [
      disposable ? "Domain is in the local disposable email provider list." : "Domain is not in the local disposable email provider list.",
      `Domain category: ${category}.`,
      "DNS/MX lookups are not run in this sandboxed module; classification uses public domain lists and syntax only."
    ]
  };

  return {
    domainIntel,
    evidence: [
      {
        source: "Domain intelligence",
        type: "whois",
        title: `Email domain: ${domain}`,
        confidence: domainIntel.confidence,
        summary: `${category} domain with ${reputation} contact reputation. Disposable=${disposable}.`,
        collectedAt: new Date().toISOString(),
        legalBasis: "derived",
        fields: {
          domain,
          disposable,
          category,
          reputation
        }
      } satisfies SourceEvidence
    ]
  };
}
