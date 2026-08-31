import { prisma } from "@/lib/db/client";
import { guardRoute } from "@/lib/api/guard";
import { apiSuccess, handleRouteError } from "@/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await guardRoute({ route: "careers-get", limit: 90 });
  if (!guard.ok) return guard.response;

  try {
    const [roles, matches] = await Promise.all([
      prisma.careerRole.findMany({
        include: { roleSkills: { include: { skill: true } } },
        orderBy: { title: "asc" },
      }),
      prisma.careerMatch.findMany({ where: { userId: guard.user.id } }),
    ]);

    const scoreByRole = new Map(matches.map((match) => [match.careerRoleId, match.score]));

    return apiSuccess({
      careers: roles.map((role) => ({
        id: role.id,
        slug: role.slug,
        title: role.title,
        category: role.category,
        shortDescription: role.shortDescription,
        demandIndex: role.demandIndex,
        score: scoreByRole.get(role.id) ?? null,
        skillCount: role.roleSkills.length,
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
