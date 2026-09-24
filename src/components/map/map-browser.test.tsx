import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/components/i18n/i18n-provider";

const mockedBase = vi.hoisted(() => ({ state: "ready" }));
vi.mock("./base-map-canvas", () => ({
  BaseMapCanvas: ({
    onStateChange,
  }: {
    onStateChange: (state: string) => void;
  }) => {
    queueMicrotask(() => onStateChange(mockedBase.state));
    return (
      <div
        role="region"
        aria-label="像素地图：浏览真实地理，不表示人物位置"
        data-provider="openfreemap"
      />
    );
  },
}));

import { MapBrowser } from "./map-browser";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
  mockedBase.state = "ready";
});

describe("MapBrowser", () => {
  it("首屏直接显示OpenFreeMap底图且不请求Overpass", async () => {
    const transport = vi.fn();
    vi.stubGlobal("fetch", transport);
    render(<MapBrowser spaceId="test" />);
    expect(screen.getByRole("region", { name: /像素地图/ })).toHaveAttribute(
      "data-provider",
      "openfreemap",
    );
    await waitFor(() =>
      expect(screen.queryByText("正在铺开地图…")).not.toBeInTheDocument(),
    );
    expect(transport).not.toHaveBeenCalled();
  });

  it("底图失败时保留温暖fallback与Home内容", async () => {
    mockedBase.state = "error";
    render(<MapBrowser spaceId="base-failure" />);
    expect(
      await screen.findByText(
        "底图暂时没有铺开。人物与此刻仍然可用，可以稍后再试。",
      ),
    ).toBeVisible();
    expect(screen.getByRole("region", { name: /像素地图/ })).toBeVisible();
  });

  it("可选enrichment失败不移除底图或阻断Home", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ errorCode: "MAP_UNAVAILABLE" }, { status: 503 }),
        ),
    );
    render(<MapBrowser spaceId="unavailable" />);
    await userEvent.click(
      screen.getByRole("button", { name: "加载更多建筑细节" }),
    );
    expect(
      await screen.findByText("更多细节暂时不可用，底图不受影响。"),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /像素地图/ })).toBeVisible();
  });

  it("enrichment成功后标记为已叠加", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          bounds: [2.334, 48.852, 2.35, 48.862],
          features: [],
          attribution: "OpenStreetMap contributors",
          fetchedAt: new Date().toISOString(),
        }),
      ),
    );
    render(
      <I18nProvider locale="zh-CN">
        <MapBrowser spaceId="enriched" />
      </I18nProvider>,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "加载更多建筑细节" }),
    );
    expect(await screen.findByText("更多地图细节已叠加。")).toBeInTheDocument();
  });
});
