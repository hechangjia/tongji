import { expect, test } from "@playwright/test";

test("member can view cumulative stats on the range leaderboard", async ({ page }) => {
  await page.goto("/login?callbackUrl=%2Fleaderboard%2Frange");

  await page.getByLabel("账号").fill("member01");
  await page.getByLabel("密码").fill("member123456");
  await page.getByRole("button", { name: "登录" }).click();

  await expect(page).toHaveURL(/\/leaderboard\/range$/);
  await expect(page.getByText("本月累计卖卡")).toBeVisible();
  await expect(page.getByText("按全体成员累计数量统计")).toBeVisible();
});

test("admin can switch cumulative trend filters on the dashboard", async ({ page }) => {
  await page.goto("/login?callbackUrl=%2Fadmin");

  await page.getByLabel("账号").fill("admin");
  await page.getByLabel("密码").fill("admin123456");
  await page.getByRole("button", { name: "登录" }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByText("成员累计卖卡趋势")).toBeVisible();

  await page.getByRole("button", { name: "近 30 天" }).click();
  await page.getByRole("button", { name: "60 套餐" }).click();

  await expect(page.getByText("Top 成员")).toBeVisible();
});
