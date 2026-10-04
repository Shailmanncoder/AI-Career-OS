import { env } from "@/lib/env";
import { searchAdzuna } from "./adzuna";
import { curateListings } from "./freshness";
import { JobProviderError } from "./http";
import { searchJSearch } from "./jsearch";
import type { JobListing, JobProvider, JobSearchParams, PageCursor } from "./types";

const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_ENTRIES = 200;

export type JobSearchResult = {
  jobs: JobListing[];
  nextCursor: string | null;
  providers: JobProvider[];
  failedProviders: JobProvider[];
  fetchedAt: string;
};

const cache = new Map<string, { expires: number; value: JobSearchResult }>();

export function configuredJobProviders(): JobProvider[] {
  const providers: JobProvider[] = [];
  if (env.jsearchApiKey) providers.push("jsearch");
  if (env.adzunaAppId && env.adzunaAppKey) providers.push("adzuna");
  return providers;
}

export function isJobSearchConfigured() {
  return configuredJobProviders().length > 0;
}

export function encodeCursor(cursor: PageCursor) {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeCursor(token: string): PageCursor {
  try {
    const parsed = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    const cursor: PageCursor = {};
    if (typeof parsed?.jsearch === "string" && parsed.jsearch.length < 2000) cursor.jsearch = parsed.jsearch;
    if (Number.isInteger(parsed?.adzuna) && parsed.adzuna > 1 && parsed.adzuna <= 20) cursor.adzuna = parsed.adzuna;
    return cursor;
  } catch {
    return {};
  }
}

/**
 * Without a cursor every configured provider is queried from the start. With one, only
 * the providers that still have pages left are asked for their next page.
 */
export async function searchJobs(params: JobSearchParams, cursorToken?: string): Promise<JobSearchResult> {
  const configured = configuredJobProviders();
  if (configured.length === 0) throw new Error("JOBS_NOT_CONFIGURED");

  const cursor = cursorToken ? decodeCursor(cursorToken) : null;
  const providers = cursor ? configured.filter((provider) => cursor[provider] !== undefined) : configured;
  if (providers.length === 0) {
    return { jobs: [], nextCursor: null, providers: [], failedProviders: [], fetchedAt: new Date().toISOString() };
  }

  const cacheKey = JSON.stringify({
    ...params,
    query: params.query.toLowerCase(),
    location: params.location.toLowerCase(),
    cursor: cursorToken ?? null,
  });
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.value;

  const settled = await Promise.allSettled(
    providers.map(async (provider) =>
      provider === "jsearch"
        ? { provider, ...(await searchJSearch(params, cursor?.jsearch)) }
        : { provider, ...(await searchAdzuna(params, cursor?.adzuna)) },
    ),
  );

  const failedProviders: JobProvider[] = [];
  const collected: JobListing[] = [];
  const next: PageCursor = {};

  settled.forEach((outcome, index) => {
    if (outcome.status === "fulfilled") {
      collected.push(...outcome.value.jobs);
      if (outcome.value.provider === "jsearch" && typeof outcome.value.next === "string") {
        next.jsearch = outcome.value.next;
      }
      if (outcome.value.provider === "adzuna" && typeof outcome.value.next === "number") {
        next.adzuna = outcome.value.next;
      }
      return;
    }
    failedProviders.push(providers[index]);
    const reason = outcome.reason;
    console.error("[jobs]", providers[index], reason instanceof JobProviderError ? reason.message : reason);
  });

  if (failedProviders.length === providers.length) throw new Error("JOBS_UPSTREAM");

  const value: JobSearchResult = {
    jobs: curateListings(collected, params.maxAgeDays),
    nextCursor: Object.keys(next).length > 0 ? encodeCursor(next) : null,
    providers: providers.filter((provider) => !failedProviders.includes(provider)),
    failedProviders,
    fetchedAt: new Date().toISOString(),
  };

  // Partial results are not cached so a recovered provider shows up on the next search.
  if (failedProviders.length === 0) {
    if (cache.size >= CACHE_MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
    cache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, value });
  }

  return value;
}
