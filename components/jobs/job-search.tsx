"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BriefcaseBusiness,
  Building2,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  Search,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorPanel } from "@/components/shared/error-panel";
import { requestJson } from "@/lib/api/client";
import type { JobSearchResult } from "@/lib/jobs/search";
import { MAX_AGE_OPTIONS, type JobListing } from "@/lib/jobs/types";
import { formatRelative } from "@/lib/utils";

type Filters = { query: string; location: string; days: number; remoteOnly: boolean };

const DAY_LABELS: Record<number, string> = {
  1: "Last 24 hours",
  3: "Last 3 days",
  7: "Last 7 days",
  14: "Last 14 days",
  30: "Last 30 days",
};

function buildUrl(filters: Filters, cursor: string | null) {
  const params = new URLSearchParams({
    q: filters.query,
    location: filters.location,
    days: String(filters.days),
    remote: String(filters.remoteOnly),
  });
  if (cursor) params.set("cursor", cursor);
  return `/api/jobs?${params}`;
}

export function JobSearch({
  defaultQuery,
  defaultLocation,
}: {
  defaultQuery: string;
  defaultLocation: string;
}) {
  const [filters, setFilters] = useState<Filters>({
    query: defaultQuery,
    location: defaultLocation,
    days: 7,
    remoteOnly: false,
  });
  const [submitted, setSubmitted] = useState<Filters | null>(null);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<"search" | "more" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const autoSearched = useRef(false);

  const run = useCallback(async (next: Filters, cursor: string | null) => {
    if (next.query.trim().length < 2) {
      setError("Enter a role, skill or company to search.");
      return;
    }

    const id = ++requestId.current;
    setPending(cursor ? "more" : "search");
    setError(null);

    const result = await requestJson<JobSearchResult>(buildUrl(next, cursor));
    if (id !== requestId.current) return;
    setPending(null);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setSubmitted(next);
    setNextCursor(result.data.nextCursor);
    setNotice(
      result.data.failedProviders.length > 0
        ? "One job source did not respond, so these results may be incomplete."
        : null,
    );
    setJobs((current) => {
      if (!cursor) return result.data.jobs;
      const seen = new Set(current.map((job) => job.id));
      return [...current, ...result.data.jobs.filter((job) => !seen.has(job.id))];
    });
  }, []);

  // Guarded so Strict Mode's double effect run does not spend two quota calls.
  useEffect(() => {
    if (autoSearched.current) return;
    autoSearched.current = true;
    if (defaultQuery.trim().length >= 2) {
      void run({ query: defaultQuery, location: defaultLocation, days: 7, remoteOnly: false }, null);
    }
  }, [defaultQuery, defaultLocation, run]);

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="pt-6">
          <form
            className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1.4fr_1fr_auto] md:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              void run(filters, null);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="job-query">Role, skill or company</Label>
              <Input
                id="job-query"
                value={filters.query}
                maxLength={100}
                placeholder="e.g. React developer"
                onChange={(event) => setFilters({ ...filters, query: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-location">Location</Label>
              <Input
                id="job-location"
                value={filters.location}
                maxLength={80}
                placeholder="e.g. Bengaluru"
                onChange={(event) => setFilters({ ...filters, location: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-days">Posted</Label>
              <Select
                value={String(filters.days)}
                onValueChange={(value) => setFilters({ ...filters, days: Number(value) })}
              >
                <SelectTrigger id="job-days">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MAX_AGE_OPTIONS.map((days) => (
                    <SelectItem key={days} value={String(days)}>
                      {DAY_LABELS[days]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={pending !== null}>
              {pending === "search" ? <Loader2 className="animate-spin" /> : <Search />}
              Search
            </Button>
            <label className="flex items-center gap-2 text-sm text-muted-foreground md:col-span-4">
              <Checkbox
                checked={filters.remoteOnly}
                onCheckedChange={(checked) => setFilters({ ...filters, remoteOnly: checked === true })}
              />
              Remote only
            </label>
          </form>
        </CardContent>
      </Card>

      {error ? <ErrorPanel message={error} onRetry={() => void run(filters, null)} /> : null}

      {pending === "search" ? (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      ) : submitted && jobs.length === 0 && !error ? (
        <EmptyState
          icon={BriefcaseBusiness}
          title="No open listings found"
          description="Nothing currently hiring matched this search. Widen the date range, drop the location, or try a broader role name."
        />
      ) : jobs.length > 0 ? (
        <section className="space-y-3" aria-live="polite">
          <p className="text-sm text-muted-foreground">
            {jobs.length} open {jobs.length === 1 ? "listing" : "listings"} · newest first
          </p>
          {notice ? <p className="text-sm text-warning">{notice}</p> : null}

          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}

          {nextCursor && submitted ? (
            <Button
              variant="outline"
              className="w-full"
              disabled={pending !== null}
              onClick={() => void run(submitted, nextCursor)}
            >
              {pending === "more" ? <Loader2 className="animate-spin" /> : null}
              Load more
            </Button>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function JobCard({ job }: { job: JobListing }) {
  const ageDays = (Date.now() - Date.parse(job.postedAt)) / 86_400_000;

  return (
    <Card>
      <CardContent className="space-y-3 pt-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <h3 className="font-semibold leading-snug">{job.title}</h3>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {job.company}
              </span>
              {job.location ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {job.location}
                </span>
              ) : null}
              {job.salary ? (
                <span className="inline-flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5" />
                  {job.salary}
                </span>
              ) : null}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-1.5">
            <Badge variant={ageDays <= 3 ? "success" : "muted"} className="gap-1">
              <Clock className="h-3 w-3" />
              {formatRelative(job.postedAt)}
            </Badge>
            {job.isRemote ? <Badge variant="secondary">Remote</Badge> : null}
            {job.employmentType ? (
              <Badge variant="outline" className="capitalize">
                {job.employmentType}
              </Badge>
            ) : null}
          </div>
        </div>

        {job.snippet ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{job.snippet}</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {job.applyOptions.slice(0, 4).map((option) => (
            <Button key={option.url} asChild size="sm" variant="outline">
              <a href={option.url} target="_blank" rel="noopener noreferrer nofollow">
                Apply on {option.publisher}
                <ExternalLink />
              </a>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
