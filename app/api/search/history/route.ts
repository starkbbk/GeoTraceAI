import { NextResponse } from "next/server";
import { listSearches } from "@/lib/db/memory-store";
import { getClientKey, rateLimit } from "@/lib/security/rate-limit";

export async function GET(request: Request) {
  const key = getClientKey(request);
  const limit = rateLimit(`history:${key}`, 60, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  return NextResponse.json({
    searches: listSearches().map((item) => ({
      id: item.id,
      createdAt: item.createdAt,
      label: item.possibleFullName ?? item.companyName ?? item.query.normalizedUsername ?? "Untitled search",
      country: item.query.inferredCountry,
      confidence: item.confidence,
      risk: item.risk.reputation
    }))
  });
}
