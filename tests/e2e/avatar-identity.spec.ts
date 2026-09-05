import { PrismaClient } from "@prisma/client";
import { test, expect, type Page } from "@playwright/test";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { AuthService } from "@/server/services/auth-service";
import { SpaceService } from "@/server/services/space-service";
import { InvitationService } from "@/server/services/invitation-service";
const password = "avatar-playwright-only-fixture-password";
function database() {
  if (!process.env.TEST_DATABASE_URL)
    throw new Error("必须提供独立 TEST_DATABASE_URL");
  return new PrismaClient({
    datasources: { db: { url: process.env.TEST_DATABASE_URL } },
  });
}
async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("邮箱").fill(email);
  await page.getByLabel("密码").fill(password);
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page).toHaveURL(/\/home/);
}
async function setup(db: PrismaClient) {
  const suffix = `${Date.now()}-${test.info().project.name}`;
  const auth = new AuthService(db);
  const owner = await auth.register({
    email: `avatar-owner-${suffix}@example.com`,
    name: "阿禾",
    password,
  });
  const partner = await auth.register({
    email: `avatar-partner-${suffix}@example.com`,
    name: "小满",
    password,
  });
  await new SpaceService(db).create({
    userId: owner.id,
    name: "我们的晴天小屋",
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
  return { owner, partner };
}
async function choose(page: Page) {
  const buffer = await sharp({
    create: { width: 256, height: 256, channels: 3, background: "#bea890" },
  })
    .jpeg()
    .toBuffer();
  await page.getByLabel("选择自己的照片").setInputFiles({
    name: "controlled-test-photo.jpg",
    mimeType: "image/jpeg",
    buffer,
  });
  await expect(page.getByAltText("所选照片的本地预览")).toBeVisible();
  await page.getByRole("checkbox").check();
}
async function screenshot(page: Page, name: string) {
  const root = process.env.AVATAR_EVIDENCE_DIR;
  if (!root) return;
  await mkdir(root, { recursive: true });
  await page.screenshot({
    path: `${root}/${test.info().project.name}-${name}.png`,
    fullPage: true,
    animations: "disabled",
  });
}
test("头像上传、本人确认、Partner 授权、登出再登录持久与双语", async ({
  page,
  browser,
  request,
}) => {
  const db = database();
  const { owner, partner } = await setup(db);
  const partnerContext = await browser.newContext({
    extraHTTPHeaders: {
      "x-forwarded-for":
        test.info().project.name === "chromium"
          ? "198.51.100.71"
          : "198.51.100.72",
    },
  });
  const other = await partnerContext.newPage();
  try {
    if (test.info().project.name === "mobile-chrome")
      await page.setViewportSize({ width: 375, height: 812 });
    else await page.setViewportSize({ width: 1280, height: 850 });
    await login(page, owner.email);
    await screenshot(page, "home-before");
    await page.getByRole("link", { name: "创建我的像素形象" }).click();
    await expect(
      page.getByText("自动测试模式", { exact: false }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await screenshot(page, "entry");
    await choose(page);
    await screenshot(page, "local-preview");
    await page.getByRole("button", { name: "生成一张候选" }).click();
    await expect(
      page.getByRole("heading", { name: "先看看，喜欢这个你吗" }),
    ).toBeVisible();
    await screenshot(page, "candidate-fixture");
    const asset = await page
      .getByAltText("待本人确认的像素角色候选")
      .getAttribute("src");
    expect(asset).toBeTruthy();
    expect((await request.get(asset!)).status()).toBe(401);
    await login(other, partner.email);
    expect((await other.request.get(asset!)).status()).toBe(404);
    await expect(other.locator(".resident-pixel-avatar")).toHaveCount(0);
    await page
      .getByRole("checkbox", { name: "我选择这个形象作为我的角色" })
      .focus();
    await page.keyboard.press("Space");
    await page.getByRole("button", { name: "确认并使用" }).click();
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.locator(".resident-pixel-avatar")).toHaveAttribute(
      "src",
      asset!,
    );
    await screenshot(page, "home-confirmed-fixture");
    await other.reload();
    await expect(other.locator(".resident-pixel-avatar")).toHaveAttribute(
      "src",
      asset!,
    );
    expect((await other.request.get(asset!)).status()).toBe(200);
    expect(
      (await other.request.get(asset!)).headers()["cache-control"],
    ).toContain("no-store");
    await page.getByLabel("打开 Space 与账户菜单").click();
    await page.getByRole("button", { name: "登出" }).click();
    await expect(page).toHaveURL(/\/welcome/);
    expect((await page.request.get(asset!)).status()).toBe(401);
    await login(page, owner.email);
    await expect(page.locator(".resident-pixel-avatar")).toHaveAttribute(
      "src",
      asset!,
    );
    await page.getByRole("link", { name: "更换形象" }).click();
    await page.getByRole("button", { name: "EN English", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Change my character" }),
    ).toBeVisible();
    await screenshot(page, "replace-en");
    await page.getByRole("button", { name: "Cancel and return Home" }).click();
    await expect(page.locator(".resident-pixel-avatar")).toHaveAttribute(
      "src",
      asset!,
    );
  } finally {
    await partnerContext.close();
    await db.$disconnect();
  }
});
test("失败、取消与重生成候选不会自动替换身份", async ({ page }) => {
  const db = database();
  const { owner } = await setup(db);
  try {
    await login(page, owner.email);
    await page.getByRole("link", { name: "创建我的像素形象" }).click();
    await choose(page);
    await page.route("**/api/avatar/generate", (route) =>
      route.fulfill({
        status: 502,
        contentType: "application/json",
        body: JSON.stringify({ errorCode: "AVATAR_GENERATION_FAILED" }),
      }),
    );
    await page.getByRole("button", { name: "生成一张候选" }).click();
    await expect(page.locator("#avatar-error")).toContainText(
      "原来的形象没有改变",
    );
    await screenshot(page, "failure");
    await page.unroute("**/api/avatar/generate");
    await page.getByRole("button", { name: "生成一张候选" }).click();
    await expect(
      page.getByRole("heading", { name: "先看看，喜欢这个你吗" }),
    ).toBeVisible();
    const old = await page
      .getByAltText("待本人确认的像素角色候选")
      .getAttribute("src");
    await page.getByRole("button", { name: "重新生成", exact: true }).click();
    await expect(page.getByLabel("选择自己的照片")).toBeVisible();
    expect((await page.request.get(old!)).status()).toBe(404);
    await page.getByRole("button", { name: "生成一张候选" }).click();
    await expect(
      page.getByRole("heading", { name: "先看看，喜欢这个你吗" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "取消，回到 Home" }).click();
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.locator(".resident-pixel-avatar")).toHaveCount(0);
    expect(
      await db.mediaAsset.count({ where: { uploadedByUserId: owner.id } }),
    ).toBe(0);
  } finally {
    await db.$disconnect();
  }
});
test("未登录上传、跨站上传和非法文件被拒绝", async ({ page, request }) => {
  expect(
    (
      await request.post("/api/avatar/generate", {
        headers: { origin: "http://127.0.0.1:3000" },
        data: "x",
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.post("/api/avatar/generate", {
        headers: { origin: "https://unrelated.example" },
        data: "x",
      })
    ).status(),
  ).toBe(403);
  const db = database();
  const { owner } = await setup(db);
  try {
    await login(page, owner.email);
    const result = await page.request.post("/api/avatar/generate", {
      headers: { origin: "http://127.0.0.1:3000" },
      multipart: {
        requestId: crypto.randomUUID(),
        consent: "avatar-cloudflare-v1",
        photo: {
          name: "bad.jpg",
          mimeType: "image/jpeg",
          buffer: Buffer.from("not a jpeg"),
        },
      },
    });
    expect(result.status()).toBe(422);
    expect(
      await db.avatarGeneration.count({
        where: { resident: { userId: owner.id } },
      }),
    ).toBe(0);
  } finally {
    await db.$disconnect();
  }
});
