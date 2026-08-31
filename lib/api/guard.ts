import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { apiError } from "./response";
import { consumeRateLimit, pruneRateLimitBuckets } from "./rate-limit";

export type GuardResult =
  | { ok: true; user: SessionUser }
  | { ok: false; response: ReturnType<typeof apiError> };

export type GuardOptions = {
  route: string;
  limit?: number;
  windowMs?: number;
};

export async function guardRoute({
  route,
  limit = 30,
  windowMs = 60_000,
}: GuardOptions): Promise<GuardResult> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, response: apiError("UNAUTHORIZED", "Sign in to continue.") };
  }

  pruneRateLimitBuckets();
  const result = consumeRateLimit({ key: `${route}:${user.id}`, limit, windowMs });

  if (!result.allowed) {
    return {
      ok: false,
      response: apiError(
        "RATE_LIMITED",
        `Too many requests. Try again in ${result.retryAfterSeconds} seconds.`,
      ),
    };
  }

  return { ok: true, user };
}
