import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import LoginForm from "./loginForm";
import createSupabaseServer from "@/utils/server";

import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Dashboard() {
  const supabase = await createSupabaseServer();

  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    redirect("/dashboard");
  }

  return (
    <main className="container mx-auto flex min-h-[calc(100vh-4rem)] flex-1 items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription className="text-balance">
            Enter your credentials to access your account.{" "}
            <Link
              href="/auth/register"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Don&apos;t have an account yet?
            </Link>
          </CardDescription>
        </CardHeader>
        <LoginForm />
      </Card>
    </main>
  );
}
