import { parseOverpass } from "@/server/map/overpass";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { MapCanvas } from "./map-canvas";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import type { Geography } from "@/lib/map/model";
const geography: Geography = {
  bounds: [10, 50, 10.02, 50.02],
  features: [],
  attribution: "OpenStreetMap contributors",
  fetchedAt: "2026-09-06T00:00:00Z",
};
afterEach(cleanup);
describe("MapCanvas", () => {
  it("键盘移动缩放和回到浏览视野，不产生人物坐标", async () => {
    const { container } = render(<MapCanvas geography={geography} />);
    const svg = screen.getByRole("img");
    fireEvent.keyDown(svg, { key: "ArrowRight" });
    expect(container.querySelector("g[transform]")).toHaveAttribute(
      "transform",
      expect.stringContaining("440"),
    );
    await userEvent.click(screen.getByRole("button", { name: "放大地图" }));
    expect(container.querySelector("g[transform]")).toHaveAttribute(
      "transform",
      expect.stringContaining("scale(1.25)"),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "回到原始地图视野" }),
    );
    expect(container.querySelector("g[transform]")).toHaveAttribute(
      "transform",
      "translate(500 400) scale(1) translate(-500 -400)",
    );
    expect(container.querySelector("[data-latitude]")).toBeNull();
  });
  it("英文无障碍控制与 OSM 署名", () => {
    render(
      <I18nProvider locale="en-US">
        <MapCanvas geography={geography} />
      </I18nProvider>,
    );
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeVisible();
    expect(screen.getByRole("link", { name: /OpenStreetMap/ })).toHaveAttribute(
      "href",
      "https://www.openstreetmap.org/copyright",
    );
  });
  it("裁剪道路与未闭合水岸在renderer中保持分段，不画NaN或伪造闭合", () => {
    const clipped = parseOverpass(
      {
        elements: [
          {
            type: "way",
            id: 1,
            tags: { highway: "primary" },
            geometry: [
              null,
              { lon: 9, lat: 50.005 },
              { lon: 11, lat: 50.005 },
              null,
            ],
          },
          {
            type: "relation",
            id: 2,
            tags: { natural: "water" },
            members: [
              {
                type: "way",
                ref: 3,
                role: "outer",
                geometry: [
                  null,
                  { lon: 10.003, lat: 49 },
                  { lon: 10.003, lat: 51 },
                  null,
                ],
              },
            ],
          },
        ],
      },
      [10, 50, 10.01, 50.01],
    );
    const { container } = render(<MapCanvas geography={clipped} />);
    const outline = container.querySelector('path[stroke="#91bacd"]');
    expect(outline).toBeInTheDocument();
    expect(outline?.getAttribute("d")).not.toMatch(/Z|NaN|Infinity/);
    expect(container.querySelector('g[fill="none"]')).toBeInTheDocument();
  });
});
