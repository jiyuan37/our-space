import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { LoginForm } from "@/components/auth/login-form";
import { authOptions } from "@/lib/auth/auth-options";
import { safeCallbackPath } from "@/lib/auth/callback-url";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  if (await getServerSession(authOptions)) redirect("/space");
  const callbackUrl = safeCallbackPath((await searchParams).callbackUrl);
  return (
    <AppShell>
      <section className="foundation-card">
        <h1>欢迎回来</h1>
        <LoginForm callbackUrl={callbackUrl} />
        <Link href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
          创建账户
        </Link>
      </section>
    </AppShell>
  );
}
