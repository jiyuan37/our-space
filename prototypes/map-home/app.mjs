import {
  CONFIG,
  A,
  B,
  SELF,
  decide,
  scenario,
  cursorKey,
  currentPresence,
} from "./movement.mjs";
import { character } from "./characters.mjs";
import {
  textures,
  buildingColor,
  softenFeature,
  plantGarden,
} from "./background.mjs";
const $ = (id) => document.getElementById(id);
const pairs = {
  space: ["慢慢的家", "Our little place"],
  prototype: [
    "交互原型 · 角色与移动为演示",
    "Prototype · demo people & movement",
  ],
  locate: ["找我们", "Find us"],
  locationHint: [
    "位置：演示共享点 · 伦敦南岸",
    "Place: demo shared point · South Bank",
  ],
  place: ["伦敦 · 南岸", "LONDON · SOUTH BANK"],
  lin: ["小林", "Lin"],
  yu: ["小雨", "Yu"],
  mapCaption: ["伦敦南岸 · 真实地理底图", "South Bank · real geography"],
  skip: ["跳过", "Skip"],
  create: ["留一点今天", "Leave a little"],
  unplaced: ["没有地点的时刻", "Without a place"],
  debug: ["原型实验台", "Prototype lab"],
  close: ["关闭", "Close"],
  debugNote: [
    "仅切换合成样本，不采集你的位置。",
    "Synthetic samples only. No location collection.",
  ],
  scenario: ["演示场景", "Demo scenario"],
  reopen: ["再打开地图", "Reopen map"],
  reset: ["重置演示游标", "Reset demo cursor"],
  motion: ["关闭移动回放", "Turn off movement replay"],
  pose: ["自愿状态（与位置独立）", "Voluntary state (separate from location)"],
  parameters: [
    "阈值为原型参数，尚未实测校准。步态不代表交通方式。",
    "Prototype thresholds are uncalibrated. Walking animation does not identify transport.",
  ],
  identity: ["查看示例形象与创建流程", "Example identity & creation flow"],
  sample: ["示例内容", "EXAMPLE CONTENT"],
  quiet: ["今天这里很安静。", "It’s quiet here today."],
  nochange: [
    "有效样本未支持新的位置变化。",
    "Valid samples do not support a new location change.",
  ],
  available: ["一小段位置变化。", "A little change of place."],
  endpoint: [
    "仅端点变化示意，不代表真实路线或步行。",
    "Endpoints only; not an actual route or travel mode.",
  ],
  sampled: [
    "沿有效合成采样段展示，不补齐缺口。",
    "Following valid synthetic samples; gaps stay gaps.",
  ],
  settled: ["这段变化已经展示。", "This change has been shown."],
  settledCopy: [
    "停在最后可展示位置，重新打开不会重播。",
    "At the last displayable position. Reopening won’t replay.",
  ],
  baseline: ["从这个位置开始。", "Starting from this position."],
  baselineCopy: [
    "只有一个有效位置，没有虚构的起点。",
    "One valid position. No invented starting point.",
  ],
  nodata: [
    "暂时没有可展示的位置更新。",
    "No location update to show right now.",
  ],
  nodataCopy: [
    "这不表示对方没有移动。",
    "This does not mean the other person hasn’t moved.",
  ],
  paused: ["位置共享已暂停。", "Location sharing is paused."],
  pausedCopy: [
    "不展示旧位置，也不拼接暂停前后的路线。",
    "No old position or route across the pause.",
  ],
  far: ["各自的地方，也能一起看见。", "Two places, still a shared home."],
  farCopy: [
    "选择小雨查看巴黎，保留街区尺度。",
    "Choose Yu to see Paris at a neighbourhood scale.",
  ],
  remote: [
    "巴黎 · 示例位置<br/>本原型未打包此处底图。",
    "Paris · example position<br/>This prototype has no basemap for this area.",
  ],
  static: ["静态位置变化", "Static location change"],
  staticCopy: [
    "已关闭移动效果；起点与终点仍可查看。",
    "Motion is off; the start and end remain visible.",
  ],
  personTitle: ["小林的此刻", "Lin’s moment"],
  yuTitle: ["小雨的此刻", "Yu’s moment"],
  read: ["在读几页书。", "Reading a few pages."],
  cup: ["喝杯奶茶，放松一下。", "A milk tea break."],
  idle: ["安静待一会儿。", "Taking a quiet moment."],
  presenceHint: [
    "自愿状态与地点独立；在看书不等于在图书馆。",
    "A voluntary state is separate from place; reading does not mean being at a library.",
  ],
  expired: [
    "今天回到平静。旧状态动作已停止，角色身份保留。",
    "Quiet again today. The old action has stopped; identity stays.",
  ],
  momentTitle: ["把河边的风留给你。", "A little riverside breeze for you."],
  momentCopy: [
    "示例 LifePoint：下午在这里停了一会儿，水面很亮。人物与内容均为虚构。",
    "Example LifePoint: paused here this afternoon; the water was bright. People and content are fictional.",
  ],
  momentHint: [
    "未来可在这里接住这一刻，成为 SharedMoment；本轮只展示内容面板。",
    "A future Response can hold this as a SharedMoment. This prototype only shows a content panel.",
  ],
  unplacedTitle: ["有些时刻，没有地点。", "Some moments have no place."],
  unplacedCopy: [
    "示例：今天听到一首想分享给你的歌。未来通过“没有地点的时刻”与 Visit 自然访问，不强制选择坐标。",
    "Example: a song I wanted to share with you. These moments stay reachable without requiring coordinates.",
  ],
  composerTitle: ["留一点今天 · 流程示例", "Leave a little · flow example"],
  composerHint: [
    "可以只留一句话，不必选择地点。本原型不会保存或发送。",
    "A few words are enough. No place required. This prototype does not save or send.",
  ],
  draft: ["写一句今天想留下的话", "A little of today"],
  done: ["收起示例", "Close example"],
  avatarTitle: [
    "找到像自己的那个角色。",
    "Find a character that feels like you.",
  ],
  avatarHint: [
    "示例形象 / 尚未接入 AI。没有上传、拍照或生成请求。",
    "Example identities / AI is not connected. No upload, camera or generation requests.",
  ],
  flow: [
    "首次进入显著引导 → 自拍/上传 → AI 候选 → 选择/调整/重新生成 → 明确确认 → 持久身份。是否必须照片或阻断 Home 仍待决定。",
    "Prominent first-entry invitation → photo → AI candidates → choose/adjust/regenerate → explicit confirmation → persistent identity. Photo requirements and entry blocking remain undecided.",
  ],
  selectExample: [
    "选用小林示例（仅本页）",
    "Choose Lin example (this page only)",
  ],
  selected: [
    "已选中示例形象；不是 AI 生成或正式身份保存。",
    "Example selected; no AI generation or production identity saved.",
  ],
  mapLabel: [
    "地图，可用方向键移动；加减键缩放",
    "Map: arrow keys pan; plus/minus zoom",
  ],
  accountLabel: ["查看示例账户与形象", "View example account and identity"],
  zoomIn: ["放大地图", "Zoom in"],
  zoomOut: ["缩小地图", "Zoom out"],
  center: ["回到关注区域", "Return to focus area"],
  start: ["起点", "Start"],
  end: ["终点", "End"],
  thames: ["泰晤士河", "RIVER THAMES"],
  jubilee: ["朱比利花园", "Jubilee Gardens"],
  waterloo: ["滑铁卢", "Waterloo"],
  westminster: ["威斯敏斯特桥", "Westminster Bridge"],
  north: ["北 ↑", "N ↑"],
  mapError: [
    "底图未能加载。请使用 README 中的本地启动命令。",
    "Basemap could not load. Use the local server command in README.",
  ],
};
const scenarios = {
  quiet: ["没有新移动 · 状态独立", "No new movement · separate states"],
  move: ["新的端点变化 · 自动一次", "New endpoints · once"],
  seen: ["同段已展示 · 不再走动", "Already shown · no replay"],
  baseline: ["只有终点 · 无基线", "Endpoint only · no baseline"],
  noise: ["小范围噪声 · 不走动", "Small noise · no walking"],
  nodata: ["无新数据 · 位置不明", "No data · location unknown"],
  stale: ["样本过期 · 隐藏旧位置", "Stale samples · hide position"],
  paused: ["共享暂停 · 不展示", "Sharing paused"],
  endpoints: ["只有端点 · 变化示意", "Endpoints · illustrative"],
  sampled: ["有中间样本 · 有效采样段", "Intermediate samples"],
  return: ["A → B → A · 往返变化", "A → B → A · return trip"],
  gap: ["采样缺口 · 不补路线", "Sample gap · no invented route"],
  far: ["两个人相隔很远", "Two distant residents"],
};
const poses = {
  idle: ["平静", "Quiet"],
  read: ["看书", "Reading"],
  cup: ["喝奶茶", "Milk tea"],
  expired: ["Presence 跨日/清除", "Presence expired / cleared"],
};
let locale = "zh-CN",
  name = "quiet",
  pose = "read",
  result = {},
  input,
  point = A,
  camera = { x: 0, y: 0, scale: 1 },
  frame = 0,
  direction = 1,
  raf = 0,
  replays = 0,
  remote = false,
  staticChange = false,
  detailKind = null,
  geography,
  storageOK = true;
