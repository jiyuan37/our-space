import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { authOptions } from "@/lib/auth/auth-options";
import { safeCallbackPath } from "@/lib/auth/callback-url";
import { getServerI18n } from "@/lib/i18n/server";

export default async function RegisterPage({
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
        <h1>{t("register.title")}</h1>
        <p>{t("register.copy")}</p>
        <RegisterForm callbackUrl={callbackUrl} />
        <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
          {t("register.haveAccount")}
        </Link>
      </section>
    </AppShell>
  );
}
