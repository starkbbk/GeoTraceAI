import { listSearches } from "@/lib/db/memory-store";
import { similarity } from "./fuzzy";
import {
  ConfidenceFactor,
  DigitalFootprint,
  DomainIntelligence,
  InvestigationTask,
  LocationIntelligence,
  NormalizedInput,
  PhoneIntelligence,
  PossibleMatch,
  PublicAvatar,
  RiskAnalysis,
  SourceEvidence
} from "./types";

type EntityLinkingInput = {
  input: NormalizedInput;
  location: LocationIntelligence;
  footprint: DigitalFootprint;
  evidence: SourceEvidence[];
  risk: RiskAnalysis;
  phoneIntel?: PhoneIntelligence;
  domainIntel?: DomainIntelligence;
};

export function buildEntityLinking({
  input,
  location,
  footprint,
  evidence,
  risk,
  phoneIntel,
  domainIntel
}: EntityLinkingInput) {
  const avatars = buildAvatars(evidence);
  const possibleMatches = buildPossibleMatches(input, location, footprint, evidence, avatars);
  const historyMatches = buildHistoryMatches(input);
  const confidenceFactors = buildConfidenceFactors(input, location, footprint, evidence, risk, phoneIntel, domainIntel);
  const investigationTasks = buildInvestigationTasks(input, possibleMatches, historyMatches, phoneIntel, domainIntel);

  return {
    avatars,
    possibleMatches: [...possibleMatches, ...historyMatches],
    confidenceFactors,
    investigationTasks,
    mergedConfidence: mergeConfidence(confidenceFactors)
  };
}

function buildAvatars(evidence: SourceEvidence[]): PublicAvatar[] {
  return evidence
    .flatMap((item) => {
      const avatarUrl = item.fields?.avatarUrl;
      return typeof avatarUrl === "string"
        ? [
            {
              source: item.source,
              url: avatarUrl,
              confidence: item.confidence,
              provenance: item.legalBasis === "public-api" ? "verified-public-api" : "derived-inference"
            } satisfies PublicAvatar
          ]
        : [];
    })
    .slice(0, 6);
}

function buildPossibleMatches(
  input: NormalizedInput,
  location: LocationIntelligence,
  footprint: DigitalFootprint,
  evidence: SourceEvidence[],
  avatars: PublicAvatar[]
): PossibleMatch[] {
  const matches: PossibleMatch[] = [];

  footprint.githubProfiles.forEach((profile) => {
    const nameScore = input.fullName ? maxEvidenceNameScore(input.fullName, evidence) : 0;
    const locationScore = location.city && evidence.some((item) => item.summary.toLowerCase().includes(location.city!.toLowerCase())) ? 0.1 : 0;
    matches.push({
      id: `github:${profile.login}`,
      title: `GitHub: ${profile.login}`,
      subtitle: [profile.bio, `${profile.repositories ?? 0} repositories`, `${profile.followers ?? 0} followers`]
        .filter(Boolean)
        .join(" | "),
      confidence: clamp(profile.confidence + nameScore * 0.12 + locationScore),
      provenance: "verified-public-api",
      signals: ["username", "github-api", profile.bio ? "profile-bio" : "public-profile"],
      profileUrl: profile.url,
      avatarUrl: avatars.find((avatar) => avatar.source === "Gravatar")?.url
    });
  });

  footprint.socialProfiles.forEach((profile) => {
    matches.push({
      id: `social:${profile.platform}:${profile.handle}`,
      title: `${profile.platform}: ${profile.handle}`,
      subtitle: profile.url ? "Public profile or public review link" : "Username signal",
      confidence: profile.confidence,
      provenance: profile.confidence >= 0.5 ? "verified-public-api" : "public-review-link",
      signals: ["username", profile.platform],
      profileUrl: profile.url
    });
  });

  if (input.fullName && location.city) {
    matches.push({
      id: "name-city-correlation",
      title: input.fullName,
      subtitle: `Name and city signal: ${location.city}${location.state ? `, ${location.state}` : ""}`,
      confidence: input.normalizedPhone ? 0.68 : 0.5,
      provenance: "derived-inference",
      signals: ["name", "city", ...(input.normalizedPhone ? ["phone"] : [])]
    });
  }

  return dedupeMatches(matches).sort((a, b) => b.confidence - a.confidence).slice(0, 8);
}

function buildHistoryMatches(input: NormalizedInput): PossibleMatch[] {
  return listSearches()
    .filter((item) => item.id !== input.notes)
    .flatMap((profile) => {
      const score =
        (input.normalizedEmail && input.normalizedEmail === profile.query.normalizedEmail ? 0.45 : 0) +
        (input.normalizedPhone && input.normalizedPhone === profile.query.normalizedPhone ? 0.4 : 0) +
        (input.normalizedUsername && input.normalizedUsername === profile.query.normalizedUsername ? 0.28 : 0) +
        (input.fullName && profile.possibleFullName ? similarity(input.fullName, profile.possibleFullName) * 0.18 : 0) +
        (input.cityState && profile.city && input.cityState.toLowerCase().includes(profile.city.toLowerCase()) ? 0.12 : 0);
      if (score < 0.22) return [];
      return [
        {
          id: `history:${profile.id}`,
          title: profile.possibleFullName ?? profile.query.normalizedUsername ?? profile.id,
          subtitle: `Prior search ${profile.id}`,
          confidence: clamp(score),
          provenance: "derived-inference",
          signals: ["search-history", ...profile.query.signals],
          profileUrl: `/results/${profile.id}`
        } satisfies PossibleMatch
      ];
    })
    .slice(0, 4);
}

