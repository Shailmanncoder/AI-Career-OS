import { describe, expect, it } from "vitest";
import { curateListings, staleReason } from "@/lib/jobs/freshness";
import type { JobListing } from "@/lib/jobs/types";

const NOW = Date.parse("2026-10-04T12:00:00Z");
const daysAgo = (days: number) => new Date(NOW - days * 86_400_000).toISOString();

function job(overrides: Partial<JobListing> = {}): JobListing {
  return {
    id: "jsearch:1",
    provider: "jsearch",
    title: "Frontend Developer",
    company: "Acme",
    location: "Bengaluru, KA, IN",
    isRemote: false,
    employmentType: "full time",
    snippet: "Build interfaces with React.",
    postedAt: daysAgo(2),
    expiresAt: null,
    salary: null,
    applyUrl: "https://example.com/a",
    applyOptions: [{ publisher: "Naukri.com", url: "https://example.com/a" }],
    publisher: "Naukri.com",
    ...overrides,
  };
}

describe("staleReason", () => {
  it("keeps a recent, unexpired listing", () => {
    expect(staleReason(job(), 7, NOW)).toBeNull();
  });

  it("rejects listings older than the window", () => {
    expect(staleReason(job({ postedAt: daysAgo(8) }), 7, NOW)).toBe("too-old");
  });

  it("rejects listings without a usable posting date", () => {
    expect(staleReason(job({ postedAt: "" }), 7, NOW)).toBe("undated");
    expect(staleReason(job({ postedAt: daysAgo(-3) }), 7, NOW)).toBe("undated");
  });

  it("rejects listings whose published expiry has passed", () => {
    expect(staleReason(job({ expiresAt: daysAgo(1) }), 30, NOW)).toBe("expired");
    expect(staleReason(job({ expiresAt: daysAgo(-5) }), 30, NOW)).toBeNull();
  });

  it("rejects listings marked as filled or closed", () => {
    expect(staleReason(job({ title: "Data Analyst (Position Filled)" }), 7, NOW)).toBe("closed");
    expect(staleReason(job({ snippet: "We are no longer accepting applications." }), 7, NOW)).toBe("closed");
  });
});

describe("curateListings", () => {
  it("merges the same opening from two sources and sorts newest first", () => {
    const result = curateListings(
      [
        job({ id: "adzuna:9", provider: "adzuna", postedAt: daysAgo(3), applyOptions: [{ publisher: "Adzuna", url: "https://example.com/z" }] }),
        job({ id: "jsearch:1", postedAt: daysAgo(1), location: "Bengaluru" }),
        job({ id: "jsearch:2", title: "Backend Engineer", postedAt: daysAgo(0.5) }),
        job({ id: "jsearch:3", title: "Old Role", postedAt: daysAgo(40) }),
      ],
      7,
      NOW,
    );

    expect(result.map((entry) => entry.id)).toEqual(["jsearch:2", "jsearch:1"]);
    expect(result[1].applyOptions.map((option) => option.publisher).sort()).toEqual(["Adzuna", "Naukri.com"]);
  });
});
