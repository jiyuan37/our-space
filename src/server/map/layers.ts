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
    maxBatchElements: 1800,
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
    maxBatchElements: 2500,
    maxPoints: 16000,
    selectors: ["way[building][building!=no]"],
  },
  {
    kind: "building",
    elementType: "relation",
    minZoom: 16,
    maxElements: 32,
    maxBatchElements: 96,
    maxPoints: 4000,
    selectors: ["relation[type=multipolygon][building][building!=no]"],
  },
  {
    kind: "park",
    elementType: "way",
    minZoom: 15,
    maxElements: 100,
    maxBatchElements: 300,
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
    maxBatchElements: 96,
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
    maxBatchElements: 300,
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
    maxBatchElements: 96,
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
  const parsed = cells.map((cell) => boundsSchema.parse(cell));
  const envelope = [
    Math.min(...parsed.map(([w]) => w)),
    Math.min(...parsed.map(([, s]) => s)),
    Math.max(...parsed.map(([, , e]) => e)),
    Math.max(...parsed.map(([, , , n]) => n)),
  ] as Bounds;
  const [w, s, e, n] = envelope;
  const outputBounds = `(${s},${w},${n},${e})`;
  for (const layer of MAP_LAYERS.filter((l) => zoom >= l.minZoom)) {
    // 多个固定cell先组成Overpass集合，OSM type/id由集合语义去重；避免跨cell长way/relation
    // 在同一次HTTP响应中被完整重复。输出仍裁到固定cell包络，不使用任意viewport。
    parts.push(
      `(${parsed
        .flatMap(([cw, cs, ce, cn]) =>
          layer.selectors.map(
            (selector) => `${selector}(${cs},${cw},${cn},${ce});`,
          ),
        )
        .join("")});`,
    );
    const batchLimit = Math.min(
      layer.maxBatchElements,
      layer.maxElements * parsed.length,
    );
    parts.push(
      `out ${layer.elementType === "relation" ? "body" : "tags"} geom${outputBounds} qt ${batchLimit + 1};out count;`,
    );
  }
  return parts.join("\n");
}
