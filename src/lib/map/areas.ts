import type { Bounds } from "./model";
// 可主动选择的公共浏览区域。不会默认选中，也不会写入 Resident location。
export const MAP_AREAS = [
  {
    id: "new-york-central-park",
    zh: "纽约 · 中央公园南侧",
    en: "New York · Central Park South",
    bounds: [-73.985, 40.762, -73.959, 40.782],
  },
  {
    id: "paris-seine",
    zh: "巴黎 · 塞纳河畔",
    en: "Paris · Seine riverside",
    bounds: [2.334, 48.852, 2.35, 48.862],
  },
  {
    id: "kyoto-kamogawa",
    zh: "京都 · 鸭川河畔",
    en: "Kyoto · Kamogawa riverside",
    bounds: [135.762, 35.003, 135.782, 35.023],
  },
] as const satisfies ReadonlyArray<{
  id: string;
  zh: string;
  en: string;
  bounds: Bounds;
}>;
export type MapAreaId = (typeof MAP_AREAS)[number]["id"];
export function findMapArea(id: unknown) {
  return MAP_AREAS.find((area) => area.id === id);
}
