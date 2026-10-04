export type JobProvider = "adzuna" | "jsearch";

export type ApplyOption = {
  publisher: string;
  url: string;
};

export type JobListing = {
  id: string;
  provider: JobProvider;
  title: string;
  company: string;
  location: string;
  isRemote: boolean;
  employmentType: string | null;
  snippet: string;
  postedAt: string;
  expiresAt: string | null;
  salary: string | null;
  applyUrl: string;
  applyOptions: ApplyOption[];
  publisher: string;
};

export type JobSearchParams = {
  query: string;
  location: string;
  maxAgeDays: number;
  remoteOnly: boolean;
};

/** Where each provider left off; JSearch pages by cursor, Adzuna by page number. */
export type PageCursor = Partial<{ jsearch: string; adzuna: number }>;

export type ProviderResult<Next> = {
  jobs: JobListing[];
  next: Next | null;
};

export const MAX_AGE_OPTIONS = [1, 3, 7, 14, 30] as const;
