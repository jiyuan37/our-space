import { describe, expect, it } from "vitest";

import {
  DEFAULT_AUTH_CALLBACK,
  safeCallbackPath,
} from "@/lib/auth/callback-url";

describe("safeCallbackPath", () => {
  it("保留站内 Invitation callback", () => {
    expect(safeCallbackPath("/invite/safe_token-123?from=login")).toBe(
      "/invite/safe_token-123?from=login",
    );
  });

  it.each([
    "https://evil.example/invite/token",
    "//evil.example/invite/token",
    "/\\evil.example/invite/token",
    "javascript:alert(1)",
    "invite/token",
    "",
  ])("拒绝外部或非相对 callback：%s", (value) => {
    expect(safeCallbackPath(value)).toBe(DEFAULT_AUTH_CALLBACK);
  });
});
