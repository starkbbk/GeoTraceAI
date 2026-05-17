/**
 * AI Service Layer
 *
 * Centralizes all AI provider calls with DeepSeek as the primary provider.
 * Provides:
 *   - generateAiSummary: non-streaming correlated investigation summary
 *   - streamAiSummary: streaming Server-Sent Event compatible chunks
 *   - withFallback: cascades through configured providers on failure
 *
 * All provider keys are read from `lib/security/config` and never exposed to
 * the client. Failures are logged server-side; the UI receives a graceful
 * fallback summary built from local correlation data.
 */

import OpenAI from "openai";
import { config } from "@/lib/security/config";

export type AiProviderName = "deepseek" | "openai" | "gemini" | "local";

export type AiCorrelationRequest = {
  querySummary: string;
  evidenceSummary: string;
  riskSummary: string;
};

export type AiCorrelationResult = {
  provider: AiProviderName;
  summary: string;
  confidenceAdjustment: number;
};

const SYSTEM_PROMPT =
  "You are an OSINT correlation assistant for authorized public-source investigations. " +
  "Use cautious, non-committal language. Do not claim certainty. Do not infer protected " +
  "or sensitive attributes (gender, religion, health, sexuality). Return a concise " +
  "analyst-grade summary based only on the supplied public evidence and risk context.";

const DEEPSEEK_DEFAULT_MODEL = "deepseek-chat";

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export async function generateAiSummary(
  request: AiCorrelationRequest
): Promise<AiCorrelationResult> {
  const prompt = buildPrompt(request);

  // Primary: DeepSeek
  if (config.deepseekApiKey) {
    const result = await callDeepSeek(prompt);
    if (result) return result;
  }

  // Fallback 1: OpenAI
  if (config.openaiApiKey) {
    const result = await callOpenAi(prompt);
    if (result) return result;
  }

  // Fallback 2: Gemini
  if (config.geminiApiKey) {
    const result = await callGemini(prompt);
    if (result) return result;
  }

  // Final fallback: local synthesis
  return {
    provider: "local",
    summary: localSummary(request),
    confidenceAdjustment: 0
  };
}

/**
 * Streams a DeepSeek completion as plain-text chunks suitable for SSE.
 * Yields strings as they arrive. Falls back to a single emit from
 * `generateAiSummary` if streaming is unavailable.
 */
export async function* streamAiSummary(
  request: AiCorrelationRequest
): AsyncGenerator<string, AiProviderName, void> {
  const prompt = buildPrompt(request);

  if (config.deepseekApiKey) {
    try {
      const stream = await streamDeepSeek(prompt);
      if (stream) {
        for await (const chunk of stream) yield chunk;
        return "deepseek";
      }
    } catch (error) {
      console.error("DeepSeek stream failed, falling back", error);
    }
  }

  // Fallback: one-shot summary
  const fallback = await generateAiSummary(request);
  yield fallback.summary;
  return fallback.provider;
}

/* ------------------------------------------------------------------ */
/*  Prompt builder                                                     */
/* ------------------------------------------------------------------ */

function buildPrompt(request: AiCorrelationRequest) {
  return [
    `Query: ${request.querySummary}`,
    `Evidence: ${request.evidenceSummary}`,
    `Risk: ${request.riskSummary}`,
    "",
    "Produce a 3-5 sentence analyst summary that:",
    "1. Names the strongest public signals and what they suggest.",
    "2. States confidence cautiously (e.g., 'likely', 'possibly', 'unconfirmed').",
    "3. Flags any risk indicators the analyst should review.",
    "4. Never invents data or asserts unverified facts."
  ].join("\n");
}

/* ------------------------------------------------------------------ */
/*  DeepSeek (primary)                                                 */
/* ------------------------------------------------------------------ */

async function callDeepSeek(prompt: string): Promise<AiCorrelationResult | null> {
  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.deepseekApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: config.deepseekModel || DEEPSEEK_DEFAULT_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        stream: false
      })
    });

    if (!response.ok) {
      console.error("DeepSeek HTTP error", response.status);
      return null;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return null;

    return {
      provider: "deepseek",
      summary: text,
      confidenceAdjustment: 0.06
    };
  } catch (error) {
    console.error("DeepSeek request failed", error);
    return null;
  }
}

async function streamDeepSeek(prompt: string): Promise<AsyncIterable<string> | null> {
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.deepseekApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.deepseekModel || DEEPSEEK_DEFAULT_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      stream: true
    })
  });

  if (!response.ok || !response.body) {
    console.error("DeepSeek stream HTTP error", response.status);
    return null;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  return {
    async *[Symbol.asyncIterator]() {
      let buffer = "";
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") return;
            try {
              const json = JSON.parse(payload) as {
                choices?: Array<{ delta?: { content?: string } }>;
              };
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) yield delta;
            } catch {
              // ignore malformed SSE chunks
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    }
  };
}

/* ------------------------------------------------------------------ */
/*  OpenAI fallback                                                    */
/* ------------------------------------------------------------------ */

async function callOpenAi(prompt: string): Promise<AiCorrelationResult | null> {
  try {
    const client = new OpenAI({ apiKey: config.openaiApiKey });
    const response = await client.responses.create({
      model: config.openaiModel,
      input: `${SYSTEM_PROMPT}\n\n${prompt}`
    });
    return {
      provider: "openai",
      summary: response.output_text || "OpenAI returned no summary text.",
      confidenceAdjustment: 0.04
    };
  } catch (error) {
    console.error("OpenAI summary failed", error);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Gemini fallback                                                    */
/* ------------------------------------------------------------------ */

async function callGemini(prompt: string): Promise<AiCorrelationResult | null> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": config.geminiApiKey ?? ""
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }] }],
          generationConfig: { thinkingConfig: { thinkingBudget: 0 } }
        })
      }
    );
    if (!response.ok) return null;
    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text)
      .filter(Boolean)
      .join("\n");
    return text ? { provider: "gemini", summary: text, confidenceAdjustment: 0.03 } : null;
  } catch (error) {
    console.error("Gemini summary failed", error);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Local synthesis                                                    */
/* ------------------------------------------------------------------ */

function localSummary(request: AiCorrelationRequest) {
  return [
    "This profile was generated from locally correlated public-source signals and user-provided identifiers.",
    request.evidenceSummary
      ? `The strongest available indicators are: ${request.evidenceSummary}.`
      : "No strong external evidence was available from configured public connectors.",
    `Risk context: ${request.riskSummary}.`
  ].join(" ");
}
