import { describe, expect, it } from "vitest";

import { normalizePresenceText } from "@/lib/validation/presence";
import { PresenceTextInvalidError } from "@/server/errors/domain-error";

describe("normalizePresenceText", () => {
  it("去除边缘空白，并把纯空白解释为主动清除", () => {
    expect(normalizePresenceText("  今天很好  ")).toBe("今天很好");
    expect(normalizePresenceText(" \n\t ")).toBeNull();
  });

  it("按 Unicode code point 接受 120 字符并拒绝第 121 个", () => {
    expect(normalizePresenceText("🌿".repeat(120))).toHaveLength(240);
    expect(() => normalizePresenceText("🌿".repeat(121))).toThrow(
      PresenceTextInvalidError,
    );
  });

  it("拒绝非字符串 transport 值", () => {
    expect(() => normalizePresenceText(null)).toThrow(PresenceTextInvalidError);
  });
});
