import type { JobListing } from "./types";

const DAY_MS = 86_400_000;
const CLOCK_SKEW_MS = 6 * 60 * 60 * 1000;

const CLOSED_PATTERN =
  /\b(position (has been )?filled|no longer (accepting|available|hiring)|applications? (are )?closed|hiring closed|job (has )?expired|vacancy closed)\b/i;

export type StaleReason = "undated" | "too-old" | "expired" | "closed";

/**
 * A listing counts as open only when it can prove it: a known posting date inside
 * the window, an expiry (if published) still in the future, and no closed wording.
 */
export function staleReason(job: JobListing, maxAgeDays: number, now = Date.now()): StaleReason | null {
  const posted = Date.parse(job.postedAt);
  if (Number.isNaN(posted) || posted > now + CLOCK_SKEW_MS) return "undated";
  if (now - posted > maxAgeDays * DAY_MS) return "too-old";

  if (job.expiresAt) {
    const expires = Date.parse(job.expiresAt);
    if (!Number.isNaN(expires) && expires <= now) return "expired";
  }

  if (CLOSED_PATTERN.test(job.title) || CLOSED_PATTERN.test(job.snippet)) return "closed";

  return null;
}

function dedupeKey(job: JobListing) {
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return `${normalize(job.title)}|${normalize(job.company)}|${normalize(job.location.split(",")[0] ?? "")}`;
}

/** Drops stale listings, merges duplicates across providers, newest first. */
export function curateListings(jobs: JobListing[], maxAgeDays: number, now = Date.now()) {
  const merged = new Map<string, JobListing>();

  for (const job of jobs) {
    if (staleReason(job, maxAgeDays, now)) continue;

    const key = dedupeKey(job);
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, job);
      continue;
    }

    const newer = Date.parse(job.postedAt) > Date.parse(existing.postedAt) ? job : existing;
    const links = new Map(
      [...existing.applyOptions, ...job.applyOptions].map((option) => [option.url, option]),
    );
    merged.set(key, { ...newer, applyOptions: Array.from(links.values()) });
  }

  return Array.from(merged.values()).sort(
    (a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt),
  );
}
