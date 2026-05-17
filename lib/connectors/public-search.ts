import { NormalizedInput, SourceEvidence } from "@/lib/osint/types";

export function buildPublicSearchEvidence(input: NormalizedInput) {
  const terms = [
    input.fullName,
    input.companyName,
    input.normalizedUsername,
    input.normalizedEmail ? input.normalizedEmail.split("@")[1] : undefined,
    input.cityState,
    input.country
  ].filter(Boolean);

  if (terms.length === 0) return [];

  const query = encodeURIComponent(terms.join(" "));
  const links = [
    {
      source: "Search engine snippets",
      url: `https://www.google.com/search?q=${query}`,
      title: "Manual public web search"
    },
    {
      source: "OpenStreetMap",
      url: `https://www.openstreetmap.org/search?query=${query}`,
      title: "Public map search"
    },
    {
      source: "GitHub public search",
      url: `https://github.com/search?q=${query}&type=users`,
      title: "GitHub user search"
    },
    {
      source: "LinkedIn public search",
      url: `https://www.linkedin.com/search/results/all/?keywords=${query}`,
      title: "LinkedIn public search"
    },
    {
      source: "X/Twitter public search",
      url: `https://x.com/search?q=${query}`,
      title: "X/Twitter public search"
    },
    {
      source: "Instagram public search",
      url: `https://www.instagram.com/explore/search/keyword/?q=${query}`,
      title: "Instagram public search"
    }
  ];

  return links.map<SourceEvidence>((link) => ({
    source: link.source,
    type: "search",
    title: link.title,
    url: link.url,
    confidence: 0.35,
    summary: "Prepared a manual review link. Automated scraping of search result pages is intentionally not performed.",
    collectedAt: new Date().toISOString(),
    legalBasis: "derived"
  }));
}
