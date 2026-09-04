"use client";

import Link from "next/link";

import { LogoutButton } from "@/components/space/space-actions";
import { useI18n } from "@/components/i18n/i18n-provider";

function initials(name: string): string {
  return Array.from(name.trim()).slice(0, 2).join("").toUpperCase() || "OS";
}

export function HomeHeader({ viewerName }: Readonly<{ viewerName: string }>) {
  const { t } = useI18n();
  return (
    <details className="account-menu">
      <summary role="button" aria-label={t("home.accountMenu")}>
        <span aria-hidden="true">{initials(viewerName)}</span>
      </summary>
      <div className="account-menu-panel">
        <Link href="/space">{t("home.manage")}</Link>
        <LogoutButton />
      </div>
    </details>
  );
}
