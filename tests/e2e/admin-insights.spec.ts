import { expect, test } from "@playwright/test";

test("admin can adjust today's target, send a reminder, and member sees the feedback", async ({
  page,
}) => {
  const reminderTitle = `管理员提醒-${Date.now()}`;
  const reminderContent = `请优先跟进今日进度 ${Date.now()}`;

  await page.goto("/entry");
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel("账号").fill("member01");
  await page.getByLabel("密码").fill("member123456");
  await page.getByRole("button", { name: "登录" }).click();

  await expect(page).toHaveURL(/\/entry$/);

  const todayInput = page.getByLabel("日期");
  const todaySaleDate = await todayInput.inputValue();
  await todayInput.fill(todaySaleDate);
  await page.getByLabel("40 套餐").fill("2");
  await page.getByLabel("60 套餐").fill("1");
  await page.getByRole("button", { name: "保存今日记录" }).click();
  await expect(page.getByText(/今日记录已(保存|更新)/)).toBeVisible();

  await page.context().clearCookies();

  await page.goto("/admin/insights");
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel("账号").fill("admin");
  await page.getByLabel("密码").fill("admin123456");
  await page.getByRole("button", { name: "登录" }).click();

  await page.waitForURL(/\/admin\/insights/, { timeout: 10000 });
  await expect(page.getByText("经营诊断中心")).toBeVisible();
  await expect(page.getByRole("heading", { name: /示例成员|member01/ })).toBeVisible();

  const firstAdjustButton = page.getByRole("button", { name: "调整今日目标" }).first();
  await expect(firstAdjustButton).toBeVisible();
  await page.locator('input[name="finalTotal"]').first().fill("5");
  await firstAdjustButton.click();
  await expect(page.getByText("今日目标已更新")).toBeVisible();

  await page.locator('input[name="title"]').first().fill(reminderTitle);
  await page.locator('textarea[name="content"]').first().fill(reminderContent);
  await page.getByRole("button", { name: "发送提醒" }).first().click();
  await expect(page.getByText("提醒已发送")).toBeVisible();

  await page.context().clearCookies();

  await page.goto("/entry");
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel("账号").fill("member01");
  await page.getByLabel("密码").fill("member123456");
  await page.getByRole("button", { name: "登录" }).click();

  await expect(page).toHaveURL(/\/entry$/);
  await expect(page.getByText("今日目标")).toBeVisible();
  await expect(page.getByText("还差 2 单")).toBeVisible();
  await expect(page.getByText("最近提醒")).toBeVisible();
  await expect(page.getByText(reminderTitle)).toBeVisible();
  await expect(page.getByText(reminderContent)).toBeVisible();
});
