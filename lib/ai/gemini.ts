import type { z, ZodTypeAny } from "zod";
import { env, isAiConfigured } from "@/lib/env";
import { aiFailure, type AiResult } from "./errors";
import { parseJsonLoose } from "./json";

const API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models";
const REQUEST_TIMEOUT_MS = 45_000;
const MAX_ATTEMPTS = 3;
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

type GeminiCandidate = {
  content?: { parts?: Array<{ text?: string }> };
  finishReason?: string;
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
  promptFeedback?: { blockReason?: string };
};

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

async function callGemini(body: unknown): Promise<
  | { ok: true; payload: GeminiResponse }
  | { ok: false; retryable: boolean; code: "RATE_LIMIT" | "UPSTREAM" | "TIMEOUT" | "NETWORK" }
> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${API_ROOT}/${encodeURIComponent(env.geminiModel)}:generateContent`,
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
      const retryable = RETRYABLE_STATUS.has(response.status);
      return {
        ok: false,
        retryable,
        code: response.status === 429 ? "RATE_LIMIT" : "UPSTREAM",
      };
    }

    const payload = (await response.json()) as GeminiResponse;
    return { ok: true, payload };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return { ok: false, retryable: true, code: aborted ? "TIMEOUT" : "NETWORK" };
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

  let lastCode: "RATE_LIMIT" | "UPSTREAM" | "TIMEOUT" | "NETWORK" | "MALFORMED" | "SCHEMA" | "EMPTY" =
    "UPSTREAM";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const result = await callGemini(body);

    if (!result.ok) {
      lastCode = result.code;
      if (!result.retryable || attempt === MAX_ATTEMPTS) break;
      await delay(attempt * 900);
      continue;
    }

    const text = readCandidateText(result.payload);
    if (!text) {
      lastCode = "EMPTY";
      if (attempt === MAX_ATTEMPTS) break;
      await delay(attempt * 700);
      continue;
    }

    const parsedJson = parseJsonLoose(text);
    if (parsedJson === null) {
      lastCode = "MALFORMED";
      if (attempt === MAX_ATTEMPTS) break;
      await delay(attempt * 700);
      continue;
    }

    const validated = schema.safeParse(parsedJson);
    if (!validated.success) {
      lastCode = "SCHEMA";
      if (attempt === MAX_ATTEMPTS) break;
      await delay(attempt * 700);
      continue;
    }

    return { ok: true, data: validated.data, model: env.geminiModel };
  }

  return aiFailure(lastCode);
}
