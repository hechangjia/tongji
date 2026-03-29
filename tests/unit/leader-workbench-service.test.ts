import { beforeEach, describe, expect, test, vi } from "vitest";

const getAggregatedSalesDayRowsMock = vi.hoisted(() => vi.fn());
const userFindUniqueMock = vi.hoisted(() => vi.fn());
const userFindManyMock = vi.hoisted(() => vi.fn());
const identifierCodeFindManyMock = vi.hoisted(() => vi.fn());
const groupFollowUpItemFindManyMock = vi.hoisted(() => vi.fn());
const groupResourceAuditLogFindManyMock = vi.hoisted(() => vi.fn());

vi.mock("@/server/services/sales-reporting-service", () => ({
  getAggregatedSalesDayRows: getAggregatedSalesDayRowsMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: userFindUniqueMock,
      findMany: userFindManyMock,
    },
    identifierCode: {
      findMany: identifierCodeFindManyMock,
    },
    groupFollowUpItem: {
      findMany: groupFollowUpItemFindManyMock,
    },
    groupResourceAuditLog: {
      findMany: groupResourceAuditLogFindManyMock,
    },
  },
}));

import {
  getLeaderBoundGroupOrThrow,
  getLeaderWorkbenchSnapshot,
} from "@/server/services/leader-workbench-service";

