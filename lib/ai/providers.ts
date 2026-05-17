/**
 * Backwards-compatible re-export. The real implementation now lives in
 * `lib/services/ai-service.ts` so other intelligence/scoring modules can
 * share the same provider cascade.
 */

export {
  generateAiSummary,
  streamAiSummary
} from "@/lib/services/ai-service";

export type {
  AiProviderName,
  AiCorrelationRequest,
  AiCorrelationResult
} from "@/lib/services/ai-service";
