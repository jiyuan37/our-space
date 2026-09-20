import { MAP_AREAS } from "@/lib/map/areas";
import { describe, it, expect } from "vitest";
import { cellsForBounds, mergeCellGeography } from "@/lib/map/cells";
import { overpassCellsQuery, MAP_LAYERS } from "./layers";
import { parseCellResponse, parseOverpass } from "./overpass";
import { clipLines } from "./cropped-geometry";
import type { Bounds } from "@/lib/map/model";
const bounds: Bounds = [10, 50, 10.01, 50.01];
const queryBounds: Bounds = [10, 50, 10.005, 50.005];
const geometry = [
  { lon: 10.002, lat: 50.002 },
  { lon: 10.008, lat: 50.002 },
  { lon: 10.008, lat: 50.008 },
  { lon: 10.002, lat: 50.002 },
];
const way = (
  geometry: unknown,
  tags: Record<string, string> = { building: "yes" },
) => ({ type: "way", id: 1, tags, geometry });
describe("有界cell几何与查询", () => {
  it("格网稳定、面积和viewport cell数有限，负经度及边界不重复", () => {
    expect(cellsForBounds([10.001, 50.001, 10.004, 50.004])).toEqual(
      cellsForBounds([10.002, 50.002, 10.003, 50.003]),
    );
    expect(cellsForBounds(queryBounds)).toHaveLength(1);
    for (const area of MAP_AREAS)
      expect(cellsForBounds(area.bounds).length).toBeLessThanOrEqual(36);
    expect(cellsForBounds([-0.005, 50, 0, 50.005])[0].bounds).toEqual([
      -0.005, 50, 0, 50.005,
    ]);
    expect(() => cellsForBounds([0, 0, 10, 10])).toThrow("MAP_INVALID_AREA");
  });
  it("每层选择和输出使用相同bbox、qt/预算/count，无无限输出或recurse", () => {
    const query = overpassCellsQuery([queryBounds]);
    expect(
      query.match(/out tags geom\(50,10,50.005,10.005\) qt/g),
    ).toHaveLength(4);
    expect(query).not.toMatch(/out geom;|[<>];|out meta|boundary|is_in/);
    expect(query.match(/out count;/g)).toHaveLength(7);
    for (const layer of MAP_LAYERS)
      expect(query).toContain(`qt ${layer.maxElements + 1};out count;`);
    expect(query).toContain(
      "relation[type=multipolygon][natural=water](50,10,50.005,10.005)",
    );
    expect(
      query.match(/out body geom\(50,10,50.005,10.005\) qt/g),
    ).toHaveLength(3);
    expect(query).not.toMatch(/footway|steps|cycleway/);
    expect(query).toMatchSnapshot();
  });
  it("bbox内闭合way可填色，真实坐标不改变", () => {
    const data = parseOverpass({ elements: [way(geometry)] }, bounds);
    expect(data.features[0].rings[0]).toEqual(
      geometry.map((c) => [c.lon, c.lat]),
    );
  });
  it("超长way裁剪后保留跨边界道路，不跨null连线", () => {
    const data = parseOverpass(
      {
        elements: [
          way(
            [
              null,
              { lon: 9, lat: 50.005 },
              { lon: 11, lat: 50.005 },
              null,
              { lon: 10.001, lat: 50.008 },
              { lon: 10.005, lat: 50.008 },
              null,
            ],
            { highway: "primary" },
          ),
        ],
      },
      bounds,
    );
    expect(data.features[0].rings).toHaveLength(2);
    expect(data.features[0].rings[0][0][0]).toBeCloseTo(10);
    expect(data.features[0].rings[0][1][0]).toBeCloseTo(10.01);
  });
  it("巨大multipolygon只含局部边界：绘已知边界，绝不用直线补假水面", () => {
    const data = parseOverpass(
      {
        elements: [
          {
            type: "relation",
            id: 8,
            tags: { type: "multipolygon", natural: "water" },
            members: [
              {
                type: "way",
                ref: 1,
                role: "outer",
                geometry: [
                  null,
                  { lon: 9, lat: 50.005 },
                  { lon: 10.005, lat: 50.005 },
                  { lon: 11, lat: 50.005 },
                  null,
                ],
              },
              { type: "way", ref: 2, role: "outer" },
            ],
          },
        ],
      },
      bounds,
    );
    expect(data.features[0].rings).toEqual([]);
    expect(data.features[0].outlines).toHaveLength(1);
    expect(
      data.features[0].outlines![0].every((p) => p[0] >= 10 && p[0] <= 10.01),
    ).toBe(true);
  });
  it("完整跨边界polygon正确裁剪到格边，保留内环", () => {
    const square = [
      { lon: 9, lat: 49 },
      { lon: 11, lat: 49 },
      { lon: 11, lat: 51 },
      { lon: 9, lat: 51 },
      { lon: 9, lat: 49 },
    ];
    const data = parseOverpass(
      {
        elements: [
          {
            type: "relation",
            id: 9,
            tags: { natural: "water" },
            members: [
              { type: "way", ref: 1, role: "outer", geometry: square },
              { type: "way", ref: 2, role: "inner", geometry },
            ],
          },
        ],
      },
      bounds,
    );
    expect(data.features[0].rings).toHaveLength(2);
    expect(
      data.features[0].rings[0].every(
        (p) => p[0] >= 10 && p[0] <= 10.01 && p[1] >= 50 && p[1] <= 50.01,
      ),
    ).toBe(true);
  });
  it("邻格相同OSM feature合并去重，保留两格不同片段", () => {
    const a = parseOverpass(
      {
        elements: [
          way(
            [
              { lon: 10, lat: 50.005 },
              { lon: 10.02, lat: 50.005 },
            ],
            { highway: "primary" },
          ),
        ],
      },
      bounds,
    );
    const b = parseOverpass(
      {
        elements: [
          way(
            [
              { lon: 10, lat: 50.005 },
              { lon: 10.02, lat: 50.005 },
            ],
            { highway: "primary" },
          ),
        ],
      },
      [10.01, 50, 10.02, 50.01],
    );
    const merged = mergeCellGeography([10, 50, 10.02, 50.01], [a, b, a]);
    expect(merged.features).toHaveLength(1);
    expect(merged.features[0].rings).toHaveLength(2);
  });
  it("元素/点预算与out count截断标记安全拒绝", () => {
    expect(() =>
      parseOverpass(
        {
          elements: Array.from({ length: 451 }, (_, i) => ({
            ...way(geometry),
            id: i + 1,
          })),
        },
        bounds,
      ),
    ).toThrow("MAP_PROVIDER_TOO_LARGE");
    expect(() =>
      parseOverpass(
        {
          elements: [
            way(Array.from({ length: 17000 }, () => ({ lon: 10, lat: 50 }))),
          ],
        },
        bounds,
      ),
    ).toThrow("MAP_PROVIDER_TOO_LARGE");
    expect(() =>
      parseCellResponse(
        { elements: [{ type: "count", tags: { total: "351" } }] },
        [bounds],
      ),
    ).toThrow("MAP_PROVIDER_TOO_LARGE");
    expect(() => parseCellResponse({ elements: [] }, [bounds])).toThrow(
      "MAP_PROVIDER_INCOMPLETE",
    );
  });
  it("完全在bbox外的线段不画，空cell也是可缓存的有效结果", () => {
    expect(
      clipLines(
        [
          [
            [8, 48],
            [9, 49],
          ],
        ],
        bounds,
      ),
    ).toEqual([]);
    expect(
      parseCellResponse(
        {
          elements: Array.from({ length: 7 }, () => ({
            type: "count",
            tags: { total: "0" },
          })),
        },
        [bounds],
      )[0].features,
    ).toEqual([]);
  });
  it("真实失败schema回归：层总量1371被拒绝，缺成员的relation不能悄悄当作完整数据", () => {
    expect(() =>
      parseCellResponse(
        { elements: [{ type: "count", id: 0, tags: { total: "1371" } }] },
        [queryBounds],
      ),
    ).toThrow("MAP_PROVIDER_TOO_LARGE");
    expect(() =>
      parseOverpass(
        {
          elements: [
            {
              type: "relation",
              id: 123,
              tags: { type: "multipolygon", natural: "water" },
              bounds: { minlat: 0, minlon: 0, maxlat: 1, maxlon: 1 },
            },
          ],
        },
        bounds,
      ),
    ).toThrow("MAP_PROVIDER_INCOMPLETE");
  });
});
