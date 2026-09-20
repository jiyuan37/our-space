import type { Bounds, Geography, MapFeature } from "./model";
export const CELL_DEGREES = 0.005;
export const HOME_MAP_ZOOM = 16;
export const MAX_VIEW_CELLS = 36;
export type MapCell = { key: string; bounds: Bounds };
// 全球整数格网：单格最大约0.31km²；边缘不因拖动产生浮点 cache key。
export function cellsForBounds(bounds: Bounds): MapCell[] {
  const [w, s, e, n] = bounds;
  if (
    !bounds.every(Number.isFinite) ||
    w < -180 ||
    e > 180 ||
    s < -80 ||
    n > 80 ||
    e <= w ||
    n <= s
  )
    throw new Error("MAP_INVALID_AREA");
  const x0 = Math.floor(w * 200 + 1e-8),
    x1 = Math.ceil(e * 200 - 1e-8);
  const y0 = Math.floor(s * 200 + 1e-8),
    y1 = Math.ceil(n * 200 - 1e-8);
  if ((x1 - x0) * (y1 - y0) > MAX_VIEW_CELLS)
    throw new Error("MAP_INVALID_AREA");
  const cells: MapCell[] = [];
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++)
      cells.push({
        key: `cell-v3-${x}-${y}-z${HOME_MAP_ZOOM}`,
        bounds: [x / 200, y / 200, (x + 1) / 200, (y + 1) / 200],
      });
  return cells;
}
export function mergeCellGeography(
  bounds: Bounds,
  cells: readonly Geography[],
): Geography {
  const features = new Map<string, MapFeature>();
  for (const cell of cells)
    for (const f of cell.features) {
      const old = features.get(f.id);
      if (!old) {
        features.set(f.id, f);
        continue;
      }
      // 保留不同cell的真实片段，重复的同向/反向片段只绘一次；绝不凭端点跨gap连线。
      const keys = new Set<string>();
      const rings = [...old.rings, ...f.rings].filter((r) => {
        const forward = JSON.stringify(r),
          reverse = JSON.stringify([...r].reverse());
        const key = forward < reverse ? forward : reverse;
        if (keys.has(key)) return false;
        keys.add(key);
        return true;
      });
      const outlines = [...(old.outlines ?? []), ...(f.outlines ?? [])].filter(
        (r, i, a) =>
          a.findIndex(
            (x) =>
              JSON.stringify(x) === JSON.stringify(r) ||
              JSON.stringify([...x].reverse()) === JSON.stringify(r),
          ) === i,
      );
      features.set(f.id, {
        ...old,
        rings,
        ...(outlines.length ? { outlines } : {}),
      });
    }
  const merged = [...features.values()];
  if (
    merged.length > 8000 ||
    merged.reduce(
      (n, f) =>
        n +
        [...f.rings, ...(f.outlines ?? [])].reduce(
          (sum, r) => sum + r.length,
          0,
        ),
      0,
    ) > 150000
  )
    throw new Error("MAP_PROVIDER_TOO_LARGE");
  return {
    bounds,
    features: merged,
    attribution: "OpenStreetMap contributors",
    fetchedAt:
      cells.map((c) => c.fetchedAt).sort()[0] ?? new Date().toISOString(),
  };
}
