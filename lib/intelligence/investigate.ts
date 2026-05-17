/**
 * Unified Investigation Engine
 *
 * Thin wrapper that exposes the public-facing investigation entrypoint
 * used by route handlers. Internally delegates to the existing
 * correlation engine in `lib/osint/correlation.ts`. Future intelligence
 * orchestration logic should be added here (e.g., parallel pipelines,
 * caching, ML scoring) so the route handlers stay slim.
 */

import { buildIdentityProfile } from "@/lib/osint/correlation";
import { normalizeSearchInput } from "@/lib/osint/normalization";
import type { IdentityProfile, SearchInput } from "@/lib/osint/types";

export type InvestigationRequest = SearchInput & {
  actor?: string;
  clientIp?: string;
};

/**
 * Runs a full unified investigation across all configured public
 * connectors, returning the correlated identity profile.
 */
export async function investigate(
  input: InvestigationRequest
): Promise<IdentityProfile> {
  const { actor, clientIp, ...rest } = input;
  const normalized = normalizeSearchInput(rest);
  return buildIdentityProfile(normalized, actor ?? "anonymous", clientIp);
}
