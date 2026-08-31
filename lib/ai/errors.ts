export const AI_ERROR_CODES = [
  "MISSING_KEY",
  "TIMEOUT",
  "RATE_LIMIT",
  "UPSTREAM",
  "NETWORK",
  "MALFORMED",
  "SCHEMA",
  "EMPTY",
] as const;

export type AiErrorCode = (typeof AI_ERROR_CODES)[number];

export const AI_ERROR_MESSAGES: Record<AiErrorCode, string> = {
  MISSING_KEY: "AI is not configured. Add a Gemini API key to enable live analysis.",
  TIMEOUT: "The AI service took too long to respond. Please try again.",
  RATE_LIMIT: "The AI service is rate limited right now. Please retry in a moment.",
  UPSTREAM: "The AI service is temporarily unavailable.",
  NETWORK: "Could not reach the AI service. Check your connection and retry.",
  MALFORMED: "The AI returned a response we could not read.",
  SCHEMA: "The AI response did not match the expected structure.",
  EMPTY: "The AI returned an empty response.",
};

export type AiFailure = {
  ok: false;
  code: AiErrorCode;
  message: string;
};

export type AiSuccess<T> = {
  ok: true;
  data: T;
  model: string;
};

export type AiResult<T> = AiSuccess<T> | AiFailure;

export function aiFailure(code: AiErrorCode, message?: string): AiFailure {
  return { ok: false, code, message: message ?? AI_ERROR_MESSAGES[code] };
}
