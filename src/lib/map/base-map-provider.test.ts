import { describe, expect, it } from "vitest";
import { OpenFreeMapProvider, boundsCenter } from "./base-map-provider";

describe("OpenFreeMapProvider", () => {
  it("提供真实vector tile source、Our Space style和完整attribution", () => {
    const definition = new OpenFreeMapProvider().definition();
    expect(definition.id).toBe("openfreemap");
    expect(definition.style.sources.openfreemap).toMatchObject({
      type: "vector",
      url: "https://tiles.openfreemap.org/planet",
    });
    expect(definition.style.layers.map((layer) => layer.id)).toEqual(
      expect.arrayContaining([
        "home-water",
        "home-green",
        "home-buildings",
        "home-roads",
      ]),
    );
    expect(definition.attribution.map((item) => item.label)).toEqual([
      "OpenFreeMap",
      "OpenStreetMap contributors",
    ]);
  });

  it("从白名单区域计算相机中心", () => {
    expect(boundsCenter([2, 4, 6, 10])).toEqual([4, 7]);
  });
});
