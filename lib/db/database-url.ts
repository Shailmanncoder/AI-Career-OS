const POOLED_KEYS = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
] as const;

const DIRECT_KEYS = [
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
] as const;

function readValue(env: Record<string, string | undefined>, key: string) {
  const value = env[key];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

function findBySuffix(env: Record<string, string | undefined>, suffixes: readonly string[]) {
  for (const suffix of suffixes) {
    const match = Object.keys(env)
      .filter((key) => key !== suffix && key.endsWith(`_${suffix}`))
      .sort();
    for (const key of match) {
      const value = readValue(env, key);
      if (value) return value;
    }
  }
  return undefined;
}

export function resolveDatabaseUrl(env: Record<string, string | undefined> = process.env) {
  for (const key of POOLED_KEYS) {
    const value = readValue(env, key);
    if (value) return value;
  }
  return findBySuffix(env, POOLED_KEYS);
}

export function resolveDirectDatabaseUrl(env: Record<string, string | undefined> = process.env) {
  for (const key of DIRECT_KEYS) {
    const value = readValue(env, key);
    if (value) return value;
  }
  return findBySuffix(env, DIRECT_KEYS) ?? resolveDatabaseUrl(env);
}

export function applyDatabaseEnv(env: Record<string, string | undefined> = process.env) {
  const pooled = resolveDatabaseUrl(env);
  const direct = resolveDirectDatabaseUrl(env);
  if (pooled) env.DATABASE_URL = pooled;
  if (direct) env.DATABASE_URL_UNPOOLED = direct;
  return { pooled, direct };
}
