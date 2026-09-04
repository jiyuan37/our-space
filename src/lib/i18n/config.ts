export const SUPPORTED_LOCALES = ["zh-CN", "en-US"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "zh-CN";
export const LOCALE_COOKIE = "our-space-locale";

export function isLocale(value: unknown): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

export function resolveLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
