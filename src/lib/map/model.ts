// 地理数据与 Resident 分离：浏览范围绝不构成任何人的位置事实。
export type Point = readonly [longitude: number, latitude: number];
export type Bounds = readonly [
  west: number,
  south: number,
  east: number,
  north: number,
];
export type MapFeature = Readonly<{
  id: string;
  kind: "water" | "park" | "building" | "road";
  rings: ReadonlyArray<ReadonlyArray<Point>>;
  roadClass?: string;
  name?: string;
  outlines?: ReadonlyArray<ReadonlyArray<Point>>;
}>;
export type Geography = Readonly<{
  bounds: Bounds;
  features: ReadonlyArray<MapFeature>;
  attribution: "OpenStreetMap contributors";
  fetchedAt: string;
}>;
export interface EnrichmentProvider {
  read(bounds: Bounds): Promise<Geography>;
  readCells?(bounds: readonly Bounds[]): Promise<Geography[]>;
}
// 兼容既有调用方；Overpass 的职责现在明确为可选 enrichment，而非底图。
export type GeographyProvider = EnrichmentProvider;
export function project(point: Point, bounds: Bounds): [number, number] {
  const width = bounds[2] - bounds[0];
  const height = bounds[3] - bounds[1];
  const ratio =
    (width * Math.cos((((bounds[1] + bounds[3]) / 2) * Math.PI) / 180)) /
    height;
  return [
    500 + ((point[0] - bounds[0]) / width - 0.5) * 800 * ratio,
    800 * (1 - (point[1] - bounds[1]) / height),
  ];
}
export function featurePath(feature: MapFeature, bounds: Bounds): string {
  return feature.rings
    .map(
      (ring) =>
        ring
          .map((point, index) => {
            const [x, y] = project(point, bounds);
            return `${index ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`;
          })
          .join(" ") + (feature.kind === "road" ? "" : "Z"),
    )
    .join(" ");
}
export type Camera = Readonly<{ x: number; y: number; zoom: number }>;
export const initialCamera: Camera = { x: 0, y: 0, zoom: 1 };
export function constrainCamera(camera: Camera): Camera {
  const zoom = Math.min(3, Math.max(1, camera.zoom));
  return {
    zoom,
    x: Math.max(-400 * zoom, Math.min(400 * zoom, camera.x)),
    y: Math.max(-320 * zoom, Math.min(320 * zoom, camera.y)),
  };
}

function contains(point: Point, ring: ReadonlyArray<Point>): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i],
      [xj, yj] = ring[j];
    if (
      yi > point[1] !== yj > point[1] &&
      point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi
    )
      inside = !inside;
  }
  return inside;
}
function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b[0] - a[0],
    dy = b[1] - a[1],
    length = dx * dx + dy * dy;
  const t = length
    ? Math.max(
        0,
        Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length),
      )
    : 0;
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}
// 树是公园中的原创制图装饰，并非宣称这些地点实际存在单棵树。
export function parkDecorations(geography: Geography): Point[] {
  const parks = geography.features
    .filter((f) => f.kind === "park")
    .map((f) => f.rings.map((r) => r.map((p) => project(p, geography.bounds))));
  const roads = geography.features
    .filter((f) => f.kind === "road")
    .flatMap((f) =>
      f.rings.map((r) => r.map((p) => project(p, geography.bounds))),
    );
  const trees: Point[] = [];
  for (let y = 55; y < 755; y += 64)
    for (let x = 55; x < 955; x += 72) {
      const p: Point = [x + (y % 3) * 7, y];
      const crown: Point[] = [
        p,
        [p[0] - 15, p[1]],
        [p[0] + 15, p[1]],
        [p[0], p[1] - 20],
        [p[0], p[1] + 20],
      ];
      if (
        parks.some((rings) =>
          crown.every(
            (q) =>
              rings.reduce((n, r) => n + Number(contains(q, r)), 0) % 2 === 1,
          ),
        ) &&
        !roads.some((r) =>
          r.some((a, i) => i > 0 && distanceToSegment(p, r[i - 1], a) < 25),
        )
      )
        trees.push(p);
      if (trees.length >= 36) return trees;
    }
  return trees;
}
