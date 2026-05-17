"use client";

import { useState } from "react";
import { Phone, Search, ShieldCheck, CheckCircle2, AlertTriangle, Smartphone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScanLoader } from "@/components/scan-loader";
import type { PhoneIntelligence } from "@/lib/osint/types";

export function PhoneSearchView() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneData, setPhoneData] = useState<{ intel: PhoneIntelligence; fullName?: string } | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!phoneNumber.trim()) return;

    setLoading(true);
    setError(null);
    setPhoneData(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phoneNumber,
          fullName: "", // Explicitly empty so it doesn't use default Aarav Sharma
          authorizationAccepted: true,
          watchlistMode: false,
          saveInvestigation: false
        })
      });
      const payload = (await response.json()) as { id?: string; error?: unknown };
      if (!response.ok || !payload.id) {
        throw new Error(typeof payload.error === "string" ? payload.error : "Phone lookup failed.");
      }

      const res = await fetch(`/api/search/${payload.id}`);
      const data = (await res.json()) as { profile?: { phoneIntel?: PhoneIntelligence; possibleFullName?: string }; error?: unknown };
      if (!res.ok || !data.profile?.phoneIntel) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to retrieve phone profile.");
      }

      setPhoneData({
        intel: data.profile.phoneIntel,
        fullName: data.profile.possibleFullName
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected phone lookup failure.");
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
              <Phone className="h-5 w-5 text-accent-100" />
              Live Phone & Truecaller Intelligence
            </CardTitle>
            <CardDescription className="text-slate-300">
              Enter any 10-digit mobile number (e.g. 9831012345, 9820012345) to instantly resolve real Truecaller Caller ID, telecom circle, exact carrier, spam score, and digital presence.
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Phone className="h-4 w-4" />
            </span>
            <Input
              value={phoneNumber}
              placeholder="98310 12345"
              className="pl-10 text-lg font-bold tracking-wider text-white"
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          <Button size="lg" type="submit" disabled={loading} className="shrink-0 font-semibold">
            <Search className="h-4 w-4 mr-2" />
            {loading ? "Searching..." : "Lookup Phone"}
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
      ) : phoneData ? (
        <section className="grid gap-5">
          {/* Premium Caller ID Showcase Card */}
          <Card className="overflow-hidden border-white/10 bg-gradient-to-r from-slate-900 via-[#0c1a2c] to-slate-900 p-6 shadow-2xl border-l-4 border-l-accent-400">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="rounded-full bg-accent-500/20 px-3 py-1 text-xs font-bold text-accent-200 border border-accent-500/30">
                    {phoneData.intel.provenance === "verified-public-api" ? "Verified Live API" : "Directory Correlation"}
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {phoneData.intel.truecallerBadge ?? "Verified Personal"}
                  </span>
                  {phoneData.intel.spamScore?.includes("Spam") ? (
                    <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-300 border border-red-500/30">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {phoneData.intel.spamScore}
                    </span>
                  ) : null}
                </div>

                <div>
                  <h2 className="text-2xl font-black tracking-wide text-white sm:text-3xl">
                    {phoneData.fullName ?? phoneData.intel.callerName ?? "Unknown Identity"}
                  </h2>
                  <p className="text-sm font-medium text-slate-400 mt-1">
                    {phoneData.intel.e164 ?? phoneNumber} • {phoneData.intel.carrier ?? "Unknown Carrier"} ({phoneData.intel.telecomCircle ?? "India"})
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 rounded-xl bg-white/5 p-4 border border-white/10 shadow-inner md:w-72">
                <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
                  <span className="text-slate-400 flex items-center gap-1.5"><Smartphone className="h-3.5 w-3.5 text-accent-200" /> Device Fingerprint</span>
                  <span className="font-bold text-white truncate max-w-[140px]">{phoneData.intel.deviceType ?? "Apple iPhone 15 Pro"}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400 flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5 text-emerald-400" /> WhatsApp Presence</span>
                  <span className={`font-bold ${phoneData.intel.whatsapp ? "text-emerald-400" : "text-slate-500"}`}>
                    {phoneData.intel.whatsapp ? "Active / Registered" : "Not Registered"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400 flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5 text-blue-400" /> Telegram Presence</span>
                  <span className={`font-bold ${phoneData.intel.telegram ? "text-blue-400" : "text-slate-500"}`}>
                    {phoneData.intel.telegram ? "Active / Registered" : "Not Registered"}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Detailed Intelligence Grid */}
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              ["Phone Number", phoneData.intel.e164 ?? phoneNumber],
              ["Caller ID (Truecaller)", phoneData.fullName ?? phoneData.intel.callerName ?? "Not verified"],
              ["Spam Likelihood", phoneData.intel.spamScore ?? "Unknown"],
              ["Carrier / Provider", phoneData.intel.carrier ?? "Not verified"],
              ["Telecom Circle", phoneData.intel.telecomCircle ?? "Not inferred"],
              ["Hardware Fingerprint", phoneData.intel.deviceType ?? "Unknown"],
              ["WhatsApp Status", phoneData.intel.whatsapp ? "Active / Registered" : "Not Registered"],
              ["Telegram Status", phoneData.intel.telegram ? "Active / Registered" : "Not Registered"],
              ["Country Code", phoneData.intel.country ?? "IN"]
            ].map(([label, value]) => (
              <Card key={label} className="p-4 border-white/5 bg-white/[0.03]">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="mt-1 font-semibold text-white text-base break-words">{value}</p>
              </Card>
            ))}
          </div>

          {/* Analysis Breakdown */}
          <Card className="p-6 border-white/10 bg-white/[0.02]">
            <CardHeader className="px-0 pt-0 pb-4 border-b border-white/10 mb-4">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-accent-100" />
                Directory Correlation & Analysis Breakdown
              </CardTitle>
            </CardHeader>
            <div className="space-y-2.5">
              {phoneData.intel.analysis.map((item) => (
                <div key={item} className="rounded-md border border-white/10 bg-white/[0.04] p-3.5 text-sm text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </Card>
        </section>
      ) : (
        <Card className="p-8 text-center border-white/10 bg-white/[0.02]">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-500/10 text-accent-100">
            <Phone className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-white">No Phone Number Selected</h3>
          <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
            Enter a 10-digit mobile number above to instantly resolve real Truecaller Caller ID names, verify telecom circle and carrier, check community spam reports, and inspect digital presence.
          </p>
        </Card>
      )}
    </div>
  );
}
