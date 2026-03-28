import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { EntryReminderList } from "@/components/entry-reminder-list";

describe("entry reminder list", () => {
  test("renders recent reminders in reverse chronological order", () => {
    render(
      <EntryReminderList
        reminders={[
          {
            id: "reminder-2",
            type: "TARGET_GAP",
            title: "今日目标仍有差距",
            content: "你今天距离目标还差 3 单，请尽快跟进。",
            sentAtIso: "2026-03-27T09:00:00.000Z",
            senderName: "系统管理员",
            status: "UNREAD",
          },
          {
            id: "reminder-1",
            type: "FOLLOW_UP",
            title: "请关注今天的执行状态",
            content: "请优先跟进今天的执行节奏。",
            sentAtIso: "2026-03-27T08:00:00.000Z",
            senderName: "系统管理员",
            status: "READ",
          },
        ]}
      />,
    );

    const titles = screen.getAllByRole("heading", { level: 3 });
    expect(titles[0]).toHaveTextContent("今日目标仍有差距");
    expect(titles[1]).toHaveTextContent("请关注今天的执行状态");
  });
});
