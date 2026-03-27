import { describe, expect, test } from "vitest";
import {
  buildMemberCumulativeRanking,
  buildTrendSeries,
  type CumulativeSourceRow,
  resolvePresetRange,
  resolveTrendGranularity,
} from "@/server/services/cumulative-sales-stats-service";

describe("cumulative sales stats service", () => {
  test("resolves preset ranges with Asia/Shanghai business-day semantics", () => {
    const fixedNow = new Date("2026-03-27T12:00:00+08:00");

    expect(resolvePresetRange("MONTH", fixedNow)).toEqual({
      startDate: "2026-03-01",
      endDate: "2026-03-27",
      endExclusiveDate: "2026-03-28",
    });

    expect(resolvePresetRange("ROLLING_30", fixedNow)).toEqual({
      startDate: "2026-02-26",
      endDate: "2026-03-27",
      endExclusiveDate: "2026-03-28",
    });
  });

  test("builds member ranking as top 10 plus my position and filters to active members", () => {
    const memberRows: CumulativeSourceRow[] = Array.from({ length: 11 }, (_, index) => ({
      userId: `member-${index + 1}`,
      userName: `成员${index + 1}`,
      role: "MEMBER" as const,
      status: "ACTIVE" as const,
      saleDate: "2026-03-27" as const,
      count40: 11 - index,
      count60: 0,
    }));
    const hiddenRows: CumulativeSourceRow[] = [
      {
        userId: "admin-1",
        userName: "管理员",
        role: "ADMIN" as const,
        status: "ACTIVE" as const,
        saleDate: "2026-03-27" as const,
        count40: 100,
        count60: 0,
      },
      {
        userId: "inactive-member",
        userName: "停用成员",
        role: "MEMBER" as const,
        status: "INACTIVE" as const,
        saleDate: "2026-03-27" as const,
        count40: 99,
        count60: 0,
      },
    ];
    const rows: CumulativeSourceRow[] = [...memberRows, ...hiddenRows];

    const ranking = buildMemberCumulativeRanking({
      rows,
      currentUserId: "member-11",
      metric: "TOTAL",
      topLimit: 10,
    });

    expect(ranking).toHaveLength(11);
    expect(ranking[0]).toMatchObject({
      rank: 1,
      userName: "成员1",
      total: 11,
      isCurrentUser: false,
    });
    expect(ranking.at(-1)).toMatchObject({
      rank: 11,
      userName: "成员11",
      total: 1,
      isCurrentUser: true,
      isMyPositionRow: true,
      gapToPrevious: 1,
    });
    expect(ranking.find((row) => row.userName === "管理员")).toBeUndefined();
    expect(ranking.find((row) => row.userName === "停用成员")).toBeUndefined();
  });

  test("builds trend series with carry-forward points and final-total top ordering", () => {
    const series = buildTrendSeries({
      rows: [
        {
          userId: "member-1",
          userName: "张三",
          role: "MEMBER",
          status: "ACTIVE",
          saleDate: "2026-03-01" as const,
          count40: 1,
          count60: 1,
        },
        {
          userId: "member-1",
          userName: "张三",
          role: "MEMBER",
          status: "ACTIVE",
          saleDate: "2026-03-03" as const,
          count40: 2,
          count60: 1,
        },
        {
          userId: "member-2",
          userName: "李四",
          role: "MEMBER",
          status: "ACTIVE",
          saleDate: "2026-03-01" as const,
          count40: 3,
          count60: 0,
        },
      ] satisfies CumulativeSourceRow[],
      metric: "TOTAL",
      topLimit: 5,
      granularity: "day",
      range: {
        startDate: "2026-03-01",
        endDate: "2026-03-03",
        endExclusiveDate: "2026-03-04",
      },
    });

    expect(series[0]).toMatchObject({
      userName: "张三",
      total: 5,
      points: [
        { label: "2026-03-01", value: 2 },
        { label: "2026-03-02", value: 2 },
        { label: "2026-03-03", value: 5 },
      ],
    });
    expect(series[1]).toMatchObject({
      userName: "李四",
      total: 3,
      points: [
        { label: "2026-03-01", value: 3 },
        { label: "2026-03-02", value: 3 },
        { label: "2026-03-03", value: 3 },
      ],
    });
  });

  test("uses monthly trend granularity for ranges longer than 180 days", () => {
    expect(
      resolveTrendGranularity({
        startDate: "2026-01-01",
        endDate: "2026-12-31",
        endExclusiveDate: "2027-01-01",
      }),
    ).toBe("month");
  });
});
