import { env } from "@/lib/env";
import { fetchProviderJson, formatSalary, plainText } from "./http";
import type { JobListing, JobSearchParams, ProviderResult } from "./types";

const PAGE_SIZE = 20;

type AdzunaJob = {
  id: string;
  title?: string;
  description?: string;
  created?: string;
  redirect_url?: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
  salary_min?: number;
  salary_max?: number;
  contract_time?: string;
};

type AdzunaResponse = { results?: AdzunaJob[]; count?: number };

const CURRENCY_BY_COUNTRY: Record<string, string> = {
  in: "INR", gb: "GBP", us: "USD", ca: "CAD", au: "AUD", sg: "SGD", de: "EUR", fr: "EUR", nl: "EUR",
};

export async function searchAdzuna(params: JobSearchParams, page = 1): Promise<ProviderResult<number>> {
  const country = env.jobsCountry;
  const query = new URLSearchParams({
    app_id: env.adzunaAppId as string,
    app_key: env.adzunaAppKey as string,
    results_per_page: String(PAGE_SIZE),
    what: params.remoteOnly ? `${params.query} remote` : params.query,
    max_days_old: String(params.maxAgeDays),
    sort_by: "date",
    "content-type": "application/json",
  });
  if (params.location) query.set("where", params.location);

  const payload = await fetchProviderJson<AdzunaResponse>(
    "adzuna",
    `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?${query}`,
  );

  const results = payload.results ?? [];
  const jobs = results.flatMap((job): JobListing[] => {
    if (!job.title || !job.redirect_url || !job.created) return [];
    const title = plainText(job.title, 160);
    const snippet = plainText(job.description);
    return [
      {
        id: `adzuna:${job.id}`,
        provider: "adzuna",
        title,
        company: job.company?.display_name?.trim() || "Company not listed",
        location: job.location?.display_name ?? "",
        isRemote: /\bremote\b/i.test(`${title} ${snippet}`),
        employmentType: job.contract_time ? job.contract_time.replace("_", " ") : null,
        snippet,
        postedAt: job.created,
        expiresAt: null,
        salary: formatSalary(job.salary_min, job.salary_max, CURRENCY_BY_COUNTRY[country] ?? "USD", "year"),
        applyUrl: job.redirect_url,
        applyOptions: [{ publisher: "Adzuna", url: job.redirect_url }],
        publisher: "Adzuna",
      },
    ];
  });

  const hasMore = results.length === PAGE_SIZE && (payload.count ?? 0) > page * PAGE_SIZE;
  return { jobs, next: hasMore ? page + 1 : null };
}
