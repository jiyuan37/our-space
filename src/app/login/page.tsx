import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { LoginForm } from "@/components/auth/login-form";
import { authOptions } from "@/lib/auth/auth-options";
import { safeCallbackPath } from "@/lib/auth/callback-url";
import { getServerI18n } from "@/lib/i18n/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  if (await getServerSession(authOptions)) redirect("/home");
  const callbackUrl = safeCallbackPath((await searchParams).callbackUrl);
  const { t } = await getServerI18n();
  return (
    <AppShell>
      <section className="foundation-card">
        <h1>{t("login.title")}</h1>
        <LoginForm callbackUrl={callbackUrl} />
        <Link href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
          {t("login.createAccount")}
        </Link>
      </section>
    </AppShell>
  );
}
