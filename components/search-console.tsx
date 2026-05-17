"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AtSign, Building2, Car, Globe2, LocateFixed, Mail, MapPin, Network, Phone, Radar, Search, Server, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScanLoader } from "@/components/scan-loader";

const fields = [
  { name: "fullName", label: "Full name", placeholder: "Aarav Sharma", icon: User },
  { name: "phone", label: "Phone number", placeholder: "+91 98765 43210", icon: Phone },
  { name: "pincode", label: "Pincode / ZIP", placeholder: "226001", icon: LocateFixed },
  { name: "country", label: "Country", placeholder: "India", icon: Globe2 },
  { name: "email", label: "Email address", placeholder: "name@example.com", icon: Mail },
  { name: "domain", label: "Domain", placeholder: "example.com", icon: Server },
  { name: "ipAddress", label: "IP address", placeholder: "8.8.8.8", icon: Network },
  { name: "username", label: "Username", placeholder: "github_handle", icon: AtSign },
  { name: "companyName", label: "Company name", placeholder: "Acme Cyber Labs", icon: Building2 },
  { name: "vehicleNumber", label: "Vehicle number", placeholder: "UP32 AB 1234", icon: Car },
  { name: "cityState", label: "City / State", placeholder: "Lucknow, Uttar Pradesh", icon: MapPin }
] as const;

type FieldName = (typeof fields)[number]["name"];

export function SearchConsole() {
  const router = useRouter();
  const [values, setValues] = useState<Record<FieldName | "notes", string>>({
    fullName: "",
    phone: "",
    pincode: "",
    country: "",
    email: "",
    domain: "",
    ipAddress: "",
    username: "",
    companyName: "",
    vehicleNumber: "",
    cityState: "",
    notes: ""
  });
  const [authorizationAccepted, setAuthorizationAccepted] = useState(true);
  const [watchlistMode, setWatchlistMode] = useState(true);
  const [saveInvestigation, setSaveInvestigation] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, authorizationAccepted, watchlistMode, saveInvestigation })
      });
      const payload = (await response.json()) as { id?: string; error?: unknown };
      if (!response.ok || !payload.id) {
        throw new Error(typeof payload.error === "string" ? payload.error : "Search request failed.");
      }
      router.push(`/results/${payload.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected search failure.");
      setLoading(false);
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <CardHeader className="mb-5">
        <div>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Radar className="h-5 w-5 text-accent-100" />
            Unified Exposure Search
          </CardTitle>
          <CardDescription>
            Search public breach metadata and exposure signals. Passwords, stolen credentials, and private records are never displayed.
          </CardDescription>
        </div>
      </CardHeader>

      <form className="space-y-5" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((field) => (
            <label key={field.name} className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                <field.icon className="h-3.5 w-3.5" />
                {field.label}
              </span>
              <Input
                value={values[field.name]}
                placeholder={field.placeholder}
                onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
              />
            </label>
          ))}
        </div>

        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
            Analyst notes
          </span>
          <Textarea
            value={values.notes}
            placeholder="Case context, consent reference, or investigation scope."
            onChange={(event) => setValues((current) => ({ ...current, notes: event.target.value }))}
          />
        </label>

        <label className="flex items-start gap-3 rounded-lg border border-emerald-300/15 bg-emerald-400/10 p-4 text-sm leading-6 text-emerald-100">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-white/20 bg-black"
            checked={authorizationAccepted}
            onChange={(event) => setAuthorizationAccepted(event.target.checked)}
          />
          I confirm this search is authorized and limited to lawful public-source research. I will not use the output
          for harassment, stalking, credential attacks, or doxxing.
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-slate-200">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-white/20 bg-black"
              checked={watchlistMode}
              onChange={(event) => setWatchlistMode(event.target.checked)}
            />
            Enable watchlist mode and repeated exposure alerts for this identifier.
          </label>
          <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-slate-200">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-white/20 bg-black"
              checked={saveInvestigation}
              onChange={(event) => setSaveInvestigation(event.target.checked)}
            />
            Save investigation locally with analyst notes and bookmarks.
          </label>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-100">{error}</div>
        ) : null}

        {loading ? (
          <ScanLoader />
        ) : (
          <Button size="lg" type="submit" className="w-full sm:w-auto">
            <Search className="h-4 w-4" />
            Run Authorized Search
          </Button>
        )}
      </form>
    </Card>
  );
}
