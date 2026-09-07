import { PrismaClient } from "@prisma/client";
import { test, expect } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import { AuthService } from "@/server/services/auth-service";
import { SpaceService } from "@/server/services/space-service";
import { InvitationService } from "@/server/services/invitation-service";
import type { Geography } from "@/lib/map/model";

const password = "map-playwright-controlled-only-password";
// 仅浏览器拦截使用隔离原型的 OSM 快照验证 renderer；不进入生产 bundle/cache。
async function geographyFixture(): Promise<Geography> {
  const raw = JSON.parse(
    await readFile("prototypes/map-home/geography.json", "utf8"),
  );
  return {
    bounds: raw.bbox,
    attribution: "OpenStreetMap contributors",
    fetchedAt: raw.timestamp,
    features: raw.features
      .filter((f: { kind: string }) =>
        ["water", "park", "building", "road"].includes(f.kind),
      )
      .map(
        (f: {
          id: string;
          kind: string;
          coordinates: number[][];
          class?: string;
        }) => ({
          id: f.id,
          kind: f.kind,
          rings: [f.coordinates],
          roadClass: f.class,
        }),
      ),
  };
}
test("正式地图 Home：主动浏览、真实成员、无位置入口、双语和视野交互", async ({
  page,
  request,
}) => {
  if (!process.env.TEST_DATABASE_URL) throw new Error("必须使用独立测试库");
  const db = new PrismaClient({
    datasources: { db: { url: process.env.TEST_DATABASE_URL } },
  });
  const suffix = `${Date.now()}-${test.info().project.name}`;
  try {
    expect((await request.get("/api/map?area=paris-seine")).status()).toBe(401);
    const auth = new AuthService(db);
    const owner = await auth.register({
      email: `map-owner-${suffix}@example.com`,
      name: "阿禾",
      password,
    });
    const partner = await auth.register({
      email: `map-partner-${suffix}@example.com`,
      name: "小满",
      password,
    });
    await new SpaceService(db).create({
      userId: owner.id,
      name: "一起慢慢生活",
      displayName: owner.name,
    });
    const invitation = await new InvitationService(db).create({
      userId: owner.id,
      email: partner.email,
    });
    await new InvitationService(db).accept({
      userId: partner.id,
      email: partner.email,
      token: invitation.token,
      displayName: partner.name,
    });
    if (test.info().project.name === "mobile-chrome")
      await page.setViewportSize({ width: 375, height: 812 });
    else await page.setViewportSize({ width: 1280, height: 850 });
    let mapRequests = 0;
    await page.route("**/api/map?*", async (route) => {
      mapRequests++;
      await route.fulfill({ json: await geographyFixture() });
    });
    await page.goto("/login");
    await page.getByLabel("邮箱").fill(owner.email);
    await page.getByLabel("密码").fill(password);
    await page.getByRole("button", { name: "登录", exact: true }).click();
    await expect(page).toHaveURL(/\/home/);
    await expect(
      page.getByRole("heading", { name: "一起慢慢生活" }),
    ).toBeVisible();
    await expect(page.locator(".resident-location-note")).toBeVisible();
    expect(mapRequests).toBe(0);
    await page
      .getByRole("button", { name: "巴黎 · 塞纳河畔", exact: true })
      .click();
    expect(
      await page
        .locator(".map-home")
        .evaluate((el) => el.getBoundingClientRect().width),
    ).toBeGreaterThan((page.viewportSize()?.width ?? 375) * 0.95);
    const map = page.getByRole("img", { name: /像素地图/ });
    await expect(map).toBeVisible();
    await expect(page.locator(".resident-avatar")).toHaveCount(2);
    await expect(page.locator(".resident-pixel-avatar")).toHaveCount(0);
    await expect(page.locator("[data-latitude], [data-longitude]")).toHaveCount(
      0,
    );
    await page.getByRole("button", { name: "放大地图", exact: true }).click();
    const transform = await map
      .locator("g[transform]")
      .first()
      .getAttribute("transform");
    await page.getByRole("button", { name: "小满", exact: true }).click();
    await page.getByRole("button", { name: "小满", exact: true }).click();
    expect(
      await map.locator("g[transform]").first().getAttribute("transform"),
    ).toBe(transform);
    await page.getByRole("button", { name: "回到原始地图视野" }).click();
    await page.getByRole("button", { name: "写下我的此刻" }).click();
    await page.getByLabel("此刻的我").fill("在阳光里坐一会儿");
    await page.getByRole("button", { name: "保存", exact: true }).click();
    await expect(page.getByLabel("此刻的我")).toHaveCount(0);
    await expect(page.locator(".presence-line")).toContainText([
      "",
      "在阳光里坐一会儿",
    ]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    if (process.env.MAP_EVIDENCE_DIR) {
      await mkdir(process.env.MAP_EVIDENCE_DIR, { recursive: true });
      await page.screenshot({
        path: `${process.env.MAP_EVIDENCE_DIR}/${test.info().project.name}-map-offline-fixture.png`,
        fullPage: true,
      });
    }
    await page.reload();
    await expect(page.getByRole("img", { name: /像素地图/ })).toBeVisible();
    await page.getByRole("button", { name: "EN English", exact: true }).click();
    await expect(page.getByRole("button", { name: "Zoom in" })).toBeVisible();
    await expect(page.locator(".resident-location-note")).toBeVisible();
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(
      await page.evaluate(
        () => matchMedia("(prefers-reduced-motion: reduce)").matches,
      ),
    ).toBe(true);
  } finally {
    await db.$disconnect();
  }
});
