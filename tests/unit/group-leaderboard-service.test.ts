import { beforeEach, describe, expect, test, vi } from "vitest";

const getAggregatedSalesDayRowsMock = vi.hoisted(() => vi.fn());
const groupFindManyMock = vi.hoisted(() => vi.fn());
const userFindManyMock = vi.hoisted(() => vi.fn());
const userFindUniqueMock = vi.hoisted(() => vi.fn());

vi.mock("@/server/services/sales-reporting-service", () => ({
  getAggregatedSalesDayRows: getAggregatedSalesDayRowsMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    group: {
      findMany: groupFindManyMock,
    },
    user: {
      findMany: userFindManyMock,
      findUnique: userFindUniqueMock,
    },
  },
}));

import {
  getGroupLeaderboard,
  getVisibleGroupMemberRows,
} from "@/server/services/group-leaderboard-service";

describe("group leaderboard service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("ranks groups by today's totals, preserves 40/60 splits, keeps mixed source rows, and returns current leader adjacent deltas", async () => {
    getAggregatedSalesDayRowsMock.mockResolvedValue([
      {
        userId: "member-1",
        userName: "成员甲",
        saleDate: new Date("2026-03-29T00:00:00.000Z"),
        count40: 1,
        count60: 0,
        source: "IDENTIFIER_SALE",
      },
      {
        userId: "member-2",
        userName: "成员乙",
        saleDate: new Date("2026-03-29T00:00:00.000Z"),
        count40: 0,
        count60: 1,
        source: "IDENTIFIER_SALE",
      },
      {
        userId: "member-3",
        userName: "成员丙",
        saleDate: new Date("2026-03-29T00:00:00.000Z"),
        count40: 1,
        count60: 2,
        source: "LEGACY_SALES_RECORD",
      },
      {
        userId: "member-4",
        userName: "成员丁",
        saleDate: new Date("2026-03-29T00:00:00.000Z"),
        count40: 1,
        count60: 0,
        source: "LEGACY_SALES_RECORD",
      },
    ]);
    groupFindManyMock.mockResolvedValue([
      { id: "group-1", name: "北极星组", leaderUserId: "leader-1" },
      { id: "group-2", name: "开拓者组", leaderUserId: "leader-2" },
      { id: "group-3", name: "冲锋组", leaderUserId: "leader-3" },
    ]);
    userFindManyMock.mockResolvedValue([
      { id: "member-1", groupId: "group-1" },
      { id: "member-2", groupId: "group-1" },
      { id: "member-3", groupId: "group-2" },
      { id: "member-4", groupId: "group-3" },
    ]);
    userFindUniqueMock.mockResolvedValue({ id: "leader-1", groupId: "group-1" });

    await expect(
      getGroupLeaderboard({
        currentUserId: "leader-1",
        currentUserRole: "LEADER",
        todaySaleDate: "2026-03-29",
      }),
    ).resolves.toEqual({
      rows: [
        {
          rank: 1,
          groupId: "group-2",
          groupName: "开拓者组",
          count40: 1,
          count60: 2,
          total: 3,
        },
        {
          rank: 2,
          groupId: "group-1",
          groupName: "北极星组",
          count40: 1,
          count60: 1,
          total: 2,
        },
        {
          rank: 3,
          groupId: "group-3",
          groupName: "冲锋组",
          count40: 1,
          count60: 0,
          total: 1,
        },
      ],
      currentGroupDelta: {
        groupId: "group-1",
        gapToPrevious: 1,
        gapToNext: 1,
      },
    });

    expect(getAggregatedSalesDayRowsMock).toHaveBeenCalledWith({
      startDate: "2026-03-29",
      endDate: "2026-03-29",
    });
  });

  test("hides member rows from MEMBER role", async () => {
    await expect(
      getVisibleGroupMemberRows({
        currentUserId: "member-1",
        currentUserRole: "MEMBER",
        groupId: "group-1",
        todaySaleDate: "2026-03-29",
      }),
    ).resolves.toEqual([]);

    expect(getAggregatedSalesDayRowsMock).not.toHaveBeenCalled();
  });

  test("allows LEADER to expand only their own group", async () => {
    userFindUniqueMock.mockResolvedValue({ id: "leader-1", groupId: "group-1" });

    await expect(
      getVisibleGroupMemberRows({
        currentUserId: "leader-1",
        currentUserRole: "LEADER",
        groupId: "group-2",
        todaySaleDate: "2026-03-29",
      }),
    ).resolves.toEqual([]);

    getAggregatedSalesDayRowsMock.mockResolvedValue([
      {
        userId: "member-1",
        userName: "成员甲",
        saleDate: new Date("2026-03-29T00:00:00.000Z"),
        count40: 2,
        count60: 0,
        source: "IDENTIFIER_SALE",
      },
      {
        userId: "member-2",
        userName: "成员乙",
        saleDate: new Date("2026-03-29T00:00:00.000Z"),
        count40: 0,
        count60: 1,
        source: "LEGACY_SALES_RECORD",
      },
      {
        userId: "member-3",
        userName: "成员丙",
        saleDate: new Date("2026-03-29T00:00:00.000Z"),
        count40: 9,
        count60: 0,
        source: "IDENTIFIER_SALE",
      },
    ]);
    userFindManyMock.mockResolvedValue([
      { id: "member-1", name: "成员甲", username: "m1", groupId: "group-1", role: "MEMBER" },
      { id: "member-2", name: "成员乙", username: "m2", groupId: "group-1", role: "MEMBER" },
    ]);

    await expect(
      getVisibleGroupMemberRows({
        currentUserId: "leader-1",
        currentUserRole: "LEADER",
        groupId: "group-1",
        todaySaleDate: "2026-03-29",
      }),
    ).resolves.toEqual([
      {
        rank: 1,
        userId: "member-1",
        userName: "成员甲",
        count40: 2,
        count60: 0,
        total: 2,
      },
      {
        rank: 2,
        userId: "member-2",
        userName: "成员乙",
        count40: 0,
        count60: 1,
        total: 1,
      },
    ]);
  });
});
