import { expect, test } from "@playwright/test";

test("两名 User 完成注册、登录、Space 与 Invitation 流程", async ({
  page,
  browser,
}) => {
  const suffix = `${Date.now()}-${test.info().project.name}`;
  const ownerEmail = `owner-${suffix}@example.com`;
  const guestEmail = `guest-${suffix}@example.com`;
  const password = "playwright-local-fake-password-安全";

  await page.goto("/register");
  await page.getByLabel("你的名字").fill("Yuan");
  await page.getByLabel("邮箱").fill(ownerEmail);
  await page.getByLabel("密码（15–128 个字符）").fill(password);
  await page.getByRole("button", { name: "创建账户" }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("邮箱").fill(ownerEmail);
  await page.getByLabel("密码").fill(password);
  const ownerLogin = page.waitForResponse(/\/api\/auth\/callback\/credentials/);
  await page.getByRole("button", { name: "登录" }).click();
  await expect((await ownerLogin).ok()).toBe(true);
  await expect(page).toHaveURL(/\/space/, { timeout: 15_000 });

  await page.getByLabel("Space 名称").fill("Our E2E Home");
  await page.getByRole("button", { name: "Create our space" }).click();
  await expect(
    page.getByRole("heading", { name: "You are home" }),
  ).toBeVisible();
  await page.getByLabel("邀请邮箱（可选）").fill(guestEmail);
  await page.getByRole("button", { name: "Invite someone important" }).click();
  const invitationUrl = await page.getByLabel("邀请链接").inputValue();
  expect(invitationUrl).toMatch(/\/invite\/[A-Za-z0-9_-]+$/);

  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  await guestPage.goto("http://127.0.0.1:3000/register");
  await guestPage.getByLabel("你的名字").fill("Lin");
  await guestPage.getByLabel("邮箱").fill(guestEmail);
  await guestPage.getByLabel("密码（15–128 个字符）").fill(password);
  await guestPage.getByRole("button", { name: "创建账户" }).click();
  const csrf = (await (
    await guestPage.request.get("http://127.0.0.1:3000/api/auth/csrf")
  ).json()) as { csrfToken: string };
  const guestLogin = await guestPage.request.post(
    "http://127.0.0.1:3000/api/auth/callback/credentials?json=true",
    {
      form: {
        csrfToken: csrf.csrfToken,
        email: guestEmail,
        password,
        callbackUrl: "http://127.0.0.1:3000/space",
        json: "true",
      },
    },
  );
  expect(guestLogin.ok()).toBe(true);
  await guestPage.goto(invitationUrl);
  await expect(guestPage.getByText("Our E2E Home")).toBeVisible();
  await expect(guestPage.getByText(/Yuan 邀请你/)).toBeVisible();
  await guestPage.getByRole("button", { name: "接受邀请" }).click();
  await expect(
    guestPage.getByRole("heading", { name: "You are home" }),
  ).toBeVisible();
  await expect(
    guestPage.getByRole("button", { name: "Invite someone important" }),
  ).toHaveCount(0);
  await guestContext.close();
});

test("未登录用户无法访问认证后页面", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/space");
  await expect(page).toHaveURL(/\/login/);
});
