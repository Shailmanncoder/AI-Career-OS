import { createHash } from "node:crypto";

export function normalizeForHash(text: string) {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim().replace(/\s+/g, " "))
    .filter((line) => line.length > 0)
    .join("\n")
    .toLowerCase();
}

export function hashResumeContent(text: string) {
  return createHash("sha256").update(normalizeForHash(text)).digest("hex");
}
