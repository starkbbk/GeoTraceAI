import { LockKeyhole, ServerCog, ShieldCheck, UserCog } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listAuditEvents } from "@/lib/security/audit";

export default function AdminPage() {
  const audit = listAuditEvents();

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Badge tone="warn">Admin Preview</Badge>
          <h1 className="mt-4 text-3xl font-semibold text-white">Admin Panel</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Manage connector health, queue readiness, premium modules, and audit logs.
          </p>
        </div>

        <section className="grid gap-5 md:grid-cols-3">
          {[
            { label: "Role access", detail: "Clerk or JWT roles can protect this route in production.", icon: UserCog },
            { label: "Queues", detail: "BullMQ/Redis worker hooks are documented for bulk search.", icon: ServerCog },
            { label: "Abuse controls", detail: "Rate limits, Turnstile, and audit trails are wired at API boundaries.", icon: LockKeyhole }
          ].map((item) => (
            <Card key={item.label}>
              <CardHeader>
                <div>
                  <CardTitle>{item.label}</CardTitle>
                  <CardDescription>{item.detail}</CardDescription>
                </div>
                <item.icon className="h-5 w-5 text-accent-100" />
              </CardHeader>
            </Card>
          ))}
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Premium Modules</CardTitle>
                <CardDescription>Feature flags for paid team workflows.</CardDescription>
              </div>
              <ShieldCheck className="h-5 w-5 text-emerald-200" />
            </CardHeader>
            <div className="space-y-3">
              {[
                ["PDF intelligence report", "placeholder"],
                ["CSV export", "enabled in UI"],
                ["Team dashboard", "schema-ready"],
                ["Saved investigations", "schema-ready"],
                ["Bulk search", "queue-ready"],
                ["OCR upload", "placeholder"],
                ["Face similarity", "disabled"]
              ].map(([label, status]) => (
                <div key={label} className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.04] p-3">
                  <span className="text-sm text-slate-200">{label}</span>
                  <Badge tone={status === "disabled" ? "bad" : status === "enabled in UI" ? "good" : "neutral"}>{status}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Audit Log</CardTitle>
                <CardDescription>Recent API and investigation events.</CardDescription>
              </div>
            </CardHeader>
            <div className="space-y-3">
              {(audit.length ? audit : [{ id: "empty", action: "audit.empty", actor: "system", createdAt: new Date().toISOString() }]).map((event) => (
                <div key={event.id} className="rounded-md border border-white/10 bg-white/[0.04] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-white">{event.action}</p>
                    <span className="text-xs text-slate-500">{new Date(event.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Actor: {event.actor}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </main>
    </AppShell>
  );
}
