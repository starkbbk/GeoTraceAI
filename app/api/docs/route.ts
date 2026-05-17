import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "GeoTrace AI API",
    version: "1.0.0",
    compliance: "Authorized public-source intelligence only. No private databases, leaked passwords, or bypassed access.",
    endpoints: [
      {
        method: "POST",
        path: "/api/auth",
        description: "Issue a local JWT for analyst/admin testing."
      },
      {
        method: "POST",
        path: "/api/search",
        description: "Create an authorized OSINT search from partial identifiers."
      },
      {
        method: "GET",
        path: "/api/search/{id}",
        description: "Read a generated investigation profile from the local store."
      },
      {
        method: "GET",
        path: "/api/search/history",
        description: "List recent searches."
      },
      {
        method: "GET",
        path: "/api/analytics",
        description: "Return usage analytics and audit events."
      }
    ]
  });
}
