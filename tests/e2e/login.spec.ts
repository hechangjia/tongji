import { expect, test } from "@playwright/test";

test("admin login protects the admin route and grants access after sign in", async ({
  page,
}) => {
  await page.goto("/admin");

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText("校园销售作战台")).toBeVisible();

  await page.getByLabel("账号").fill("admin");
  await page.getByLabel("密码").fill("admin123456");
  await page.getByRole("button", { name: "登录" }).click();

  await page.waitForURL(/\/admin$/, { timeout: 20000 });
  await expect(
    page.getByRole("heading", { name: "管理员功能" }),
  ).toBeVisible({ timeout: 20000 });
});
