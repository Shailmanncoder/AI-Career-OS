const POOLED_KEYS = ["DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL"];
const DIRECT_KEYS = ["DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING"];

const read = (key) => {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : undefined;
};

const bySuffix = (suffixes) => {
  for (const suffix of suffixes) {
    for (const key of Object.keys(process.env).filter((k) => k !== suffix && k.endsWith(`_${suffix}`)).sort()) {
      const value = read(key);
      if (value) return value;
    }
  }
  return undefined;
};

const pooled = POOLED_KEYS.map(read).find(Boolean) ?? bySuffix(POOLED_KEYS);
const direct = DIRECT_KEYS.map(read).find(Boolean) ?? bySuffix(DIRECT_KEYS) ?? pooled;

if (!pooled) {
  console.error("No database URL found. Set DATABASE_URL or a provider equivalent.");
  process.exit(1);
}

const quote = (value) => `'${value.replace(/'/g, `'\\''`)}'`;
process.stdout.write(`export DATABASE_URL=${quote(pooled)}\nexport DATABASE_URL_UNPOOLED=${quote(direct)}\n`);
