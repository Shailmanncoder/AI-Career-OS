import { env } from "@/lib/env";
import { fetchProviderJson, plainText } from "./http";
import type { ApplyOption, JobListing, JobSearchParams, ProviderResult } from "./types";

const HOST = "jsearch.p.rapidapi.com";

type JSearchJob = {
  job_id: string;
  job_title?: string;
  employer_name?: string;
  job_publisher?: string;
  job_employment_type?: string | null;
  job_apply_link?: string;
  job_description?: string;
  job_is_remote?: boolean;
  job_posted_at_datetime_utc?: string | null;
  job_offer_expiration_datetime_utc?: string | null;
  job_city?: string | null;
  job_state?: string | null;
  job_country?: string | null;
  job_salary_string?: string | null;
  apply_options?: Array<{ publisher?: string; apply_link?: string }>;
};

// v5 shape of GET /search-v2: pages are chained with data.cursor.
type JSearchResponse = { data?: { jobs?: JSearchJob[]; cursor?: string | null } };

// JSearch only buckets by day/3 days/week/month; the exact window is enforced afterwards.
function datePostedBucket(maxAgeDays: number) {
  if (maxAgeDays <= 1) return "today";
  if (maxAgeDays <= 3) return "3days";
  if (maxAgeDays <= 7) return "week";
  return "month";
}

export async function searchJSearch(params: JobSearchParams, cursor?: string): Promise<ProviderResult<string>> {
  const query = new URLSearchParams({
    query: params.location ? `${params.query} in ${params.location}` : params.query,
    country: env.jobsCountry,
    date_posted: datePostedBucket(params.maxAgeDays),
  });
  if (params.remoteOnly) query.set("work_from_home", "true");
  if (cursor) query.set("cursor", cursor);

  const payload = await fetchProviderJson<JSearchResponse>("jsearch", `https://${HOST}/search-v2?${query}`, {
    "X-RapidAPI-Key": env.jsearchApiKey as string,
    "X-RapidAPI-Host": HOST,
  });

  const results = payload.data?.jobs ?? [];
  const jobs = results.flatMap((job): JobListing[] => {
    if (!job.job_title || !job.job_apply_link || !job.job_posted_at_datetime_utc) return [];

    const applyOptions: ApplyOption[] = (job.apply_options ?? []).flatMap((option) =>
      option.apply_link && option.publisher ? [{ publisher: option.publisher, url: option.apply_link }] : [],
    );
    if (applyOptions.length === 0) {
      applyOptions.push({ publisher: job.job_publisher ?? "Apply", url: job.job_apply_link });
    }

    return [
      {
        id: `jsearch:${job.job_id}`,
        provider: "jsearch",
        title: plainText(job.job_title, 160),
        company: job.employer_name?.trim() || "Company not listed",
        location: [job.job_city, job.job_state, job.job_country].filter(Boolean).join(", "),
        isRemote: Boolean(job.job_is_remote),
        employmentType: job.job_employment_type?.replace("_", " ").toLowerCase() ?? null,
        snippet: plainText(job.job_description),
        postedAt: job.job_posted_at_datetime_utc,
        expiresAt: job.job_offer_expiration_datetime_utc ?? null,
        salary: job.job_salary_string?.trim() || null,
        applyUrl: job.job_apply_link,
        applyOptions,
        publisher: job.job_publisher ?? "Google Jobs",
      },
    ];
  });

  const next = payload.data?.cursor;
  return { jobs, next: results.length > 0 && next ? next : null };
}
