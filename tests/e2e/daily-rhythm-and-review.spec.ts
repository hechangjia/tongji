import { expect, test } from "@playwright/test";

test("admin reviews today's pending sales and sees formal top3 leaderboard", async ({
  page,
}) => {
  const uniqueRemark = `e2e-review-${Date.now()}`;

  await page.goto("/entry");
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel("账号").fill("member01");
  await page.getByLabel("密码").fill("member123456");
  await page.getByRole("button", { name: "登录" }).click();

  await expect(page).toHaveURL(/\/entry$/);
  await expect(page.getByText("每日行动面板")).toBeVisible();

  const todayInput = page.getByLabel("日期");
  const todaySaleDate = await todayInput.inputValue();
  await todayInput.fill(todaySaleDate);
  await page.getByLabel("40 套餐").fill("7");
  await page.getByLabel("60 套餐").fill("1");
  await page.getByLabel("备注").fill(uniqueRemark);
  await page.getByRole("button", { name: "保存今日记录" }).click();

  await expect(page.getByText(/今日记录已(保存|更新)/)).toBeVisible();
  await expect(page.getByText("待审核")).toBeVisible();

  await page.context().clearCookies();

  await page.goto("/admin/sales?scope=today");
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel("账号").fill("admin");
  await page.getByLabel("密码").fill("admin123456");
  await page.getByRole("button", { name: "登录" }).click();

  await page.waitForURL(/\/admin\/sales\?scope=today/, { timeout: 10000 });
  await expect(page.getByText("今日待审核")).toBeVisible();

  const pendingCard = page
    .locator("form")
    .filter({ hasText: uniqueRemark })
    .filter({ has: page.getByRole("button", { name: "通过" }) })
    .first();
  await pendingCard.getByRole("button", { name: "通过" }).click();

  await expect(page.getByText("审核已通过")).toBeVisible();

  await page.goto("/leaderboard/daily");
  await expect(page.getByText("正式前三")).toBeVisible();
});
