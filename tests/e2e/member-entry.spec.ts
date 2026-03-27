import { expect, test } from "@playwright/test";

test("member can create or update a daily record", async ({ page }) => {
  const uniqueDay = String((Date.now() % 28) + 1).padStart(2, "0");
  const freshSaleDate = `2099-01-${uniqueDay}`;

  await page.goto("/entry");

  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel("账号").fill("member01");
  await page.getByLabel("密码").fill("member123456");
  await page.getByRole("button", { name: "登录" }).click();

  await expect(page).toHaveURL(/\/entry$/);
  await expect(page.getByText("每日行动面板")).toBeVisible();

  await page.getByLabel("日期").fill(freshSaleDate);
  await page.getByLabel("40 套餐").fill("5");
  await page.getByLabel("60 套餐").fill("2");
  await page.getByRole("button", { name: "保存今日记录" }).click();

  await expect(page.getByText("今日记录已保存")).toBeVisible();
  await expect(page.getByText("40 套餐数量")).toBeVisible();
  await expect(page.getByText("60 套餐数量")).toBeVisible();
  await expect(page.getByText("总数", { exact: true })).toBeVisible();
  await expect(page.getByText("最后提交时间")).toBeVisible();
  await expect(page.getByText("当前审核状态")).toBeVisible();
  await expect(page.getByText("待审核")).toBeVisible();

  const temporaryTop3Copy = page.getByText(/临时前三|当前处于临时第/);
  if (await temporaryTop3Copy.count()) {
    await expect(temporaryTop3Copy.first()).toBeVisible();
  }

  await page.getByLabel("日期").fill(freshSaleDate);
  await page.getByLabel("40 套餐").fill("6");
  await page.getByRole("button", { name: "保存今日记录" }).click();

  await expect(page.getByText("今日记录已更新")).toBeVisible();
});
