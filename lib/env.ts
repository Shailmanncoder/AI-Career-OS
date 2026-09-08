function readOptional(key: string) {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

const DEFAULT_MODEL = "gemini-3.1-flash-lite";

const DEFAULT_MODEL_CHAIN = [
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
];

function readList(key: string) {
  return readOptional(key)
    ?.split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function buildModelChain() {
  const primary = readOptional("GEMINI_MODEL") ?? DEFAULT_MODEL;
  const rest = readList("GEMINI_FALLBACK_MODELS") ?? DEFAULT_MODEL_CHAIN;
  return Array.from(new Set([primary, ...rest]));
}

export const env = {
  databaseUrl: readOptional("DATABASE_URL"),
  authSecret: readOptional("AUTH_SECRET") ?? readOptional("NEXTAUTH_SECRET"),
  geminiApiKey: readOptional("GEMINI_API_KEY") ?? readOptional("GOOGLE_API_KEY"),
  geminiModel: readOptional("GEMINI_MODEL") ?? DEFAULT_MODEL,
  geminiModels: buildModelChain(),
  appUrl: readOptional("AUTH_URL") ?? readOptional("NEXTAUTH_URL") ?? "http://localhost:3000",
  isProduction: process.env.NODE_ENV === "production",
};

export function isAiConfigured() {
  return Boolean(env.geminiApiKey);
}
