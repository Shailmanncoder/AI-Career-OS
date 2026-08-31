import {
  ACCEPTED_RESUME_EXTENSIONS,
  ACCEPTED_RESUME_TYPES,
  MAX_RESUME_BYTES,
} from "@/lib/validation/forms";

export type ExtractionFailureCode =
  | "UNSUPPORTED_TYPE"
  | "FILE_TOO_LARGE"
  | "EMPTY_FILE"
  | "NO_TEXT"
  | "PARSE_FAILED";

export type ExtractionResult =
  | { ok: true; text: string; charCount: number }
  | { ok: false; code: ExtractionFailureCode; message: string };

export const EXTRACTION_MESSAGES: Record<ExtractionFailureCode, string> = {
  UNSUPPORTED_TYPE: "Only PDF and DOCX resumes are supported.",
  FILE_TOO_LARGE: "Resume files must be 5 MB or smaller.",
  EMPTY_FILE: "The uploaded file is empty.",
  NO_TEXT: "No readable text was found. Scanned or image-only resumes cannot be parsed.",
  PARSE_FAILED: "We could not read this file. Try re-exporting it as a PDF or DOCX.",
};

const MIN_USEFUL_CHARS = 120;
const MAX_STORED_CHARS = 24000;

export function detectResumeKind(fileName: string, mimeType: string) {
  const lowerName = fileName.toLowerCase();
  if (mimeType === "application/pdf" || lowerName.endsWith(".pdf")) return "pdf" as const;
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lowerName.endsWith(".docx")
  ) {
    return "docx" as const;
  }
  return null;
}

export function validateResumeFile(fileName: string, mimeType: string, size: number) {
  const hasAcceptedExtension = ACCEPTED_RESUME_EXTENSIONS.some((extension) =>
    fileName.toLowerCase().endsWith(extension),
  );
  const hasAcceptedType = (ACCEPTED_RESUME_TYPES as readonly string[]).includes(mimeType);

  if (!hasAcceptedExtension && !hasAcceptedType) {
    return { ok: false as const, code: "UNSUPPORTED_TYPE" as const };
  }
  if (size <= 0) return { ok: false as const, code: "EMPTY_FILE" as const };
  if (size > MAX_RESUME_BYTES) return { ok: false as const, code: "FILE_TOO_LARGE" as const };
  return { ok: true as const };
}

export function cleanResumeText(raw: string) {
  const lines = raw
    .replace(/\r\n?/g, "\n")
    .replace(/[   ]/g, " ")
    .replace(/[­​-‍﻿]/g, "")
    .replace(/[•▪◦‣·]/g, "- ")
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((line) => line.trim());

  const compacted: string[] = [];
  for (const line of lines) {
    if (line.length === 0 && compacted[compacted.length - 1] === "") continue;
    compacted.push(line);
  }

  return compacted.join("\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, MAX_STORED_CHARS);
}

async function extractPdfText(buffer: Buffer) {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const document = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(document, { mergePages: true });
  return Array.isArray(text) ? text.join("\n") : text;
}

async function extractDocxText(buffer: Buffer) {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function extractResumeText(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<ExtractionResult> {
  const kind = detectResumeKind(fileName, mimeType);
  if (!kind) {
    return { ok: false, code: "UNSUPPORTED_TYPE", message: EXTRACTION_MESSAGES.UNSUPPORTED_TYPE };
  }

  let raw = "";
  try {
    raw = kind === "pdf" ? await extractPdfText(buffer) : await extractDocxText(buffer);
  } catch {
    return { ok: false, code: "PARSE_FAILED", message: EXTRACTION_MESSAGES.PARSE_FAILED };
  }

  const cleaned = cleanResumeText(raw ?? "");
  if (cleaned.length < MIN_USEFUL_CHARS) {
    return { ok: false, code: "NO_TEXT", message: EXTRACTION_MESSAGES.NO_TEXT };
  }

  return { ok: true, text: cleaned, charCount: cleaned.length };
}
