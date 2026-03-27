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

  const remarkInputs = page.locator('input[name="remark"]');
  const remarkInputCount = await remarkInputs.count();
  let pendingCard = page.locator("form").first();

  for (let index = 0; index < remarkInputCount; index += 1) {
    const remarkInput = remarkInputs.nth(index);

    if ((await remarkInput.inputValue()) === uniqueRemark) {
      pendingCard = remarkInput.locator("xpath=ancestor::form[1]");
      break;
    }
  }

  await expect(pendingCard.locator('input[name="remark"]')).toHaveValue(uniqueRemark);
  await pendingCard.getByRole("button", { name: "通过" }).click();

  await expect(page.getByText("审核已通过")).toBeVisible();

  await page.goto("/leaderboard/daily");
  await expect(page.getByText("临时前三")).toBeVisible();
  await expect(page.getByText("正式前三")).toBeVisible();

  const formalTop3Section = page.getByTestId("daily-formal-top3-section");
  await expect(formalTop3Section).toBeVisible();
  await expect(formalTop3Section.getByText(/member01|示例成员/)).toBeVisible();
  await expect(formalTop3Section.getByText("暂无已通过审核的正式前三")).toHaveCount(0);
});
