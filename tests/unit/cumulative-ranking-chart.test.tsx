import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { CumulativeRankingChart } from "@/components/cumulative-ranking-chart";

describe("cumulative ranking chart", () => {
  test("renders top rows and my-position row", () => {
    render(
      <CumulativeRankingChart
        title="本月累计买卡"
        rows={[
          { rank: 1, userName: "张三", total: 12, isCurrentUser: false },
          {
            rank: 11,
            userName: "member01",
            total: 4,
            isCurrentUser: true,
            isMyPositionRow: true,
            gapToPrevious: 2,
          },
        ]}
      />,
    );

    expect(screen.getByText("本月累计买卡")).toBeInTheDocument();
    expect(screen.getByText("我的位置")).toBeInTheDocument();
    expect(screen.getByText("距离前一名 2")).toBeInTheDocument();
  });

  test("renders the range-aware empty state", () => {
    render(<CumulativeRankingChart title="本月累计买卡" rows={[]} />);

    expect(
      screen.getByText("当前时间范围内暂无累计买卡数据，可调整当前区间后查看"),
    ).toBeInTheDocument();
  });
});
