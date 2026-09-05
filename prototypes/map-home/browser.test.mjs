import { chromium } from "playwright";
import { format } from "prettier";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
const output =
  process.env.PROTOTYPE_OUTPUT ??
  path.join(tmpdir(), "our-space-map-home-v2-evidence");
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
let checks = 0;
const pass = () => checks++;
try {
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
  });
  const page = await context.newPage();
  const errors = [],
    external = [],
    requests = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    requests.push(r.url());
    if (!r.url().startsWith("http://127.0.0.1:4173/")) external.push(r.url());
  });
  await page.addInitScript(() => {
    window.locationCalls = 0;
    navigator.geolocation.getCurrentPosition = () => {
      window.locationCalls++;
      throw Error("禁止定位");
    };
    navigator.geolocation.watchPosition = () => {
      window.locationCalls++;
      throw Error("禁止定位");
    };
  });
  const response = await page.goto("http://127.0.0.1:4173");
  assert.match(response.headers()["permissions-policy"], /geolocation=\(\)/);
  await page.waitForSelector("#residentLin");
  await page.bringToFront();
  pass();
  const state = () => page.locator("body").getAttribute("data-state");
  async function scene(name) {
    if (!(await page.locator("#debug").isVisible()))
      await page.locator("#debugToggle").click();
    await page.locator("#scenario").selectOption(name);
    await page.bringToFront();
  }
  assert.equal(await state(), "NO_CHANGE");
  const before = await page.locator("#residentLin").getAttribute("style");
  await page.waitForTimeout(400);
  assert.equal(
    await page.locator("#residentLin").getAttribute("style"),
    before,
  );
  pass();
  await page.screenshot({ path: path.join(output, "mobile-quiet.png") });
  await scene("move");
  assert.equal(await state(), "REPLAYING");
  const first = await page.locator("#residentLin").getAttribute("style");
  await page.waitForFunction(
    (before) =>
      document.querySelector("#residentLin")?.getAttribute("style") !== before,
    first,
    { timeout: 4000, polling: 50 },
  );
  assert.notEqual(
    await page.locator("#residentLin").getAttribute("style"),
    first,
  );
  await page.locator("#debugClose").click();
  await page.screenshot({ path: path.join(output, "mobile-moving.png") });
  await page.waitForFunction(
    () => document.body.dataset.state === "SETTLED",
    null,
    { polling: 50, timeout: 6000 },
  );
  pass();
  await page.screenshot({ path: path.join(output, "mobile-settled.png") });
  const settled = await page.locator("#residentLin").getAttribute("style");
  await page.waitForTimeout(200);
  assert.equal(
    await page.locator("#residentLin").getAttribute("style"),
    settled,
  );
  await page.reload();
  await page.waitForSelector("#residentLin");
  assert.equal(await state(), "SETTLED");
  assert.equal(await page.locator("body").getAttribute("data-replays"), "0");
  await page.locator("#locale").click();
  assert.equal(await state(), "SETTLED");
  pass();
  for (const [name, expected] of Object.entries({
    seen: "SETTLED",
    baseline: "NO_BASELINE",
    noise: "NO_CHANGE",
    nodata: "INSUFFICIENT_DATA",
    stale: "INSUFFICIENT_DATA",
    paused: "SHARING_PAUSED",
    gap: "INSUFFICIENT_DATA",
  })) {
    await scene(name);
    assert.equal(await state(), expected);
    if (["nodata", "stale", "paused", "gap"].includes(name))
      assert.equal(await page.locator("#residentLin").count(), 0);
    pass();
  }
  await scene("sampled");
  await page.locator("#reset").click();
  assert.equal(await state(), "REPLAYING");
  assert.equal(
    await page.locator("#route path").first().getAttribute("stroke-dasharray"),
    "none",
  );
  await page.locator("#skip").click();
  assert.equal(await state(), "SETTLED");
  await page.locator("#reopen").click();
  assert.equal(await state(), "SETTLED");
  pass();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await scene("move");
  await page.locator("#reset").click();
  assert.equal(await state(), "SETTLED");
  assert.equal(await page.locator("#skip").isVisible(), false);
  assert.equal(
    await page.locator("#route path").first().getAttribute("stroke-dasharray"),
    "5 7",
  );
  pass();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.locator("#motion").check();
  await scene("return");
  await page.locator("#reset").click();
  assert.equal(await state(), "SETTLED");
  pass();
  await page.locator("#motion").uncheck();
  await scene("quiet");
  await page.locator("#debugClose").click();
  await page.locator("#map").focus();
  await page.keyboard.press("ArrowRight");
  const camera = await page.locator("#world").getAttribute("transform");
  await page.locator("#residentLin").click();
  assert.equal(await page.locator("#detail").isVisible(), true);
  await page.locator("#closeDetail").click();
  assert.equal(await page.locator("#world").getAttribute("transform"), camera);
  await page.locator("#lifeMarker").click();
  assert.match(await page.locator("#detailBody").innerText(), /LifePoint/);
  await page.keyboard.press("Escape");
  pass();
  await page.locator("#unplaced").click();
  assert.match(
    await page.locator("#detailBody").innerText(),
    /coordinates|坐标/,
  );
  await page.keyboard.press("Escape");
  pass();
  await scene("far");
  await page.locator("#debugClose").click();
  await page.locator("#locate").click();
  await page.locator("#focusYu").click();
  assert.equal(await page.locator("#remoteNote").isVisible(), true);
  assert.equal(await page.locator("#geography").isVisible(), false);
  await page.locator("#locate").click();
  await page.locator("#focusLin").click();
  assert.equal(await page.locator("#remoteNote").isVisible(), false);
  pass();
  await scene("quiet");
  await page.locator("#pose").selectOption("expired");
  await page.locator("#debugClose").click();
  await page.locator("#residentLin").click();
  assert.match(
    await page.locator("#detailBody").innerText(),
    /old action|旧状态/,
  );
  await page.keyboard.press("Escape");
  pass();
  // V2 保留原有语义检查，增加头像、面板、手势和信息层级证据。
  await scene("quiet");
  await page.locator("#pose").selectOption("read");
  await page.locator("#debugClose").click();
  for (const id of ["residentLin", "residentYu"]) {
    assert.equal(
      await page.locator(`#${id} svg[data-kind="head-shoulders"]`).count(),
      1,
    );
    assert.equal(await page.locator(`#${id} [data-prop]`).count(), 1);
    assert.equal(
      await page.locator(`#${id} svg`).getAttribute("aria-hidden"),
      "true",
    );
    assert.doesNotMatch(
      await page.locator(`#${id} .name`).innerText(),
      /示例|example/,
    );
    assert.match(
      await page.locator(`#${id}`).getAttribute("aria-label"),
      /Reading|milk tea|读|奶茶/,
    );
  }
  assert.equal(await page.locator("#replayNote").isVisible(), false);
  assert.equal(await page.locator(".intro").count(), 0);
  assert.equal(await page.locator("#residents").isVisible(), false);
  assert.match(
    await page.locator(".prototype-label").innerText(),
    /交互原型|Prototype/,
  );
  assert.match(
    await page.locator(".attribution").getAttribute("href"),
    /openstreetmap.org\/copyright/,
  );
  pass();
  await page.locator("#residentLin").click();
  await page.locator("#residentYu").click();
  assert.equal(await page.locator("dialog[open]").count(), 1);
  assert.match(await page.locator("#detailBody").innerText(), /Yu|小雨/);
  const selectedCamera = await page.locator("#world").getAttribute("transform");
  await page.locator("#detailTitle").click();
  assert.equal(
    await page.locator("#world").getAttribute("transform"),
    selectedCamera,
  );
  await page.keyboard.press("Escape");
  assert.equal(
    await page.evaluate(() => document.activeElement.id),
    "residentYu",
  );
  pass();
  await page.locator("#residentLin").focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.locator("#detail").isVisible(), true);
  await page.locator("#closeDetail").click();
  assert.equal(
    await page.evaluate(() => document.activeElement.id),
    "residentLin",
  );
  pass();
  const avatarBox = await page.locator("#residentLin").boundingBox();
  await page.mouse.move(avatarBox.x + 30, avatarBox.y + 30);
  await page.mouse.down();
  await page.mouse.move(avatarBox.x + 70, avatarBox.y + 50, { steps: 8 });
  await page.mouse.up();
  assert.equal(await page.locator("#detail").isVisible(), false);
  assert.notEqual(
    await page.locator("#world").getAttribute("transform"),
    selectedCamera,
  );
  await page.waitForTimeout(160);
  await page.locator("#center").click();
  pass();
  await scene("move");
  await page.locator("#reset").click();
  assert.equal(
    await page.locator('#residentLin [data-prop="book"]').count(),
    1,
  );
  assert.equal(
    await page.locator("#residentLin svg").getAttribute("data-motion"),
    "moving",
  );
  await page.locator("#debugClose").click();
  const movingCamera = await page.locator("#world").getAttribute("transform");
  await page.locator("#map").focus();
  await page.keyboard.press("ArrowLeft");
  const draggedCamera = await page.locator("#world").getAttribute("transform");
  assert.notEqual(draggedCamera, movingCamera);
  await page.locator("#skip").click();
  assert.equal(
    await page.locator("#world").getAttribute("transform"),
    draggedCamera,
  );
  assert.equal(
    await page.locator('#residentLin [data-prop="book"]').count(),
    1,
  );
  assert.equal(
    await page.locator("#residentLin svg").getAttribute("data-motion"),
    "still",
  );
  pass();
  await scene("quiet");
  await page.locator("#debugClose").click();
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 850 });
    await page.locator("#center").click();
    for (const locale of ["zh-CN", "en-US"]) {
      if ((await page.locator("html").getAttribute("lang")) !== locale)
        await page.locator("#locale").click();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
      const tiny = await page
        .locator("button:visible,select:visible,a:visible")
        .evaluateAll((es) =>
          es
            .filter((e) => {
              const b = e.getBoundingClientRect();
              return b.width < 44 || b.height < 44;
            })
            .map((e) => e.id || e.tagName),
        );
      assert.deepEqual(tiny, []);
      pass();
      const head = await page.locator("#residentLin svg").boundingBox();
      assert.ok(
        width === 375
          ? head.width >= 52 && head.width <= 64
          : head.width >= 64 && head.width <= 80,
      );
      const markerBox = await page.locator("#residentLin").boundingBox();
      const bottomBox = await page.locator(".bottom").boundingBox();
      assert.ok(markerBox.y + markerBox.height < bottomBox.y);
      await page.screenshot({
        path: path.join(
          output,
          `${width === 375 ? "mobile" : "desktop"}-${locale}.png`,
        ),
      });
    }
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.locator("#center").click();
  if ((await page.locator("html").getAttribute("lang")) !== "zh-CN")
    await page.locator("#locale").click();
  await page.locator("#residentLin").click();
  const sheet = await page.locator("#detail").boundingBox();
  assert.ok(sheet.height < 812 * 0.5 && sheet.y > 350);
  const selectedHead = await page.locator("#residentLin svg").boundingBox();
  assert.ok(selectedHead.y + selectedHead.height < sheet.y);
  await page.screenshot({ path: path.join(output, "mobile-selected.png") });
  await page.keyboard.press("Escape");
  pass();
  await page.setViewportSize({ width: 1280, height: 850 });
  await scene("sampled");
  await page.locator("#reset").click();
  await page.locator("#debugClose").click();
  await page.waitForTimeout(450);
  await page.screenshot({ path: path.join(output, "desktop-moving.png") });
  await page.locator("#skip").click();
  assert.equal(await page.evaluate(() => window.locationCalls), 0);
  assert.deepEqual(external, []);
  assert.deepEqual(errors, []);
  pass();
  // 对比实际使用的文字/背景颜色，不只检查 token 是否存在。
  const colors = [
    ["#3e3831", "#fff4df"],
    ["#665a4d", "#fff4df"],
    ["#fff4df", "#536b46"],
    ["#5c5447", "#e8dcc4"],
    ["#315064", "#aecfe0"],
  ];
  const luminance = (h) => {
    const cs = h
      .slice(1)
      .match(/../g)
      .map((x) => parseInt(x, 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * cs[0] + 0.7152 * cs[1] + 0.0722 * cs[2];
  };
  const contrasts = colors.map(([fg, bg]) => {
    const a = luminance(fg),
      b = luminance(bg),
      ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    assert.ok(ratio >= 4.5);
    return { fg, bg, ratio: +ratio.toFixed(2) };
  });
  pass();
  await fs.writeFile(
    path.join(output, "verification.json"),
    await format(
      JSON.stringify(
        {
          checks,
          viewports: ["375×812", "1280×850"],
          locales: ["zh-CN", "en-US"],
          externalRequests: external.length,
          geolocationCalls: 0,
          pageErrors: errors,
          contrasts,
          requests: [...new Set(requests)],
        },
        null,
        2,
      ),
      { parser: "json" },
    ),
  );
  console.log(
    JSON.stringify({ checks, contrasts, externalRequests: 0, pageErrors: 0 }),
  );
} finally {
  await browser.close();
}
