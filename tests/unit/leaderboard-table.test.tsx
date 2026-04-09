import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { LeaderboardTable } from "@/components/leaderboard-table";

describe("leaderboard table", () => {
  test("renders as a server-safe component without framer-motion dependency", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile(`${process.cwd()}/src/components/leaderboard-table.tsx`, "utf8"),
    );

    expect(source).not.toContain('"use client"');
    expect(source).not.toContain("framer-motion");
  });

  test("highlights the top rank block", () => {
    render(
      <LeaderboardTable
        title="日榜"
        rows={[
          {
            rank: 1,
            userName: "张三",
            count40: 12,
            count60: 8,
            total: 20,
          },
          {
            rank: 2,
            userName: "李四",
            count40: 10,
            count60: 5,
            total: 15,
          },
        ]}
      />,
    );

    expect(screen.getByText("TOP 1")).toBeInTheDocument();
    expect(screen.getAllByText("张三").length).toBeGreaterThanOrEqual(2);
  });

  test("shows the richer empty state copy", () => {
    render(
      <LeaderboardTable
        title="日榜"
        rows={[]}
        emptyText="当前时间范围内暂无数据，建议切换日期后重试"
      />,
    );

    expect(
      screen.getByText("当前时间范围内暂无数据，建议切换日期后重试"),
    ).toBeInTheDocument();
  });
});
