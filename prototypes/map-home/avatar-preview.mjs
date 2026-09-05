// 从真实 SVG 绘制代码生成对照；4× 预览放大原尺寸 PNG，不重新矢量渲染。
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { character } from "./characters.mjs";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const output =
  process.env.PROTOTYPE_OUTPUT ??
  path.join(tmpdir(), "our-space-avatar-redraw");
// 此 ref 只用于读取已核实旧素材；绝不切换或重置工作树。
const beforeRef =
  process.env.AVATAR_BEFORE_REF ?? "b2d9b8f1f821cd123e3ba3704d0ae69f37904747";
const oldSource = execFileSync(
  "git",
  ["show", `${beforeRef}:prototypes/map-home/characters.mjs`],
  { cwd: root, encoding: "utf8" },
);
const { character: previous } = await import(
  `data:text/javascript;base64,${Buffer.from(oldSource).toString("base64")}`
);
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 640, height: 760 },
    deviceScaleFactor: 1,
  });
  const renders = [];
  const headCoverage = [];
  for (const [person, pose, label] of [
    ["lin", "read", "小林 · 长发 / 专注看书"],
    ["yu", "cup", "小雨 · 短发 / 奶茶小憩"],
  ]) {
    for (const [version, fn] of [
      ["before", previous],
      ["after", character],
    ]) {
      const svg = fn(person, pose);
      if (version === "after") {
        const coverage = await page.evaluate(async (source) => {
          const parsed = new DOMParser().parseFromString(
            source,
            "image/svg+xml",
          ).documentElement;
          const serialize = (e) => new XMLSerializer().serializeToString(e);
          const onlyHead = parsed.cloneNode(true);
          onlyHead.querySelector('[data-part="body"]').remove();
          onlyHead.querySelector("[data-prop]")?.remove();
          const onlyProp = parsed.cloneNode(true);
          onlyProp.querySelector('[data-part="head"]').remove();
          onlyProp.querySelector('[data-part="body"]').remove();
          const pixels = async (svg) => {
            const canvas = document.createElement("canvas");
            canvas.width = 480;
            canvas.height = 500;
            const ctx = canvas.getContext("2d");
            const img = new Image();
            img.src =
              "data:image/svg+xml;base64," +
              btoa(unescape(encodeURIComponent(svg)));
            await img.decode();
            ctx.drawImage(img, 0, 0, 480, 500);
            return ctx.getImageData(0, 0, 480, 500).data;
          };
          const [all, head, prop] = await Promise.all([
            pixels(source),
            pixels(serialize(onlyHead)),
            pixels(serialize(onlyProp)),
          ]);
          let total = 0,
            visibleHead = 0;
          for (let i = 3; i < all.length; i += 4) {
            if (all[i] > 127) total++;
            if (head[i] > 127 && prop[i] <= 127) visibleHead++;
          }
          return +(visibleHead / total).toFixed(3);
        }, svg);
        headCoverage.push({ person, visibleHeadFraction: coverage });
      }

      await fs.writeFile(path.join(output, `${person}-${version}.svg`), svg);
      await page.setContent(
        `<style>body{margin:0}.sample{width:64px;height:68px;padding:2px;background:#fff4df}svg{width:60px;height:62.5px;filter:drop-shadow(0 2px 0 #84725c)}</style><div class="sample">${svg}</div>`,
      );
      const png = await page
        .locator(".sample")
        .screenshot({ path: path.join(output, `${person}-${version}-1x.png`) });
      renders.push({
        person,
        version,
        label,
        url: `data:image/png;base64,${png.toString("base64")}`,
      });
    }
  }
  const sheet = (scale) =>
    `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>人物实际素材对照</title><style>*{box-sizing:border-box}body{margin:0;background:#f4eddf;color:#463c32;font-family:system-ui,"PingFang SC",sans-serif}.sheet{padding:24px;width:${scale === 1 ? 440 : 608}px}h1{font-size:20px;margin:0 0 6px}p{font-size:12px;color:#665a4d;margin:0 0 20px}.cols,.row{display:grid;grid-template-columns:1fr 1fr;gap:16px;text-align:center}.cols{font-size:13px;margin:0 0 6px}.label{font-size:13px;font-weight:600;margin:18px 0 10px}.row>div{background:#fff4df;display:flex;align-items:center;justify-content:center;padding:${scale === 1 ? 12 : 0}px}img{display:block;width:${64 * scale}px;height:${68 * scale}px;image-rendering:pixelated}</style><div class="sheet"><h1>${scale === 1 ? "正常手机显示尺寸" : "4 倍最近邻 · 像素细节"}</h1><p>${scale === 1 ? "头像宽度均为 60px，画布及 CSS 尺寸保持不变。" : "将原尺寸 64×68 PNG（含留白）逐像素放大 4 倍。"}</p><div class="cols"><span>旧版 · 头肩像</span><span>新版 · 大头角色</span></div>${[
      "lin",
      "yu",
    ]
      .map(
        (person) =>
          `<div class="label">${renders.find((r) => r.person === person).label}</div><div class="row">${renders
            .filter((r) => r.person === person)
            .map(
              (r) =>
                `<div><img alt="${r.person} ${r.version}" src="${r.url}"></div>`,
            )
            .join("")}</div>`,
      )
      .join("")}</div></html>`;
  for (const scale of [1, 4]) {
    const html = sheet(scale);
    await fs.writeFile(path.join(output, `comparison-${scale}x.html`), html);
    await page.setContent(html);
    await page
      .locator("img")
      .evaluateAll((es) => Promise.all(es.map((e) => e.decode())));
    await page
      .locator(".sheet")
      .screenshot({ path: path.join(output, `comparison-${scale}x.png`) });
  }
  await fs.writeFile(
    path.join(output, "preview-evidence.json"),
    JSON.stringify(
      {
        beforeRef,
        headCoverage,
        source: "prototypes/map-home/characters.mjs",
        display: { width: 60, height: 62.5 },
        raster: { width: 64, height: 68, padding: 2 },
        detailScale: 4,
        method: "实际 SVG → Chromium 1× PNG → image-rendering:pixelated 4×",
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`实际素材对照已生成：${output}`);
  console.log(JSON.stringify({ headCoverage }));
} finally {
  await browser.close();
}
