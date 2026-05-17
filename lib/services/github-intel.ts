/**
 * GitHub Intelligence Service
 *
 * Builds a richer GitHub profile snapshot for the dashboard intelligence
 * card. Reuses the existing cached HTTP layer and the GITHUB_TOKEN from
 * environment configuration.
 *
 * Returns:
 *   - profile: avatar, bio, followers, repos, company, location
 *   - recentActivity: last 5 public events (push, pull-request, issue, etc.)
 *   - topRepositories: 5 most starred public repos
 *
 * No private events, secrets, or scoped data are accessed.
 */

import { config } from "@/lib/security/config";
import { cachedJson } from "@/lib/connectors/http";

export type GithubProfileSnapshot = {
  login: string;
  name?: string;
  avatarUrl: string;
  htmlUrl: string;
  bio?: string;
  company?: string;
  location?: string;
  blog?: string;
  email?: string;
  followers: number;
  following: number;
  publicRepos: number;
  publicGists: number;
  createdAt?: string;
  updatedAt?: string;
};

export type GithubActivityEvent = {
  id: string;
  type: string;
  repo?: string;
  message?: string;
  url?: string;
  createdAt?: string;
};

export type GithubRepoSummary = {
  name: string;
  fullName: string;
  url: string;
  description?: string;
  language?: string;
  stars: number;
  forks: number;
  updatedAt?: string;
};

export type GithubIntelligence = {
  configured: boolean;
  ok: boolean;
  username?: string;
  profile?: GithubProfileSnapshot;
  recentActivity: GithubActivityEvent[];
  topRepositories: GithubRepoSummary[];
  error?: string;
};

type RawUser = {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name?: string;
  company?: string;
  blog?: string;
  location?: string;
  email?: string;
  bio?: string;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at?: string;
  updated_at?: string;
};

type RawEvent = {
  id: string;
  type: string;
  repo?: { name?: string; url?: string };
  payload?: { commits?: Array<{ message?: string }>; action?: string; pull_request?: { html_url?: string }; issue?: { html_url?: string } };
  created_at?: string;
};

type RawRepo = {
  name: string;
  full_name: string;
  html_url: string;
  description?: string;
  language?: string;
  stargazers_count: number;
  forks_count: number;
  fork: boolean;
  updated_at?: string;
};

const HEADERS = {
  Accept: "application/vnd.github+json",
  "User-Agent": "GeoTraceAI/1.0",
  "X-GitHub-Api-Version": "2022-11-28"
} as const;

function authHeaders() {
  return config.githubToken
    ? { ...HEADERS, Authorization: `Bearer ${config.githubToken}` }
    : { ...HEADERS };
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export async function buildGithubIntelligence(
  rawUsername: string
): Promise<GithubIntelligence> {
  const username = sanitizeUsername(rawUsername);
  if (!username) {
    return {
      configured: Boolean(config.githubToken),
      ok: false,
      recentActivity: [],
      topRepositories: [],
      error: "Username is empty or contains invalid characters."
    };
  }

  const [profileResp, eventsResp, reposResp] = await Promise.all([
    cachedJson<RawUser>({
      source: "github",
      cacheKey: `user:${username.toLowerCase()}`,
      url: `https://api.github.com/users/${encodeURIComponent(username)}`,
      ttlMs: 6 * 60 * 60_000,
      timeoutMs: 8_000,
      retries: 1,
      retryDelayMs: 500,
      init: { headers: authHeaders() }
    }),
    cachedJson<RawEvent[]>({
      source: "github",
      cacheKey: `events:${username.toLowerCase()}`,
      url: `https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=10`,
      ttlMs: 30 * 60_000,
      timeoutMs: 8_000,
      retries: 1,
      init: { headers: authHeaders() }
    }),
    cachedJson<RawRepo[]>({
      source: "github",
      cacheKey: `repos:${username.toLowerCase()}`,
      url: `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=30`,
      ttlMs: 60 * 60_000,
      timeoutMs: 8_000,
      retries: 1,
      init: { headers: authHeaders() }
    })
  ]);

  if (profileResp.status === 404 || !profileResp.ok || !profileResp.data) {
    return {
      configured: Boolean(config.githubToken),
      ok: false,
      username,
      recentActivity: [],
      topRepositories: [],
      error:
        profileResp.status === 404
          ? `GitHub user '${username}' not found.`
          : profileResp.error ?? `GitHub returned HTTP ${profileResp.status}.`
    };
  }

  const profile = mapProfile(profileResp.data);
  const recentActivity = mapEvents(eventsResp.ok ? eventsResp.data ?? [] : []);
  const topRepositories = mapRepos(reposResp.ok ? reposResp.data ?? [] : []);

  return {
    configured: Boolean(config.githubToken),
    ok: true,
    username,
    profile,
    recentActivity,
    topRepositories
  };
}

/* ------------------------------------------------------------------ */
/*  Mapping helpers                                                    */
/* ------------------------------------------------------------------ */

function mapProfile(user: RawUser): GithubProfileSnapshot {
  return {
    login: user.login,
    name: user.name,
    avatarUrl: user.avatar_url,
    htmlUrl: user.html_url,
    bio: user.bio,
    company: user.company,
    location: user.location,
    blog: user.blog,
    email: user.email,
    followers: user.followers,
    following: user.following,
    publicRepos: user.public_repos,
    publicGists: user.public_gists,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  };
}

function mapEvents(events: RawEvent[]): GithubActivityEvent[] {
  return events.slice(0, 5).map((event) => ({
    id: event.id,
    type: event.type,
    repo: event.repo?.name,
    message: extractEventMessage(event),
    url: extractEventUrl(event),
    createdAt: event.created_at
  }));
}

function extractEventMessage(event: RawEvent) {
  if (event.type === "PushEvent") {
    return event.payload?.commits?.[0]?.message;
  }
  if (event.type === "PullRequestEvent") {
    return `${event.payload?.action ?? "updated"} pull request`;
  }
  if (event.type === "IssuesEvent") {
    return `${event.payload?.action ?? "updated"} issue`;
  }
  if (event.type === "WatchEvent") {
    return "starred a repository";
  }
  if (event.type === "ForkEvent") {
    return "forked a repository";
  }
  return event.type.replace(/Event$/, "").toLowerCase();
}

function extractEventUrl(event: RawEvent) {
  return (
    event.payload?.pull_request?.html_url ??
    event.payload?.issue?.html_url ??
    (event.repo?.name ? `https://github.com/${event.repo.name}` : undefined)
  );
}

function mapRepos(repos: RawRepo[]): GithubRepoSummary[] {
  return repos
    .filter((r) => !r.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 5)
    .map((r) => ({
      name: r.name,
      fullName: r.full_name,
      url: r.html_url,
      description: r.description ?? undefined,
      language: r.language ?? undefined,
      stars: r.stargazers_count,
      forks: r.forks_count,
      updatedAt: r.updated_at
    }));
}

function sanitizeUsername(raw: string) {
  const trimmed = raw.trim().replace(/^@/, "");
  return /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(trimmed)
    ? trimmed
    : "";
}
