import { expect, test } from "@playwright/test";

test("显示 Phase 1 最小应用 Shell", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Welcome Home" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Settings" })).toHaveCount(0);
});
