import { expect, test } from "@playwright/test";

test("unauthenticated user is redirected to login", async ({ page }) => {
  await page.goto("/entry");

  await expect(page).toHaveURL(/\/login/);
});
