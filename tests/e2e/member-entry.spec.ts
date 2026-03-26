import { expect, test } from "@playwright/test";

test("member can create or update a daily record", async ({ page }) => {
  await page.goto("/entry");

  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel("账号").fill("member01");
  await page.getByLabel("密码").fill("member123456");
  await page.getByRole("button", { name: "登录" }).click();

  await expect(page).toHaveURL(/\/entry$/);
  await expect(page.getByText("每日行动面板")).toBeVisible();

  await page.getByLabel("40 套餐").fill("5");
  await page.getByLabel("60 套餐").fill("2");
  await page.getByRole("button", { name: "保存今日记录" }).click();

  await expect(page.getByRole("status")).toContainText("保存成功");
});
