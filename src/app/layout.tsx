import type { Metadata } from "next";
import type { ReactNode } from "react";

import { I18nProvider } from "@/components/i18n/i18n-provider";
import { getServerI18n, getServerLocale } from "@/lib/i18n/server";
import "@/styles/globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: "Our Space", description: t("meta.description") };
}

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default async function RootLayout({ children }: RootLayoutProps) {
  const locale = await getServerLocale();
  return (
    <html lang={locale}>
      <body>
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
