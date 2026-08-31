function readOptional(key: string) {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

export const env = {
  databaseUrl: readOptional("DATABASE_URL"),
  authSecret: readOptional("AUTH_SECRET") ?? readOptional("NEXTAUTH_SECRET"),
  geminiApiKey: readOptional("GEMINI_API_KEY") ?? readOptional("GOOGLE_API_KEY"),
  geminiModel: readOptional("GEMINI_MODEL") ?? "gemini-3.6-flash",
  appUrl: readOptional("AUTH_URL") ?? readOptional("NEXTAUTH_URL") ?? "http://localhost:3000",
  isProduction: process.env.NODE_ENV === "production",
};

export function isAiConfigured() {
  return Boolean(env.geminiApiKey);
}
