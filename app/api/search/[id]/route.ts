import { NextResponse } from "next/server";
import { getSearch } from "@/lib/db/memory-store";
import { getClientKey, rateLimit } from "@/lib/security/rate-limit";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const key = getClientKey(request);
  const limit = rateLimit(`search-read:${key}`, 120, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const { id } = await params;
  const profile = getSearch(id);
  if (!profile) return NextResponse.json({ error: "Search result not found in local memory store." }, { status: 404 });
  return NextResponse.json({ profile });
}
