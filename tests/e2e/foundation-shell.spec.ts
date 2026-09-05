import { expect, test, type Locator } from "@playwright/test";

async function expectTouchTarget(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
}

test("显示 Phase 1 最小应用 Shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "欢迎回家" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Settings" })).toHaveCount(0);
});

test("切换语言后保持语言无关 URL，并在 reload 后持久化", async ({ page }) => {
  await page.goto("/welcome");
  await page.locator('button[name="locale"][value="en-US"]').click();
  await expect(
    page.getByRole("heading", { name: "Welcome Home" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/welcome$/);

  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Welcome Home" }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en-US");
});

test("登录与注册页的 inline secondary link 提供 44px touch target", async ({
  page,
}) => {
  await page.goto("/login");
  const createAccount = page.getByRole("link", { name: "创建账户" });
  await expectTouchTarget(createAccount);
  await createAccount.click();

  const haveAccount = page.getByRole("link", { name: "已经有账户" });
  await expectTouchTarget(haveAccount);
});
