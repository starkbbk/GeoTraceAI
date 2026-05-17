/**
 * GitHub Intelligence API
 *
 * POST /api/github-intel
 *   body: { username: string }
 *
 * Returns rich GitHub profile metadata (avatar, followers, repos, recent
 * activity). Rate limited per client. Auth-protected when Clerk is
 * configured (handled by middleware).
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { buildGithubIntelligence } from "@/lib/services/github-intel";
import { writeAuditEvent } from "@/lib/security/audit";
import { getClientKey, rateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  username: z.string().min(1).max(80),
  email: z.string().email().optional()
});

export async function POST(request: Request) {
  const clientKey = getClientKey(request);
  const limit = rateLimit(`github-intel:${clientKey}`, 12, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "GitHub intelligence rate limited.", rateLimit: { remaining: 0, resetAt: limit.resetAt } },
      { status: 429 }
    );
  }

  const payload = await request.json().catch(() => null);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Prefer the username field; fall back to email local part if needed.
  const username =
    parsed.data.username || parsed.data.email?.split("@")[0] || "";

  writeAuditEvent({
    actor: clientKey,
    action: "github.intel.requested",
    metadata: { username: username.slice(0, 4) + "***" }
  });

  const result = await buildGithubIntelligence(username);

  return NextResponse.json({
    ...result,
    rateLimit: { remaining: limit.remaining, resetAt: limit.resetAt }
  });
}
