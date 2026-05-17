import { Code2, KeyRound, ShieldCheck, Webhook } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const endpoints = [
  ["POST", "/api/auth", "Issue a local JWT for analysts or admins."],
  ["POST", "/api/search", "Create an authorized public-source investigation."],
  ["GET", "/api/search/{id}", "Fetch a generated profile from local memory."],
  ["GET", "/api/search/history", "List recent searches."],
  ["GET", "/api/analytics", "Read dashboard metrics and audit events."]
];

export default function DocsPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Badge tone="info">Developer API</Badge>
          <h1 className="mt-4 text-3xl font-semibold text-white">GeoTrace AI API Docs</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
            Integrate authorized public-source lookups with JWT auth, throttling, Turnstile verification, and auditable
            search metadata.
          </p>
        </div>

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Request Example</CardTitle>
                <CardDescription>Partial signals are accepted. Authorization confirmation is required.</CardDescription>
              </div>
              <Code2 className="h-5 w-5 text-accent-100" />
            </CardHeader>
            <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black/35 p-4 text-xs leading-6 text-slate-300">
{`curl -X POST http://localhost:3000/api/search \\
  -H "Content-Type: application/json" \\
  -d '{
    "fullName": "Aarav Sharma",
    "pincode": "226001",
    "country": "India",
    "username": "aaravdev",
    "authorizationAccepted": true
  }'`}
            </pre>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Security Controls</CardTitle>
                <CardDescription>Designed for responsible OSINT workflows.</CardDescription>
              </div>
              <ShieldCheck className="h-5 w-5 text-emerald-200" />
            </CardHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["JWT", "Bearer tokens for API clients and team workflows."],
                ["Rate limits", "In-memory throttling with Redis-ready production design."],
                ["Turnstile", "Cloudflare anti-bot verification when configured."],
                ["Audit logs", "Search started/completed events with metadata."]
              ].map(([label, detail]) => (
                <div key={label} className="rounded-md border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <Card className="mt-5">
          <CardHeader>
            <div>
              <CardTitle>Endpoints</CardTitle>
              <CardDescription>Route summary for frontend, partners, and internal tools.</CardDescription>
            </div>
            <Webhook className="h-5 w-5 text-accent-100" />
          </CardHeader>
          <div className="space-y-3">
            {endpoints.map(([method, path, description]) => (
              <div key={path} className="grid gap-3 rounded-md border border-white/10 bg-white/[0.04] p-4 sm:grid-cols-[90px_1fr_1.5fr]">
                <Badge tone={method === "POST" ? "info" : "neutral"}>{method}</Badge>
                <code className="text-sm text-accent-100">{path}</code>
                <p className="text-sm text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="mt-5">
          <CardHeader>
            <div>
              <CardTitle>Environment Keys</CardTitle>
              <CardDescription>All external providers are optional in local demo mode.</CardDescription>
            </div>
            <KeyRound className="h-5 w-5 text-accent-100" />
          </CardHeader>
          <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black/35 p-4 text-xs leading-6 text-slate-300">
{`OPENAI_API_KEY=
GEMINI_API_KEY=
DEEPSEEK_API_KEY=
GITHUB_TOKEN=
HIBP_API_KEY=
TURNSTILE_SECRET_KEY=
DATABASE_URL=
REDIS_URL=`}
          </pre>
        </Card>
      </main>
    </AppShell>
  );
}
