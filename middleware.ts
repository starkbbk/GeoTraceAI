/**
 * Clerk-aware middleware.
 *
 * When Clerk is configured (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and
 * CLERK_SECRET_KEY both present), `/dashboard`, `/results`, and the
 * private API routes require an authenticated session. When Clerk is
 * not configured, this middleware short-circuits to a no-op so local
 * development continues to work without authentication setup.
 */

import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { isClerkConfigured } from "@/lib/security/clerk-config";

const isProtected = createRouteMatcher([
  "/dashboard(.*)",
  "/results(.*)",
  "/admin(.*)",
  "/api/search(.*)",
  "/api/breach-search(.*)",
  "/api/analytics(.*)"
]);

const handler = isClerkConfigured
  ? clerkMiddleware(async (auth, req) => {
      if (isProtected(req)) {
        await auth.protect();
      }
    })
  : (_req: NextRequest) => NextResponse.next();

export default handler;

export const config = {
  matcher: [
    // Match everything except Next internals and common static files.
    "/((?!_next|_static|.*\\..*|favicon\\.ico).*)",
    "/(api|trpc)(.*)"
  ]
};
