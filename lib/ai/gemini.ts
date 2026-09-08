import type { z, ZodTypeAny } from "zod";
import { env, isAiConfigured } from "@/lib/env";
import { aiFailure, type AiErrorCode, type AiResult } from "./errors";
import { parseJsonLoose } from "./json";

const API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models";
export const AI_TIME_BUDGET_MS = 50_000;
const ATTEMPT_TIMEOUT_MS = 20_000;
const MIN_ATTEMPT_MS = 3_000;
const CONTENT_ATTEMPTS_PER_MODEL = 2;
const CONTENT_RETRY_DELAY_MS = 350;

type GeminiCandidate = {
  content?: { parts?: Array<{ text?: string }> };
  finishReason?: string;
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
  promptFeedback?: { blockReason?: string };
};

type CallOutcome =
  | { ok: true; payload: GeminiResponse }
  | { ok: false; code: AiErrorCode; status?: number; detail?: string };

export type StructuredRequest<Schema extends ZodTypeAny> = {
  system: string;
  user: string;
  schema: Schema;
  temperature?: number;
  maxOutputTokens?: number;
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readCandidateText(payload: GeminiResponse) {
  const parts = payload.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((part) => part.text ?? "")
    .join("")
    .trim();
}

function classifyStatus(status: number): AiErrorCode {
  if (status === 429) return "RATE_LIMIT";
  if (status === 408 || status === 504) return "TIMEOUT";
  return "UPSTREAM";
}

function logFailure(model: string, code: AiErrorCode, status?: number, detail?: string) {
  console.error("[ai]", model, code, status ?? "", detail ? detail.slice(0, 240) : "");
}

async function callGemini(
  model: string,
  body: unknown,
  timeoutMs: number,
): Promise<CallOutcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `${API_ROOT}/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.geminiApiKey as string,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return { ok: false, code: classifyStatus(response.status), status: response.status, detail };
    }

    const payload = (await response.json()) as GeminiResponse;
    return { ok: true, payload };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return {
      ok: false,
      code: aborted ? "TIMEOUT" : "NETWORK",
      detail: error instanceof Error ? error.message : undefined,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function generateStructured<Schema extends ZodTypeAny>({
  system,
  user,
  schema,
  temperature = 0.35,
  maxOutputTokens = 8192,
}: StructuredRequest<Schema>): Promise<AiResult<z.output<Schema>>> {
  if (!isAiConfigured()) return aiFailure("MISSING_KEY");

  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig: {
      temperature,
      maxOutputTokens,
      responseMimeType: "application/json",
      topP: 0.9,
    },
    safetySettings: [],
  };

  const startedAt = Date.now();
  const remaining = () => AI_TIME_BUDGET_MS - (Date.now() - startedAt);
  let lastCode: AiErrorCode = "UPSTREAM";

  for (const model of env.geminiModels) {
    for (let attempt = 1; attempt <= CONTENT_ATTEMPTS_PER_MODEL; attempt += 1) {
      const budget = remaining();
      if (budget < MIN_ATTEMPT_MS) return aiFailure(lastCode);

      const result = await callGemini(model, body, Math.min(ATTEMPT_TIMEOUT_MS, budget));

      if (!result.ok) {
        lastCode = result.code;
        logFailure(model, result.code, result.status, result.detail);
        break;
      }

      const blockReason = result.payload.promptFeedback?.blockReason;
      if (blockReason) {
        lastCode = "EMPTY";
        logFailure(model, "EMPTY", undefined, `blocked: ${blockReason}`);
        break;
      }

      const text = readCandidateText(result.payload);
      if (!text) {
        lastCode = "EMPTY";
        logFailure(model, "EMPTY", undefined, result.payload.candidates?.[0]?.finishReason);
        if (attempt < CONTENT_ATTEMPTS_PER_MODEL) await delay(CONTENT_RETRY_DELAY_MS);
        continue;
      }

      const parsedJson = parseJsonLoose(text);
      if (parsedJson === null) {
        lastCode = "MALFORMED";
        logFailure(model, "MALFORMED", undefined, text.slice(0, 120));
        if (attempt < CONTENT_ATTEMPTS_PER_MODEL) await delay(CONTENT_RETRY_DELAY_MS);
        continue;
      }

      const validated = schema.safeParse(parsedJson);
      if (!validated.success) {
        lastCode = "SCHEMA";
        logFailure(model, "SCHEMA", undefined, validated.error.issues[0]?.message);
        if (attempt < CONTENT_ATTEMPTS_PER_MODEL) await delay(CONTENT_RETRY_DELAY_MS);
        continue;
      }

      return { ok: true, data: validated.data, model };
    }
  }

  return aiFailure(lastCode);
}
