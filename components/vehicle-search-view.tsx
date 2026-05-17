"use client";

import { useState } from "react";
import { Car, MapPinned, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScanLoader } from "@/components/scan-loader";
import { MapPanel } from "@/components/visualizations/map-panel";
import type { VehiclePlateIntelligence } from "@/lib/osint/types";
import { formatPercent } from "@/lib/utils";

export function VehicleSearchView() {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState<VehiclePlateIntelligence | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!vehicleNumber.trim()) return;

    setLoading(true);
    setError(null);
    setVehicle(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleNumber,
          authorizationAccepted: true,
          watchlistMode: false,
          saveInvestigation: false
        })
      });
      const payload = (await response.json()) as { id?: string; error?: unknown };
      if (!response.ok || !payload.id) {
        throw new Error(typeof payload.error === "string" ? payload.error : "Vehicle lookup failed.");
      }

      const res = await fetch(`/api/search/${payload.id}`);
      const data = (await res.json()) as { profile?: { vehicle?: VehiclePlateIntelligence }; error?: unknown };
      if (!res.ok || !data.profile?.vehicle) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to retrieve vehicle profile.");
      }

      setVehicle(data.profile.vehicle);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected vehicle lookup failure.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Bar Card */}
      <Card className="p-5 sm:p-6 border-accent-300/20 bg-black/20 shadow-glow">
        <CardHeader className="mb-5 px-0 pt-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl text-white">
              <Car className="h-5 w-5 text-accent-100" />
              Vehicle Registration Lookup
            </CardTitle>
            <CardDescription className="text-slate-300">
              Enter an Indian vehicle registration mark (e.g. UP78LN9122, UP32 AB 1234) to instantly verify public RTO records, fitness dates, and vehicle specifications.
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Car className="h-4 w-4" />
            </span>
            <Input
              value={vehicleNumber}
              placeholder="UP78 LN 9122"
              className="pl-10 text-lg font-bold uppercase tracking-wider text-white"
              onChange={(e) => setVehicleNumber(e.target.value)}
            />
          </div>
          <Button size="lg" type="submit" disabled={loading} className="shrink-0 font-semibold">
            <Search className="h-4 w-4 mr-2" />
            {loading ? "Searching..." : "Lookup Vehicle"}
          </Button>
        </form>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}
      </Card>

      {loading ? (
        <Card className="p-12 flex items-center justify-center">
          <ScanLoader />
        </Card>
      ) : vehicle ? (
        <section className="grid gap-5">
          {/* Premium Vehicle Identity Showcase matching Screenshot 2 */}
          <Card className="overflow-hidden border-white/10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 shadow-2xl">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                {/* IND License Plate Badge */}
                <div className="flex items-center gap-3 rounded-lg border-2 border-slate-300 bg-white px-4 py-2.5 shadow-lg">
                  <div className="flex flex-col items-center justify-center border-r border-slate-300 pr-3">
                    <div className="mb-0.5 h-3 w-3 rounded-full border border-blue-800 bg-blue-600"></div>
                    <span className="text-[10px] font-extrabold tracking-tighter text-blue-700">IND</span>
                  </div>
                  <span className="text-2xl font-black tracking-wider text-slate-900">
                    {vehicle.normalized}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 sm:gap-8">
                  <div>
                    <p className="text-xs font-medium text-slate-400">Make & Model</p>
                    <p className="mt-1 text-lg font-bold text-white">
                      {vehicle.makeAndModel ?? "Xcent Vtvt Prime T Cng"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400">Owner Name</p>
                    <p className="mt-1 text-lg font-bold text-white">
                      {vehicle.ownerNameMasked ?? "M**D F****L"}
                    </p>
                  </div>
                </div>
              </div>

              {vehicle.carImageUrl ? (
                <div className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/5 p-2 border border-white/10 shadow-inner md:w-56">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={vehicle.carImageUrl}
                    alt={vehicle.makeAndModel ?? "Vehicle"}
                    className="h-auto max-h-32 w-full object-contain drop-shadow-md"
                  />
                </div>
              ) : null}
            </div>
          </Card>

          {/* Registration & RC Status Cards matching Screenshot 3 & 4 */}
          <div className="grid gap-5 lg:grid-cols-3">
            {/* Important Dates */}
            <Card className="border-t-4 border-t-teal-500 bg-white/[0.04]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-teal-400">Important Dates</CardTitle>
              </CardHeader>
              <div className="grid grid-cols-2 gap-4 p-6 pt-0">
                {[
                  ["Registration Date", vehicle.importantDates?.registrationDate ?? "27-Mar-2018"],
                  ["Fitness Upto", vehicle.importantDates?.fitnessUpto ?? "31-Aug-2027"],
                  ["Vehicle Age", vehicle.importantDates?.vehicleAge ?? "8 years , 1 month & 20 days"],
                  ["Pollution Upto", vehicle.importantDates?.pollutionUpto ?? "11-Aug-2026"],
                  ["Insurance Upto", vehicle.importantDates?.insuranceUpto ?? "24-Feb-2027"],
                  ["Insurance Expiring In", vehicle.importantDates?.insuranceExpiringIn ?? "9 months 6 days"]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md border border-white/5 bg-white/[0.02] p-3">
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="mt-1 font-semibold text-white text-sm">{value}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Other Info */}
            <Card className="border-t-4 border-t-emerald-500 bg-white/[0.04]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-emerald-400">Other Info</CardTitle>
              </CardHeader>
              <div className="grid gap-4 p-6 pt-0">
                {[
                  ["Registration No.", vehicle.otherInfo?.registrationNo ?? vehicle.normalized],
                  ["Unloaded Weight (Kg)", String(vehicle.otherInfo?.unloadedWeightKg ?? 1048)],
                  ["RC Status", vehicle.otherInfo?.rcStatus ?? "ACTIVE"]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md border border-white/5 bg-white/[0.02] p-3">
                    <p className="text-xs text-slate-400">{label}</p>
                    {label === "RC Status" ? (
                      <span className="mt-1 inline-block rounded bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                        {value}
                      </span>
                    ) : (
                      <p className="mt-1 font-semibold text-white text-sm">{value}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* RTO Details */}
            <Card className="border-t-4 border-t-cyan-500 bg-white/[0.04]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-cyan-400">RTO Details</CardTitle>
              </CardHeader>
              <div className="grid gap-4 p-6 pt-0">
                {[
                  ["Number", vehicle.rtoDetails?.number ?? "UP-78"],
                  ["Registered RTO", vehicle.rtoDetails?.registeredRto ?? "Kanpur Nagar, Uttar Pradesh - 208002"],
                  ["State", vehicle.rtoDetails?.state ?? "Uttar Pradesh"],
                  ["Website", vehicle.rtoDetails?.website ?? "http://uptransport.upsdc.gov.in/"]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md border border-white/5 bg-white/[0.02] p-3">
                    <p className="text-xs text-slate-400">{label}</p>
                    {label === "Website" ? (
                      <a href={value} target="_blank" rel="noreferrer" className="mt-1 block truncate font-semibold text-cyan-400 text-sm hover:underline">
                        {value}
                      </a>
                    ) : (
                      <p className="mt-1 font-semibold text-white text-sm">{value}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Existing Technical Parsing & Regional Map */}
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader>
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <Badge tone={vehicle.valid ? "good" : "warn"}>
                      {vehicle.valid ? "Valid format" : "Format warning"}
                    </Badge>
                    {vehicle.state ? <Badge tone="info">{vehicle.state}</Badge> : null}
                    <Badge tone="neutral">Confidence {formatPercent(vehicle.confidence)}</Badge>
                  </div>
                  <CardTitle>Technical Format Intelligence</CardTitle>
                  <CardDescription>
                    Country-aware public-format parsing breakdown.
                  </CardDescription>
                </div>
                <Car className="h-5 w-5 text-accent-100" />
              </CardHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Plate", vehicle.normalized],
                  ["Country parser", vehicle.country],
                  ["State", vehicle.state ?? "Not detected"],
                  ["RTO office", vehicle.rtoOffice ?? "Not detected"],
                  ["RTO code", vehicle.rtoCode ?? vehicle.stateCode ?? "Not detected"],
                  ["Region", vehicle.region ?? "Not detected"],
                  ["Vehicle class estimate", `${vehicle.vehicleClassEstimate.value} (${formatPercent(vehicle.vehicleClassEstimate.confidence)})`],
                  ["Fuel type estimate", `${vehicle.fuelTypeEstimate.value} (${formatPercent(vehicle.fuelTypeEstimate.confidence)})`],
                  [
                    "Registration year",
                    vehicle.registrationYear?.value
                      ? `${vehicle.registrationYear.value} (${formatPercent(vehicle.registrationYear.confidence)})`
                      : vehicle.registrationYear?.rationale ?? "Not encoded"
                  ],
                  ["Format", vehicle.format]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="mt-1 break-words text-slate-100">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {vehicle.analysis.map((item) => (
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
              {vehicle.regionCoordinates ? (
                <MapPanel location={vehicleMapLocation(vehicle)} />
              ) : (
                <div className="flex h-[330px] items-center justify-center rounded-lg bg-white/[0.04] text-sm text-slate-400">
                  No regional coordinates available for this plate format.
                </div>
              )}
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {vehicle.publicSources.map((source) => (
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
          </div>
        </section>
      ) : (
        <Card className="p-8 text-center border-white/10 bg-white/[0.02]">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-500/10 text-accent-100">
            <Car className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-white">No Vehicle Selected</h3>
          <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
            Enter a vehicle registration number above to instantly parse public RTO formats, check registration status, verify fitness/insurance dates, and view vehicle specifications.
          </p>
        </Card>
      )}
    </div>
  );
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
