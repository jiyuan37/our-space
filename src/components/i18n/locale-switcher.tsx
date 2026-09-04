"use client";

import { setLocaleAction } from "@/app/locale-actions";
import { useI18n } from "@/components/i18n/i18n-provider";

export function LocaleSwitcher() {
  const { locale, t } = useI18n();
  return (
    <form
      action={setLocaleAction}
      className="locale-switcher"
      aria-label={t("language.label")}
    >
      <button
        className="locale-option"
        name="locale"
        value="zh-CN"
        aria-pressed={locale === "zh-CN"}
        title={t("language.zh-CN")}
      >
        中<span className="sr-only">{t("language.zh-CN")}</span>
      </button>
      <span aria-hidden="true">/</span>
      <button
        className="locale-option"
        name="locale"
        value="en-US"
        aria-pressed={locale === "en-US"}
        title={t("language.en-US")}
      >
        EN
        <span className="sr-only">{t("language.en-US")}</span>
      </button>
    </form>
  );
}
