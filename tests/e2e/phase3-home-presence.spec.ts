import { PrismaClient } from "@prisma/client";
import { expect, test, type Browser, type Page } from "@playwright/test";

import { AuthService } from "@/server/services/auth-service";
import { InvitationService } from "@/server/services/invitation-service";
import { SpaceService } from "@/server/services/space-service";

const password = "phase-three-playwright-password-安全";

function database() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("Phase 3 E2E 必须提供 TEST_DATABASE_URL");
  return new PrismaClient({ datasources: { db: { url } } });
}

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("邮箱").fill(email);
  await page.getByLabel("密码").fill(password);
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page).toHaveURL(/\/home/, { timeout: 15_000 });
}

async function signedInPage(browser: Browser, email: string, ip: string) {
  const context = await browser.newContext({
    extraHTTPHeaders: { "x-forwarded-for": ip },
  });
  const page = await context.newPage();
  await login(page, email);
  return { context, page };
}

test("两位 Resident 共享当天 Presence，但只能编辑与清除自己", async ({
  browser,
}) => {
  const db = database();
  const suffix = `${Date.now()}-${test.info().project.name}`;
  const ownerEmail = `phase3-owner-${suffix}@example.com`;
  const guestEmail = `phase3-guest-${suffix}@example.com`;

  try {
    const auth = new AuthService(db);
    const owner = await auth.register({
      email: ownerEmail,
      name: "Yuan",
      password,
    });
    const guest = await auth.register({
      email: guestEmail,
      name: "Lin",
      password,
    });
    await new SpaceService(db).create({
      userId: owner.id,
      name: "安静的小屋",
      displayName: owner.name,
    });
    const invitation = await new InvitationService(db).create({
      userId: owner.id,
      email: guest.email,
    });
    await new InvitationService(db).accept({
      userId: guest.id,
      token: invitation.token,
      email: guest.email,
      displayName: guest.name,
    });

    const ownerSession = await signedInPage(
      browser,
      ownerEmail,
      `198.51.100.${test.info().project.name === "chromium" ? "31" : "41"}`,
    );
    const guestSession = await signedInPage(
      browser,
      guestEmail,
      `198.51.100.${test.info().project.name === "chromium" ? "32" : "42"}`,
    );

    await expect(
      ownerSession.page.getByRole("heading", { name: "安静的小屋" }),
    ).toBeVisible();
    await expect(ownerSession.page.getByText("今天这里很安静。")).toBeVisible();
    await expect(
      ownerSession.page.getByRole("heading", { name: "Lin" }),
    ).toBeVisible();
    await expect(
      ownerSession.page.getByRole("heading", { name: "Yuan" }),
    ).toBeVisible();
    await expect(
      ownerSession.page.getByRole("button", { name: "写下我的此刻" }),
    ).toHaveCount(1);

    await ownerSession.page
      .getByRole("button", { name: "写下我的此刻" })
      .click();
    await ownerSession.page.getByLabel("此刻的我").fill("在窗边读书");
    await ownerSession.page.getByRole("button", { name: "保存" }).click();
    await expect(ownerSession.page.getByLabel("此刻的我")).toHaveCount(0);
    await expect(
      ownerSession.page.locator(".presence-line").getByText("在窗边读书"),
    ).toBeVisible();

    await guestSession.page.reload();
    await expect(guestSession.page.getByText("在窗边读书")).toBeVisible();
    await expect(
      guestSession.page.getByRole("button", { name: "写下我的此刻" }),
    ).toHaveCount(1);
    await expect(
      guestSession.page.getByRole("button", { name: "更新我的此刻" }),
    ).toHaveCount(0);
    await ownerSession.page
      .getByRole("button", { name: "更新我的此刻" })
      .click();
    await ownerSession.page
      .getByRole("button", { name: "让这里安静一会儿" })
      .click();
    await expect(ownerSession.page.getByLabel("此刻的我")).toHaveCount(0);
    await expect(ownerSession.page).toHaveURL(/\/home/);
    await expect(ownerSession.page.getByText("在窗边读书")).toHaveCount(0);
    await expect(ownerSession.page.getByText("今天这里很安静。")).toBeVisible();

    await guestSession.page.reload();
    await expect(guestSession.page.getByText("今天这里很安静。")).toBeVisible();

    const ownerResident = await db.resident.findFirstOrThrow({
      where: { userId: owner.id, status: "ACTIVE" },
    });
    const guestResident = await db.resident.findFirstOrThrow({
      where: { userId: guest.id, status: "ACTIVE" },
    });
    expect(
      await db.presence.findUnique({ where: { residentId: ownerResident.id } }),
    ).toBeNull();
    expect(
      await db.presence.findUnique({ where: { residentId: guestResident.id } }),
    ).toBeNull();

    await ownerSession.context.close();
    await guestSession.context.close();
  } finally {
    await db.$disconnect();
  }
});
