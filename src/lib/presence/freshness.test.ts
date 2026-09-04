import { describe, expect, it } from "vitest";

import {
  isPresenceCurrentForViewer,
  millisecondsUntilNextLocalDay,
} from "@/lib/presence/freshness";

describe("Presence freshness", () => {
  it("只把查看者本地日历日内的 Presence 视为当前", () => {
    const now = new Date("2026-06-12T20:00:00.000Z");
    expect(
      isPresenceCurrentForViewer(
        "2026-06-12T05:00:00.000Z",
        now,
        "America/New_York",
      ),
    ).toBe(true);
    expect(
      isPresenceCurrentForViewer(
        "2026-06-12T03:59:59.000Z",
        now,
        "America/New_York",
      ),
    ).toBe(false);
  });

  it("同一 UTC 日会按不同查看者时区得出不同结果", () => {
    const updatedAt = "2026-01-01T14:30:00.000Z";
    const now = new Date("2026-01-01T15:30:00.000Z");
    expect(isPresenceCurrentForViewer(updatedAt, now, "America/New_York")).toBe(
      true,
    );
    expect(isPresenceCurrentForViewer(updatedAt, now, "Asia/Tokyo")).toBe(
      false,
    );
  });

  it("拒绝无效时间，并计算到下一本地日界线的正数延迟", () => {
    expect(isPresenceCurrentForViewer("not-a-date")).toBe(false);
    const localNow = new Date(2026, 3, 4, 23, 30, 0);
    expect(millisecondsUntilNextLocalDay(localNow)).toBe(30 * 60 * 1000);
  });
});
