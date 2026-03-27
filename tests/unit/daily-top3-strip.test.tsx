import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { DailyTop3Strip } from "@/components/daily-top3-strip";

describe("daily top3 strip", () => {
  test("renders temporary and formal top3 lists", () => {
    render(
      <DailyTop3Strip
        top3Status={{
          temporaryTop3: [
            {
              id: "pending-1",
              userId: "member-1",
              userName: "待审核第一",
              reviewStatus: "PENDING",
              lastSubmittedAt: new Date("2026-03-27T00:15:00.000Z"),
              rank: 1,
            },
            {
              id: "approved-2",
              userId: "member-2",
              userName: "已通过第二",
              reviewStatus: "APPROVED",
              lastSubmittedAt: new Date("2026-03-27T00:30:00.000Z"),
              rank: 2,
            },
          ],
          formalTop3: [
            {
              id: "approved-1",
              userId: "member-3",
              userName: "正式第一",
              reviewStatus: "APPROVED",
              lastSubmittedAt: new Date("2026-03-27T01:00:00.000Z"),
              rank: 1,
            },
          ],
          temporaryCount: 2,
          formalCount: 1,
          isFormalTop3Complete: false,
        }}
      />,
    );

    expect(screen.getByText("临时前三")).toBeInTheDocument();
    expect(screen.getByText("待审核")).toBeInTheDocument();
    expect(screen.getByText("待审核第一")).toBeInTheDocument();
    expect(screen.getByText("已通过第二")).toBeInTheDocument();
    expect(screen.getByText("正式前三")).toBeInTheDocument();
    expect(screen.getByText("正式第一")).toBeInTheDocument();
  });

  test("renders an explicit empty state when temporary top3 is empty", () => {
    render(
      <DailyTop3Strip
        top3Status={{
          temporaryTop3: [],
          formalTop3: [
            {
              id: "approved-1",
              userId: "member-3",
              userName: "正式第一",
              reviewStatus: "APPROVED",
              lastSubmittedAt: new Date("2026-03-27T01:00:00.000Z"),
              rank: 1,
            },
          ],
          temporaryCount: 0,
          formalCount: 1,
          isFormalTop3Complete: false,
        }}
      />,
    );

    expect(screen.getByText("临时前三")).toBeInTheDocument();
    expect(screen.getByText("暂无待审核中的临时前三")).toBeInTheDocument();
    expect(screen.getByText("正式第一")).toBeInTheDocument();
  });

  test("renders an explicit empty state when formal top3 is empty", () => {
    render(
      <DailyTop3Strip
        top3Status={{
          temporaryTop3: [
            {
              id: "pending-1",
              userId: "member-1",
              userName: "待审核第一",
              reviewStatus: "PENDING",
              lastSubmittedAt: new Date("2026-03-27T00:15:00.000Z"),
              rank: 1,
            },
          ],
          formalTop3: [],
          temporaryCount: 1,
          formalCount: 0,
          isFormalTop3Complete: false,
        }}
      />,
    );

    expect(screen.getByText("正式前三")).toBeInTheDocument();
    expect(screen.getByText("暂无已通过审核的正式前三")).toBeInTheDocument();
    expect(screen.getByText("待审核第一")).toBeInTheDocument();
  });
});
