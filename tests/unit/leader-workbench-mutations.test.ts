import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, test, vi } from "vitest";

const dbTransactionMock = vi.hoisted(() => vi.fn());
const userFindUniqueMock = vi.hoisted(() => vi.fn());
const groupFollowUpItemFindUniqueMock = vi.hoisted(() => vi.fn());
const groupFollowUpItemCreateMock = vi.hoisted(() => vi.fn());
const groupFollowUpItemUpdateMock = vi.hoisted(() => vi.fn());
const identifierCodeFindUniqueMock = vi.hoisted(() => vi.fn());
const identifierCodeUpdateMock = vi.hoisted(() => vi.fn());
const groupResourceAuditLogCreateMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: dbTransactionMock,
    user: {
      findUnique: userFindUniqueMock,
    },
    groupFollowUpItem: {
      findUnique: groupFollowUpItemFindUniqueMock,
      create: groupFollowUpItemCreateMock,
      update: groupFollowUpItemUpdateMock,
    },
    identifierCode: {
      findUnique: identifierCodeFindUniqueMock,
      update: identifierCodeUpdateMock,
    },
    groupResourceAuditLog: {
      create: groupResourceAuditLogCreateMock,
    },
  },
}));

import {
  createManualFollowUpForLeader,
  reassignFollowUpForLeader,
  reassignIdentifierCodeForLeader,
  updateFollowUpStatusForLeader,
} from "@/server/services/leader-workbench-service";

