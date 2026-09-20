import type { Bounds, Point } from "@/lib/map/model";
export type Coordinate = { lon: number; lat: number } | null;
export const same = (a: Point, b: Point) => a[0] === b[0] && a[1] === b[1];
// Liang–Barsky：只截取真实线段，与null占位分隔；不把隔着未知几何的点串成一条路。
function segment(
  a: Point,
  b: Point,
  [w, s, e, n]: Bounds,
): [Point, Point] | null {
  let start = 0,
    end = 1;
  const dx = b[0] - a[0],
    dy = b[1] - a[1];
  for (const [p, q] of [
    [-dx, a[0] - w],
    [dx, e - a[0]],
    [-dy, a[1] - s],
    [dy, n - a[1]],
  ]) {
    if (p === 0) {
      if (q < 0) return null;
      continue;
    }
    const t = q / p;
    if (p < 0) start = Math.max(start, t);
    else end = Math.min(end, t);
    if (start > end) return null;
  }
  return [
    [a[0] + start * dx, a[1] + start * dy],
    [a[0] + end * dx, a[1] + end * dy],
  ];
}
export function splitGeometry(coords: readonly Coordinate[]): Point[][] {
  const result: Point[][] = [];
  let current: Point[] = [];
  for (const c of coords) {
    if (c) current.push([c.lon, c.lat]);
    else {
      if (current.length > 1) result.push(current);
      current = [];
    }
  }
  if (current.length > 1) result.push(current);
  return result;
}
export function clipLines(
  lines: readonly (readonly Point[])[],
  bounds: Bounds,
): Point[][] {
  const result: Point[][] = [];
  for (const line of lines) {
    let current: Point[] = [];
    for (let i = 1; i < line.length; i++) {
      const part = segment(line[i - 1], line[i], bounds);
      if (!part) {
        if (current.length > 1) result.push(current);
        current = [];
        continue;
      }
      if (current.length && same(current[current.length - 1], part[0]))
        current.push(part[1]);
      else {
        if (current.length > 1) result.push(current);
        current = [...part];
      }
    }
    if (current.length > 1) result.push(current);
  }
  return result;
}
export function stitch(segments: Point[][]): Point[][] {
  const pool = segments.map((s) => [...s]);
  const chains: Point[][] = [];
  while (pool.length) {
    let chain = pool.pop()!;
    let changed = true;
    while (changed && !same(chain[0], chain[chain.length - 1])) {
      changed = false;
      for (let i = 0; i < pool.length; i++) {
        let next = pool[i];
        if (same(chain[chain.length - 1], next[0]))
          chain = [...chain, ...next.slice(1)];
        else if (same(chain[chain.length - 1], next[next.length - 1])) {
          next = [...next].reverse();
          chain = [...chain, ...next.slice(1)];
        } else if (same(chain[0], next[next.length - 1]))
          chain = [...next, ...chain.slice(1)];
        else if (same(chain[0], next[0])) {
          next = [...next].reverse();
          chain = [...next, ...chain.slice(1)];
        } else continue;
        pool.splice(i, 1);
        changed = true;
        break;
      }
    }
    chains.push(chain);
  }
  return chains;
}
// 只裁剪完整已知闭环；裁剪线在cell边界，是clip edge而不是虚构OSM边界。
export function clipRing(ring: readonly Point[], bounds: Bounds): Point[] {
  let points = [...ring.slice(0, -1)];
  for (const [axis, edge, sign] of [
    [0, bounds[0], 1],
    [0, bounds[2], -1],
    [1, bounds[1], 1],
    [1, bounds[3], -1],
  ]) {
    const input = points;
    points = [];
    if (!input.length) break;
    for (let i = 0; i < input.length; i++) {
      const a = input[(i + input.length - 1) % input.length],
        b = input[i];
      const aIn = (a[axis] - edge) * sign >= 0,
        bIn = (b[axis] - edge) * sign >= 0;
      if (aIn !== bIn) {
        const t = (edge - a[axis]) / (b[axis] - a[axis]);
        points.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
      }
      if (bIn) points.push(b);
    }
  }
  if (points.length >= 3) return [...points, points[0]];
  return [];
}
