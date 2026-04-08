import { expect, test } from "@playwright/test";

test("member can navigate from entry to records", async ({ page }) => {
  await page.goto("/entry");
  await expect(page).toHaveURL(/\/login/);

  await page.locator("#username").fill("member01");
  await page.locator("#password").fill("member123456");
  await page.getByRole("button", { name: "登录" }).click();

  await page.waitForURL(/\/entry$/, { timeout: 20_000 });
  await expect(
    page.getByRole("heading", { name: "今日录入" }),
  ).toBeVisible({ timeout: 20_000 });

  await page.getByRole("link", { name: "我的记录" }).first().click();

  await page.waitForURL(/\/records$/, { timeout: 20_000 });
  await expect(
    page.getByRole("heading", { name: "我的记录" }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("This page couldn’t load")).not.toBeVisible();
});
