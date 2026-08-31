import type { NextAuthConfig } from "next-auth";

export const PROTECTED_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/resume",
  "/skills",
  "/careers",
  "/simulator",
  "/roadmap",
  "/assessments",
  "/interview",
  "/optimizer",
  "/progress",
];

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
    error: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isProtected = PROTECTED_PREFIXES.some((prefix) =>
        request.nextUrl.pathname.startsWith(prefix),
      );
      if (!isProtected) return true;
      return Boolean(auth?.user);
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.isDemo = Boolean((user as { isDemo?: boolean }).isDemo);
      }
      if (trigger === "update" && session && typeof session === "object") {
        const patch = session as { name?: string };
        if (patch.name) token.name = patch.name;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? token.sub ?? "";
        session.user.isDemo = Boolean(token.isDemo);
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
