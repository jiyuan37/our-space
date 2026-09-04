"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { isLocale, LOCALE_COOKIE } from "@/lib/i18n/config";

export async function setLocaleAction(data: FormData): Promise<void> {
  const locale = data.get("locale");
  if (!isLocale(locale)) return;

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    httpOnly: true,
    maxAge: 365 * 24 * 60 * 60,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  revalidatePath("/", "layout");
}
