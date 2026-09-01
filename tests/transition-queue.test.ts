import { describe, expect, it } from "vitest";
import { createTransitionQueue } from "@/lib/theme/transition-queue";

type Request = { theme: "light" | "dark" };

describe("createTransitionQueue", () => {
  it("permits the first request to run", () => {
    const queue = createTransitionQueue<Request>();
    expect(queue.isRunning()).toBe(false);
    expect(queue.begin({ theme: "dark" })).toBe(true);
    expect(queue.isRunning()).toBe(true);
  });

  it("refuses a second request while one is running", () => {
    const queue = createTransitionQueue<Request>();
    queue.begin({ theme: "dark" });
    expect(queue.begin({ theme: "light" })).toBe(false);
  });

  it("queues the refused request rather than dropping it", () => {
    const queue = createTransitionQueue<Request>();
    queue.begin({ theme: "dark" });
    queue.begin({ theme: "light" });
    expect(queue.peek()).toEqual({ theme: "light" });
  });

  it("keeps only the most recent request when several arrive", () => {
    const queue = createTransitionQueue<Request>();
    queue.begin({ theme: "dark" });
    queue.begin({ theme: "light" });
    queue.begin({ theme: "dark" });
    queue.begin({ theme: "light" });
    expect(queue.peek()).toEqual({ theme: "light" });
  });

  it("hands back the queued request on release and clears it", () => {
    const queue = createTransitionQueue<Request>();
    queue.begin({ theme: "dark" });
    queue.begin({ theme: "light" });
    expect(queue.release()).toEqual({ theme: "light" });
    expect(queue.peek()).toBeNull();
    expect(queue.isRunning()).toBe(false);
  });

  it("returns null on release when nothing was queued", () => {
    const queue = createTransitionQueue<Request>();
    queue.begin({ theme: "dark" });
    expect(queue.release()).toBeNull();
  });

  it("accepts a new request after release, so transitions never wedge", () => {
    const queue = createTransitionQueue<Request>();
    queue.begin({ theme: "dark" });
    queue.release();
    expect(queue.begin({ theme: "light" })).toBe(true);
  });

  it("survives a release that was never begun", () => {
    const queue = createTransitionQueue<Request>();
    expect(queue.release()).toBeNull();
    expect(queue.isRunning()).toBe(false);
    expect(queue.begin({ theme: "dark" })).toBe(true);
  });

  it("never lets two requests run concurrently across a full cycle", () => {
    const queue = createTransitionQueue<Request>();
    const started: Request[] = [];
    const request = (r: Request) => {
      if (queue.begin(r)) started.push(r);
    };
    request({ theme: "dark" });
    request({ theme: "light" });
    request({ theme: "dark" });
    expect(started).toHaveLength(1);

    const next = queue.release();
    expect(next).not.toBeNull();
    if (next) request(next);
    expect(started).toHaveLength(2);
  });
});
