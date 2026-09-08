import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const schema = z.object({ title: z.string() });

const CHAIN = ["model-a", "model-b", "model-c", "model-d"];

vi.mock("@/lib/env", () => ({
  env: {
    geminiApiKey: "test-key",
    geminiModel: "model-a",
    geminiModels: ["model-a", "model-b", "model-c", "model-d"],
  },
  isAiConfigured: () => true,
}));

const { AI_TIME_BUDGET_MS, generateStructured } = await import("@/lib/ai/gemini");

function modelOf(call: unknown) {
  return String(call).split("/models/")[1]?.split(":")[0] ?? "";
}

function jsonResponse(payload: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }] }),
    text: async () => "",
  };
}

function errorResponse(status: number, message: string) {
  return {
    ok: false,
    status,
    json: async () => ({}),
    text: async () => JSON.stringify({ error: { code: status, message } }),
  };
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("generateStructured model failover", () => {
  it("returns the first successful model without calling later ones", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ title: "ok" }));

    const result = await generateStructured({ system: "s", user: "u", schema });

    expect(result).toMatchObject({ ok: true, data: { title: "ok" }, model: "model-a" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("moves to the next model immediately when quota is exhausted", async () => {
    fetchMock
      .mockResolvedValueOnce(errorResponse(429, "Quota exceeded, limit: 20"))
      .mockResolvedValueOnce(jsonResponse({ title: "second" }));

    const result = await generateStructured({ system: "s", user: "u", schema });

    expect(result).toMatchObject({ ok: true, model: "model-b" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(modelOf(fetchMock.mock.calls[0][0])).toBe("model-a");
    expect(modelOf(fetchMock.mock.calls[1][0])).toBe("model-b");
  });

  it("does not retry the same model after a quota rejection", async () => {
    fetchMock.mockResolvedValue(errorResponse(429, "Quota exceeded"));

    const result = await generateStructured({ system: "s", user: "u", schema });

    expect(result).toMatchObject({ ok: false, code: "RATE_LIMIT" });
    expect(fetchMock).toHaveBeenCalledTimes(CHAIN.length);
    expect(fetchMock.mock.calls.map((call) => modelOf(call[0]))).toEqual(CHAIN);
  });

  it("switches models when one is overloaded", async () => {
    fetchMock
      .mockResolvedValueOnce(errorResponse(503, "high demand"))
      .mockResolvedValueOnce(errorResponse(503, "high demand"))
      .mockResolvedValueOnce(jsonResponse({ title: "third" }));

    const result = await generateStructured({ system: "s", user: "u", schema });

    expect(result).toMatchObject({ ok: true, model: "model-c" });
  });

  it("retries the same model once when the payload fails schema validation", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ wrong: true }))
      .mockResolvedValueOnce(jsonResponse({ title: "recovered" }));

    const result = await generateStructured({ system: "s", user: "u", schema });

    expect(result).toMatchObject({ ok: true, model: "model-a" });
    expect(fetchMock.mock.calls.map((call) => modelOf(call[0]))).toEqual(["model-a", "model-a"]);
  });

  it("reports the last failure code when every model fails", async () => {
    fetchMock.mockResolvedValue(errorResponse(500, "boom"));

    const result = await generateStructured({ system: "s", user: "u", schema });

    expect(result).toMatchObject({ ok: false, code: "UPSTREAM" });
  });
});

describe("generateStructured time budget", () => {
  it("stops starting new attempts once the budget is spent", async () => {
    let now = 0;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    fetchMock.mockImplementation(async () => {
      now += 20_000;
      return errorResponse(503, "high demand");
    });

    const result = await generateStructured({ system: "s", user: "u", schema });

    expect(result).toMatchObject({ ok: false });
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(3);
  });

  it("keeps the total budget under the platform function ceiling", () => {
    expect(AI_TIME_BUDGET_MS).toBeLessThan(60_000);
  });

  it("caps a late attempt at the remaining budget rather than the full timeout", async () => {
    let now = 0;
    const deadlines: number[] = [];
    vi.spyOn(Date, "now").mockImplementation(() => now);
    fetchMock.mockImplementation(async () => {
      deadlines.push(AI_TIME_BUDGET_MS - now);
      now += 20_000;
      return errorResponse(503, "high demand");
    });

    await generateStructured({ system: "s", user: "u", schema });

    expect(deadlines.at(-1)).toBeLessThan(20_000);
    expect(now).toBeLessThanOrEqual(AI_TIME_BUDGET_MS + 20_000);
  });
});
