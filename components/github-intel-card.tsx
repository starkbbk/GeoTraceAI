"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  ExternalLink,
  Github,
  GitFork,
  Loader2,
  MapPin,
  Search,
  Star,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ProfileSnapshot = {
  login: string;
  name?: string;
  avatarUrl: string;
  htmlUrl: string;
  bio?: string;
  company?: string;
  location?: string;
  blog?: string;
  followers: number;
  following: number;
  publicRepos: number;
  publicGists: number;
  createdAt?: string;
};

type ActivityEvent = {
  id: string;
  type: string;
  repo?: string;
  message?: string;
  url?: string;
  createdAt?: string;
};

type RepoSummary = {
  name: string;
  fullName: string;
  url: string;
  description?: string;
  language?: string;
  stars: number;
  forks: number;
};

type ApiResponse = {
  ok: boolean;
  configured: boolean;
  username?: string;
  profile?: ProfileSnapshot;
  recentActivity: ActivityEvent[];
  topRepositories: RepoSummary[];
  error?: string;
};

export function GithubIntelCard() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (target: string) => {
    if (!target.trim()) return;
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    try {
      const response = await fetch("/api/github-intel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: target.trim() }),
        signal: controller.signal
      });

      const json = (await response.json()) as ApiResponse & { error?: string };

      if (!response.ok || !json.ok) {
        setError(typeof json.error === "string" ? json.error : "GitHub lookup failed.");
        setData(null);
      } else {
        setData(json);
      }
    } catch (err) {
      const aborted = err instanceof Error && err.name === "AbortError";
      setError(
        aborted
          ? "Request timed out. GitHub may be slow or unreachable."
          : err instanceof Error
            ? err.message
            : "Unexpected error during GitHub lookup."
      );
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, []);

  return (
    <Card className="p-5 sm:p-6">
      <CardHeader className="mb-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Github className="h-5 w-5 text-accent-100" />
            GitHub Intelligence
          </CardTitle>
          <CardDescription>
            Public GitHub profile metadata: avatar, bio, repos, followers, recent activity.
          </CardDescription>
        </div>
      </CardHeader>

      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          search(username);
        }}
      >
        <Input
          placeholder="GitHub username or email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Button type="submit" disabled={loading || !username.trim()} className="sm:w-auto">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Lookup
        </Button>
      </form>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 rounded-lg border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-100"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {data?.profile && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-5 space-y-5"
          >
            {/* Profile header */}
            <div className="flex flex-wrap items-start gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.profile.avatarUrl}
                alt={`${data.profile.login} avatar`}
                className="h-20 w-20 rounded-md border border-accent-300/30 object-cover shadow-glow"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {data.profile.name ?? data.profile.login}
                    </h3>
                    <a
                      href={data.profile.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-accent-200 hover:text-white"
                    >
                      @{data.profile.login}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <Badge tone="good">verified public</Badge>
                </div>
                {data.profile.bio && (
                  <p className="mt-2 text-sm leading-6 text-slate-300">{data.profile.bio}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                  {data.profile.company && (
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" /> {data.profile.company}
                    </span>
                  )}
                  {data.profile.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" /> {data.profile.location}
                    </span>
                  )}
                  {data.profile.blog && (
                    <a
                      href={data.profile.blog.startsWith("http") ? data.profile.blog : `https://${data.profile.blog}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 hover:text-accent-200"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> {data.profile.blog}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Stat tiles */}
            <div className="grid gap-3 sm:grid-cols-4">
              <Stat label="Repos" value={data.profile.publicRepos} icon={Github} />
              <Stat label="Followers" value={data.profile.followers} icon={Users} />
              <Stat label="Following" value={data.profile.following} icon={Users} />
              <Stat label="Gists" value={data.profile.publicGists} icon={Star} />
            </div>

            {/* Top repos */}
            {data.topRepositories.length > 0 && (
              <div>
                <h4 className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                  Top public repositories
                </h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {data.topRepositories.map((repo) => (
                    <a
                      key={repo.fullName}
                      href={repo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-md border border-white/10 bg-white/[0.04] p-3 transition hover:border-accent-300/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="truncate text-sm font-medium text-white">{repo.name}</p>
                        <div className="flex shrink-0 items-center gap-2 text-xs text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <Star className="h-3 w-3" /> {repo.stars}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <GitFork className="h-3 w-3" /> {repo.forks}
                          </span>
                        </div>
                      </div>
                      {repo.description && (
                        <p className="mt-2 line-clamp-2 text-xs text-slate-400">{repo.description}</p>
                      )}
                      {repo.language && (
                        <span className="mt-2 inline-block rounded-full bg-accent-400/10 px-2 py-0.5 text-[11px] text-accent-100">
                          {repo.language}
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Recent activity */}
            {data.recentActivity.length > 0 && (
              <div>
                <h4 className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                  Recent public activity
                </h4>
                <div className="space-y-2">
                  {data.recentActivity.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-white">
                          {event.type.replace(/Event$/, "")}
                        </span>
                        {event.createdAt && (
                          <span className="text-xs text-slate-500">
                            {new Date(event.createdAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                      {event.repo && (
                        <p className="mt-1 text-xs text-slate-400">{event.repo}</p>
                      )}
                      {event.message && (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-300">{event.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!data.configured && (
              <p className="text-xs text-slate-500">
                Tip: set <code className="rounded bg-white/10 px-1 py-0.5">GITHUB_TOKEN</code> for higher rate limits.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function Stat({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold text-white">{value.toLocaleString()}</p>
    </div>
  );
}
