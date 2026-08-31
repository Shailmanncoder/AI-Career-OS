import { z } from "zod";

export const boundedScore = z.preprocess((value) => {
  const numeric = typeof value === "string" ? Number(value) : value;
  if (typeof numeric !== "number" || !Number.isFinite(numeric)) return 0;
  return Math.min(100, Math.max(0, Math.round(numeric)));
}, z.number().int().min(0).max(100));

export const confidenceValue = z.preprocess((value) => {
  const numeric = typeof value === "string" ? Number(value) : value;
  if (typeof numeric !== "number" || !Number.isFinite(numeric)) return 0.5;
  const normalized = numeric > 1 ? numeric / 100 : numeric;
  return Math.min(1, Math.max(0, Number(normalized.toFixed(2))));
}, z.number().min(0).max(1));

export const nonNegativeNumber = z.preprocess((value) => {
  const numeric = typeof value === "string" ? Number(value) : value;
  if (typeof numeric !== "number" || !Number.isFinite(numeric) || numeric < 0) return 0;
  return Number(numeric.toFixed(1));
}, z.number().min(0));

export const trimmedString = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : value),
  z.string(),
);

export const stringList = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : String(item ?? "").trim()))
      .filter((item) => item.length > 0)
      .slice(0, 25);
  }
  if (typeof value === "string" && value.trim().length > 0) return [value.trim()];
  return [];
}, z.array(z.string()));

export function optionalText(max = 2000) {
  return z.preprocess((value) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed.slice(0, max) : undefined;
  }, z.string().max(max).optional());
}

export function requiredText(max = 4000, fallback = "") {
  return z.preprocess((value) => {
    if (typeof value !== "string") return fallback;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed.slice(0, max) : fallback;
  }, z.string().max(max));
}
