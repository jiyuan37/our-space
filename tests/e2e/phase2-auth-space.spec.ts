import { PrismaClient } from "@prisma/client";
import { expect, test, type Page } from "@playwright/test";

import { OwnerPermissionRequiredError } from "@/server/errors/domain-error";
import { InvitationService } from "@/server/services/invitation-service";

const password = "playwright-local-fake-password-安全";

async function register(page: Page, name: string, email: string) {
  await page.getByLabel("你的名字").fill(name);
  await page.getByLabel("邮箱").fill(email);
  await page.getByLabel("密码（15–128 个字符）").fill(password);
  await page.getByRole("button", { name: "创建账户" }).click();
}

async function login(page: Page, email: string) {
  await page.getByLabel("邮箱").fill(email);
  await page.getByLabel("密码").fill(password);
  const credentialsResponse = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      response.request().method() === "POST" &&
      url.pathname === "/api/auth/callback/credentials"
    );
  });
  await page.getByRole("button", { name: "登录" }).click();
  expect((await credentialsResponse).ok()).toBe(true);
}

function database() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("Phase 2 E2E 必须提供 TEST_DATABASE_URL");
  return new PrismaClient({ datasources: { db: { url } } });
}

test("两名 User 通过 callback 加入，第三人和非 OWNER 被拒绝", async ({
  page,
  browser,
}) => {
  const suffix = `${Date.now()}-${test.info().project.name}`;
  const ipPrefix = test.info().project.name === "chromium" ? "10" : "20";
  const ownerEmail = `owner-${suffix}@example.com`;
  const guestEmail = `guest-${suffix}@example.com`;
  const thirdEmail = `third-${suffix}@example.com`;
  const db = database();

  try {
    await page.goto("/register");
    await register(page, "Yuan", ownerEmail);
    await expect(page).toHaveURL(/\/login/);
    await login(page, ownerEmail);
    await expect(page).toHaveURL(/\/space/, { timeout: 15_000 });

    await page.getByLabel("Space 名称").fill("Our E2E Home");
    await page.getByRole("button", { name: "Create our space" }).click();
    await expect(
      page.getByRole("heading", { name: "You are home" }),
    ).toBeVisible();
    await page.getByLabel("邀请邮箱（可选）").fill(guestEmail);
    await page
      .getByRole("button", { name: "Invite someone important" })
      .click();
    const invitationUrl = await page.getByLabel("邀请链接").inputValue();
    const invitationPath = new URL(invitationUrl).pathname;

    const guestContext = await browser.newContext({
      extraHTTPHeaders: { "x-forwarded-for": `198.51.100.${ipPrefix}1` },
    });
    const guestPage = await guestContext.newPage();
    await guestPage.goto(invitationUrl);
    await expect(guestPage.getByText("Our E2E Home")).toBeVisible();
    await guestPage.getByRole("link", { name: "注册" }).click();
    await expect(guestPage).toHaveURL(/\/register\?callbackUrl=/);
    await register(guestPage, "Lin", guestEmail);
    await expect(guestPage).toHaveURL(/\/login\?registered=1&callbackUrl=/);
    await login(guestPage, guestEmail);
    await expect
      .poll(() => new URL(guestPage.url()).pathname === invitationPath, {
        message: "第二名 User 登录后应返回原 invitation",
        timeout: 15_000,
      })
      .toBe(true);
    await expect(guestPage.getByText(/Yuan 邀请你/)).toBeVisible();
    await guestPage.getByRole("button", { name: "接受邀请" }).click();
    await expect(
      guestPage.getByRole("heading", { name: "You are home" }),
    ).toBeVisible();

    const owner = await db.user.findUniqueOrThrow({
      where: { email: ownerEmail },
    });
    const guest = await db.user.findUniqueOrThrow({
      where: { email: guestEmail },
    });
    const ownerResident = await db.resident.findFirstOrThrow({
      where: { userId: owner.id, status: "ACTIVE" },
    });
    expect(
      await db.resident.count({
        where: { spaceId: ownerResident.spaceId, status: "ACTIVE" },
      }),
    ).toBe(2);
    await expect(
      new InvitationService(db).create({ userId: guest.id }),
    ).rejects.toBeInstanceOf(OwnerPermissionRequiredError);

    await page.reload();
    await page.getByLabel("邀请邮箱（可选）").fill("");
    await page
      .getByRole("button", { name: "Invite someone important" })
      .click();
    const fullInvitationUrl = await page.getByLabel("邀请链接").inputValue();
    const fullInvitationPath = new URL(fullInvitationUrl).pathname;

    const thirdContext = await browser.newContext({
      extraHTTPHeaders: { "x-forwarded-for": `198.51.100.${ipPrefix}2` },
    });
    const thirdPage = await thirdContext.newPage();
    await thirdPage.goto(fullInvitationUrl);
    await thirdPage.getByRole("link", { name: "注册" }).click();
    await register(thirdPage, "Third", thirdEmail);
    await expect(thirdPage).toHaveURL(/\/login\?registered=1&callbackUrl=/);
    await login(thirdPage, thirdEmail);
    await expect
      .poll(() => new URL(thirdPage.url()).pathname === fullInvitationPath, {
        message: "第三名 User 登录后应返回原 invitation",
        timeout: 15_000,
      })
      .toBe(true);
    await expect(thirdPage.getByText(/Yuan 邀请你/)).toBeVisible();
    await expect(
      thirdPage.getByRole("button", { name: "接受邀请" }),
    ).toBeVisible();
    await thirdPage.getByRole("button", { name: "接受邀请" }).click();
    await expect(
      thirdPage
        .getByRole("alert")
        .filter({ hasText: "这个 Space 已经住满了。" }),
    ).toHaveText("这个 Space 已经住满了。");
    expect(
      await db.resident.count({
        where: { spaceId: ownerResident.spaceId, status: "ACTIVE" },
      }),
    ).toBe(2);

    await thirdContext.close();
    await guestContext.close();
  } finally {
    await db.$disconnect();
  }
});

test("未登录用户无法访问认证后页面", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/space");
  await expect(page).toHaveURL(/\/login/);
});
