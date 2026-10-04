import { z } from "zod";
import { guardRoute } from "@/lib/api/guard";
import { apiSuccess, handleRouteError } from "@/lib/api/response";
import { searchJobs } from "@/lib/jobs/search";
import { MAX_AGE_OPTIONS } from "@/lib/jobs/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  q: z.string().trim().min(2, "Enter at least 2 characters to search.").max(100),
  location: z.string().trim().max(80).default(""),
  days: z.coerce
    .number()
    .int()
    .refine((value) => (MAX_AGE_OPTIONS as readonly number[]).includes(value), "Unsupported date range.")
    .default(7),
  remote: z.enum(["true", "false"]).default("false"),
  cursor: z.string().max(4000).optional(),
});

export async function GET(request: Request) {
  const guard = await guardRoute({ route: "jobs-search", limit: 20 });
  if (!guard.ok) return guard.response;

  try {
    const searchParams = new URL(request.url).searchParams;
    const params = querySchema.parse(Object.fromEntries(searchParams.entries()));

    const result = await searchJobs({
      query: params.q,
      location: params.location,
      maxAgeDays: params.days,
      remoteOnly: params.remote === "true",
    }, params.cursor);

    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
