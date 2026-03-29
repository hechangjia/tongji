import { expect, test } from "@playwright/test";

test("leader workbench flow covers group setup, in-group mutation, and shared leaderboard", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const suffix = Date.now().toString().slice(-6);
  const registeredUsername = `e2e_member_${suffix}`;
  const registeredPassword = "member123456";
  const groupName = `E2E小组${suffix}`;
  const codeValue = `E2ECODE${suffix}`;
  const qqValue = `90${suffix}`;

  async function pickOptionValueByText(selector: string, targetText: string) {
    return page.locator(selector).locator("option").evaluateAll(
      (options, text) => {
        const match = options.find((option) => option.textContent?.includes(text));
        return match ? (match as HTMLOptionElement).value : null;
      },
      targetText,
    );
  }

  await page.goto("/login");
  await page.locator("#register-username").fill(registeredUsername);
  await page.locator("#register-password").fill(registeredPassword);
  await page.getByRole("button", { name: "注册并进入" }).click();
  await expect(page).toHaveURL(/\/entry$/, { timeout: 20_000 });
  await expect(page.getByText("每日行动面板")).toBeVisible();

  await page.context().clearCookies();

  await page.goto("/admin/groups");
  await expect(page).toHaveURL(/\/login/);
  await page.locator("#username").fill("admin");
  await page.locator("#password").fill("admin123456");
  await page.getByRole("button", { name: "登录" }).click();
  await page.waitForURL(/\/admin\/groups/, { timeout: 20_000 });

  await page.getByLabel("小组名称").fill(groupName);
  const createLeaderValue = await pickOptionValueByText('select[name="leaderUserId"]', registeredUsername);
  expect(createLeaderValue).toBeTruthy();
  await page.locator('form').filter({ hasText: "新增小组" }).locator('select[name="leaderUserId"]').selectOption(createLeaderValue!);
  await page.getByRole("button", { name: "新增小组" }).click();
  await expect(
    page.locator("table tbody tr").filter({ hasText: groupName }).first(),
  ).toBeVisible({ timeout: 20_000 });

  await page.goto("/admin/codes");
  await page.locator("#identifier-file").setInputFiles({
    name: "codes.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(`识别码\n${codeValue}\n`, "utf-8"),
  });
  await page.getByRole("button", { name: "导入识别码" }).click();
  await expect(page.getByText(/识别码导入完成/)).toBeVisible({ timeout: 20_000 });

  await page.locator("#prospect-file").setInputFiles({
    name: "prospects.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(`QQ号,专业\n${qqValue},计算机\n`, "utf-8"),
  });
  await page.getByRole("button", { name: "导入新生 QQ" }).click();
  await expect(page.getByText(/新生 QQ 导入完成/)).toBeVisible({ timeout: 20_000 });

  const codeAssigneeValue = await pickOptionValueByText("#code-userId", registeredUsername);
  expect(codeAssigneeValue).toBeTruthy();
  await page.locator("#code-userId").selectOption(codeAssigneeValue!);
  await page.locator("#codeIds").selectOption({ label: codeValue });
  await page.getByRole("button", { name: "确认分发识别码" }).click();
  await expect(page).toHaveURL(/\/admin\/codes\?notice=/, { timeout: 20_000 });

  const leadAssigneeValue = await pickOptionValueByText("#lead-userId", registeredUsername);
  expect(leadAssigneeValue).toBeTruthy();
  await page.locator("#lead-userId").selectOption(leadAssigneeValue!);
  await page.locator("#leadIds").selectOption({ label: `${qqValue} · 计算机` });
  await page.getByRole("button", { name: "确认分配线索" }).click();
  await expect(page).toHaveURL(/\/admin\/codes\?notice=/, { timeout: 20_000 });

  await page.context().clearCookies();

  await page.goto("/login?callbackUrl=%2Fleader%2Fsales");
  await page.locator("#username").fill(registeredUsername);
  await page.locator("#password").fill(registeredPassword);
  await page.getByRole("button", { name: "登录" }).click();
  await page.waitForURL(/\/leader\/sales/, { timeout: 20_000 });

  await expect(page.getByRole("heading", { name: "组内成员冲榜" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "各组排名变化" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "线索推进区" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "识别码调度区" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "审计时间线" })).toBeVisible();
  await expect(page.getByText(groupName).first()).toBeVisible();

  const codeCard = page.locator("article").filter({ hasText: codeValue }).first();
  await codeCard.locator('select[name="nextOwnerUserId"]').selectOption("");
  await codeCard.locator('input[name="reason"]').fill("E2E 回收到组池");
  await codeCard.getByRole("button", { name: "更新识别码归属" }).click();
  await expect(page).toHaveURL(/\/leader\/sales\?notice=/, { timeout: 20_000 });
  await expect(page.getByText("E2E 回收到组池")).toBeVisible({ timeout: 20_000 });

  await page.goto("/leaderboard/groups");
  await expect(page.getByRole("heading", { name: "小组榜单" })).toBeVisible();
  await expect(page.getByText(groupName).first()).toBeVisible();
  await expect(page.getByText(new RegExp(registeredUsername)).first()).toBeVisible();
});