const store = {
  get(k, fallback) {
    try {
      return JSON.parse(localStorage.getItem(k)) ?? fallback;
    } catch {
      storageOK = false;
      return fallback;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {
      storageOK = false;
    }
  },
};
const key = cursorKey("demo-viewer", "demo-space", "demo");
let seen = store.get(key, []);
locale = store.get("our-space-prototype:locale", "zh-CN");
name = store.get("our-space-prototype:scenario", "quiet");
if (!scenarios[name]) name = "quiet";
const t = (k) => pairs[k]?.[locale === "zh-CN" ? 0 : 1] ?? k;
const project = (p) => ({
  x: (p[0] + 0.12) * 69300,
  y: (51.505 - p[1]) * 111320,
});
function screen(p) {
  const q = project(p);
  return {
    x: $("map").clientWidth / 2 + (q.x - camera.x) * camera.scale,
    y: $("map").clientHeight * 0.47 + (q.y - camera.y) * camera.scale,
  };
}
const svgEl = (tag, attrs = {}, text) => {
  const e = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text) e.textContent = text;
  return e;
};
function path(points) {
  return points
    .map((p, i) => {
      const q = project(p);
      return `${i ? "L" : "M"}${q.x.toFixed(2)},${q.y.toFixed(2)}`;
    })
    .join(" ");
}
function buildMap() {
  const world = $("world");
  world.replaceChildren();
  const defs = svgEl("defs");
  defs.innerHTML = textures;
  world.append(defs);
  world.append(
    svgEl("rect", {
      x: -2500,
      y: -2500,
      width: 5000,
      height: 5000,
      fill: "#e8dcc4",
    }),
  );
  const order = ["water", "island", "park", "building", "road"];
  let featureIndex = 0;
  for (const kind of order) {
    for (const f of geography.features.filter((f) => f.kind === kind)) {
      const road = kind === "road",
        major = ["primary", "secondary", "tertiary"].includes(f.class),
        foot = ["footway", "path"].includes(f.class);
      world.append(
        svgEl("path", {
          d: path(f.coordinates) + (road ? "" : "Z"),
          fill: road
            ? "none"
            : {
                water: "url(#waterTexture)",
                island: "#e8dcc4",
                park: "url(#grassTexture)",
                building: buildingColor(f.id),
              }[kind],
          stroke: road
            ? major
              ? "#fff4df"
              : foot
                ? "#f3e7cc"
                : "#f5e8cf"
            : kind === "building"
              ? "#bca98e"
              : kind === "park"
                ? "#a0b990"
                : "none",
          "stroke-width": road ? (major ? 11 : foot ? 2.3 : 4.5) : 0.7,
          "stroke-linejoin": "round",
          "stroke-linecap": "round",
        }),
      );
      if (kind === "park" || kind === "building")
        softenFeature(world, defs, f, featureIndex++, { svgEl, path, project });
    }
  }
  plantGarden(world, defs, geography.features, { svgEl, path, project });
  const labels = [
    ["thames", [-0.1228, 51.5054], -28],
    ["jubilee", [-0.118, 51.5049], 0],
    ["waterloo", [-0.1135, 51.504], 0],
    ["westminster", [-0.1217, 51.5009], 12],
  ];
  for (const [k, p, r] of labels) {
    const q = project(p);
    world.append(
      svgEl(
        "text",
        {
          x: q.x,
          y: q.y,
          "text-anchor": "middle",
          "font-size": k === "thames" ? 16 : 12,
          "letter-spacing": k === "thames" ? 4 : 1,
          transform: `rotate(${r} ${q.x} ${q.y})`,
          class: k === "thames" ? "river-label" : "",
          "data-map-label": k,
        },
        t(k),
      ),
    );
  }
}
function applyCamera() {
  $("world").setAttribute(
    "transform",
    `translate(${$("map").clientWidth / 2} ${$("map").clientHeight * 0.47}) scale(${camera.scale}) translate(${-camera.x} ${-camera.y})`,
  );
  $("geography").style.display = remote ? "none" : "";
  $("remoteNote").hidden = !remote;
  $("remoteNote").innerHTML = t("remote");
  for (const label of $("world").querySelectorAll("[data-map-label]"))
    label.style.display =
      camera.scale < 0.85 && label.dataset.mapLabel !== "thames" ? "none" : "";
  drawAnchors();
  drawRoute();
}
function focus(person = null) {
  remote = name === "far" && person === "yu";
  const p = remote
    ? SELF
    : person === "yu"
      ? SELF
      : person === "lin"
        ? (point ?? B)
        : [-0.1181, 51.50455];
  const q = project(p);
  camera = { ...q, scale: $("map").clientWidth < 650 ? 1.05 : 1.18 };
  applyCamera();
}
let anchorIds = new Set();
function anchor(id, p, html, cls, action, label) {
  anchorIds.add(id);
  const e = $(id) ?? document.createElement("button");
  e.id = id;
  e.className = `anchor ${cls}`;
  e.classList.toggle(
    "selected",
    detailKind ===
      (id === "residentLin" ? "lin" : id === "residentYu" ? "yu" : "moment"),
  );
  e.setAttribute("aria-pressed", String(e.classList.contains("selected")));
  if (e.dataset.markup !== html) {
    e.innerHTML = html;
    e.dataset.markup = html;
  }
  e.setAttribute("aria-label", label);
  const q = screen(p);
  e.style.left = `${q.x}px`;
  e.style.top = `${q.y}px`;
  e.onclick = (event) => {
    if (performance.now() > suppressClickUntil) action(event);
  };
  if (!e.isConnected) $("anchors").append(e);
}
function drawAnchors() {
  anchorIds = new Set();
  const activePose = currentPresence(
    pose === "expired" ? Date.now() - 86400000 : Date.now(),
  )
    ? pose
    : "idle";
  if (point && !remote)
    anchor(
      "residentLin",
      point,
      `${character("lin", activePose, frame, direction, result.state === "REPLAYING")}<span class="name">${t("lin")}</span><span class="pin" aria-hidden="true"></span>`,
      "resident",
      () => openDetail("lin"),
      `${t("lin")} · ${t(activePose)}`,
    );
  if (name !== "far" || remote)
    anchor(
      "residentYu",
      SELF,
      `${character("yu", "cup")}<span class="name">${t("yu")}</span><span class="pin" aria-hidden="true"></span>`,
      "resident",
      () => openDetail("yu"),
      `${t("yu")} · ${t("cup")}`,
    );
  if (!remote) {
    anchor(
      "lifeMarker",
      [-0.1182, 51.5031],
      '<span class="moment-icon">✿</span>',
      "moment",
      () => openDetail("moment"),
      t("momentTitle"),
    );
  }
  for (const child of $("anchors").children)
    if (!anchorIds.has(child.id)) child.remove();
  // 地名服从人物层级；只隐藏与可见头像相交的标签，不移动地理位置。
  const markers = [...$("anchors").querySelectorAll(".resident")].map((e) =>
    e.getBoundingClientRect(),
  );
  for (const label of $("world").querySelectorAll("[data-map-label]")) {
    const box = label.getBoundingClientRect();
    label.style.visibility = markers.some(
      (m) =>
        box.left < m.right + 6 &&
        box.right > m.left - 6 &&
        box.top < m.bottom + 6 &&
        box.bottom > m.top - 6,
    )
      ? "hidden"
      : "visible";
  }
  const treeObstacles = [
    ...$("anchors").querySelectorAll(".resident svg, .resident .name, .moment"),
  ].map((e) => e.getBoundingClientRect());
  const labels = [...$("world").querySelectorAll("[data-map-label]")]
    .filter((e) => e.style.visibility !== "hidden")
    .map((e) => e.getBoundingClientRect());
  for (const tree of $("world").querySelectorAll("[data-map-decoration]")) {
    const box = tree.getBoundingClientRect();
    tree.style.visibility =
      camera.scale < 0.85 ||
      [...treeObstacles, ...labels].some(
        (m) =>
          box.left < m.right + 4 &&
          box.right > m.left - 4 &&
          box.top < m.bottom + 4 &&
          box.bottom > m.top - 4,
      )
        ? "hidden"
        : "visible";
  }
}
function drawRoute() {
  const route = $("route");
  route.replaceChildren();
  if (
    remote ||
    !["REPLAYING", "SETTLED"].includes(result.state) ||
    !result.displaySegments?.length
  )
    return;
  for (const segment of result.displaySegments) {
    const a = screen(segment.from),
      b = screen(segment.to);
    route.append(
      svgEl("path", {
        d: `M${a.x} ${a.y}L${b.x} ${b.y}`,
        fill: "none",
        stroke: "#536b46",
        "stroke-width": 3,
        "stroke-dasharray": segment.mode === "endpoints" ? "5 7" : "none",
        opacity: 0.8,
      }),
    );
  }
  const first = result.displaySegments[0].from,
    last = result.displaySegments.at(-1).to;
  for (const [p, k] of [
    [first, "start"],
    [last, "end"],
  ]) {
    const q = screen(p);
    route.append(
      svgEl("circle", {
        cx: q.x,
        cy: q.y,
        r: 5,
        fill: "#fff4df",
        stroke: "#536b46",
        "stroke-width": 2,
      }),
    );
    route.append(
      svgEl("text", { x: q.x + 10, y: q.y + 20, "font-size": 11 }, t(k)),
    );
  }
}
function status() {
  let title = "quiet",
    copy = "nochange";
  if (name === "far") {
    title = "far";
    copy = "farCopy";
  } else if (result.state === "REPLAYING") {
    title = "available";
    copy = input.mode === "sampled" ? "sampled" : "endpoint";
  } else if (result.state === "SETTLED") {
    title = staticChange ? "static" : "settled";
    copy = staticChange ? "staticCopy" : "settledCopy";
  } else if (result.state === "NO_BASELINE") {
    title = "baseline";
    copy = "baselineCopy";
  } else if (result.state === "INSUFFICIENT_DATA") {
    title = "nodata";
    copy = "nodataCopy";
  } else if (result.state === "SHARING_PAUSED") {
    title = "paused";
    copy = "pausedCopy";
  }
  // 无位置变化并不意味着没有主动状态；技术原因只在实验台展示。
  $("replayNote").hidden = result.state === "NO_CHANGE";
  $("statusTitle").textContent = t(title);
  $("statusCopy").textContent = t(copy);
  $("statusTitle").classList.toggle("sr-only", result.state === "REPLAYING");
  $("skip").hidden = result.state !== "REPLAYING";
  $("machine").textContent =
    `${result.state === "NO_CHANGE" ? t("nochange") + " " : ""}${result.state} · auto=${replays} · mode=${input?.mode ?? "endpoints"} · omitted=${result.omitted ?? 0}${storageOK ? "" : " · storage unavailable: static only"}`;
  document.body.dataset.state = result.state;
  document.body.dataset.replays = replays;
}
function text() {
  document.documentElement.lang = locale;
  $("locale").textContent = locale === "zh-CN" ? "EN" : "中文";
  document
    .querySelectorAll("[data-i18n]")
    .forEach((e) => (e.innerHTML = t(e.dataset.i18n)));
  for (const [id, k] of [
    ["map", "mapLabel"],
    ["account", "accountLabel"],
    ["zoomIn", "zoomIn"],
    ["zoomOut", "zoomOut"],
    ["center", "center"],
  ])
    $(id).setAttribute("aria-label", t(k));
  for (const [id, options, val] of [
    ["scenario", scenarios, name],
    ["pose", poses, pose],
  ]) {
    $(id).replaceChildren(
      ...Object.entries(options).map(([value, labels]) => {
        const o = document.createElement("option");
        o.value = value;
        o.textContent = labels[locale === "zh-CN" ? 0 : 1];
        return o;
      }),
    );
    $(id).value = val;
  }
  status();
  if (geography) buildMap();
  applyCamera();
  if (detailKind) detailContent();
}
function consume() {
  for (const id of result.consume ?? []) if (!seen.includes(id)) seen.push(id);
  seen = seen.slice(-200);
  store.set(key, seen);
}
function finish() {
  if (result.state !== "REPLAYING") return;
  cancelAnimationFrame(raf);
  consume();
  point = result.point;
  result.state = "SETTLED";
  frame = 0;
  drawAnchors();
  drawRoute();
  status();
}
function loadScene() {
  cancelAnimationFrame(raf);
  raf = 0;
  staticChange = false;
  remote = false;
  input = scenario(name);
  if (name === "seen") {
    const r = decide({ ...input, seen: [] });
    for (const id of r.consume ?? []) if (!seen.includes(id)) seen.push(id);
    store.set(key, seen);
  }
  result = decide({ ...input, seen });
  point = result.point;
  result.displaySegments = result.segments;
  focus();
  if (result.state === "MOVEMENT_AVAILABLE") {
    if (
      $("motion").checked ||
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !storageOK ||
      result.long
    ) {
      staticChange = true;
      consume();
      result.state = "SETTLED";
    } else {
      point = result.segments[0].from;
      result.state = "REPLAYING";
      replays++;
      const start = performance.now();
      const segments = result.segments;
      const animate = (now) => {
        if (result.state !== "REPLAYING") return;
        const progress = Math.min(1, (now - start) / CONFIG.replayMs),
          v = progress * segments.length,
          index = Math.min(segments.length - 1, Math.floor(v)),
          seg = segments[index],
          f = progress === 1 ? 1 : v - index;
        point = seg.from.map((c, i) => c + (seg.to[i] - c) * f);
        direction = seg.to[0] >= seg.from[0] ? 1 : -1;
        frame = Math.floor((now - start) / 100) % 8;
        drawAnchors();
        if (progress === 1) finish();
        else raf = requestAnimationFrame(animate);
      };
      raf = requestAnimationFrame(animate);
    }
  }
  drawAnchors();
  drawRoute();
  status();
}
function detailContent() {
  const body = $("detailBody");
  let title, content;
  if (detailKind === "lin" || detailKind === "yu") {
    const who = detailKind;
    title = t(who === "lin" ? "personTitle" : "yuTitle");
    const state = who === "yu" ? "cup" : pose;
    content = `<div class="portrait">${character(who, state === "expired" ? "idle" : state)}<div><strong>${t(who)}</strong><p>${t(state === "expired" ? "expired" : state)}</p></div></div><p class="location-nature">${who === "lin" && result.state === "SHARING_PAUSED" ? t("paused") : who === "lin" && !point ? t("nodata") : name === "far" && who === "yu" ? t("remote").replace("<br/>", " · ") : t("locationHint")}</p>${who === "lin" && ["SHARING_PAUSED", "INSUFFICIENT_DATA"].includes(result.state) ? `<p>${t("nodata")}</p>` : ""}`;
  }
  if (detailKind === "moment") {
    title = t("momentTitle");
    content = `<p>${t("momentCopy")}</p><p>${t("momentHint")}</p>`;
  }
  if (detailKind === "unplaced") {
    title = t("unplacedTitle");
    content = `<p>${t("unplacedCopy")}</p>`;
  }
  if (detailKind === "create") {
    title = t("composerTitle");
    content = `<p>${t("composerHint")}</p><label for="draft">${t("draft")}</label><textarea id="draft" maxlength="200"></textarea><button id="doneDraft">${t("done")}</button>`;
  }
  if (detailKind === "identity") {
    title = t("avatarTitle");
    content = `<p>${t("avatarHint")}</p><div class="portrait">${character("lin", "idle")}${character("lin", "read")}${character("yu", "cup")}</div><p>${t("flow")}</p><button id="selectIdentity">${t("selectExample")}</button><p id="identityResult" role="status"></p>`;
  }
  body.innerHTML = `<h2 id="detailTitle">${title}</h2>${content}`;
  if ($("doneDraft")) $("doneDraft").onclick = closeDetail;
  if ($("selectIdentity"))
    $("selectIdentity").onclick = () => {
      $("identityResult").textContent = t("selected");
    };
}
let detailTrigger = null;
function openDetail(kind) {
  if (!$("detail").contains(document.activeElement))
    detailTrigger = document.activeElement;
  $("debug").hidden = true;
  setLocate(false);
  detailKind = kind;
  detailContent();
  if (!$("detail").open) $("detail").show();
  drawAnchors();
  $("closeDetail").focus();
}
function closeDetail() {
  $("detail").close();
  detailKind = null;
  drawAnchors();
  if (detailTrigger?.isConnected) detailTrigger.focus();
}
$("closeDetail").onclick = closeDetail;
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if ($("detail").open) closeDetail();
    else if (!$("residents").hidden) {
      setLocate(false);
      $("locate").focus();
    } else if (!$("debug").hidden) $("debugClose").click();
  }
});
function setLocate(open) {
  $("residents").hidden = !open;
  $("locate").setAttribute("aria-expanded", String(open));
}
$("locate").onclick = () => {
  if ($("detail").open) closeDetail();
  $("debug").hidden = true;
  setLocate($("residents").hidden);
};
$("debugToggle").onclick = () => {
  if ($("detail").open) closeDetail();
  setLocate(false);
  $("debug").hidden = !$("debug").hidden;
};
$("debugClose").onclick = () => {
  $("debug").hidden = true;
  $("debugToggle").focus();
};
$("scenario").onchange = (e) => {
  name = e.target.value;
  store.set("our-space-prototype:scenario", name);
  loadScene();
};
$("reopen").onclick = () => {
  finish();
  loadScene();
};
$("reset").onclick = () => {
  cancelAnimationFrame(raf);
  seen = [];
  store.set(key, seen);
  replays = 0;
  loadScene();
};
$("locale").onclick = () => {
  locale = locale === "zh-CN" ? "en-US" : "zh-CN";
  store.set("our-space-prototype:locale", locale);
  text();
};
$("skip").onclick = finish;
$("motion").onchange = () => {
  if ($("motion").checked) {
    staticChange = true;
    finish();
  }
};
matchMedia("(prefers-reduced-motion: reduce)").addEventListener(
  "change",
  (e) => {
    if (e.matches) {
      staticChange = true;
      finish();
    }
  },
);
$("pose").onchange = (e) => {
  pose = e.target.value;
  drawAnchors();
  status();
};
$("focusLin").onclick = () => {
  setLocate(false);
  if (!point) openDetail("lin");
  else focus("lin");
};
$("focusYu").onclick = () => {
  setLocate(false);
  focus("yu");
};
$("center").onclick = () => focus();
for (const [id, k] of [
  ["create", "create"],
  ["unplaced", "unplaced"],
  ["account", "identity"],
  ["identity", "identity"],
])
  $(id).onclick = () => openDetail(k);
