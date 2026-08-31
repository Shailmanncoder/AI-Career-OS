import { redirect } from "next/navigation";
import { auth } from "./index";

export type SessionUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  isDemo: boolean;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return null;
  return {
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email,
    image: session.user.image ?? null,
    isDemo: Boolean(session.user.isDemo),
  };
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
