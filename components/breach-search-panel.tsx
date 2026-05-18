"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  AtSign,
  Clock,
  Globe2,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingUp
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/* ---------- Types ---------- */

type Severity = "low" | "medium" | "high" | "critical";

type BreachRecord = {
  id: string;
  source: string;
  sourceUrl: string;
  breachDate?: string;
  exposedFields: string[];
  riskScore: number;
  exposureCount: number;
  severity: Severity;
  confidence: number;
  identifierType: string;
  verified: boolean;
  inferred: boolean;
  recommendation: string;
  disclaimer: string;
};

type TimelineEvent = {
  id: string;
  date: string;
  label: string;
  severity: Severity;
  source: string;
  detail: string;
};

type BreachMetrics = {
  exposureCount: number;
  breachSources: number;
  riskScore: number;
  highestSeverity: Severity;
  verifiedMetadata: number;
  affectedIdentifierTypes: string[];
};

type BreachResponse = {
  id: string;
  provider: string;
  configured: boolean;
  ok: boolean;
  records: BreachRecord[];
  timeline: TimelineEvent[];
  metrics: BreachMetrics;
  monitoringRecommendation: string;
  summary: string;
  compliance: { consentAccepted: boolean; storage: string; disclosure?: string };
  rateLimit: { remaining: number; resetAt: number };
  error?: string;
};

/* ---------- Constants ---------- */

const SEVERITY_TONE: Record<Severity, "good" | "warn" | "bad"> = {
  low: "good",
  medium: "warn",
  high: "bad",
  critical: "bad"
};

const SEVERITY_COLOR: Record<Severity, string> = {
  low: "border-emerald-300/30 bg-emerald-400/10",
  medium: "border-amber-300/30 bg-amber-400/10",
  high: "border-red-300/30 bg-red-400/10",
  critical: "border-red-400/40 bg-red-500/15"
};

const SEVERITY_DOT: Record<Severity, string> = {
  low: "bg-emerald-400",
  medium: "bg-amber-400",
  high: "bg-red-400",
  critical: "bg-red-500"
};

/* ---------- Component ---------- */

