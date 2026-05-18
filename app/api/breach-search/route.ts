import { NextResponse } from "next/server";
import { z } from "zod";
import { lookupBreachExposureXon } from "@/lib/connectors/xon";
import {
  LeakLookupBreachRecord,
  LeakLookupIdentifierType,
  searchLeakLookup
} from "@/lib/connectors/leak-lookup";
import { writeAuditEvent } from "@/lib/security/audit";
import { getClientKey, rateLimit } from "@/lib/security/rate-limit";
import { stableId } from "@/lib/utils";

export const runtime = "nodejs";

const schema = z
  .object({
    provider: z.enum(["leak-lookup", "xon"]).default("leak-lookup"),
    email: z.string().email().optional().or(z.literal("")),
    username: z.string().min(2).max(80).optional().or(z.literal("")),
    domain: z.string().min(3).max(255).optional().or(z.literal("")),
    phone: z.string().min(5).max(40).optional().or(z.literal("")),
    consentAccepted: z.boolean().optional(),
    authorizationAccepted: z.boolean().optional()
  })
  .refine((value) => Boolean(value.consentAccepted || value.authorizationAccepted), {
    message: "Consent is required before searching public breach metadata."
  })
  .refine(
    (value) => ["email", "username", "domain", "phone"].some((key) => Boolean(value[key as keyof typeof value])),
    { message: "Provide an email, username, domain, or phone number." }
  );

type TimelineEvent = {
  id: string;
  date: string;
  label: string;
  severity: LeakLookupBreachRecord["severity"];
  source: string;
  detail: string;
};

export async function POST(request: Request) {
  const clientKey = getClientKey(request);
  const limit = rateLimit(`breach-search:${clientKey}`, 8, 60_000);
  if (!limit.allowed) {
    writeAuditEvent({
      actor: clientKey,
      action: "breach.lookup.rate_limited",
      metadata: { route: "/api/breach-search", resetAt: limit.resetAt }
    });
    return NextResponse.json(
      {
        error: "Breach search throttled. Try again shortly.",
        rateLimit: { remaining: limit.remaining, resetAt: limit.resetAt }
      },
      { status: 429 }
    );
  }

  const payload = await request.json().catch(() => null);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const inputs = normalizeInputs(parsed.data);
  const provider = parsed.data.provider;
  const searchId = stableId("breach");

  writeAuditEvent({
    actor: clientKey,
    action: "breach.lookup.started",
    target: searchId,
    metadata: {
      route: "/api/breach-search",
      provider,
      identifierTypes: inputs.map((input) => input.type),
      identifiers: inputs.map((input) => maskIdentifier(input.query, input.type))
    }
  });

  try {
    let records: LeakLookupBreachRecord[] = [];
    let isConfigured = false;
    let isOk = false;
    let sourceResults: any[] = [];

    if (provider === "xon") {
      const emailInput = inputs.find((i) => i.type === "email");
      if (!emailInput) {
        return NextResponse.json({ error: "XposedOrNot requires an email address to search." }, { status: 400 });
      }

      const xonResult = await lookupBreachExposureXon({ normalizedEmail: emailInput.query } as any);
      
      const errorEvidence = xonResult.evidence.find((e) => e.title === "Breach exposure check unavailable");
      if (errorEvidence) {
        return NextResponse.json({ error: errorEvidence.summary }, { status: 502 });
      }

      isConfigured = xonResult.enabled;
      isOk = xonResult.enabled;
      records = xonResult.records.map((r) => ({
        id: r.id,
        source: r.sourceUrl ? `${r.sourceUrl} (${r.breachName})` : r.breachName,
        sourceUrl: r.sourceUrl ?? "https://xposedornot.com",
        breachDate: r.firstSeen,
        exposedFields: r.categories,
        riskScore: r.severity === "critical" ? 95 : r.severity === "high" ? 75 : r.severity === "medium" ? 55 : 25,
        exposureCount: 1,
        severity: r.severity,
        confidence: r.confidence,
        identifierType: "email",
        verified: r.verified,
        inferred: r.inferred,
        recommendation: r.summary,
        disclaimer: "XposedOrNot metadata result"
      }));
      sourceResults = [{ provider: "XposedOrNot", configured: isConfigured, ok: isOk, cached: false }];
    } else {
      const results = await Promise.all(
        inputs.map(({ type, query }) => searchLeakLookup({ type, query }))
      );
      sourceResults = results;
      records = results.flatMap((result) => result.records);
      isConfigured = results.some((result) => result.configured);
      isOk = results.every((result) => result.ok) || records.length > 0;
    }

    const exposureCount = provider === "xon" ? records.length : records.reduce((sum, record) => sum + record.exposureCount, 0);
    const topSeverity = getHighestSeverity(records);
    const riskScore = records.length ? Math.max(...records.map((record) => record.riskScore)) : 0;
    const timeline = buildTimeline(records, provider === "xon" ? "XposedOrNot" : "Leak-Lookup");

    writeAuditEvent({
      actor: clientKey,
      action: "breach.lookup.completed",
      target: searchId,
      metadata: {
        route: "/api/breach-search",
        sources: [provider === "xon" ? "XposedOrNot" : "Leak-Lookup"],
        recordCount: records.length,
        exposureCount,
        highestSeverity: topSeverity,
        configured: isConfigured
      }
    });

    return NextResponse.json({
      id: searchId,
      provider: provider === "xon" ? "XposedOrNot" : "Leak-Lookup",
      configured: isConfigured,
      ok: isOk,
      records,
      timeline,
      metrics: {
        exposureCount,
        breachSources: new Set(records.map((record) => record.source)).size,
        riskScore,
        highestSeverity: topSeverity,
        verifiedMetadata: records.filter((record) => record.verified).length,
        affectedIdentifierTypes: Array.from(new Set(records.map((record) => record.identifierType)))
      },
      searches: sourceResults.map((result) => ({
        provider: result.provider,
        identifierType: result.identifierType,
        queryMasked: result.queryMasked,
        configured: result.configured,
        ok: result.ok,
        cached: result.cached,
        exposureCount: result.exposureCount,
        error: result.error
      })),
      monitoringRecommendation: monitoringRecommendation(topSeverity, exposureCount, provider === "xon" ? "XposedOrNot" : "Leak-Lookup"),
      summary: summaryFor(records.length, exposureCount, topSeverity),
      compliance: {
        consentAccepted: true,
        storage: "No credential rows, passwords, or API secrets are stored by this route.",
        disclosure: "Metadata-only public breach intelligence. Sensitive values are redacted before returning to the client."
      },
      rateLimit: {
        remaining: limit.remaining,
        resetAt: limit.resetAt
      }
    });
  } catch (error) {
    writeAuditEvent({
      actor: clientKey,
      action: "breach.lookup.failed",
      target: searchId,
      metadata: {
        route: "/api/breach-search",
        error: error instanceof Error ? error.message : "Unexpected breach search failure"
      }
    });

    return NextResponse.json(
      {
        id: searchId,
        ok: false,
        provider: parsed.data?.provider === "xon" ? "XposedOrNot" : "Leak-Lookup",
        records: [],
        timeline: [],
        error: "Breach intelligence lookup is temporarily unavailable. No credential data was stored.",
        compliance: {
          consentAccepted: true,
          storage: "No credential rows, passwords, or API secrets are stored by this route."
        }
      },
      { status: 502 }
    );
  }
}

