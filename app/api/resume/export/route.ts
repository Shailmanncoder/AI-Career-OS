import { z } from "zod";
import { guardRoute } from "@/lib/api/guard";
import { handleRouteError, validationError } from "@/lib/api/response";
import { resumeRewriteSchema } from "@/lib/validation/ai";
import { buildDocx, buildPdf, exportFileName } from "@/lib/services/resume-export";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  format: z.enum(["docx", "pdf"]),
  rewrite: resumeRewriteSchema,
});

const CONTENT_TYPE = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
} as const;

export async function POST(request: Request) {
  const guard = await guardRoute({ route: "resume-export", limit: 20, windowMs: 60_000 });
  if (!guard.ok) return guard.response;

  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const { format, rewrite } = parsed.data;
    const file = format === "docx" ? await buildDocx(rewrite) : await buildPdf(rewrite);
    const fileName = exportFileName(rewrite.fullName, format);

    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": CONTENT_TYPE[format],
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(file.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
