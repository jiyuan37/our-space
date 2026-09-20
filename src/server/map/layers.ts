import { z } from "zod";
import type { Bounds } from "@/lib/map/model";
import { HOME_MAP_ZOOM, MAX_VIEW_CELLS } from "@/lib/map/cells";
export const boundsSchema = z
  .tuple([
    z.number().min(-180).max(180),
    z.number().min(-80).max(80),
    z.number().min(-180).max(180),
    z.number().min(-80).max(80),
  ])
  .refine(
    ([w, s, e, n]) =>
      e > w && n > s && e - w <= 0.005000001 && n - s <= 0.005000001,
    "MAP_INVALID_AREA",
  );
// 只查询当前renderer实际使用的层；名称从这些feature的name轻量保留，不查询行政/人口等无UI字段。
export const MAP_LAYERS = [
  {
    kind: "road",
    elementType: "way",
    minZoom: 15,
    maxElements: 350,
    maxPoints: 10000,
    selectors: [
      'way[highway~"^(primary|secondary|tertiary|residential|unclassified|living_street|service|pedestrian|primary_link|secondary_link|tertiary_link)$"][area!=yes][indoor!=yes]',
    ],
  },
  {
    kind: "building",
    elementType: "way",
    minZoom: 16,
    maxElements: 450,
    maxPoints: 16000,
    selectors: ["way[building][building!=no]"],
  },
  {
    kind: "building",
    elementType: "relation",
    minZoom: 16,
    maxElements: 32,
    maxPoints: 4000,
    selectors: ["relation[type=multipolygon][building][building!=no]"],
  },
  {
    kind: "park",
    elementType: "way",
    minZoom: 15,
    maxElements: 100,
    maxPoints: 8000,
    selectors: [
      'way[leisure~"^(park|garden|recreation_ground)$"]',
      'way[landuse~"^(grass|forest|meadow)$"]',
    ],
  },
  {
    kind: "park",
    elementType: "relation",
    minZoom: 15,
    maxElements: 32,
    maxPoints: 4000,
    selectors: [
      'relation[type=multipolygon][leisure~"^(park|garden|recreation_ground)$"]',
      'relation[type=multipolygon][landuse~"^(grass|forest|meadow)$"]',
    ],
  },
  {
    kind: "water",
    elementType: "way",
    minZoom: 15,
    maxElements: 100,
    maxPoints: 10000,
    selectors: [
      'way[natural~"^(water|coastline)$"]',
      'way[waterway~"^(river|stream|canal|riverbank)$"]',
    ],
  },
  {
    kind: "water",
    elementType: "relation",
    minZoom: 15,
    maxElements: 32,
    maxPoints: 8000,
    selectors: ["relation[type=multipolygon][natural=water]"],
  },
] as const;
export function overpassQuery(bounds: Bounds): string {
  return overpassCellsQuery([bounds]);
}
export function overpassCellsQuery(
  cells: readonly Bounds[],
  zoom = HOME_MAP_ZOOM,
): string {
  if (!cells.length || cells.length > MAX_VIEW_CELLS || zoom !== HOME_MAP_ZOOM)
    throw new Error("MAP_INVALID_AREA");
  const parts = ["[out:json][timeout:20][maxsize:33554432];"];
  for (const cell of cells) {
    const [w, s, e, n] = boundsSchema.parse(cell),
      bbox = `(${s},${w},${n},${e})`;
    for (const layer of MAP_LAYERS.filter((l) => zoom >= l.minZoom)) {
      parts.push(
        `(${layer.selectors.map((selector) => `${selector}${bbox};`).join("")});`,
      );
      // sentinel=count校验上游是否被元素上限截断，不接受静默缺层。geometry与selection共用同一cell。
      parts.push(
        `out ${layer.elementType === "relation" ? "body" : "tags"} geom${bbox} qt ${layer.maxElements + 1};out count;`,
      );
    }
  }
  return parts.join("\n");
}
