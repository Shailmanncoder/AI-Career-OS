import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "RATE_LIMITED"
  | "CONFLICT"
  | "UPSTREAM"
  | "INTERNAL";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION: 422,
  RATE_LIMITED: 429,
  CONFLICT: 409,
  UPSTREAM: 502,
  INTERNAL: 500,
};

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function apiError(code: ApiErrorCode, message: string, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status: STATUS_BY_CODE[code] },
  );
}

export function validationError(error: ZodError) {
  const details = error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
  return apiError("VALIDATION", details[0]?.message ?? "The submitted data is invalid.", details);
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) return validationError(error);

  const message = error instanceof Error ? error.message : "UNKNOWN";

  if (message === "RESUME_NOT_FOUND") return apiError("NOT_FOUND", "That resume could not be found.");
  if (message === "CAREER_ROLE_NOT_FOUND") return apiError("NOT_FOUND", "That career role could not be found.");
  if (message === "NO_ACTIVE_RESUME") {
    return apiError("CONFLICT", "Upload and analyze a resume before running this action.");
  }

  console.error("[api]", error);
  return apiError("INTERNAL", "Something went wrong. Please try again.");
}
