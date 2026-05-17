import { NormalizedInput, SourceEvidence } from "@/lib/osint/types";
import { config } from "@/lib/security/config";
import { cachedJson } from "./http";

type GithubUser = {
  login: string;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
  bio?: string;
  company?: string;
  location?: string;
  blog?: string;
  name?: string;
};

export async function lookupGithub(input: NormalizedInput) {
  const candidates = buildGithubCandidates(input);
  if (candidates.length === 0) return { evidence: [], profiles: [] };

  const results = await Promise.all(candidates.map((candidate) => lookupGithubUser(candidate, input)));
  const profiles = dedupeProfiles(results.flatMap((result) => result.profiles));
  const evidence = results.flatMap((result) => result.evidence);

  return { evidence, profiles };
}

async function lookupGithubUser(username: string, input: NormalizedInput) {
  const response = await cachedJson<GithubUser>({
    source: "github",
    cacheKey: username.toLowerCase(),
    url: `https://api.github.com/users/${encodeURIComponent(username)}`,
    ttlMs: 6 * 60 * 60_000,
    minIntervalMs: config.githubToken ? 250 : 1_000,
    init: {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "GeoTraceAI",
        ...(config.githubToken ? { Authorization: `Bearer ${config.githubToken}` } : {})
      }
    }
  });

  if (response.status === 404) return { evidence: [], profiles: [] };
  if (!response.ok || !response.data) {
    return {
      evidence: response.status
        ? [
            {
              source: "GitHub REST API",
              type: "repository",
              title: `GitHub lookup unavailable: ${username}`,
              confidence: 0.2,
              summary: response.error ?? `GitHub returned HTTP ${response.status}.`,
              collectedAt: new Date().toISOString(),
              legalBasis: "public-api"
            } satisfies SourceEvidence
          ]
        : [],
      profiles: []
    };
  }

  const user = response.data;
  const confidence = scoreGithubMatch(input, user);
  const evidence: SourceEvidence = {
    source: "GitHub REST API",
    type: "repository",
    title: `GitHub profile: ${user.login}`,
    url: user.html_url,
    confidence,
    summary: [user.name, user.bio, user.location].filter(Boolean).join(" | ") || "Public GitHub profile found.",
    collectedAt: new Date().toISOString(),
    legalBasis: "public-api",
    fields: {
      avatarUrl: user.avatar_url,
      repositories: user.public_repos,
      followers: user.followers,
      company: user.company ?? null,
      blog: user.blog ?? null,
      location: user.location ?? null,
      cached: response.cached
    }
  };

  return {
    evidence: [evidence],
    profiles: [
      {
        login: user.login,
        url: user.html_url,
        repositories: user.public_repos,
        followers: user.followers,
        bio: user.bio,
        confidence
      }
    ]
  };
}

function buildGithubCandidates(input: NormalizedInput) {
  const candidates = new Set<string>();
  if (input.normalizedUsername) candidates.add(input.normalizedUsername);
  if (input.normalizedEmail) candidates.add(input.normalizedEmail.split("@")[0].replace(/[^a-z0-9-]/gi, "-"));
  return Array.from(candidates)
    .map((candidate) => candidate.toLowerCase())
    .filter((candidate) => /^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/.test(candidate))
    .slice(0, 3);
}

function scoreGithubMatch(input: NormalizedInput, user: GithubUser) {
  const login = user.login.toLowerCase();
  if (input.normalizedUsername === login) return 0.9;
  if (input.normalizedEmail?.split("@")[0].toLowerCase() === login) return 0.62;
  const name = user.name?.toLowerCase();
  if (name && input.fullName && name === input.fullName.toLowerCase()) return 0.72;
  return 0.52;
}

function dedupeProfiles<T extends { login: string }>(profiles: T[]) {
  return Array.from(new Map(profiles.map((profile) => [profile.login.toLowerCase(), profile])).values());
}