function zoom(delta) {
  camera.scale = Math.max(0.5, Math.min(2.5, camera.scale * delta));
  applyCamera();
}
$("zoomIn").onclick = () => zoom(1.2);
$("zoomOut").onclick = () => zoom(1 / 1.2);
let drag,
  suppressClickUntil = 0;
$("map").addEventListener("pointerdown", (e) => {
  drag = {
    x: e.clientX,
    y: e.clientY,
    cx: camera.x,
    cy: camera.y,
    moved: false,
  };
});
$("map").addEventListener("pointermove", (e) => {
  if (!drag) return;
  if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6 && !drag.moved)
    return;
  drag.moved = true;
  $("map").setPointerCapture(e.pointerId);
  camera.x = drag.cx - (e.clientX - drag.x) / camera.scale;
  camera.y = drag.cy - (e.clientY - drag.y) / camera.scale;
  applyCamera();
});
for (const event of ["pointerup", "pointercancel"])
  $("map").addEventListener(event, () => {
    if (drag?.moved) suppressClickUntil = performance.now() + 150;
    drag = null;
  });
$("map").addEventListener("keydown", (e) => {
  if (e.target !== $("map")) return;
  const delta = {
    ArrowLeft: [-50, 0],
    ArrowRight: [50, 0],
    ArrowUp: [0, -50],
    ArrowDown: [0, 50],
  }[e.key];
  if (delta) {
    e.preventDefault();
    camera.x += delta[0] / camera.scale;
    camera.y += delta[1] / camera.scale;
    applyCamera();
  }
  if (e.key === "+") zoom(1.2);
  if (e.key === "-") zoom(1 / 1.2);
});
window.addEventListener("resize", applyCamera);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) finish();
});
$("account").innerHTML =
  `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3"/><path d="M5 21v-3a7 7 0 0 1 14 0v3"/></svg>`;
try {
  const response = await fetch("./geography.json");
  if (!response.ok) throw Error("地理文件读取失败");
  geography = await response.json();
  text();
  loadScene();
} catch {
  $("statusTitle").textContent = t("mapError");
}
