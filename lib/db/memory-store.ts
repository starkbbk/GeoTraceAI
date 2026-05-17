import { AnalyticsSnapshot, IdentityProfile } from "@/lib/osint/types";

const globalStore = globalThis as unknown as {
  __searches?: Map<string, IdentityProfile>;
  __savedSearches?: Map<string, any>;
  __watchlist?: Map<string, any>;
  __bookmarks?: Map<string, any>;
};

const searches = globalStore.__searches ?? (globalStore.__searches = new Map<string, IdentityProfile>());
const savedSearches = globalStore.__savedSearches ?? (globalStore.__savedSearches = new Map<string, any>());
const watchlist = globalStore.__watchlist ?? (globalStore.__watchlist = new Map<string, any>());
const bookmarks = globalStore.__bookmarks ?? (globalStore.__bookmarks = new Map<string, any>());

export function saveSearch(profile: IdentityProfile) {
  searches.set(profile.id, profile);
  return profile;
}

export function getSearch(id: string) {
  return searches.get(id);
}

export function listSearches() {
  return Array.from(searches.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveSearchToWatchlist(profile: IdentityProfile, notes?: string) {
  const query =
    profile.query.normalizedEmail ??
    profile.query.normalizedPhone ??
    profile.query.normalizedUsername ??
    profile.query.normalizedDomain ??
    profile.query.normalizedIp ??
    profile.query.vehicleNumber ??
    profile.id;
  const type = profile.query.normalizedEmail
    ? "email"
    : profile.query.normalizedPhone
      ? "phone"
      : profile.query.normalizedUsername
        ? "username"
        : profile.query.normalizedDomain
          ? "domain"
          : profile.query.normalizedIp
            ? "ip"
            : profile.query.vehicleNumber
              ? "vehicle"
              : "case";
  const record = {
    id: `watch_${profile.id}`,
    query,
    type,
    notes,
    createdAt: new Date().toISOString(),
    lastSeenAt: profile.createdAt
  };
  watchlist.set(record.id, record);
  return record;
}

export function saveInvestigation(profile: IdentityProfile, title?: string, notes?: string) {
  const record = {
    id: `saved_${profile.id}`,
    profileId: profile.id,
    title: title ?? profile.possibleFullName ?? profile.query.normalizedEmail ?? profile.query.normalizedUsername ?? profile.id,
    notes,
    createdAt: new Date().toISOString()
  };
  savedSearches.set(record.id, record);
  return record;
}

export function bookmarkEvidence(profileId: string, evidenceId?: string, notes?: string) {
  const record = {
    id: `bookmark_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    profileId,
    evidenceId,
    notes,
    createdAt: new Date().toISOString()
  };
  bookmarks.set(record.id, record);
  return record;
}

export function monitoringSnapshot() {
  return {
    savedSearches: Array.from(savedSearches.values()),
    watchlist: Array.from(watchlist.values()),
    bookmarks: Array.from(bookmarks.values())
  };
}

export function analyticsSnapshot(): AnalyticsSnapshot {
  const all = listSearches();
  const countryCounts = countBy(all.map((item) => item.query.inferredCountry));
  const riskCounts = countBy(all.map((item) => item.risk.reputation));

  return {
    totalSearches: all.length,
    apiUsage: [
      { source: "Nominatim", calls: all.length, status: "ok" },
      { source: "GitHub", calls: all.filter((item) => item.query.normalizedUsername).length, status: "ok" },
      { source: "Gravatar", calls: all.filter((item) => item.query.normalizedEmail).length, status: "ok" },
      { source: "HIBP", calls: all.filter((item) => item.query.normalizedEmail).length, status: "degraded" },
      { source: "Public breach catalog", calls: all.length, status: "ok" },
      { source: "AI Providers", calls: all.length, status: "degraded" }
    ],
    mostSearchedCountries: Object.entries(countryCounts).map(([country, count]) => ({ country, count })),
    riskDistribution: ["low-risk", "watch", "elevated", "high-risk", "unknown"].map((label) => ({
      label,
      value: riskCounts[label] ?? 0
    })),
    trends: buildTrends(all)
  };
}

function countBy(values: string[]) {
  return values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function buildTrends(all: IdentityProfile[]) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return date.toISOString().slice(0, 10);
  });

  return days.map((day) => {
    const matches = all.filter((item) => item.createdAt.startsWith(day));
    return {
      day: day.slice(5),
      searches: matches.length,
      risk: matches.filter((item) => ["elevated", "high-risk"].includes(item.risk.reputation)).length
    };
  });
}
