import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { SalesEntrySuccessCard } from "@/components/sales-entry-success-card";

describe("sales entry success card", () => {
  test("renders the structured update summary", () => {
    render(
      <SalesEntrySuccessCard
        summary={{
          saleDate: "2026-03-26",
          count40: 5,
          count60: 2,
          total: 7,
          remark: "地推",
          reviewStatus: "PENDING",
          lastSubmittedAtIso: "2026-03-26T08:15:00.000Z",
          savedAtIso: "2026-03-26T08:15:00.000Z",
          isUpdate: true,
          recoveredFromError: false,
          dailyRhythm: {
            state: "PENDING_REVIEW",
            title: "当日节奏摘要",
            message: "今天的提交已收到，等待管理员审核",
            reviewStatus: "PENDING",
            reviewStatusLabel: "待审核",
            reviewNote: null,
            isTemporaryTop3: false,
            isFormalTop3: false,
            temporaryRank: null,
            formalRank: null,
            top3Label: null,
            top3Message: null,
            lastSubmittedAtIso: "2026-03-26T08:15:00.000Z",
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
          },
        }}
      />,
    );

    expect(screen.getByText("今日记录已更新")).toBeInTheDocument();
    expect(screen.getByText("40 套餐数量")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看我的记录" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "继续调整今天记录" }),
    ).toBeInTheDocument();
  });
});