describe("leader workbench mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbTransactionMock.mockImplementation(
      async (callback: (tx: typeof import("@/lib/db").db) => Promise<unknown>) =>
        callback({
          user: {
            findUnique: userFindUniqueMock,
          },
          groupFollowUpItem: {
            findUnique: groupFollowUpItemFindUniqueMock,
            create: groupFollowUpItemCreateMock,
            update: groupFollowUpItemUpdateMock,
          },
          identifierCode: {
            findUnique: identifierCodeFindUniqueMock,
            update: identifierCodeUpdateMock,
          },
          groupResourceAuditLog: {
            create: groupResourceAuditLogCreateMock,
          },
        } as unknown as typeof import("@/lib/db").db),
    );
  });

  test("leader can create a manual follow-up item in their own group and append an audit row", async () => {
    userFindUniqueMock
      .mockResolvedValueOnce({
        id: "leader-1",
        role: "LEADER",
        groupId: "group-1",
        group: {
          id: "group-1",
          name: "北极星组",
          slogan: null,
          remark: null,
        },
      })
      .mockResolvedValueOnce({
        id: "member-1",
        role: "MEMBER",
        status: "ACTIVE",
        groupId: "group-1",
      });
    groupFollowUpItemCreateMock.mockResolvedValue({
      id: "follow-manual-1",
      groupId: "group-1",
      currentOwnerUserId: "member-1",
      sourceType: "MANUAL_DISCOVERY",
      status: "UNTOUCHED",
      summaryNote: "主动发现一个计算机新生",
      createdByUserId: "leader-1",
      prospectLeadId: null,
      lastActionAt: new Date("2026-03-29T08:00:00.000Z"),
      createdAt: new Date("2026-03-29T08:00:00.000Z"),
      convertedAt: null,
    });
    groupResourceAuditLogCreateMock.mockResolvedValue({ id: "audit-1" });

    await expect(
      createManualFollowUpForLeader("leader-1", {
        summaryNote: "主动发现一个计算机新生",
        currentOwnerUserId: "member-1",
      }),
    ).resolves.toMatchObject({
      id: "follow-manual-1",
      groupId: "group-1",
      currentOwnerUserId: "member-1",
      sourceType: "MANUAL_DISCOVERY",
    });

    expect(groupFollowUpItemCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        groupId: "group-1",
        currentOwnerUserId: "member-1",
        sourceType: "MANUAL_DISCOVERY",
        status: "UNTOUCHED",
        summaryNote: "主动发现一个计算机新生",
        createdByUserId: "leader-1",
      }),
      select: expect.any(Object),
    });
    expect(groupResourceAuditLogCreateMock).toHaveBeenCalledTimes(1);
    expect(groupResourceAuditLogCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        groupId: "group-1",
        operatorUserId: "leader-1",
        resourceType: "FOLLOW_UP_ITEM",
        resourceId: "follow-manual-1",
        actionType: "CREATE_MANUAL_FOLLOW_UP",
        reason: expect.any(String),
        beforeSnapshot: Prisma.DbNull,
        afterSnapshot: expect.objectContaining({
          currentOwnerUserId: "member-1",
          sourceType: "MANUAL_DISCOVERY",
        }),
      }),
    });
  });

  test("leader can reassign a follow-up item inside the same group", async () => {
    userFindUniqueMock
      .mockResolvedValueOnce({
        id: "leader-1",
        role: "LEADER",
        groupId: "group-1",
        group: {
          id: "group-1",
          name: "北极星组",
          slogan: null,
          remark: null,
        },
      })
      .mockResolvedValueOnce({
        id: "member-2",
        role: "MEMBER",
        status: "ACTIVE",
        groupId: "group-1",
      });
    groupFollowUpItemFindUniqueMock.mockResolvedValue({
      id: "follow-1",
      groupId: "group-1",
      currentOwnerUserId: "member-1",
      sourceType: "MANUAL_DISCOVERY",
      prospectLeadId: null,
      status: "FOLLOWING_UP",
      summaryNote: "今天继续联系",
      createdByUserId: "leader-1",
      lastActionAt: new Date("2026-03-29T06:00:00.000Z"),
      createdAt: new Date("2026-03-29T05:00:00.000Z"),
      convertedAt: null,
    });
    groupFollowUpItemUpdateMock.mockResolvedValue({
      id: "follow-1",
      currentOwnerUserId: "member-2",
      lastActionAt: new Date("2026-03-29T08:30:00.000Z"),
    });
    groupResourceAuditLogCreateMock.mockResolvedValue({ id: "audit-2" });

    await expect(
      reassignFollowUpForLeader("leader-1", {
        followUpItemId: "follow-1",
        nextOwnerUserId: "member-2",
        reason: "更适合由成员乙继续跟进",
      }),
    ).resolves.toMatchObject({
      id: "follow-1",
      currentOwnerUserId: "member-2",
    });

    expect(groupFollowUpItemUpdateMock).toHaveBeenCalledWith({
      where: { id: "follow-1" },
      data: {
        currentOwnerUserId: "member-2",
        lastActionAt: expect.any(Date),
      },
      select: expect.any(Object),
    });
    expect(groupResourceAuditLogCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actionType: "REASSIGN",
        reason: "更适合由成员乙继续跟进",
        beforeSnapshot: expect.objectContaining({
          currentOwnerUserId: "member-1",
        }),
        afterSnapshot: expect.objectContaining({
          currentOwnerUserId: "member-2",
        }),
      }),
    });
  });

  test("leader can return a follow-up item to the group pool by clearing the owner", async () => {
    userFindUniqueMock.mockResolvedValueOnce({
      id: "leader-1",
      role: "LEADER",
      groupId: "group-1",
      group: {
        id: "group-1",
        name: "北极星组",
        slogan: null,
        remark: null,
      },
    });
    groupFollowUpItemFindUniqueMock.mockResolvedValue({
      id: "follow-1",
      groupId: "group-1",
      currentOwnerUserId: "member-1",
      sourceType: "MANUAL_DISCOVERY",
      prospectLeadId: null,
      status: "FOLLOWING_UP",
      summaryNote: "需要重新分配",
      createdByUserId: "leader-1",
      lastActionAt: new Date("2026-03-29T06:00:00.000Z"),
      createdAt: new Date("2026-03-29T05:00:00.000Z"),
      convertedAt: null,
    });
    groupFollowUpItemUpdateMock.mockResolvedValue({
      id: "follow-1",
      currentOwnerUserId: null,
      lastActionAt: new Date("2026-03-29T08:45:00.000Z"),
    });
    groupResourceAuditLogCreateMock.mockResolvedValue({ id: "audit-3" });

    await expect(
      reassignFollowUpForLeader("leader-1", {
        followUpItemId: "follow-1",
        nextOwnerUserId: "",
        reason: "先退回组池重新排队",
      }),
    ).resolves.toMatchObject({
      id: "follow-1",
      currentOwnerUserId: null,
    });

    expect(groupResourceAuditLogCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actionType: "RETURN_TO_GROUP_POOL",
        reason: "先退回组池重新排队",
        afterSnapshot: expect.objectContaining({
          currentOwnerUserId: null,
        }),
      }),
    });
  });

  test("leader can update follow-up status and append an audit row", async () => {
    userFindUniqueMock.mockResolvedValueOnce({
      id: "leader-1",
      role: "LEADER",
      groupId: "group-1",
      group: {
        id: "group-1",
        name: "北极星组",
        slogan: null,
        remark: null,
      },
    });
    groupFollowUpItemFindUniqueMock.mockResolvedValue({
      id: "follow-1",
      groupId: "group-1",
      currentOwnerUserId: "member-1",
      sourceType: "PROSPECT_LEAD",
      prospectLeadId: "lead-1",
      status: "FOLLOWING_UP",
      summaryNote: "已经联系上",
      createdByUserId: "leader-1",
      lastActionAt: new Date("2026-03-29T06:00:00.000Z"),
      createdAt: new Date("2026-03-29T05:00:00.000Z"),
      convertedAt: null,
    });
    groupFollowUpItemUpdateMock.mockResolvedValue({
      id: "follow-1",
      status: "READY_TO_CONVERT",
      lastActionAt: new Date("2026-03-29T09:00:00.000Z"),
    });
    groupResourceAuditLogCreateMock.mockResolvedValue({ id: "audit-4" });

    await expect(
      updateFollowUpStatusForLeader("leader-1", {
        followUpItemId: "follow-1",
        status: "READY_TO_CONVERT",
        reason: "已约好今晚成交",
      }),
    ).resolves.toMatchObject({
      id: "follow-1",
      status: "READY_TO_CONVERT",
    });

    expect(groupFollowUpItemUpdateMock).toHaveBeenCalledWith({
      where: { id: "follow-1" },
      data: {
        status: "READY_TO_CONVERT",
        lastActionAt: expect.any(Date),
      },
      select: expect.any(Object),
    });
    expect(groupResourceAuditLogCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actionType: "STATUS_CHANGE",
        reason: "已约好今晚成交",
        beforeSnapshot: expect.objectContaining({
          status: "FOLLOWING_UP",
        }),
        afterSnapshot: expect.objectContaining({
          status: "READY_TO_CONVERT",
        }),
      }),
    });
  });

  test.each(["INVALID", "CONVERTED"] as const)(
    "leader cannot revive a %s follow-up item",
    async (status) => {
      userFindUniqueMock.mockResolvedValueOnce({
        id: "leader-1",
        role: "LEADER",
        groupId: "group-1",
        group: {
          id: "group-1",
          name: "北极星组",
          slogan: null,
          remark: null,
        },
      });
      groupFollowUpItemFindUniqueMock.mockResolvedValue({
        id: "follow-1",
        groupId: "group-1",
        currentOwnerUserId: "member-1",
        sourceType: "PROSPECT_LEAD",
        prospectLeadId: "lead-1",
        status,
        summaryNote: "已关闭",
        createdByUserId: "leader-1",
        lastActionAt: new Date("2026-03-29T06:00:00.000Z"),
        createdAt: new Date("2026-03-29T05:00:00.000Z"),
        convertedAt: status === "CONVERTED" ? new Date("2026-03-29T07:00:00.000Z") : null,
      });

      await expect(
        updateFollowUpStatusForLeader("leader-1", {
          followUpItemId: "follow-1",
          status: "FOLLOWING_UP",
          reason: "想重新打开",
        }),
      ).rejects.toThrow("已关闭的跟进项不能重新开启");

      expect(groupFollowUpItemUpdateMock).not.toHaveBeenCalled();
      expect(groupResourceAuditLogCreateMock).not.toHaveBeenCalled();
    },
  );

  test("leader can reassign an assigned identifier code inside the group", async () => {
    userFindUniqueMock
      .mockResolvedValueOnce({
        id: "leader-1",
        role: "LEADER",
        groupId: "group-1",
        group: {
          id: "group-1",
          name: "北极星组",
          slogan: null,
          remark: null,
        },
      })
      .mockResolvedValueOnce({
        id: "member-2",
        role: "MEMBER",
        status: "ACTIVE",
        groupId: "group-1",
      });
    identifierCodeFindUniqueMock.mockResolvedValue({
      id: "code-1",
      code: "ABC001",
      status: "ASSIGNED",
      assignedGroupId: "group-1",
      currentOwnerUserId: "member-1",
      assignedAt: new Date("2026-03-29T05:00:00.000Z"),
      soldAt: null,
    });
    identifierCodeUpdateMock.mockResolvedValue({
      id: "code-1",
      currentOwnerUserId: "member-2",
      assignedAt: new Date("2026-03-29T09:30:00.000Z"),
    });
    groupResourceAuditLogCreateMock.mockResolvedValue({ id: "audit-5" });

    await expect(
      reassignIdentifierCodeForLeader("leader-1", {
        codeId: "code-1",
        nextOwnerUserId: "member-2",
        reason: "成员乙接手这个码",
      }),
    ).resolves.toMatchObject({
      id: "code-1",
      currentOwnerUserId: "member-2",
    });

    expect(identifierCodeUpdateMock).toHaveBeenCalledWith({
      where: { id: "code-1" },
      data: {
        currentOwnerUserId: "member-2",
        assignedAt: expect.any(Date),
      },
      select: expect.any(Object),
    });
    expect(groupResourceAuditLogCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actionType: "REASSIGN",
        reason: "成员乙接手这个码",
        beforeSnapshot: expect.objectContaining({
          currentOwnerUserId: "member-1",
        }),
        afterSnapshot: expect.objectContaining({
          currentOwnerUserId: "member-2",
        }),
      }),
    });
  });

  test("leader can return an assigned identifier code to the group pool", async () => {
    userFindUniqueMock.mockResolvedValueOnce({
      id: "leader-1",
      role: "LEADER",
      groupId: "group-1",
      group: {
        id: "group-1",
        name: "北极星组",
        slogan: null,
        remark: null,
      },
    });
    identifierCodeFindUniqueMock.mockResolvedValue({
      id: "code-1",
      code: "ABC001",
      status: "ASSIGNED",
      assignedGroupId: "group-1",
      currentOwnerUserId: "member-1",
      assignedAt: new Date("2026-03-29T05:00:00.000Z"),
      soldAt: null,
    });
    identifierCodeUpdateMock.mockResolvedValue({
      id: "code-1",
      currentOwnerUserId: null,
      assignedAt: new Date("2026-03-29T09:45:00.000Z"),
    });
    groupResourceAuditLogCreateMock.mockResolvedValue({ id: "audit-6" });

    await expect(
      reassignIdentifierCodeForLeader("leader-1", {
        codeId: "code-1",
        nextOwnerUserId: "",
        reason: "先回收到组池",
      }),
    ).resolves.toMatchObject({
      id: "code-1",
      currentOwnerUserId: null,
    });

    expect(groupResourceAuditLogCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actionType: "RETURN_TO_GROUP_POOL",
        afterSnapshot: expect.objectContaining({
          currentOwnerUserId: null,
        }),
      }),
    });
  });

  test("sold identifier codes reject reassignment", async () => {
    userFindUniqueMock.mockResolvedValueOnce({
      id: "leader-1",
      role: "LEADER",
      groupId: "group-1",
      group: {
        id: "group-1",
        name: "北极星组",
        slogan: null,
        remark: null,
      },
    });
    identifierCodeFindUniqueMock.mockResolvedValue({
      id: "code-1",
      code: "ABC001",
      status: "SOLD",
      assignedGroupId: "group-1",
      currentOwnerUserId: "member-1",
      assignedAt: new Date("2026-03-29T05:00:00.000Z"),
      soldAt: new Date("2026-03-29T09:00:00.000Z"),
    });

    await expect(
      reassignIdentifierCodeForLeader("leader-1", {
        codeId: "code-1",
        nextOwnerUserId: "member-2",
        reason: "试图改派已售码",
      }),
    ).rejects.toThrow("已售出的识别码不能再改派");

    expect(identifierCodeUpdateMock).not.toHaveBeenCalled();
    expect(groupResourceAuditLogCreateMock).not.toHaveBeenCalled();
  });

  test("non-leader and cross-group mutations are rejected", async () => {
    userFindUniqueMock.mockResolvedValueOnce({
      id: "member-1",
      role: "MEMBER",
      groupId: "group-1",
      group: {
        id: "group-1",
        name: "北极星组",
        slogan: null,
        remark: null,
      },
    });

    await expect(
      createManualFollowUpForLeader("member-1", {
        summaryNote: "不是组长不能创建",
      }),
    ).rejects.toThrow("当前账号还没有绑定小组");

    userFindUniqueMock.mockResolvedValueOnce({
      id: "leader-1",
      role: "LEADER",
      groupId: "group-1",
      group: {
        id: "group-1",
        name: "北极星组",
        slogan: null,
        remark: null,
      },
    });
    groupFollowUpItemFindUniqueMock.mockResolvedValue({
      id: "follow-2",
      groupId: "group-2",
      currentOwnerUserId: "member-9",
      sourceType: "PROSPECT_LEAD",
      prospectLeadId: "lead-9",
      status: "FOLLOWING_UP",
      summaryNote: "跨组资源",
      createdByUserId: "leader-9",
      lastActionAt: new Date("2026-03-29T06:00:00.000Z"),
      createdAt: new Date("2026-03-29T05:00:00.000Z"),
      convertedAt: null,
    });

    await expect(
      reassignFollowUpForLeader("leader-1", {
        followUpItemId: "follow-2",
        nextOwnerUserId: "member-1",
        reason: "试图跨组改派",
      }),
    ).rejects.toThrow("只能操作本组资源");

    expect(groupFollowUpItemUpdateMock).not.toHaveBeenCalled();
    expect(groupResourceAuditLogCreateMock).not.toHaveBeenCalled();
  });
});
