// 原创像素材质和植物，仅作风格化装饰，不代表实测树木或建筑外观。
// 保留完整真实轮廓；所有装饰均裁切在原始地理要素内。
export const textures = `
<pattern id="waterTexture" width="230" height="170" patternUnits="userSpaceOnUse">
 <rect width="230" height="170" fill="#aecfe0"/>
 <path d="M28 45h8v-2h13v2h9m98 73h7v-2h12v2h7" fill="none" stroke="#c6e0e7" stroke-width="1.6"/>
 <path d="M38 51h11m115 73h9" stroke="#9fc4d7" stroke-width="1.4"/>
</pattern>
<pattern id="grassTexture" width="104" height="90" patternUnits="userSpaceOnUse">
 <rect width="104" height="90" fill="#b8d1a4"/>
 <path d="M6 13h17v-3h14v5h9v8H32v4H17v-3H6Zm55 45h18v-4h12v5h8v9H86v4H70v-4h-9Z" fill="#bed6a9"/>
 <path d="M16 45h11v2H16Zm37-12h9v2h-9Zm21 47h14v2H74Z" fill="#aac699"/>
 <path d="M27 49v-3m3 3v-5m3 5v-2M78 22v-3m3 3v-5m3 5v-2" stroke="#94b686" stroke-width="1.2"/>
 <path d="M49 72h2v2h-2Zm-2 2h2v2h-2Zm4 0h2v2h-2Z" fill="#e1ddb5"/>
</pattern>
<symbol id="roundTree" viewBox="0 0 32 40">
 <path d="M9 35h16v3H9Z" fill="#9fb889"/>
 <path d="M14 25h5v11h-5Z" fill="#967858"/><path d="M15 27h2v7h-2Z" fill="#b8956a"/>
 <path d="M11 2h10v3h5v4h3v6h2v10h-4v5h-6v3H10v-3H5v-5H2V15h2V9h3V5h4Z" fill="#789e68"/>
 <path d="M11 3h9v3h5v5h3v12h-4v5h-6v2h-8v-4H5V15h3V8h3Z" fill="#94b77b"/>
 <path d="M12 7h8v3h4v6h-7v3H8v-7h4Z" fill="#b2cc93"/>
 <path d="M7 23h6v3h8v-3h5v3h-5v4H11v-3H7Z" fill="#86aa70"/>
 <path d="M19 19h3v2h-3ZM8 17h3v2H8Z" fill="#a6c389"/>
</symbol>`;
export function buildingColor(id) {
  const hash = [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0);
  return ["#d3b99e", "#d9c4a9", "#cdb8a3", "#d5b79f"][hash % 4];
}
const inside = (p, ring) => {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i],
      b = ring[j];
    if (
      a.y > p.y !== b.y > p.y &&
      p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x
    )
      hit = !hit;
  }
  return hit;
};
function distance(p, a, b) {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const f = Math.max(
    0,
    Math.min(
      1,
      ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1),
    ),
  );
  return Math.hypot(p.x - a.x - f * dx, p.y - a.y - f * dy);
}
export function softenFeature(
  world,
  defs,
  feature,
  index,
  { svgEl, path, project },
) {
  const park = feature.kind === "park";
  const clipId = `terrain-${index}`;
  const clip = svgEl("clipPath", { id: clipId });
  clip.append(svgEl("path", { d: path(feature.coordinates) + "Z" }));
  defs.append(clip);
  const g = svgEl("g", {
    "clip-path": `url(#${clipId})`,
    "aria-hidden": "true",
  });
  // 内沿的两道浅色带为草地/屋顶增加厚度，不挪动原轮廓。
  g.append(
    svgEl("path", {
      d: path(feature.coordinates) + "Z",
      fill: "none",
      stroke: park ? "#99bb86" : "#baa087",
      "stroke-width": park ? 7 : 3,
      "stroke-linejoin": "round",
      opacity: park ? 0.45 : 0.5,
    }),
  );
  g.append(
    svgEl("path", {
      d: path(feature.coordinates) + "Z",
      fill: "none",
      stroke: park ? "#d2dfb4" : "#e6d2b7",
      "stroke-width": park ? 2 : 1,
      "stroke-linejoin": "round",
    }),
  );
  const featured = ["way/335716200", "way/335716199", "way/326803753"].includes(
    feature.id,
  );
  if (featured) {
    const ring = feature.coordinates.map(project),
      xs = ring.map((p) => p.x),
      ys = ring.map((p) => p.y);
    const x = Math.min(...xs),
      y = Math.min(...ys),
      w = Math.max(...xs) - x,
      h = Math.max(...ys) - y;
    g.append(
      svgEl("path", {
        d: `M${x} ${y + h * 0.32}H${x + w}V${y + h * 0.68}H${x}Z`,
        fill: "#c49e7e",
      }),
    );
    g.append(
      svgEl("path", {
        d: `M${x + 3} ${y + h * 0.32}H${x + w - 3}`,
        stroke: "#ebd7b7",
        "stroke-width": 1.5,
      }),
    );
  }
  world.append(g);
}
export function plantGarden(world, defs, features, { svgEl, project }) {
  const garden = features.find((f) => f.id === "way/4373996");
  if (!garden) return;
  const ring = garden.coordinates.map(project);
  const roads = features
    .filter((f) => f.kind === "road")
    .map((f) => ({
      points: f.coordinates.map(project),
      width: ["primary", "secondary", "tertiary"].includes(f.class)
        ? 11
        : ["footway", "path"].includes(f.class)
          ? 2.3
          : 4.5,
    }));
  const xs = ring.map((p) => p.x),
    ys = ring.map((p) => p.y);
  const placed = [];
  const group = svgEl("g", {
    "data-garden": "ornamental",
    "aria-hidden": "true",
  });
  // 只在主公园中选少量有空隙的位置；与实际路径保持树冠宽度的净距。
  for (let y = Math.min(...ys) + 15; y < Math.max(...ys) - 10; y += 10) {
    for (let x = Math.min(...xs) + 12; x < Math.max(...xs) - 10; x += 10) {
      const p = { x, y };
      if (
        placed.length >= 10 ||
        ![
          [-9, -10],
          [9, -10],
          [-9, 11],
          [9, 11],
        ].every(([dx, dy]) => inside({ x: x + dx, y: y + dy }, ring))
      )
        continue;
      if (placed.some((q) => Math.hypot(q.x - x, q.y - y) < 29)) continue;
      if (
        roads.some((r) =>
          r.points.some(
            (b, i) =>
              i > 0 && distance(p, r.points[i - 1], b) < 8 + r.width / 2,
          ),
        )
      )
        continue;
      placed.push(p);
      group.append(
        svgEl("use", {
          href: "#roundTree",
          x: x - 10,
          y: y - 13,
          width: 18,
          height: 23,
          "data-map-decoration": "tree",
        }),
      );
    }
  }
  world.append(group);
}
