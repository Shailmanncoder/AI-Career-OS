import { describe, expect, it } from "vitest";
import {
  applyDatabaseEnv,
  resolveDatabaseUrl,
  resolveDirectDatabaseUrl,
} from "@/lib/db/database-url";

const POOLED = "postgresql://u:p@pooler.example.com/db";
const DIRECT = "postgresql://u:p@direct.example.com/db";

describe("resolveDatabaseUrl", () => {
  it("prefers the canonical DATABASE_URL", () => {
    expect(resolveDatabaseUrl({ DATABASE_URL: POOLED, POSTGRES_URL: DIRECT })).toBe(POOLED);
  });

  it("falls back to Vercel Postgres naming", () => {
    expect(resolveDatabaseUrl({ POSTGRES_PRISMA_URL: POOLED })).toBe(POOLED);
    expect(resolveDatabaseUrl({ POSTGRES_URL: POOLED })).toBe(POOLED);
  });

  it("finds a prefixed variable from an integration custom prefix", () => {
    expect(resolveDatabaseUrl({ SHAILMANN_DATABASE_URL: POOLED })).toBe(POOLED);
    expect(resolveDatabaseUrl({ ACME_POSTGRES_URL: POOLED })).toBe(POOLED);
  });

  it("ignores empty and whitespace-only values", () => {
    expect(resolveDatabaseUrl({ DATABASE_URL: "   ", SHAILMANN_DATABASE_URL: POOLED })).toBe(POOLED);
  });

  it("returns undefined when nothing is configured", () => {
    expect(resolveDatabaseUrl({})).toBeUndefined();
    expect(resolveDatabaseUrl({ UNRELATED: "x" })).toBeUndefined();
  });

  it("does not match a variable that merely contains the name", () => {
    expect(resolveDatabaseUrl({ MYDATABASE_URLX: POOLED })).toBeUndefined();
  });
});

describe("resolveDirectDatabaseUrl", () => {
  it("prefers the unpooled variable", () => {
    expect(resolveDirectDatabaseUrl({ DATABASE_URL: POOLED, DATABASE_URL_UNPOOLED: DIRECT })).toBe(DIRECT);
  });

  it("finds the prefixed unpooled variable", () => {
    expect(
      resolveDirectDatabaseUrl({ SHAILMANN_DATABASE_URL: POOLED, SHAILMANN_DATABASE_URL_UNPOOLED: DIRECT }),
    ).toBe(DIRECT);
  });

  it("falls back to the pooled url when no direct url exists", () => {
    expect(resolveDirectDatabaseUrl({ DATABASE_URL: POOLED })).toBe(POOLED);
  });
});

describe("applyDatabaseEnv", () => {
  it("normalises prefixed variables onto the canonical names", () => {
    const env: Record<string, string | undefined> = {
      SHAILMANN_DATABASE_URL: POOLED,
      SHAILMANN_DATABASE_URL_UNPOOLED: DIRECT,
    };
    applyDatabaseEnv(env);
    expect(env.DATABASE_URL).toBe(POOLED);
    expect(env.DATABASE_URL_UNPOOLED).toBe(DIRECT);
  });

  it("leaves an already-correct environment untouched", () => {
    const env: Record<string, string | undefined> = {
      DATABASE_URL: POOLED,
      DATABASE_URL_UNPOOLED: DIRECT,
    };
    applyDatabaseEnv(env);
    expect(env.DATABASE_URL).toBe(POOLED);
    expect(env.DATABASE_URL_UNPOOLED).toBe(DIRECT);
  });

  it("does not invent values when nothing is set", () => {
    const env: Record<string, string | undefined> = {};
    applyDatabaseEnv(env);
    expect(env.DATABASE_URL).toBeUndefined();
  });
});
