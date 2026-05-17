import Link from "next/link";
import { Activity, Bell, DatabaseZap, Flame, Github, Radar, ShieldAlert, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BreachSearchPanel } from "@/components/breach-search-panel";
import { ExposureHeatmap } from "@/components/exposure/exposure-heatmap";
import { ExposureTimeline } from "@/components/exposure/exposure-timeline";
import { GithubIntelCard } from "@/components/github-intel-card";
import { MetricCard } from "@/components/metric-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "@/components/visualizations/bar-chart";
import { RiskGraph } from "@/components/visualizations/risk-graph";
import { analyticsSnapshot, listSearches, monitoringSnapshot } from "@/lib/db/memory-store";
import { sampleProfile } from "@/lib/osint/sample";
import { formatPercent } from "@/lib/utils";

export default function DashboardPage() {
  const analytics = analyticsSnapshot();
  const monitoring = monitoringSnapshot();
  const searches = listSearches();
  const recent = searches.length ? searches.slice(0, 8) : [sampleProfile];
  const exposure = recent[0].exposure;
  const breachTotal = recent.reduce((sum, item) => sum + item.exposure.breachCount, 0);
  const alertTotal = recent.reduce((sum, item) => sum + item.exposure.alertHistory.length, 0);
  const severityTotal = recent.filter((item) => ["high", "critical"].includes(item.exposure.highestSeverity)).length;

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge tone="info">Breach Intelligence</Badge>
              <Badge tone="good">Metadata-only</Badge>
              <Badge tone="neutral">Public-source feeds</Badge>
            </div>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">Exposure Command Center</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Monitor public breach metadata, exposure categories, watchlist alerts, and source confidence without
              displaying leaked passwords or stolen credentials.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Monitored searches" value={String(Math.max(analytics.totalSearches, 1))} detail="Persistent-ready search history" icon={Radar} />
          <MetricCard label="Breach metadata" value={String(breachTotal)} detail="HIBP/public catalog records" icon={DatabaseZap} />
          <MetricCard label="Alert history" value={String(alertTotal)} detail="Repeated or high-risk exposure" icon={Bell} />
          <MetricCard label="High severity" value={String(severityTotal)} detail="High or critical cases" icon={ShieldAlert} />
        </div>

        {/* Leak-Lookup Breach Search Panel */}
        <section className="mt-6">
          <BreachSearchPanel />
        </section>

        {/* GitHub Intelligence + Risk Graph */}
        <section className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <GithubIntelCard />
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-accent-100" />
                  Risk Distribution
                </CardTitle>
                <CardDescription>
                  Reputation breakdown across recent investigations.
                </CardDescription>
              </div>
            </CardHeader>
            <RiskGraph data={analytics.riskDistribution} />
            <div className="mt-5 border-t border-white/10 pt-4">
              <h4 className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                API usage
              </h4>
              <div className="space-y-2">
                {analytics.apiUsage.map((api) => (
                  <div
                    key={api.source}
                    className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.04] p-2.5 text-sm"
                  >
                    <span className="text-slate-300">{api.source}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">{api.calls}</span>
                      <Badge tone={api.status === "ok" ? "good" : api.status === "degraded" ? "warn" : "neutral"}>
                        {api.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Exposure Heatmap</CardTitle>
                <CardDescription>Signal density across breach, profile, domain, phone, history, and manual review.</CardDescription>
              </div>
              <Flame className="h-5 w-5 text-amber-200" />
            </CardHeader>
            <ExposureHeatmap exposure={exposure} />
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Exposure Categories</CardTitle>
                <CardDescription>Email, phone, IP, username, credential reuse, and social exposure.</CardDescription>
              </div>
            </CardHeader>
            <BarChart data={exposure.categories.map((item) => ({ label: item.label, value: item.count }))} />
          </Card>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Monitoring System</CardTitle>
                <CardDescription>Watchlist mode, saved searches, bookmarks, and analyst notes.</CardDescription>
              </div>
            </CardHeader>
            <div className="grid gap-3">
              {[
                ["Watchlist items", monitoring.watchlist.length],
                ["Saved searches", monitoring.savedSearches.length],
                ["Investigation bookmarks", monitoring.bookmarks.length],
                ["Local alerts", alertTotal]
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.04] p-3">
                  <span className="text-sm text-slate-300">{label}</span>
                  <span className="text-lg font-semibold text-white">{value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Intelligence Timeline</CardTitle>
                <CardDescription>Breach history, public appearances, investigation events, and alerts.</CardDescription>
              </div>
              <Activity className="h-5 w-5 text-accent-100" />
            </CardHeader>
            <ExposureTimeline events={exposure.timeline} />
          </Card>
        </section>

        <Card className="mt-5">
          <CardHeader>
            <div>
              <CardTitle>Recent Exposure Searches</CardTitle>
              <CardDescription>Persistent search history model with confidence, severity, and public-source controls.</CardDescription>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="border-b border-white/10 py-3">Identifier</th>
                  <th className="border-b border-white/10 py-3">Severity</th>
                  <th className="border-b border-white/10 py-3">Breaches</th>
                  <th className="border-b border-white/10 py-3">Risk</th>
                  <th className="border-b border-white/10 py-3">Confidence</th>
                  <th className="border-b border-white/10 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((item) => (
                  <tr key={item.id} className="text-slate-300">
                    <td className="border-b border-white/5 py-3">
                      <Link href={`/results/${item.id}`} className="text-accent-100 hover:text-white">
                        {item.query.normalizedEmail ??
                          item.query.normalizedPhone ??
                          item.query.normalizedUsername ??
                          item.query.normalizedDomain ??
                          item.query.normalizedIp ??
                          item.vehicle?.normalized ??
                          "Untitled"}
                      </Link>
                    </td>
                    <td className="border-b border-white/5 py-3">{item.exposure.highestSeverity}</td>
                    <td className="border-b border-white/5 py-3">{item.exposure.breachCount}</td>
                    <td className="border-b border-white/5 py-3">{item.risk.reputation}</td>
                    <td className="border-b border-white/5 py-3">{formatPercent(item.confidence)}</td>
                    <td className="border-b border-white/5 py-3">{new Date(item.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </AppShell>
  );
}
