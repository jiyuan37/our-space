import { describe, expect, it } from "vitest";

import {
  DEFAULT_LOCALE,
  resolveLocale,
  SUPPORTED_LOCALES,
} from "@/lib/i18n/config";
import { errorMessageKey } from "@/lib/i18n/errors";
import { formatDate, formatNumber } from "@/lib/i18n/format";
import { messages, translate } from "@/lib/i18n/messages";

describe("i18n foundation", () => {
  it("以 zh-CN 为稳定 fallback，并仅接受支持的 locale", () => {
    expect(DEFAULT_LOCALE).toBe("zh-CN");
    expect(resolveLocale("en-US")).toBe("en-US");
    expect(resolveLocale("fr-FR")).toBe("zh-CN");
    expect(resolveLocale(undefined)).toBe("zh-CN");
  });

  it("两个 locale 具有完全相同的 typed message keys", () => {
    expect(SUPPORTED_LOCALES).toEqual(["zh-CN", "en-US"]);
    expect(Object.keys(messages["en-US"]).sort()).toEqual(
      Object.keys(messages["zh-CN"]).sort(),
    );
  });

  it("插值且以稳定错误 code 选择本地化文案", () => {
    expect(translate("zh-CN", "presence.hint", { max: 120 })).toContain("120");
    expect(
      translate("en-US", errorMessageKey("RATE_LIMIT_EXCEEDED")),
    ).toContain("too many tries");
    expect(errorMessageKey("UNKNOWN")).toBe("errors.UNEXPECTED_ERROR");
    expect(translate("en-US", "shell.skip")).toBe("Skip to main content");
    expect(translate("en-US", "home.accountMenu")).toBe(
      "Open Space and account menu",
    );
  });

  it("提供 locale-aware 的日期与数字 formatter", () => {
    expect(formatNumber("en-US", 12_345)).toBe("12,345");
    expect(
      formatDate("zh-CN", new Date("2026-05-04T12:00:00.000Z"), {
        day: "numeric",
        month: "long",
        timeZone: "UTC",
        year: "numeric",
      }),
    ).toContain("2026");
  });
});
