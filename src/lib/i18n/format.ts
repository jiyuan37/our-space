import type { Locale } from "@/lib/i18n/config";

export function formatNumber(
  locale: Locale,
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatDate(
  locale: Locale,
  value: Date | number,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
  return new Intl.DateTimeFormat(locale, options).format(value);
}
