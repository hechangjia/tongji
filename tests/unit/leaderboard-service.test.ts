import { beforeEach, describe, expect, test, vi } from "vitest";

const getAggregatedSalesDayRowsMock = vi.hoisted(() => vi.fn());

vi.mock("@/server/services/sales-reporting-service", () => ({
  getAggregatedSalesDayRows: getAggregatedSalesDayRowsMock,
}));

import {
  buildLeaderboard,
  getDailyLeaderboard,
  getRangeLeaderboard,
} from "@/server/services/leaderboard-service";

describe("leaderboard aggregation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("ranks by total count descending", () => {
    const board = buildLeaderboard([
      { userName: "A", count40: 1, count60: 1 },
      { userName: "B", count40: 3, count60: 0 },
    ]);

    expect(board[0].userName).toBe("B");
    expect(board[0].total).toBe(3);
    expect(board[0].rank).toBe(1);
  });

  test("builds the daily leaderboard from aggregated sales day rows", async () => {
    getAggregatedSalesDayRowsMock.mockResolvedValue([
      {
        userId: "member-1",
        userName: "成员甲",
        saleDate: new Date("2026-03-28T00:00:00.000Z"),
        count40: 1,
        count60: 1,
        source: "IDENTIFIER_SALE",
      },
      {
        userId: "member-2",
        userName: "成员乙",
        saleDate: new Date("2026-03-28T00:00:00.000Z"),
        count40: 3,
        count60: 0,
        source: "LEGACY_SALES_RECORD",
      },
    ]);

    await expect(getDailyLeaderboard("2026-03-28")).resolves.toEqual([
      {
        rank: 1,
        userName: "成员乙",
        count40: 3,
        count60: 0,
        total: 3,
      },
      {
        rank: 2,
        userName: "成员甲",
        count40: 1,
        count60: 1,
        total: 2,
      },
    ]);

    expect(getAggregatedSalesDayRowsMock).toHaveBeenCalledWith({
      startDate: "2026-03-28",
      endDate: "2026-03-28",
    });
  });

  test("builds the range leaderboard by collapsing multiple day rows per member", async () => {
    getAggregatedSalesDayRowsMock.mockResolvedValue([
      {
        userId: "member-1",
        userName: "成员甲",
        saleDate: new Date("2026-03-28T00:00:00.000Z"),
        count40: 1,
        count60: 0,
        source: "IDENTIFIER_SALE",
      },
      {
        userId: "member-1",
        userName: "成员甲",
        saleDate: new Date("2026-03-29T00:00:00.000Z"),
        count40: 0,
        count60: 2,
        source: "IDENTIFIER_SALE",
      },
      {
        userId: "member-2",
        userName: "成员乙",
        saleDate: new Date("2026-03-29T00:00:00.000Z"),
        count40: 2,
        count60: 0,
        source: "LEGACY_SALES_RECORD",
      },
    ]);

    await expect(getRangeLeaderboard("2026-03-28", "2026-03-29")).resolves.toEqual([
      {
        rank: 1,
        userName: "成员甲",
        count40: 1,
        count60: 2,
        total: 3,
      },
      {
        rank: 2,
        userName: "成员乙",
        count40: 2,
        count60: 0,
        total: 2,
      },
    ]);
  });
});