describe("leader workbench service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("rejects a leader account with no bound group", async () => {
    userFindUniqueMock.mockResolvedValue({
      id: "leader-1",
      role: "LEADER",
      groupId: null,
    });

    await expect(getLeaderBoundGroupOrThrow("leader-1")).rejects.toThrow(
      "当前账号还没有绑定小组",
    );
  });

  test("returns leader-bound group summary, member ranking for own group only, in-group code pool rows, merged follow-up queue, and newest-first audit rows", async () => {
    userFindUniqueMock.mockResolvedValue({
      id: "leader-1",
      role: "LEADER",
      groupId: "group-1",
      group: {
        id: "group-1",
        name: "北极星组",
        slogan: "今天冲刺",
        remark: "晚间盯紧成交",
      },
    });
    userFindManyMock.mockResolvedValue([
      {
        id: "member-1",
        name: "成员甲",
        username: "m1",
        groupId: "group-1",
      },
      {
        id: "member-2",
        name: "成员乙",
        username: "m2",
        groupId: "group-1",
      },
    ]);
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
        userId: "other-group-member",
        userName: "外组成员",
        saleDate: new Date("2026-03-29T00:00:00.000Z"),
        count40: 9,
        count60: 0,
        source: "IDENTIFIER_SALE",
      },
    ]);
    identifierCodeFindManyMock.mockResolvedValue([
      {
        id: "code-1",
        code: "ABC001",
        currentOwnerUserId: "member-1",
        assignedGroupId: "group-1",
        assignedAt: new Date("2026-03-29T03:00:00.000Z"),
        createdAt: new Date("2026-03-28T16:00:00.000Z"),
        currentOwner: { id: "member-1", name: "成员甲", username: "m1" },
      },
      {
        id: "code-2",
        code: "ABC002",
        currentOwnerUserId: null,
        assignedGroupId: "group-1",
        assignedAt: new Date("2026-03-29T02:00:00.000Z"),
        createdAt: new Date("2026-03-28T15:00:00.000Z"),
        currentOwner: null,
      },
    ]);
    groupFollowUpItemFindManyMock.mockResolvedValue([
      {
        id: "follow-1",
        sourceType: "PROSPECT_LEAD",
        summaryNote: null,
        status: "FOLLOWING_UP",
        lastActionAt: new Date("2026-03-29T05:00:00.000Z"),
        createdAt: new Date("2026-03-29T01:00:00.000Z"),
        currentOwnerUserId: "member-1",
        currentOwnerUser: { id: "member-1", name: "成员甲", username: "m1" },
        prospectLead: {
          id: "lead-1",
          qqNumber: "12345",
          major: "计算机",
          status: "ASSIGNED",
          assignedToUserId: "member-1",
          assignedGroupId: "group-1",
        },
      },
      {
        id: "follow-2",
        sourceType: "MANUAL_DISCOVERY",
        summaryNote: "主动加好友",
        status: "UNTOUCHED",
        lastActionAt: new Date("2026-03-29T04:00:00.000Z"),
        createdAt: new Date("2026-03-29T03:00:00.000Z"),
        currentOwnerUserId: null,
        currentOwnerUser: null,
        prospectLead: null,
      },
    ]);
    groupResourceAuditLogFindManyMock.mockResolvedValue([
      {
        id: "audit-old",
        resourceType: "FOLLOW_UP_ITEM",
        resourceId: "follow-1",
        actionType: "REASSIGN",
        reason: "先分配给成员甲",
        operatorUserId: "leader-1",
        createdAt: new Date("2026-03-29T02:00:00.000Z"),
        beforeSnapshot: { currentOwnerUserId: null },
        afterSnapshot: { currentOwnerUserId: "member-1" },
        operatorUser: { id: "leader-1", name: "组长", username: "leader01" },
      },
      {
        id: "audit-new",
        resourceType: "IDENTIFIER_CODE",
        resourceId: "code-2",
        actionType: "RETURN_TO_GROUP_POOL",
        reason: "回收到组池",
        operatorUserId: "leader-1",
        createdAt: new Date("2026-03-29T06:00:00.000Z"),
        beforeSnapshot: { currentOwnerUserId: "member-2" },
        afterSnapshot: { currentOwnerUserId: null },
        operatorUser: { id: "leader-1", name: "组长", username: "leader01" },
      },
    ]);

    await expect(
      getLeaderWorkbenchSnapshot({
        leaderUserId: "leader-1",
        todaySaleDate: "2026-03-29",
      }),
    ).resolves.toEqual({
      group: {
        id: "group-1",
        name: "北极星组",
        slogan: "今天冲刺",
        remark: "晚间盯紧成交",
      },
      summary: {
        memberCount: 2,
        todayCount40: 2,
        todayCount60: 1,
        todayTotal: 3,
        pendingFollowUpCount: 2,
        groupPoolCodeCount: 1,
      },
      memberRanking: [
        {
          rank: 1,
          userId: "member-1",
          userName: "成员甲",
          count40: 2,
          count60: 0,
          total: 2,
          activeCodeCount: 1,
          pendingFollowUpCount: 1,
          lastActionAt: new Date("2026-03-29T05:00:00.000Z"),
        },
        {
          rank: 2,
          userId: "member-2",
          userName: "成员乙",
          count40: 0,
          count60: 1,
          total: 1,
          activeCodeCount: 0,
          pendingFollowUpCount: 0,
          lastActionAt: null,
        },
      ],
      codePool: [
        {
          id: "code-1",
          code: "ABC001",
          currentOwnerUserId: "member-1",
          currentOwnerName: "成员甲",
          assignedAt: new Date("2026-03-29T03:00:00.000Z"),
          createdAt: new Date("2026-03-28T16:00:00.000Z"),
          isInGroupPool: false,
        },
        {
          id: "code-2",
          code: "ABC002",
          currentOwnerUserId: null,
          currentOwnerName: null,
          assignedAt: new Date("2026-03-29T02:00:00.000Z"),
          createdAt: new Date("2026-03-28T15:00:00.000Z"),
          isInGroupPool: true,
        },
      ],
      followUpQueue: [
        {
          id: "follow-1",
          sourceType: "PROSPECT_LEAD",
          status: "FOLLOWING_UP",
          summaryNote: null,
          currentOwnerUserId: "member-1",
          currentOwnerName: "成员甲",
          isInGroupPool: false,
          lastActionAt: new Date("2026-03-29T05:00:00.000Z"),
          createdAt: new Date("2026-03-29T01:00:00.000Z"),
          prospectLead: {
            id: "lead-1",
            qqNumber: "12345",
            major: "计算机",
            status: "ASSIGNED",
            assignedToUserId: "member-1",
            assignedGroupId: "group-1",
          },
        },
        {
          id: "follow-2",
          sourceType: "MANUAL_DISCOVERY",
          status: "UNTOUCHED",
          summaryNote: "主动加好友",
          currentOwnerUserId: null,
          currentOwnerName: null,
          isInGroupPool: true,
          lastActionAt: new Date("2026-03-29T04:00:00.000Z"),
          createdAt: new Date("2026-03-29T03:00:00.000Z"),
          prospectLead: null,
        },
      ],
      auditRows: [
        {
          id: "audit-new",
          resourceType: "IDENTIFIER_CODE",
          resourceId: "code-2",
          actionType: "RETURN_TO_GROUP_POOL",
          reason: "回收到组池",
          createdAt: new Date("2026-03-29T06:00:00.000Z"),
          operatorUserId: "leader-1",
          operatorUserName: "组长",
          beforeSnapshot: { currentOwnerUserId: "member-2" },
          afterSnapshot: { currentOwnerUserId: null },
        },
        {
          id: "audit-old",
          resourceType: "FOLLOW_UP_ITEM",
          resourceId: "follow-1",
          actionType: "REASSIGN",
          reason: "先分配给成员甲",
          createdAt: new Date("2026-03-29T02:00:00.000Z"),
          operatorUserId: "leader-1",
          operatorUserName: "组长",
          beforeSnapshot: { currentOwnerUserId: null },
          afterSnapshot: { currentOwnerUserId: "member-1" },
        },
      ],
    });

    expect(identifierCodeFindManyMock).toHaveBeenCalledWith({
      where: {
        assignedGroupId: "group-1",
        status: "ASSIGNED",
      },
      orderBy: [{ assignedAt: "asc" }, { createdAt: "asc" }],
      select: expect.any(Object),
    });
    expect(groupFollowUpItemFindManyMock).toHaveBeenCalledWith({
      where: {
        groupId: "group-1",
        sourceType: {
          in: ["PROSPECT_LEAD", "MANUAL_DISCOVERY"],
        },
      },
      orderBy: [{ lastActionAt: "desc" }, { createdAt: "desc" }],
      select: expect.any(Object),
    });
    expect(groupResourceAuditLogFindManyMock).toHaveBeenCalledWith({
      where: {
        groupId: "group-1",
      },
      orderBy: [{ createdAt: "desc" }],
      take: 20,
      select: expect.any(Object),
    });
  });
});
