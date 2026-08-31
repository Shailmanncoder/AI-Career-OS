import { prisma } from "@/lib/db/client";
import { guardRoute } from "@/lib/api/guard";
import { apiError, apiSuccess, handleRouteError } from "@/lib/api/response";
import {
  EXTRACTION_MESSAGES,
  extractResumeText,
  validateResumeFile,
} from "@/lib/services/resume-extract";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const guard = await guardRoute({ route: "resume-upload", limit: 10, windowMs: 60_000 });
  if (!guard.ok) return guard.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return apiError("VALIDATION", "No file was received. Attach a PDF or DOCX resume.");
    }

    const validation = validateResumeFile(file.name, file.type, file.size);
    if (!validation.ok) {
      return apiError("VALIDATION", EXTRACTION_MESSAGES[validation.code]);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extraction = await extractResumeText(buffer, file.name, file.type);

    if (!extraction.ok) {
      return apiError("VALIDATION", extraction.message);
    }

    await prisma.resume.updateMany({
      where: { userId: guard.user.id, isActive: true },
      data: { isActive: false },
    });

    const resume = await prisma.resume.create({
      data: {
        userId: guard.user.id,
        fileName: file.name.slice(0, 200),
        mimeType: file.type || "application/pdf",
        fileSize: file.size,
        extractedText: extraction.text,
        charCount: extraction.charCount,
        status: "PARSING",
        isActive: true,
      },
      select: { id: true, fileName: true, charCount: true, createdAt: true },
    });

    return apiSuccess({ resume }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
