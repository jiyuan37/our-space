import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapBrowser } from "./map-browser";
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});
describe("MapBrowser", () => {
  it("不默认发请求，主动选择后显示地图", async () => {
    const transport = vi.fn().mockResolvedValue(
      Response.json({
        bounds: [2.326, 48.848, 2.354, 48.866],
        features: [],
        attribution: "OpenStreetMap contributors",
        fetchedAt: new Date().toISOString(),
      }),
    );
    vi.stubGlobal("fetch", transport);
    render(<MapBrowser spaceId="test" />);
    expect(transport).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole("button", { name: "巴黎 · 塞纳河畔" }),
    );
    await waitFor(() => expect(screen.getByRole("img")).toBeVisible());
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it("外部接入未启用时明确说明且不提供无效重试", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ errorCode: "MAP_NOT_CONFIGURED" }, { status: 503 }),
        ),
    );
    render(<MapBrowser spaceId="unconfigured" />);
    await userEvent.click(
      screen.getByRole("button", { name: "巴黎 · 塞纳河畔" }),
    );
    expect(
      await screen.findByText("地图数据接入尚未启用。你仍可使用头像与此刻。"),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "重新加载地图" }),
    ).not.toBeInTheDocument();
  });
});
