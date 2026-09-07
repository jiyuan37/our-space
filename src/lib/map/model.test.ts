import { describe, expect, it } from "vitest";
import { constrainCamera, featurePath, project } from "./model";
describe("生产地图纯逻辑", () => {
  it("保持经纬地理方向并修正纬度比例", () => {
    const bounds = [10, 50, 10.02, 50.02] as const;
    expect(project([10.01, 50.01], bounds)[0]).toBeCloseTo(500);
    expect(project([10.01, 50.01], bounds)[1]).toBeCloseTo(400);
    expect(project([10.02, 50.02], bounds)[0]).toBeGreaterThan(500);
    expect(project([10.02, 50.02], bounds)[1]).toBe(0);
  });
  it("面含内环、道路不闭合", () => {
    const feature = {
      id: "a",
      kind: "park",
      rings: [
        [
          [0, 0],
          [1, 0],
          [1, 1],
        ],
        [
          [0.1, 0.1],
          [0.2, 0.1],
          [0.2, 0.2],
        ],
      ],
    } as const;
    expect(featurePath(feature, [0, 0, 1, 1]).match(/Z/g)).toHaveLength(2);
    expect(
      featurePath({ ...feature, kind: "road" }, [0, 0, 1, 1]),
    ).not.toContain("Z");
  });
  it("缩放与拖动受限，不能无限滚入空白", () => {
    expect(constrainCamera({ x: 9999, y: -9999, zoom: 9 })).toEqual({
      x: 1200,
      y: -960,
      zoom: 3,
    });
    expect(constrainCamera({ x: 0, y: 0, zoom: -1 }).zoom).toBe(1);
  });
});
