import crypto from "crypto";
import { NormalizedInput, SourceEvidence } from "@/lib/osint/types";
import { cachedJson } from "./http";

type GravatarProfile = {
  entry?: Array<{
    id?: string;
    hash?: string;
    requestHash?: string;
    displayName?: string;
    preferredUsername?: string;
    profileUrl?: string;
    thumbnailUrl?: string;
    aboutMe?: string;
    urls?: Array<{ title?: string; value?: string }>;
  }>;
};

export async function lookupGravatar(input: NormalizedInput) {
  if (!input.normalizedEmail) return { evidence: [], emails: [], websites: [] };

  const hash = crypto.createHash("md5").update(input.normalizedEmail.trim().toLowerCase()).digest("hex");
  const avatarUrl = `https://www.gravatar.com/avatar/${hash}?d=identicon&s=200`;
  const profileUrl = `https://gravatar.com/${hash}`;
  const response = await cachedJson<GravatarProfile>({
    source: "gravatar",
    cacheKey: hash,
    url: `https://www.gravatar.com/${hash}.json`,
    ttlMs: 24 * 60 * 60_000,
    minIntervalMs: 500,
    init: {
      headers: {
        "User-Agent": "GeoTraceAI/1.0 authorized-osint",
        Accept: "application/json"
      }
    }
  });
  const profile = response.ok ? response.data?.entry?.[0] : undefined;
  const publicUrls = profile?.urls?.flatMap((item) => (item.value ? [item.value] : [])) ?? [];
  const websites = [
    {
      domain: "gravatar.com",
      url: profile?.profileUrl ?? profileUrl,
      confidence: profile ? 0.74 : 0.32
    },
    ...publicUrls.map((url) => ({
      domain: toDomain(url),
      url,
      confidence: 0.58
    }))
  ];

  const evidence: SourceEvidence = {
    source: "Gravatar",
    type: "profile",
    title: profile ? `Gravatar profile: ${profile.displayName ?? profile.preferredUsername ?? hash}` : "Gravatar profile not found",
    url: profile?.profileUrl ?? profileUrl,
    confidence: profile ? 0.74 : 0.32,
    summary: profile
      ? [profile.displayName, profile.preferredUsername, profile.aboutMe].filter(Boolean).join(" | ") ||
        "Public Gravatar profile found for the submitted email hash."
      : "Checked the public Gravatar JSON endpoint for the submitted email hash. No profile JSON was returned.",
    collectedAt: new Date().toISOString(),
    legalBasis: profile ? "public-api" : "derived",
    fields: {
      hashAlgorithm: "md5",
      avatarUrl: profile?.thumbnailUrl ?? avatarUrl,
      preferredUsername: profile?.preferredUsername ?? null,
      publicUrlCount: publicUrls.length,
      cached: response.cached
    }
  };

  return {
    evidence: [evidence],
    emails: [{ email: input.normalizedEmail, source: "user-provided", confidence: 0.92 }],
    websites
  };
}

function toDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
