import { prisma } from "@/lib/db/client";
import { guardRoute } from "@/lib/api/guard";
import { apiSuccess, handleRouteError } from "@/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guard = await guardRoute({ route: "skills-get", limit: 90 });
  if (!guard.ok) return guard.response;

  try {
    const url = new URL(request.url);
    const scope = url.searchParams.get("scope");

    if (scope === "catalog") {
      const catalog = await prisma.skill.findMany({
        select: { id: true, slug: true, name: true, category: true },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      });
      return apiSuccess({ skills: catalog });
    }

    const skills = await prisma.candidateSkill.findMany({
      where: { userId: guard.user.id },
      include: { skill: true },
      orderBy: [{ level: "desc" }, { skillId: "asc" }],
    });

    return apiSuccess({
      skills: skills.map((entry) => ({
        id: entry.id,
        skillId: entry.skillId,
        name: entry.skill.name,
        category: entry.skill.category,
        level: entry.level,
        confidence: entry.confidence,
        evidence: entry.evidence,
        source: entry.source,
        verified: entry.verified,
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
