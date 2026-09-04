import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { authOptions } from "@/lib/auth/auth-options";
import { getServerI18n } from "@/lib/i18n/server";

export default async function WelcomePage() {
  if (await getServerSession(authOptions)) redirect("/home");
  const { t } = await getServerI18n();
  return (
    <AppShell>
      <section className="foundation-card">
        <p className="eyebrow">{t("welcome.eyebrow")}</p>
        <h1>{t("welcome.title")}</h1>
        <p className="foundation-copy">{t("welcome.copy")}</p>
        <div className="link-row">
          <Link href="/register">{t("welcome.register")}</Link>
          <Link href="/login">{t("welcome.login")}</Link>
        </div>
      </section>
    </AppShell>
  );
}
