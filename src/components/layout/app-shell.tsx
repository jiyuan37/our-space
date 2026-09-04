"use client";

import type { ReactNode } from "react";

import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { useI18n } from "@/components/i18n/i18n-provider";

type AppShellProps = Readonly<{
  children: ReactNode;
  header?: ReactNode;
  home?: boolean;
}>;

export function AppShell({ children, header, home = false }: AppShellProps) {
  const { t } = useI18n();
  return (
    <div className={`app-shell${home ? " app-shell-home" : ""}`}>
      <a className="skip-link" href="#main-content">
        {t("shell.skip")}
      </a>
      <header className="shell-header">
        <span className="shell-wordmark">{t("shell.brand")}</span>
        <div className="shell-tools">
          {header}
          <LocaleSwitcher />
        </div>
      </header>
      <main
        id="main-content"
        className={`shell-main${home ? " shell-main-home" : ""}`}
      >
        {children}
      </main>
    </div>
  );
}
