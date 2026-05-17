/**
 * Centralized scoring helpers.
 *
 * Pure functions that turn evidence and exposure metadata into normalized
 * 0..1 confidence and 0..100 risk values. Keeping these in one place makes
 * it easy to reason about scoring policy and audit how decisions are made.
 */

export type Severity = "low" | "medium" | "high" | "critical";

export type RiskInputs = {
  signalCount: number;
  evidenceCount: number;
  highConfidenceEvidence: number;
  breachCount: number;
  disposableEmail: boolean;
  invalidPhone: boolean;
  reputation: "low-risk" | "watch" | "elevated" | "high-risk" | "unknown";
};

const SEVERITY_RANK: Record<Severity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3
};

/**
 * Combines breach count and disposable/invalid signals into a 0..100 risk
 * score. Higher means more attention required.
 */
export function calculateRiskScore(input: RiskInputs): number {
  let score = 0;
  score += Math.min(40, input.breachCount * 6);
  if (input.disposableEmail) score += 15;
  if (input.invalidPhone) score += 8;
  if (input.signalCount <= 1) score += 8;
  if (input.reputation === "high-risk") score += 25;
  else if (input.reputation === "elevated") score += 15;
  else if (input.reputation === "watch") score += 6;
  // Strong public evidence reduces risk slightly because we're more confident.
  if (input.highConfidenceEvidence >= 3) score -= 5;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Combines signal richness and evidence quality into a 0..1 confidence.
 */
export function calculateConfidence(input: {
  signalCount: number;
  evidenceCount: number;
  averageEvidenceConfidence: number;
  regionalScore: number;
  mergedConfidence: number;
}): number {
  const signalScore = Math.min(1, input.signalCount / 5);
  const score =
    input.averageEvidenceConfidence * 0.42 +
    signalScore * 0.24 +
    input.regionalScore * 0.14 +
    input.mergedConfidence * 0.2;
  return Math.max(0.1, Math.min(0.97, score));
}

export function highestSeverity(values: Severity[]): Severity {
  return values.reduce<Severity>(
    (highest, current) => (SEVERITY_RANK[current] > SEVERITY_RANK[highest] ? current : highest),
    "low"
  );
}

export function severityFromScore(score: number): Severity {
  if (score >= 82) return "critical";
  if (score >= 64) return "high";
  if (score >= 42) return "medium";
  return "low";
}

export function severityTone(severity: Severity): "good" | "warn" | "bad" {
  if (severity === "critical" || severity === "high") return "bad";
  if (severity === "medium") return "warn";
  return "good";
}
