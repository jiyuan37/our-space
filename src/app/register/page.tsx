import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { authOptions } from "@/lib/auth/auth-options";
import { safeCallbackPath } from "@/lib/auth/callback-url";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  if (await getServerSession(authOptions)) redirect("/space");
  const callbackUrl = safeCallbackPath((await searchParams).callbackUrl);
  return (
    <AppShell>
      <section className="foundation-card">
        <h1>创建账户</h1>
        <p>慢慢来，准备好后我们就回家。</p>
        <RegisterForm callbackUrl={callbackUrl} />
        <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
          已经有账户
        </Link>
      </section>
    </AppShell>
  );
}
