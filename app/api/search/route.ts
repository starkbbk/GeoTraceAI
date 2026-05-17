import { NextResponse } from "next/server";
import { z } from "zod";
import { saveInvestigation, saveSearch, saveSearchToWatchlist } from "@/lib/db/memory-store";
import { buildIdentityProfile } from "@/lib/osint/correlation";
import { normalizeSearchInput } from "@/lib/osint/normalization";
import { SearchInput } from "@/lib/osint/types";
import { bearerToken, verifySessionToken } from "@/lib/security/auth";
import { getClientKey, rateLimit } from "@/lib/security/rate-limit";
import { verifyTurnstile } from "@/lib/security/turnstile";

const schema = z
  .object({
    fullName: z.string().max(140).optional().or(z.literal("")),
    phone: z.string().max(40).optional().or(z.literal("")),
    pincode: z.string().max(24).optional().or(z.literal("")),
    country: z.string().max(80).optional().or(z.literal("")),
    email: z.string().email().optional().or(z.literal("")),
    domain: z.string().max(255).optional().or(z.literal("")),
    ipAddress: z.string().max(80).optional().or(z.literal("")),
    username: z.string().max(80).optional().or(z.literal("")),
    companyName: z.string().max(160).optional().or(z.literal("")),
    vehicleNumber: z.string().max(40).optional().or(z.literal("")),
    cityState: z.string().max(140).optional().or(z.literal("")),
    notes: z.string().max(1000).optional().or(z.literal("")),
    watchlistMode: z.boolean().optional(),
    saveInvestigation: z.boolean().optional(),
    authorizationAccepted: z.boolean(),
    turnstileToken: z.string().optional()
  })
  .refine((value) => Object.entries(value).some(([key, item]) => key !== "authorizationAccepted" && Boolean(item)), {
    message: "Provide at least one search signal."
  });

export async function POST(request: Request) {
  const key = getClientKey(request);
  const limit = rateLimit(`search:${key}`, 12, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Search throttled. Try again shortly." }, { status: 429 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!parsed.data.authorizationAccepted) {
    return NextResponse.json(
      { error: "Authorized-use confirmation is required before running public-source investigations." },
      { status: 403 }
    );
  }

  const turnstile = await verifyTurnstile(parsed.data.turnstileToken, key);
  if (!turnstile.ok) {
    return NextResponse.json({ error: turnstile.reason }, { status: 403 });
  }

  const session = await verifySessionToken(bearerToken(request));
  const normalized = normalizeSearchInput(stripEmpty(parsed.data));
  const profile = await buildIdentityProfile(normalized, session?.subject ?? key, key);
  saveSearch(profile);
  if (parsed.data.watchlistMode) saveSearchToWatchlist(profile, parsed.data.notes);
  if (parsed.data.saveInvestigation) saveInvestigation(profile, undefined, parsed.data.notes);

  return NextResponse.json({
    id: profile.id,
    profile,
    rateLimit: {
      remaining: limit.remaining,
      resetAt: limit.resetAt
    },
    turnstile
  });
}

function stripEmpty(input: SearchInput): SearchInput {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, typeof value === "string" && value.trim() === "" ? undefined : value])
  ) as SearchInput;
}
