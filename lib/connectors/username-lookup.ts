import { NormalizedInput, SourceEvidence } from "@/lib/osint/types";
import { cachedJson } from "./http";

type UsernamePlatform = {
  name: string;
  url: (username: string) => string;
  profileUrl: (username: string) => string;
};

type UsernameLookupResult = {
  profiles: Array<{
    platform: string;
    handle: string;
    url: string;
    confidence: number;
  }>;
  evidence: SourceEvidence[];
};

type UsernameCandidate = {
  value: string;
  basis: "submitted-username" | "email-local-part" | "name-slug";
  baseConfidence: number;
};

const platforms = [
  {
    name: "GitHub",
    url: (username: string) => `https://api.github.com/users/${encodeURIComponent(username)}`,
    profileUrl: (username: string) => `https://github.com/${encodeURIComponent(username)}`
  },
  {
    name: "Reddit",
    url: (username: string) => `https://www.reddit.com/user/${encodeURIComponent(username)}/about.json`,
    profileUrl: (username: string) => `https://www.reddit.com/user/${encodeURIComponent(username)}`
  },
] satisfies UsernamePlatform[];

export async function lookupPublicUsername(input: NormalizedInput): Promise<UsernameLookupResult> {
  if (!input.normalizedUsername) return { profiles: [], evidence: [] };

  const candidates = buildCandidates(input);
  if (candidates.length === 0) return { profiles: [], evidence: [] };

  const checks = await Promise.all(
    candidates.flatMap((candidate) => platforms.map((platform) => checkPlatform(platform, candidate)))
  );

  const profiles = dedupe(checks.flatMap((item) => item.profiles));
  const evidence = checks.flatMap((item) => item.evidence);
  return { profiles, evidence };
}

async function checkPlatform(platform: UsernamePlatform, candidate: UsernameCandidate): Promise<UsernameLookupResult> {
  const username = candidate.value;
  const response = await cachedJson<unknown>({
    source: `username:${platform.name.toLowerCase()}`,
    cacheKey: `${platform.name}:${username.toLowerCase()}`,
    url: platform.url(username),
    ttlMs: 6 * 60 * 60_000,
    minIntervalMs: 900,
    init: {
      headers: {
        "User-Agent": "GeoTraceAI/1.0 authorized-osint",
        Accept: "application/json"
      }
    }
  });

  const exists = response.ok && response.status !== 404;
  if (!exists) {
    return { profiles: [], evidence: [] };
  }

  const platformConfidence = platform.name === "GitHub" ? 0.76 : 0.54;
  const confidence = Math.min(platformConfidence, candidate.baseConfidence);

  return {
    profiles: [
      {
        platform: platform.name,
        handle: username,
        url: platform.profileUrl(username),
        confidence
      }
    ],
    evidence: [
      {
        source: "Public username lookup",
        type: "search",
        title: `${platform.name} profile match`,
        url: platform.profileUrl(username),
        confidence,
        summary: `${platform.name} responded to a public username probe for ${username}.`,
        collectedAt: new Date().toISOString(),
        legalBasis: "public-api",
        fields: {
          platform: platform.name,
          candidateBasis: candidate.basis,
          cached: response.cached
        }
      } satisfies SourceEvidence
    ]
  };
}

function buildCandidates(input: NormalizedInput) {
  const candidates: UsernameCandidate[] = [];
  const seen = new Set<string>();

  addCandidate(candidates, seen, input.normalizedUsername, "submitted-username", 0.82);
  if (input.fullName) {
    const slug = input.fullName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 32);
    addCandidate(candidates, seen, slug, "name-slug", 0.38);
  }
  if (input.normalizedEmail) {
    const local = input.normalizedEmail.split("@")[0].toLowerCase();
    addCandidate(candidates, seen, local, "email-local-part", 0.58);
  }
  return candidates.slice(0, 4);
}

function addCandidate(
  candidates: UsernameCandidate[],
  seen: Set<string>,
  value: string | undefined,
  basis: UsernameCandidate["basis"],
  baseConfidence: number
) {
  if (!value || seen.has(value)) return;
  seen.add(value);
  candidates.push({ value, basis, baseConfidence });
}

function dedupe<T extends { platform: string; handle: string }>(items: T[]) {
  return Array.from(new Map(items.map((item) => [`${item.platform}:${item.handle}`, item])).values());
}