function buildConfidenceFactors(
  input: NormalizedInput,
  location: LocationIntelligence,
  footprint: DigitalFootprint,
  evidence: SourceEvidence[],
  risk: RiskAnalysis,
  phoneIntel?: PhoneIntelligence,
  domainIntel?: DomainIntelligence
): ConfidenceFactor[] {
  const verifiedEvidence = evidence.filter((item) => item.legalBasis === "public-api");
  const locationAgreement =
    input.cityState && location.city && input.cityState.toLowerCase().includes(location.city.toLowerCase()) ? 0.86 : 0.44;
  const identityCompleteness = Math.min(1, input.signals.length / 6);
  const publicProfileScore = Math.min(1, (footprint.githubProfiles.length * 0.42 + footprint.socialProfiles.length * 0.16));
  const evidenceScore = verifiedEvidence.length ? Math.min(1, verifiedEvidence.length / 5) : 0.2;
  const contactScore =
    (input.normalizedEmail ? (domainIntel?.disposable ? 0.24 : 0.72) : 0.36) +
    (input.normalizedPhone ? (phoneIntel?.valid ? 0.22 : -0.12) : 0);

  return [
    {
      label: "Identifier completeness",
      score: identityCompleteness,
      weight: 0.2,
      provenance: "user-provided",
      detail: `${input.signals.length} signal groups supplied.`
    },
    {
      label: "Location agreement",
      score: locationAgreement,
      weight: 0.18,
      provenance: verifiedEvidence.some((item) => item.source.includes("Nominatim")) ? "verified-public-api" : "derived-inference",
      detail: location.city ? `Resolved city ${location.city}.` : "No city-level public location match."
    },
    {
      label: "Public profile matches",
      score: publicProfileScore,
      weight: 0.22,
      provenance: footprint.githubProfiles.length || footprint.socialProfiles.length ? "verified-public-api" : "public-review-link",
      detail: `${footprint.githubProfiles.length + footprint.socialProfiles.length} profile signals.`
    },
    {
      label: "Contact reputation",
      score: clamp(contactScore),
      weight: 0.16,
      provenance: "derived-inference",
      detail: risk.breachExposureCount
        ? `${risk.breachExposureCount} breach references and ${domainIntel?.category ?? "unknown"} domain.`
        : `${domainIntel?.category ?? "unknown"} domain; phone ${phoneIntel?.valid ? "valid" : "not supplied or invalid"}.`
    },
    {
      label: "Verified public evidence",
      score: evidenceScore,
      weight: 0.24,
      provenance: "verified-public-api",
      detail: `${verifiedEvidence.length} public API evidence records.`
    }
  ];
}

function buildInvestigationTasks(
  input: NormalizedInput,
  possibleMatches: PossibleMatch[],
  historyMatches: PossibleMatch[],
  phoneIntel?: PhoneIntelligence,
  domainIntel?: DomainIntelligence
): InvestigationTask[] {
  return [
    {
      id: "review-matches",
      label: "Review possible matches",
      status: possibleMatches.length ? "review" : "blocked",
      detail: possibleMatches.length
        ? `${possibleMatches.length} possible profile cards generated from public signals.`
        : "No public profile cards were generated."
    },
    {
      id: "contact-reputation",
      label: "Assess contact reputation",
      status: domainIntel?.disposable ? "review" : "done",
      detail: domainIntel?.disposable
        ? "Email domain appears disposable; verify before relying on this identity signal."
        : "No disposable email signal was detected."
    },
    {
      id: "phone-region",
      label: "Check phone region",
      status: phoneIntel?.valid ? "done" : input.normalizedPhone ? "review" : "blocked",
      detail: phoneIntel?.telecomCircle ?? "No telecom circle could be inferred."
    },
    {
      id: "history-correlation",
      label: "Search history correlation",
      status: historyMatches.length ? "review" : "done",
      detail: historyMatches.length ? `${historyMatches.length} prior search overlaps found.` : "No prior local search overlap found."
    }
  ];
}

function maxEvidenceNameScore(name: string, evidence: SourceEvidence[]) {
  return evidence.reduce((score, item) => Math.max(score, similarity(name, item.summary)), 0);
}

function mergeConfidence(factors: ConfidenceFactor[]) {
  const totalWeight = factors.reduce((total, item) => total + item.weight, 0) || 1;
  return factors.reduce((total, item) => total + item.score * item.weight, 0) / totalWeight;
}

function dedupeMatches(matches: PossibleMatch[]) {
  return Array.from(new Map(matches.map((match) => [match.id, match])).values());
}

function clamp(value: number) {
  return Math.max(0.02, Math.min(0.98, Number(value.toFixed(3))));
}
