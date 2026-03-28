import { describe, expect, test } from "vitest";
import { buildReminderFromTemplate } from "@/server/services/member-reminder-service";

describe("member reminder service", () => {
  test("buildReminderFromTemplate returns title and content for target gap reminders", () => {
    expect(
      buildReminderFromTemplate("TARGET_GAP", {
        memberName: "成员1",
        targetTotal: 8,
        currentTotal: 5,
        gap: 3,
      }),
    ).toMatchObject({
      title: expect.stringContaining("目标"),
      content: expect.stringContaining("还差 3 单"),
    });
  });
});
