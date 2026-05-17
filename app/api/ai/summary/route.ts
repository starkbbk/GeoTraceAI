/**
 * AI Summary Streaming Endpoint
 *
 * POST /api/ai/summary
 *   body: { querySummary: string; evidenceSummary: string; riskSummary: string; stream?: boolean }
 *
 * When `stream` is true, returns a text/event-stream of incremental
 * deltas from DeepSeek. Otherwise returns a JSON payload with the
 * final summary and provider name.
 *
 * Rate limited per client. The DeepSeek API key never leaves the
 * server.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { generateAiSummary, streamAiSummary } from "@/lib/services/ai-service";
import { writeAuditEvent } from "@/lib/security/audit";
import { getClientKey, rateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  querySummary: z.string().min(1).max(2_000),
  evidenceSummary: z.string().max(8_000).optional().default(""),
  riskSummary: z.string().max(2_000).optional().default(""),
  stream: z.boolean().optional().default(false)
});

export async function POST(request: Request) {
  const clientKey = getClientKey(request);
  const limit = rateLimit(`ai-summary:${clientKey}`, 10, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "AI summary rate limited.", resetAt: limit.resetAt },
      { status: 429 }
    );
  }

  const payload = await request.json().catch(() => null);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  writeAuditEvent({
    actor: clientKey,
    action: "ai.summary.requested",
    metadata: { stream: parsed.data.stream }
  });

  if (parsed.data.stream) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamAiSummary(parsed.data)) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: chunk })}\n\n`));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: error instanceof Error ? error.message : "stream failed" })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive"
      }
    });
  }

  const result = await generateAiSummary(parsed.data);
  return NextResponse.json(result);
}
