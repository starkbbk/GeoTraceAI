import { NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken } from "@/lib/security/auth";
import { getClientKey, rateLimit } from "@/lib/security/rate-limit";

const schema = z.object({
  email: z.string().email(),
  role: z.enum(["analyst", "admin"]).default("analyst")
});

export async function POST(request: Request) {
  const key = getClientKey(request);
  const limit = rateLimit(`auth:${key}`, 8, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many auth requests." }, { status: 429 });

  const payload = await request.json().catch(() => null);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const token = await createSessionToken(parsed.data.email, parsed.data.role);
  return NextResponse.json({ token, tokenType: "Bearer", expiresIn: "8h" });
}
