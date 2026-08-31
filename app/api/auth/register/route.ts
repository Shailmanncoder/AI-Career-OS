import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { hashPassword } from "@/lib/auth/password";
import { signUpSchema } from "@/lib/validation/forms";
import { apiError, apiSuccess, handleRouteError, validationError } from "@/lib/api/response";
import { consumeRateLimit } from "@/lib/api/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const forwarded = request.headers.get("x-forwarded-for") ?? "local";
    const limit = consumeRateLimit({ key: `register:${forwarded}`, limit: 8, windowMs: 60_000 });
    if (!limit.allowed) {
      return apiError("RATE_LIMITED", "Too many sign-up attempts. Please wait a moment.");
    }

    const body = await request.json();
    const parsed = signUpSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return apiError("CONFLICT", "An account with that email already exists.");
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const user = await prisma.user.create({
      data: {
        email,
        name: parsed.data.name,
        passwordHash,
        profile: { create: {} },
      },
      select: { id: true, email: true, name: true },
    });

    return apiSuccess({ user }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function GET() {
  return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: "Not found" } }, { status: 404 });
}
