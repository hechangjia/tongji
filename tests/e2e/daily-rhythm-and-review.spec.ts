import { expect, test } from "@playwright/test";

test("admin reviews today's pending sales and sees formal top3 leaderboard", async ({
  page,
}) => {
  await page.goto("/admin/sales?scope=today");

  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel("账号").fill("admin");
  await page.getByLabel("密码").fill("admin123456");
  await page.getByRole("button", { name: "登录" }).click();

  await page.waitForURL(/\/admin\/sales\?scope=today/, { timeout: 10000 });
  await expect(page.getByText("今日待审核")).toBeVisible();

  const pendingCard = page.locator("form").filter({ has: page.getByRole("button", { name: "通过" }) }).first();
  await pendingCard.getByRole("button", { name: "通过" }).click();

  await expect(page.getByText("审核已通过")).toBeVisible();

  await page.goto("/leaderboard/daily");
  await expect(page.getByText("正式前三")).toBeVisible();
});
