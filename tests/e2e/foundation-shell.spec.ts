import { expect, test } from "@playwright/test";

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
