import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { CumulativeTrendChart } from "@/components/cumulative-trend-chart";

describe("cumulative trend chart", () => {
  test("renders named series in an accessible svg chart", () => {
    render(
      <CumulativeTrendChart
        title="成员累计卖卡趋势"
        series={[
          {
            userId: "member-1",
            userName: "张三",
            total: 3,
            points: [
              { label: "03-01", value: 1 },
              { label: "03-02", value: 3 },
            ],
          },
          {
            userId: "member-2",
            userName: "李四",
            total: 4,
            points: [
              { label: "03-01", value: 2 },
              { label: "03-02", value: 4 },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByLabelText("成员累计卖卡趋势")).toBeInTheDocument();
    expect(screen.getByText("张三")).toBeInTheDocument();
  });

  test("renders the admin empty state", () => {
    render(<CumulativeTrendChart title="成员累计卖卡趋势" series={[]} />);

    expect(screen.getByText("当前筛选条件下暂无累计卖卡数据")).toBeInTheDocument();
  });
});
