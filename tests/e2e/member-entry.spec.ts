import { expect, test } from "@playwright/test";

test("member can create or update a daily record", async ({ page }) => {
  const now = new Date();
  const freshSaleDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  await page.goto("/entry");

  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel("账号").fill("member01");
  await page.getByLabel("密码").fill("member123456");
  await page.getByRole("button", { name: "登录" }).click();

  await expect(page).toHaveURL(/\/entry$/);
  await expect(page.getByText("每日行动面板")).toBeVisible();
  await expect(page.getByText("今日目标")).toBeVisible();
  await expect(page.getByText("自我趋势")).toBeVisible();
  await expect(page.getByText("最近提醒")).toBeVisible();

  await page.getByLabel("日期").fill(freshSaleDate);
  await page.getByLabel("40 套餐").fill("5");
  await page.getByLabel("60 套餐").fill("2");
  await page.getByRole("button", { name: "保存今日记录" }).click();

  await expect(page.getByText(/今日记录已(保存|更新)/)).toBeVisible();
  await expect(page.getByText("40 套餐数量")).toBeVisible();
  await expect(page.getByText("60 套餐数量")).toBeVisible();
  await expect(page.getByText("总数", { exact: true })).toBeVisible();
  await expect(page.getByText("最后提交时间")).toBeVisible();
  await expect(page.getByText("当前审核状态")).toBeVisible();
  await expect(page.getByText(/还差 \d+ 单|今天目标已完成/)).toBeVisible();
  await expect(page.getByText(/高于近 7 天常态|接近近 7 天常态|低于近 7 天常态/)).toBeVisible();
  await expect(page.getByText("待审核")).toBeVisible();
  await expect(page.locator("dd").filter({ hasText: /^\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/ }).first()).toBeVisible();

  const temporaryTop3Copy = page.getByText(/临时前三|当前处于临时第/);
  if (await temporaryTop3Copy.count()) {
    await expect(temporaryTop3Copy.first()).toBeVisible();
  }

  await page.getByLabel("日期").fill(freshSaleDate);
  await page.getByLabel("40 套餐").fill("6");
  await page.getByRole("button", { name: "保存今日记录" }).click();

  await expect(page.getByText("今日记录已更新")).toBeVisible();
});
