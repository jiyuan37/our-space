"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import {
  formatDate as formatLocaleDate,
  formatNumber as formatLocaleNumber,
} from "@/lib/i18n/format";
import { translate, type MessageKey } from "@/lib/i18n/messages";

type Translator = (
  key: MessageKey,
  values?: Readonly<Record<string, string | number>>,
) => string;

type I18nContextValue = Readonly<{
  locale: Locale;
  t: Translator;
  formatDate: (
    value: Date | number,
    options?: Intl.DateTimeFormatOptions,
  ) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
}>;

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  t: (key, values) => translate(DEFAULT_LOCALE, key, values),
  formatDate: (value, options) =>
    formatLocaleDate(DEFAULT_LOCALE, value, options),
  formatNumber: (value, options) =>
    formatLocaleNumber(DEFAULT_LOCALE, value, options),
});

export function I18nProvider({
  locale,
  children,
}: Readonly<{ locale: Locale; children: ReactNode }>) {
  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      t: (key, values) => translate(locale, key, values),
      formatDate: (value, options) => formatLocaleDate(locale, value, options),
      formatNumber: (value, options) =>
        formatLocaleNumber(locale, value, options),
    }),
    [locale],
  );
  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
