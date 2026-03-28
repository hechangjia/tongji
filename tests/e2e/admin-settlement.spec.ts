import { expect, test } from "@playwright/test";

test("admin can calculate settlement for a date range", async ({ page }) => {
  await page.goto("/admin/settlements");

  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel("账号").fill("admin");
  await page.getByLabel("密码").fill("admin123456");
  await page.getByRole("button", { name: "登录" }).click();

  await page.waitForURL(/\/admin\/settlements$/, { timeout: 10000 });

  await page.getByLabel("开始日期").fill("2026-07-01");
  await page.getByLabel("结束日期").fill("2026-07-31");
  await page.getByRole("button", { name: "生成结算" }).click();

  await expect(page.getByText("结算总览")).toBeVisible();
  await expect(page.getByRole("link", { name: "导出 Excel" })).toBeVisible();
  await expect(page.getByText("暂无结算结果")).toBeVisible();
});
