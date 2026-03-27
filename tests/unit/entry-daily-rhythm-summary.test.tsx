import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { EntryDailyRhythmSummary } from "@/components/entry-daily-rhythm-summary";

describe("entry daily rhythm summary", () => {
  test("renders a pending-review summary with actions and ranking context", () => {
    render(
      <EntryDailyRhythmSummary
        summary={{
          state: "PENDING_REVIEW",
          message: "今天的提交已收到，等待管理员审核",
          reviewStatus: "PENDING",
          reviewNote: null,
          isTemporaryTop3: true,
          isFormalTop3: false,
          temporaryRank: 2,
          formalRank: null,
          lastSubmittedAtIso: "2026-03-27T08:15:00.000Z",
          primaryAction: {
            href: "/leaderboard/daily",
            label: "查看今日榜单",
          },
          secondaryActions: [
            {
              href: "/entry",
              label: "继续填写今日记录",
            },
            {
              href: "/leaderboard/range",
              label: "查看总榜",
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("今天的提交已收到，等待管理员审核")).toBeInTheDocument();
    expect(screen.getByText("当前审核状态")).toBeInTheDocument();
    expect(screen.getByText("待审核")).toBeInTheDocument();
    expect(screen.getByText("临时前三")).toBeInTheDocument();
    expect(screen.getByText("当前处于临时第 2 名")).toBeInTheDocument();
    expect(screen.getByText("最后提交时间")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看今日榜单" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "继续填写今日记录" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看总榜" })).toBeInTheDocument();
  });
});
