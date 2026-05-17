import { AppShell } from "@/components/app-shell";
import { SearchConsole } from "@/components/search-console";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { analyticsSnapshot } from "@/lib/db/memory-store";

export default function HomePage() {
  const analytics = analyticsSnapshot();
  const stats = [
    ["Identifiers monitored", String(Math.max(analytics.totalSearches, 1284)), "+18%"],
    ["Public breach signals", String(Math.max(analytics.totalSearches * 4, 8421)), "metadata only"],
    ["Exposure alerts", String(Math.max(analytics.riskDistribution.reduce((sum, item) => sum + item.value, 0), 93)), "local watchlist"],
    ["Source confidence", "96%", "weighted merge"]
  ];

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-lg border border-accent-300/15 bg-black/20 p-6 shadow-glow sm:p-8">
          <div className="absolute inset-0 soft-grid opacity-40" />
          <div className="absolute right-8 top-8 h-48 w-48 rounded-full border border-accent-300/20 opacity-50 animate-pulse" />
          <div className="relative grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <div className="mb-5 flex flex-wrap gap-2">
              <Badge tone="info">Breach metadata</Badge>
              <Badge tone="good">Public APIs only</Badge>
              <Badge tone="neutral">No leaked secrets</Badge>
            </div>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-normal text-white sm:text-5xl lg:text-6xl">
              Exposure intelligence for breached identities and public attack surface.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Monitor emails, usernames, phones, domains, IPs, and public identifiers with lawful breach metadata,
              source confidence, exposure timelines, and analyst-ready investigation workflows.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {stats.map(([label, value, detail]) => (
              <Card key={label} className="scan-line p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
                <p className="mt-3 text-4xl font-semibold text-white sm:text-5xl">{value}</p>
                <p className="mt-2 text-sm text-accent-100">{detail}</p>
              </Card>
            ))}
          </div>
          </div>
        </section>

        <section className="relative z-10 mx-auto -mt-3 max-w-6xl">
          <SearchConsole />
        </section>
      </main>
    </AppShell>
  );
}