export function BreachSearchPanel() {
  const [provider, setProvider] = useState<"leak-lookup" | "hibp">("leak-lookup");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [domain, setDomain] = useState("");
  const [phone, setPhone] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BreachResponse | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [tableFilter, setTableFilter] = useState("");

  const hasInput = Boolean(email || username || domain || phone);

  const submit = useCallback(
    async (retry = false) => {
      if (!consentAccepted) {
        setError("You must accept the consent warning before searching.");
        return;
      }
      if (!hasInput) {
        setError("Provide at least one identifier: email, username, domain, or phone.");
        return;
      }

      setLoading(true);
      setError(null);
      if (!retry) setResult(null);

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15_000);

        const response = await fetch("/api/breach-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            provider,
            email: email || undefined,
            username: username || undefined,
            domain: domain || undefined,
            phone: phone || undefined,
            consentAccepted,
            authorizationAccepted: consentAccepted
          })
        });

        clearTimeout(timeout);

        const data = (await response.json()) as BreachResponse & { error?: string };

        if (!response.ok) {
          if (response.status === 429) {
            setError("Rate limited. Please wait a moment before retrying.");
          } else {
            setError(
              typeof data.error === "string"
                ? data.error
                : "Breach search failed. Try again shortly."
            );
          }
          setLoading(false);
          return;
        }

        setResult(data);
        setRetryCount(0);
      } catch (err) {
        const aborted = err instanceof Error && err.name === "AbortError";
        setError(
          aborted
            ? "Request timed out. The breach intelligence service may be slow."
            : err instanceof Error
              ? err.message
              : "Unexpected error during breach search."
        );
      } finally {
        setLoading(false);
      }
    },
    [provider, email, username, domain, phone, consentAccepted, hasInput]
  );

  const handleRetry = () => {
    setRetryCount((c) => c + 1);
    submit(true);
  };

  const filteredRecords = result?.records.filter((r) => {
    if (!tableFilter) return true;
    const q = tableFilter.toLowerCase();
    return (
      r.source.toLowerCase().includes(q) ||
      r.identifierType.toLowerCase().includes(q) ||
      r.severity.includes(q) ||
      r.exposedFields.some((f) => f.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card className="p-5 sm:p-6">
        <CardHeader className="mb-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ShieldAlert className="h-5 w-5 text-accent-100" />
                {provider === "leak-lookup" ? "Leak-Lookup Breach Intelligence" : "HIBP Breach Intelligence"}
              </CardTitle>
              <CardDescription>
                Search public breach metadata via {provider === "leak-lookup" ? "Leak-Lookup" : "Have I Been Pwned"}. Only exposure intelligence is displayed — no plaintext
                passwords, stolen credentials, or private data.
              </CardDescription>
            </div>
            
            <div className="flex shrink-0 items-center overflow-hidden rounded-md border border-white/10 bg-black/20 p-1">
              <button
                type="button"
                onClick={() => setProvider("leak-lookup")}
                className={`rounded px-3 py-1.5 text-xs font-medium transition ${provider === "leak-lookup" ? "bg-accent-500/30 text-accent-100 shadow" : "text-slate-400 hover:text-white"}`}
              >
                Leak-Lookup
              </button>
              <button
                type="button"
                onClick={() => setProvider("hibp")}
                className={`rounded px-3 py-1.5 text-xs font-medium transition ${provider === "hibp" ? "bg-accent-500/30 text-accent-100 shadow" : "text-slate-400 hover:text-white"}`}
              >
                HIBP
              </button>
            </div>
          </div>
        </CardHeader>

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                <Mail className="h-3.5 w-3.5" /> Email
              </span>
              <Input
                type="email"
                value={email}
                placeholder="user@example.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                <AtSign className="h-3.5 w-3.5" /> Username
              </span>
              <Input
                value={username}
                placeholder="github_handle"
                onChange={(e) => setUsername(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                <Globe2 className="h-3.5 w-3.5" /> Domain
              </span>
              <Input
                value={domain}
                placeholder="example.com"
                onChange={(e) => setDomain(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                <Phone className="h-3.5 w-3.5" /> Phone
              </span>
              <Input
                type="tel"
                value={phone}
                placeholder="+91 98765 43210"
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
          </div>

          {/* Consent Warning */}
          <label className="flex items-start gap-3 rounded-lg border border-amber-300/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-white/20 bg-black"
              checked={consentAccepted}
              onChange={(e) => setConsentAccepted(e.target.checked)}
            />
            <span>
              <strong className="text-amber-200">Consent &amp; Authorization:</strong> I confirm this search is
              authorized, lawful, and limited to public-source breach metadata. No credentials will be stored or
              displayed.
            </span>
          </label>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-start gap-3 rounded-lg border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-100"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
                <div className="flex-1">
                  <p>{error}</p>
                  {retryCount < 3 && (
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs text-red-200 hover:text-white"
                    >
                      <RefreshCw className="h-3 w-3" /> Retry ({3 - retryCount} left)
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading / Submit */}
          {loading ? (
            <div className="flex items-center gap-3 rounded-lg border border-accent-300/20 bg-accent-400/10 p-4">
              <Loader2 className="h-5 w-5 animate-spin text-accent-100" />
              <div>
                <p className="text-sm font-medium text-accent-100">Querying Leak-Lookup breach intelligence…</p>
                <p className="mt-1 text-xs text-slate-400">
                  Searching public breach metadata. No credentials are transmitted or stored.
                </p>
              </div>
            </div>
          ) : (
            <Button size="lg" type="submit" disabled={!hasInput || !consentAccepted}>
              <Search className="h-4 w-4" />
              Search Breach Metadata
            </Button>
          )}
        </form>
      </Card>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            {/* Summary Banner */}
            <Card className="border-accent-300/20 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-accent-100" />
                <p className="text-sm text-slate-200">{result.summary}</p>
                <Badge tone="info">{result.provider}</Badge>
                {result.configured ? (
                  <Badge tone="good">API Connected</Badge>
                ) : (
                  <Badge tone="warn">Demo Mode</Badge>
                )}
              </div>
            </Card>

            {/* Metrics Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricTile
                icon={Shield}
                label="Risk Score"
                value={`${result.metrics.riskScore}/100`}
                severity={result.metrics.highestSeverity}
              />
              <MetricTile
                icon={TrendingUp}
                label="Exposure Count"
                value={String(result.metrics.exposureCount)}
                severity={result.metrics.exposureCount > 10 ? "high" : result.metrics.exposureCount > 3 ? "medium" : "low"}
              />
              <MetricTile
                icon={ShieldAlert}
                label="Breach Sources"
                value={String(result.metrics.breachSources)}
                severity={result.metrics.breachSources > 5 ? "high" : result.metrics.breachSources > 2 ? "medium" : "low"}
              />
              <MetricTile
                icon={Clock}
                label="Highest Severity"
                value={result.metrics.highestSeverity.toUpperCase()}
                severity={result.metrics.highestSeverity}
              />
            </div>

            {/* Monitoring Recommendation */}
            <Card className="border-accent-300/15 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent-100" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                    Monitoring Recommendation
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">
                    {result.monitoringRecommendation}
                  </p>
                </div>
              </div>
            </Card>

            {/* Animated Breach Cards */}
            {result.records.length > 0 && (
              <div>
                <h3 className="mb-4 text-base font-semibold text-white">Breach Records</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {result.records.map((record, index) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06 }}
                    >
                      <BreachCard record={record} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Exposure Timeline */}
            {result.timeline.length > 0 && (
              <Card className="p-5">
                <CardHeader>
                  <div>
                    <CardTitle>Exposure Timeline</CardTitle>
                    <CardDescription>
                      Chronological breach appearances from Leak-Lookup metadata.
                    </CardDescription>
                  </div>
                </CardHeader>
                <div className="space-y-4">
                  {result.timeline.map((event) => (
                    <div key={event.id} className="grid grid-cols-[92px_1fr] gap-4">
                      <div className="text-xs text-slate-500">{event.date.slice(0, 10)}</div>
                      <div className="relative border-l border-white/10 pl-4">
                        <span
                          className={`absolute -left-1.5 top-1 h-3 w-3 rounded-full ${SEVERITY_DOT[event.severity]}`}
                        />
                        <p className="text-sm font-medium text-white">{event.label}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
                          {event.source}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-400">{event.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Searchable Table */}
            {result.records.length > 0 && (
              <Card className="p-5">
                <CardHeader>
                  <div>
                    <CardTitle>Breach Metadata Table</CardTitle>
                    <CardDescription>
                      Searchable breach intelligence records. Filter by source, severity, or field.
                    </CardDescription>
                  </div>
                </CardHeader>
                <div className="mb-4">
                  <Input
                    placeholder="Filter records…"
                    value={tableFilter}
                    onChange={(e) => setTableFilter(e.target.value)}
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-[0.14em] text-slate-500">
                      <tr>
                        <th className="border-b border-white/10 py-3">Source</th>
                        <th className="border-b border-white/10 py-3">Date</th>
                        <th className="border-b border-white/10 py-3">Exposed Fields</th>
                        <th className="border-b border-white/10 py-3">Severity</th>
                        <th className="border-b border-white/10 py-3">Risk</th>
                        <th className="border-b border-white/10 py-3">Exposures</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(filteredRecords ?? []).map((record) => (
                        <tr key={record.id} className="text-slate-300">
                          <td className="border-b border-white/5 py-3 font-medium text-white">
                            {record.source}
                          </td>
                          <td className="border-b border-white/5 py-3">
                            {record.breachDate ?? "Unknown"}
                          </td>
                          <td className="border-b border-white/5 py-3">
                            <div className="flex flex-wrap gap-1">
                              {record.exposedFields.slice(0, 4).map((field) => (
                                <span
                                  key={field}
                                  className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-400"
                                >
                                  {field}
                                </span>
                              ))}
                              {record.exposedFields.length > 4 && (
                                <span className="text-xs text-slate-500">
                                  +{record.exposedFields.length - 4}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="border-b border-white/5 py-3">
                            <Badge tone={SEVERITY_TONE[record.severity]}>
                              {record.severity}
                            </Badge>
                          </td>
                          <td className="border-b border-white/5 py-3">{record.riskScore}</td>
                          <td className="border-b border-white/5 py-3">{record.exposureCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredRecords?.length === 0 && (
                    <p className="py-4 text-center text-sm text-slate-500">
                      No records match your filter.
                    </p>
                  )}
                </div>
              </Card>
            )}

            {/* Compliance Footer */}
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-xs leading-5 text-slate-500">
              <p>
                <strong className="text-slate-400">Compliance:</strong>{" "}
                {result.compliance.storage}
              </p>
              {result.compliance.disclosure && (
                <p className="mt-1">{result.compliance.disclosure}</p>
              )}
              <p className="mt-1">
                No plaintext passwords, stolen credentials, or private records are displayed or stored by this system.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function MetricTile({
  icon: Icon,
  label,
  value,
  severity
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  severity: Severity;
}) {
  return (
    <div className={`rounded-lg border p-4 ${SEVERITY_COLOR[severity]}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-300" />
        <span className="text-xs uppercase tracking-[0.14em] text-slate-400">{label}</span>
      </div>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function BreachCard({ record }: { record: BreachRecord }) {
  return (
    <details
      className={`group rounded-lg border p-4 transition-colors open:border-accent-300/30 ${SEVERITY_COLOR[record.severity]}`}
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge tone={SEVERITY_TONE[record.severity]}>{record.severity}</Badge>
            <Badge tone={record.verified ? "good" : "neutral"}>
              {record.verified ? "verified" : "inferred"}
            </Badge>
            <Badge tone="info">{record.identifierType}</Badge>
          </div>
          <p className="text-sm font-medium text-white">{record.source}</p>
          <p className="mt-1 text-xs text-slate-500">
            {record.breachDate ?? "Date unknown"} · {record.exposureCount} exposure
            {record.exposureCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="text-right">
          <ShieldAlert className="ml-auto h-5 w-5 text-accent-100" />
          <p className="mt-2 text-xs text-slate-400">Risk {record.riskScore}</p>
        </div>
      </summary>
      <div className="mt-4 border-t border-white/10 pt-4">
        <div className="mb-3">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Exposed Fields</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {record.exposedFields.map((field) => (
              <span
                key={field}
                className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-slate-300"
              >
                {field}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-md border border-white/10 bg-black/20 p-3">
          <p className="text-xs text-slate-500">Recommendation</p>
          <p className="mt-1 text-sm leading-6 text-slate-200">{record.recommendation}</p>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">{record.disclaimer}</p>
      </div>
    </details>
  );
}
