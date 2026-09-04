import { cookies } from "next/headers";

import { LOCALE_COOKIE, resolveLocale, type Locale } from "@/lib/i18n/config";
import { formatDate, formatNumber } from "@/lib/i18n/format";
import { translate } from "@/lib/i18n/messages";

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value);
}

export async function getServerI18n() {
  const locale = await getServerLocale();
  return {
    locale,
    t: (
      key: Parameters<typeof translate>[1],
      values?: Parameters<typeof translate>[2],
    ) => translate(locale, key, values),
    formatDate: (value: Date | number, options?: Intl.DateTimeFormatOptions) =>
      formatDate(locale, value, options),
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) =>
      formatNumber(locale, value, options),
  };
}