function normalizeInputs(input: z.infer<typeof schema>) {
  return ([
    ["email", input.email],
    ["username", input.username],
    ["domain", input.domain],
    ["phone", input.phone]
  ] as Array<[LeakLookupIdentifierType, string | undefined]>)
    .map(([type, query]) => ({ type, query: query?.trim() ?? "" }))
    .filter((item) => item.query.length > 0);
}

function buildTimeline(records: LeakLookupBreachRecord[], sourceName: string): TimelineEvent[] {
  return records
    .map((record) => ({
      id: record.id,
      date: record.breachDate ?? new Date().toISOString().slice(0, 10),
      label: record.source,
      severity: record.severity,
      source: sourceName,
      detail: `${record.identifierType} exposure metadata with ${record.exposedFields.length} exposed field categories.`
    }))
    .sort((left, right) => right.date.localeCompare(left.date));
}

function getHighestSeverity(records: LeakLookupBreachRecord[]) {
  const order = ["low", "medium", "high", "critical"] as const;
  return records.reduce<(typeof order)[number]>(
    (highest, record) => (order.indexOf(record.severity) > order.indexOf(highest) ? record.severity : highest),
    "low"
  );
}

function monitoringRecommendation(severity: LeakLookupBreachRecord["severity"], count: number, name: string) {
  if (count === 0) return `No ${name} breach metadata returned. Keep monitoring enabled for future public appearances.`;
  if (severity === "critical") return "Immediate review recommended: rotate reused passwords, enforce MFA, and monitor linked identifiers.";
  if (severity === "high") return "Add to watchlist, review account recovery settings, and monitor repeated exposure overlap.";
  if (severity === "medium") return "Monitor for repeat appearances and reduce profile reuse across public platforms.";
  return "Maintain periodic monitoring and review public profile exposure.";
}

function summaryFor(recordCount: number, exposureCount: number, severity: LeakLookupBreachRecord["severity"]) {
  if (recordCount === 0) {
    return "No public breach metadata was returned for the submitted identifiers.";
  }
  return `${recordCount} breach metadata source${recordCount === 1 ? "" : "s"} returned with ${exposureCount} exposure reference${
    exposureCount === 1 ? "" : "s"
  }. Highest severity is ${severity}.`;
}

function maskIdentifier(value: string, type: LeakLookupIdentifierType) {
  if (!value) return "";
  if (type === "email") {
    const [local = "", domain = ""] = value.split("@");
    return `${local.slice(0, 2)}${"*".repeat(Math.max(2, local.length - 2))}@${domain}`;
  }
  if (type === "phone") {
    const digits = value.replace(/\D/g, "");
    return digits.length > 4 ? `${"*".repeat(Math.max(4, digits.length - 4))}${digits.slice(-4)}` : "****";
  }
  if (type === "domain") {
    const [name = "", ...rest] = value.split(".");
    return `${name.slice(0, 2)}${"*".repeat(Math.max(2, name.length - 2))}${rest.length ? `.${rest.join(".")}` : ""}`;
  }
  return `${value.slice(0, 2)}${"*".repeat(Math.max(2, value.length - 2))}`;
}
