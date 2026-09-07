import { z } from "zod";
import type {
  Bounds,
  Geography,
  GeographyProvider,
  MapFeature,
  Point,
} from "@/lib/map/model";

export const boundsSchema = z
  .tuple([
    z.number().min(-180).max(180),
    z.number().min(-80).max(80),
    z.number().min(-180).max(180),
    z.number().min(-80).max(80),
  ])
  .refine(
    ([w, s, e, n]) => e > w && n > s && e - w <= 0.04 && n - s <= 0.03,
    "MAP_INVALID_AREA",
  );
const coordinate = z.object({
  lon: z.number().min(-180).max(180),
  lat: z.number().min(-90).max(90),
});
const geometry = z.array(coordinate).max(20000);
const element = z.object({
  type: z.enum(["way", "relation"]),
  id: z.number().int().positive(),
  tags: z.record(z.string()).optional(),
  geometry: geometry.optional(),
  members: z
    .array(
      z.object({
        type: z.string(),
        ref: z.number(),
        role: z.string(),
        geometry: geometry.optional(),
      }),
    )
    .max(5000)
    .optional(),
});
const responseSchema = z.object({
  elements: z.array(element).max(12000),
  remark: z.string().optional(),
});
function same(a: Point, b: Point) {
  return a[0] === b[0] && a[1] === b[1];
}
// 关系的连续 way 段拼成闭环；不以直线补出缺失的河岸或建筑。
function stitch(segments: Point[][]): Point[][] {
  const pool = segments.map((s) => [...s]);
  const rings: Point[][] = [];
  while (pool.length) {
    const ring = pool.pop()!;
    while (ring.length && !same(ring[0], ring[ring.length - 1])) {
      const i = pool.findIndex(
        (s) =>
          same(s[0], ring[ring.length - 1]) ||
          same(s[s.length - 1], ring[ring.length - 1]),
      );
      if (i < 0) break;
      const next = pool.splice(i, 1)[0];
      if (!same(next[0], ring[ring.length - 1])) next.reverse();
      ring.push(...next.slice(1));
    }
    if (ring.length >= 4 && same(ring[0], ring[ring.length - 1]))
      rings.push(ring);
  }
  return rings;
}
export function parseOverpass(
  value: unknown,
  bounds: Bounds,
  now = new Date(),
): Geography {
  const parsed = responseSchema.parse(value);
  if (parsed.remark) throw new Error("MAP_PROVIDER_INCOMPLETE");
  const features: MapFeature[] = [];
  let points = 0;
  for (const item of parsed.elements) {
    const tags = item.tags ?? {};
    const kind = tags.highway
      ? "road"
      : tags.building
        ? "building"
        : tags.natural === "water" || tags.waterway === "riverbank"
          ? "water"
          : ["park", "garden", "recreation_ground"].includes(tags.leisure) ||
              ["grass", "forest", "meadow"].includes(tags.landuse)
            ? "park"
            : null;
    if (!kind) continue;
    const toPoints = (coords: z.infer<typeof geometry>): Point[] =>
      coords.map((c) => [c.lon, c.lat]);
    const rings: Point[][] =
      item.type === "way" && item.geometry
        ? [toPoints(item.geometry)]
        : ["outer", "inner"].flatMap((role) =>
            stitch(
              (item.members ?? [])
                .filter(
                  (m) =>
                    m.type === "way" &&
                    (m.role === role || (role === "outer" && m.role === "")) &&
                    m.geometry?.length,
                )
                .map((m) => toPoints(m.geometry!)),
            ),
          );
    const valid = rings.filter((r) =>
      kind === "road"
        ? r.length >= 2
        : r.length >= 4 && same(r[0], r[r.length - 1]),
    );
    points += valid.reduce((sum, r) => sum + r.length, 0);
    if (points > 100000) throw new Error("MAP_PROVIDER_TOO_LARGE");
    if (valid.length)
      features.push({
        id: `${item.type}/${item.id}`,
        kind,
        rings: valid,
        ...(kind === "road" ? { roadClass: tags.highway } : {}),
      });
  }
  if (!features.length) throw new Error("MAP_NO_GEOGRAPHY");
  return {
    bounds,
    features,
    attribution: "OpenStreetMap contributors",
    fetchedAt: now.toISOString(),
  };
}
export function overpassQuery(bounds: Bounds): string {
  const [w, s, e, n] = boundsSchema.parse(bounds);
  const bbox = `(${s},${w},${n},${e})`;
  return `[out:json][timeout:20][maxsize:33554432];(way[highway]${bbox};way[building]${bbox};relation[building]${bbox};way[natural=water]${bbox};relation[natural=water]${bbox};way[waterway=riverbank]${bbox};way[leisure~"^(park|garden|recreation_ground)$"]${bbox};relation[leisure~"^(park|garden|recreation_ground)$"]${bbox};way[landuse~"^(grass|forest|meadow)$"]${bbox};);out geom;`;
}
export class OverpassProvider implements GeographyProvider {
  constructor(
    private readonly transport: typeof fetch = fetch,
    private readonly approved = () =>
      process.env.MAP_EXTERNAL_PROCESSING_APPROVED ===
      "osm-overpass-area-only-v1",
  ) {}
  async read(bounds: Bounds): Promise<Geography> {
    if (!this.approved()) throw new Error("MAP_PROVIDER_NOT_APPROVED");
    const query = overpassQuery(bounds);
    // 固定端点、不携带 Cookie/身份、不自动重试；仅公共地理范围。
    const response = await this.transport(
      "https://overpass-api.de/api/interpreter",
      {
        method: "POST",
        body: new URLSearchParams({ data: query }),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal: AbortSignal.timeout(25000),
        redirect: "error",
        cache: "no-store",
      },
    );
    if (!response.ok || !response.body)
      throw new Error("MAP_PROVIDER_UNAVAILABLE");
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        size += part.value.length;
        if (size > 5 * 1024 * 1024) throw new Error("MAP_PROVIDER_TOO_LARGE");
        chunks.push(part.value);
      }
    } finally {
      await reader.cancel();
    }
    return parseOverpass(
      JSON.parse(Buffer.concat(chunks).toString("utf8")),
      bounds,
    );
  }
}
