import { NextResponse } from "next/server";
import { analyticsSnapshot } from "@/lib/db/memory-store";
import { listAuditEvents } from "@/lib/security/audit";

export async function GET() {
  return NextResponse.json({
    analytics: analyticsSnapshot(),
    audit: listAuditEvents().slice(0, 20)
  });
}
