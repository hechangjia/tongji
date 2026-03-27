import { expect, test } from "@playwright/test";

test("admin can publish banner and announcement content that members can see", async ({
  page,
}) => {
  const bannerContent = `今日横幅测试 ${Date.now()}`;
  const announcementTitle = `全体公告测试 ${Date.now()}`;

  await page.goto("/admin/banners");
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel("账号").fill("admin");
  await page.getByLabel("密码").fill("admin123456");
  await page.getByRole("button", { name: "登录" }).click();

  await page.waitForURL(/\/admin\/banners$/, { timeout: 10000 });
  await page.getByLabel("文案").fill(bannerContent);
  await page.getByLabel("署名（可选）").fill("系统");
  await page.getByRole("button", { name: "保存横幅" }).click();
  await expect(page.getByRole("status")).toContainText("横幅已保存");

  await page.goto("/admin/announcements");
  await expect(page).toHaveURL(/\/admin\/announcements$/);
  await page.getByLabel("标题").fill(announcementTitle);
  await page
    .getByLabel("内容")
    .fill("这是一条用于验证成员端全体公告展示的测试通知。");
  await page.getByLabel("发布时间").fill("2026-03-26T10:00");
  await page.getByRole("button", { name: "保存公告" }).click();
  await expect(page.getByRole("status")).toContainText("公告已保存");
  await expect(page.getByRole("heading", { name: announcementTitle }).first()).toBeVisible();

  await page.context().clearCookies();

  await page.goto("/entry");
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("账号").fill("member01");
  await page.getByLabel("密码").fill("member123456");
  await page.getByRole("button", { name: "登录" }).click();

  await expect(page).toHaveURL(/\/entry$/);
  await expect(page.getByText("Today Banner")).toBeVisible();
  await expect(page.getByRole("heading", { name: "全体公告", exact: true })).toBeVisible();
});
