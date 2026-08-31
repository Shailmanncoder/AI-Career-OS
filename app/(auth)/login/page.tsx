import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sparkles } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { getSessionUser } from "@/lib/auth/session";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/data/demo";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>Sign in to continue building your career roadmap.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Alert variant="info">
          <Sparkles />
          <AlertTitle>Demo account</AlertTitle>
          <AlertDescription>
            <span className="block">
              Email <span className="font-mono text-xs">{DEMO_EMAIL}</span>
            </span>
            <span className="block">
              Password <span className="font-mono text-xs">{DEMO_PASSWORD}</span>
            </span>
            <span className="mt-1 block">
              A fictional candidate with a full history, seeded for demonstration.
            </span>
          </AlertDescription>
        </Alert>

        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <LoginForm demoEmail={DEMO_EMAIL} demoPassword={DEMO_PASSWORD} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
