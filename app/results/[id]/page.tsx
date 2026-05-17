import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  AtSign,
  Car,
  ChartNoAxesColumnIncreasing,
  DatabaseZap,
  Download,
  Flame,
  Fingerprint,
  Globe2,
  Image,
  MapPinned,
  Network,
  PanelRight,
  Phone,
  SatelliteDish,
  ShieldAlert,
  Sparkles,
  UserSearch
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ExportButtons } from "@/components/export-buttons";
import { ExposureCards } from "@/components/exposure/exposure-cards";
import { ExposureHeatmap } from "@/components/exposure/exposure-heatmap";
import { ExposureTimeline } from "@/components/exposure/exposure-timeline";
import { InvestigationWorkspace } from "@/components/investigation-workspace";
import { MetricCard } from "@/components/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfidenceGraph } from "@/components/visualizations/confidence-graph";
import { MapPanel } from "@/components/visualizations/map-panel";
import { RelationshipGraph } from "@/components/visualizations/relationship-graph";
import { SearchTimeline } from "@/components/visualizations/timeline";
import { getSearch } from "@/lib/db/memory-store";
import { sampleProfile } from "@/lib/osint/sample";
import { VehiclePlateIntelligence } from "@/lib/osint/types";
import { formatPercent } from "@/lib/utils";

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = getSearch(id) ?? (id === "demo" ? sampleProfile : undefined);

  if (!profile) {
    return (
      <AppShell>
        <main className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
  <Card>
            <CardTitle>Result not found</CardTitle>
            <CardDescription>
              This scaffold stores searches in memory. Run a new search or open the demo result.
            </CardDescription>
            <div className="mt-5 flex gap-3">
              <Link href="/">
                <Button>New Search</Button>
              </Link>
              <Link href="/results/demo">
                <Button variant="secondary">Open Demo</Button>
              </Link>
            </div>
          </Card>
        </main>
      </AppShell>
    );
  }

  const riskTone =
    profile.risk.reputation === "high-risk" || profile.risk.reputation === "elevated"
      ? "bad"
      : profile.risk.reputation === "watch"
        ? "warn"
        : "good";

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            New search
          </Link>
          <div className="flex gap-2">
            <ExportButtons profile={profile as unknown as Record<string, unknown>} filenameBase={`geotrace-${profile.id}`} />
          </div>
        </div>

        <section className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <Card className="scan-line">
            <CardHeader>
              <div>
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge tone="info">Confidence {formatPercent(profile.confidence)}</Badge>
                  <Badge tone={profile.exposure.highestSeverity === "critical" || profile.exposure.highestSeverity === "high" ? "bad" : "warn"}>
                    Exposure {profile.exposure.highestSeverity}
                  </Badge>
                  <Badge tone={riskTone}>{profile.risk.reputation}</Badge>
                  <Badge tone="neutral">Audit {profile.compliance.auditId}</Badge>
                </div>
                <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                  {profile.query.normalizedEmail ??
                    profile.query.normalizedPhone ??
                    profile.query.normalizedUsername ??
                    profile.query.normalizedDomain ??
                    profile.query.normalizedIp ??
                    profile.possibleFullName ??
                    "Exposure Profile"}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">{profile.aiSummary}</p>
              </div>
            </CardHeader>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Breach records" value={String(profile.exposure.breachCount)} detail="Verified or catalog metadata" icon={ShieldAlert} />
              <MetricCard label="Exposure records" value={String(profile.exposure.records.length)} detail="Public-source metadata only" icon={DatabaseZap} />
              <MetricCard label="Highest severity" value={profile.exposure.highestSeverity} detail="Weighted exposure posture" icon={Flame} />
              <MetricCard label="Risk" value={formatPercent(profile.risk.scamLikelihood)} detail={`${profile.risk.breachExposureCount} direct breach refs`} icon={ShieldAlert} />
            </div>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Identity Overview</CardTitle>
                <CardDescription>Country-aware parser output and sensitive inference policy.</CardDescription>
              </div>
            </CardHeader>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Possible name", profile.possibleFullName ?? "Unknown"],
                ["Country", profile.country ?? "Unknown"],
                ["City", profile.city ?? "Unknown"],
                ["State", profile.state ?? "Unknown"],
                ["Area", profile.approximateArea ?? "Unknown"],
                ["Timezone", profile.timezone ?? "Unknown"],
                ["Map coordinates", formatCoordinates(profile.location.coordinates)],
                ["ISP/provider", profile.location.networkProvider ?? "Unknown"],
                ["Languages", profile.languages.join(", ") || "Unknown"],
                ["Gender", profile.genderPrediction?.value ?? "Not inferred"]
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-white/10 bg-white/[0.04] p-3">
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="mt-1 break-words text-slate-100">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Breach Detection Engine</CardTitle>
                <CardDescription>Public breach metadata, exposure categories, source confidence, and affected identifiers.</CardDescription>
              </div>
              <ShieldAlert className="h-5 w-5 text-red-200" />
            </CardHeader>
            <ExposureCards records={profile.exposure.records} />
          </Card>

          <div className="grid gap-5">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Exposure Categories</CardTitle>
                  <CardDescription>Metadata categories marked verified or inferred.</CardDescription>
                </div>
              </CardHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                {profile.exposure.categories.map((category) => (
                  <div key={category.key} className="rounded-md border border-white/10 bg-white/[0.04] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-white">{category.label}</p>
                      <Badge tone={category.severity === "high" || category.severity === "critical" ? "bad" : category.severity === "medium" ? "warn" : "good"}>
                        {category.count}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Confidence {formatPercent(category.confidence)}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Exposure Heatmap</CardTitle>
                  <CardDescription>Signal density by exposure family.</CardDescription>
                </div>
              </CardHeader>
              <ExposureHeatmap exposure={profile.exposure} />
            </Card>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Alert History</CardTitle>
                <CardDescription>Repeated exposure alerts and high-severity public metadata.</CardDescription>
              </div>
              <Sparkles className="h-5 w-5 text-accent-100" />
            </CardHeader>
            <div className="space-y-3">
              {profile.exposure.alertHistory.length ? (
                profile.exposure.alertHistory.map((alert) => (
                  <div key={alert.id} className="rounded-md border border-white/10 bg-white/[0.04] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-white">{alert.label}</p>
                      <Badge tone={alert.severity === "high" || alert.severity === "critical" ? "bad" : "warn"}>{alert.severity}</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{alert.detail}</p>
                    <p className="mt-2 text-xs text-slate-500">{new Date(alert.createdAt).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No repeated exposure alerts yet.</p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Intelligence Timeline</CardTitle>
                <CardDescription>Breach chronology, public appearances, watchlist events, and investigation activity.</CardDescription>
              </div>
            </CardHeader>
            <ExposureTimeline events={profile.exposure.timeline} />
          </Card>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Location Intelligence</CardTitle>
                <CardDescription>Approximate map region with confidence radius.</CardDescription>
              </div>
            </CardHeader>
            <MapPanel location={profile.location} />
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ["Detected location", [profile.city, profile.state, profile.country].filter(Boolean).join(", ") || "Unknown"],
                ["Timezone", profile.timezone ?? "Unknown"],
                ["Coordinates", formatCoordinates(profile.location.coordinates)]
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-1 break-words text-slate-100">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {(profile.location.nearbyLandmarks.length ? profile.location.nearbyLandmarks : ["No landmarks found"]).map((item) => (
                <div key={item} className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Risk Analysis</CardTitle>
                <CardDescription>Breach count, spam reports, reputation, and heuristics.</CardDescription>
              </div>
              <AlertTriangle className="h-5 w-5 text-amber-200" />
            </CardHeader>
            <div className="space-y-3">
              {profile.risk.indicators.map((indicator) => (
                <div key={indicator} className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">
                  {indicator}
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-xs text-slate-500">Breach exposure</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{profile.risk.breachExposureCount}</p>
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-xs text-slate-500">Spam reports</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{profile.risk.spamReports}</p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Possible Matches</CardTitle>
                <CardDescription>Linked profile cards from public signals and local history correlation.</CardDescription>
              </div>
              <Fingerprint className="h-5 w-5 text-accent-100" />
            </CardHeader>
            <div className="grid gap-3 md:grid-cols-2">
              {profile.possibleMatches.length ? (
                profile.possibleMatches.map((match) => (
                  <div key={match.id} className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-start gap-3">
                      {match.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={match.avatarUrl} alt="" className="h-11 w-11 rounded-md border border-white/10 object-cover" />
                      ) : (
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-white/10 bg-black/20 text-slate-400">
                          <UserSearch className="h-5 w-5" />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="truncate text-sm font-medium text-white">{match.title}</p>
                          <Badge tone={match.provenance === "verified-public-api" ? "good" : "neutral"}>
                            {formatPercent(match.confidence)}
                          </Badge>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{match.subtitle}</p>
                        <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-slate-500">{match.provenance}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {match.signals.slice(0, 4).map((signal) => (
                            <span key={signal} className="rounded-full bg-white/[0.06] px-2 py-1 text-[11px] text-slate-300">
                              {signal}
                            </span>
                          ))}
                        </div>
                        {match.profileUrl ? (
                          <a href={match.profileUrl} target="_blank" rel="noreferrer" className="mt-3 block text-xs text-accent-200">
                            Open linked profile
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-400">
                  No possible profile cards were generated from the supplied public signals.
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Confidence Graph</CardTitle>
                <CardDescription>Weighted merge of public evidence, contact reputation, and signal agreement.</CardDescription>
              </div>
              <ChartNoAxesColumnIncreasing className="h-5 w-5 text-accent-100" />
            </CardHeader>
            <ConfidenceGraph factors={profile.confidenceFactors} />
          </Card>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Contact Intelligence</CardTitle>
                <CardDescription>Phone, telecom region, domain reputation, and disposable email checks.</CardDescription>
              </div>
              <Phone className="h-5 w-5 text-accent-100" />
            </CardHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Phone", profile.phoneIntel?.e164 ?? "Not supplied"],
                ["Phone country", profile.phoneIntel?.country ?? "Unknown"],
                ["Carrier/provider", profile.phoneIntel?.carrier ?? "Not verified"],
                ["Telecom circle", profile.phoneIntel?.telecomCircle ?? "Not inferred"],
                ["Phone region", profile.phoneIntel?.region ?? "Unknown"],
                ["Domain", profile.domainIntel?.domain ?? "Not supplied"],
                ["Domain category", profile.domainIntel?.category ?? "Unknown"],
                ["Disposable email", profile.domainIntel ? (profile.domainIntel.disposable ? "Yes" : "No") : "Unknown"]
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-1 break-words text-slate-100">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {[...(profile.phoneIntel?.analysis ?? []), ...(profile.domainIntel?.analysis ?? [])].slice(0, 5).map((item) => (
                <div key={item} className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Investigation Workspace</CardTitle>
                <CardDescription>Review queue for analyst actions and unresolved correlation checks.</CardDescription>
              </div>
              <PanelRight className="h-5 w-5 text-accent-100" />
            </CardHeader>
            <InvestigationWorkspace tasks={profile.investigationTasks} />
            {profile.avatars.length ? (
              <div className="mt-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
                  <Image className="h-4 w-4 text-accent-100" />
                  Public avatars
                </div>
                <div className="flex flex-wrap gap-3">
                  {profile.avatars.map((avatar) => (
                    <a key={avatar.url} href={avatar.url} target="_blank" rel="noreferrer" className="block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={avatar.url} alt="" className="h-14 w-14 rounded-md border border-white/10 object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>
        </section>

        {profile.vehicle ? (
          <section className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader>
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <Badge tone={profile.vehicle.valid ? "good" : "warn"}>
                      {profile.vehicle.valid ? "Valid format" : "Format warning"}
                    </Badge>
                    {profile.vehicle.state ? <Badge tone="info">{profile.vehicle.state}</Badge> : null}
                    <Badge tone="neutral">Confidence {formatPercent(profile.vehicle.confidence)}</Badge>
                  </div>
                  <CardTitle>Vehicle Number Intelligence</CardTitle>
                  <CardDescription>
                    Country-aware public-format parsing. Owner, RC, chassis, and protected records are not queried.
                  </CardDescription>
                </div>
                <Car className="h-5 w-5 text-accent-100" />
              </CardHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Plate", profile.vehicle.normalized],
                  ["Country parser", profile.vehicle.country],
                  ["State", profile.vehicle.state ?? "Not detected"],
                  ["RTO office", profile.vehicle.rtoOffice ?? "Not detected"],
                  ["RTO code", profile.vehicle.rtoCode ?? profile.vehicle.stateCode ?? "Not detected"],
                  ["Region", profile.vehicle.region ?? "Not detected"],
                  ["Vehicle class estimate", `${profile.vehicle.vehicleClassEstimate.value} (${formatPercent(profile.vehicle.vehicleClassEstimate.confidence)})`],
                  ["Fuel type estimate", `${profile.vehicle.fuelTypeEstimate.value} (${formatPercent(profile.vehicle.fuelTypeEstimate.confidence)})`],
                  [
                    "Registration year",
                    profile.vehicle.registrationYear?.value
                      ? `${profile.vehicle.registrationYear.value} (${formatPercent(profile.vehicle.registrationYear.confidence)})`
                      : profile.vehicle.registrationYear?.rationale ?? "Not encoded"
                  ],
                  ["Format", profile.vehicle.format]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="mt-1 break-words text-slate-100">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {profile.vehicle.analysis.map((item) => (
                  <div key={item} className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">
                    {item}
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Registration Region</CardTitle>
                  <CardDescription>Approximate region from public RTO/state/district plate metadata.</CardDescription>
                </div>
                <MapPinned className="h-5 w-5 text-accent-100" />
              </CardHeader>
              {profile.vehicle.regionCoordinates ? (
                <MapPanel location={vehicleMapLocation(profile.vehicle)} />
              ) : (
                <div className="flex h-[330px] items-center justify-center rounded-lg bg-white/[0.04] text-sm text-slate-400">
                  No regional coordinates available for this plate format.
                </div>
              )}
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {profile.vehicle.publicSources.map((source) => (
                  <a
                    key={source.url}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm text-accent-200 hover:border-accent-300/50"
                  >
                    {source.label}
                  </a>
                ))}
              </div>
            </Card>
          </section>
        ) : null}

        <section className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Digital Footprint</CardTitle>
                <CardDescription>Social profiles, GitHub accounts, usernames, and public metadata.</CardDescription>
              </div>
              <UserSearch className="h-5 w-5 text-accent-100" />
            </CardHeader>
            <div className="space-y-3">
              {[
                ...profile.footprint.githubProfiles.map((item) => ({
                  label: `GitHub: ${item.login}`,
                  detail: `${item.repositories ?? 0} repos, ${item.followers ?? 0} followers`,
                  url: item.url
                })),
                ...profile.footprint.socialProfiles.map((item) => ({
                  label: `${item.platform}: ${item.handle}`,
                  detail: `Confidence ${formatPercent(item.confidence)}`,
                  url: item.url
                })),
                ...profile.footprint.usernames.map((item) => ({
                  label: `Username: ${item.username}`,
                  detail: `${item.platform}, confidence ${formatPercent(item.confidence)}`,
                  url: undefined
                })),
                ...profile.footprint.emails.map((item) => ({
                  label: item.email,
                  detail: `Source ${item.source}`,
                  url: undefined
                }))
              ].map((item) => (
                <div key={`${item.label}-${item.url}`} className="rounded-md border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noreferrer" className="mt-2 block text-xs text-accent-200">
                      Open public source
                    </a>
                  ) : null}
                </div>
              ))}
              {profile.footprint.githubProfiles.length +
                profile.footprint.socialProfiles.length +
                profile.footprint.usernames.length +
                profile.footprint.emails.length ===
              0 ? (
                <div className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-400">
                  No public footprint matches were returned by configured live connectors.
                </div>
              ) : null}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Account Signals</CardTitle>
                <CardDescription>Breach count, GitHub accounts, and usernames found.</CardDescription>
              </div>
              <AtSign className="h-5 w-5 text-accent-100" />
            </CardHeader>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
                <p className="text-xs text-slate-500">Breach count</p>
                <p className="mt-1 text-2xl font-semibold text-white">{profile.risk.breachExposureCount}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
                <p className="text-xs text-slate-500">GitHub accounts</p>
                <p className="mt-1 text-2xl font-semibold text-white">{profile.footprint.githubProfiles.length}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
                <p className="text-xs text-slate-500">Usernames found</p>
                <p className="mt-1 text-2xl font-semibold text-white">{profile.footprint.usernames.length}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {profile.footprint.websites.map((item) => (
                <a
                  key={item.url}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300 hover:border-accent-300/50"
                >
                  <p className="font-medium text-white">{item.domain}</p>
                  <p className="mt-1 break-all text-xs text-slate-500">{item.url}</p>
                </a>
              ))}
            </div>
          </Card>
        </section>

        <section className="mt-5">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>AI Relationship Graph</CardTitle>
                <CardDescription>Entity linking engine output with confidence-weighted links.</CardDescription>
              </div>
              <Network className="h-5 w-5 text-accent-100" />
            </CardHeader>
            <RelationshipGraph graph={profile.graph} />
          </Card>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Timeline</CardTitle>
                <CardDescription>Real-time workflow states captured for analyst review.</CardDescription>
              </div>
              <Sparkles className="h-5 w-5 text-accent-100" />
            </CardHeader>
            <SearchTimeline events={profile.timeline} />
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Evidence Register</CardTitle>
                <CardDescription>Collected public-source references and derived records.</CardDescription>
              </div>
            </CardHeader>
            <div className="grid gap-3 md:grid-cols-2">
              {profile.evidence.map((item, index) => (
                <div key={`${item.source}-${index}`} className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">{item.source}</p>
                    </div>
                    <Badge tone="neutral">{formatPercent(item.confidence)}</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{item.summary}</p>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noreferrer" className="mt-3 block text-sm text-accent-200">
                      Source link
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </Card>
        </section>
      </main>
    </AppShell>
  );
}

function formatCoordinates(location?: { lat: number; lng: number; confidenceRadiusKm: number }) {
  if (!location) return "Unknown";
  return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)} (+/- ${location.confidenceRadiusKm} km)`;
}

function vehicleMapLocation(vehicle: VehiclePlateIntelligence) {
  const coordinates = vehicle.regionCoordinates;
  return {
    country: vehicle.state ?? vehicle.country,
    countryCode: vehicle.country,
    state: vehicle.state,
    city: vehicle.rtoOffice,
    approximateArea: vehicle.region,
    timezone: vehicle.country === "IN" ? "Asia/Kolkata" : undefined,
    coordinates,
    languages: [],
    nearbyLandmarks: vehicle.region ? [vehicle.region] : []
  };
}
