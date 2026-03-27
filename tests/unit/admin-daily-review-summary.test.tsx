import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { AdminDailyReviewSummary } from "@/components/admin/admin-daily-review-summary";

describe("admin daily review summary", () => {
  test("renders message, pending count, primary action, and secondary actions", () => {
    render(
      <AdminDailyReviewSummary
        summary={{
          message: "今天已有 2 条提交，等待管理员审核",
          pendingCount: 2,
          top3Status: {
            temporaryTop3: [],
            formalTop3: [],
            temporaryCount: 2,
            formalCount: 0,
            isFormalTop3Complete: false,
          },
          top3ConfirmationStatus: "NOT_CONFIRMED",
          primaryAction: {
            href: "/admin/sales?scope=today",
            label: "去审核今日记录",
          },
          secondaryActions: [
            {
              href: "/leaderboard/range",
              label: "查看总榜",
            },
            {
              href: "/admin/announcements",
              label: "管理公告",
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("今天已有 2 条提交，等待管理员审核")).toBeInTheDocument();
    expect(screen.getByText("待审核")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "去审核今日记录" })).toHaveAttribute(
      "href",
      "/admin/sales?scope=today",
    );
    expect(screen.getByRole("link", { name: "查看总榜" })).toHaveAttribute(
      "href",
      "/leaderboard/range",
    );
    expect(screen.getByRole("link", { name: "管理公告" })).toHaveAttribute(
      "href",
      "/admin/announcements",
    );
  });
});
