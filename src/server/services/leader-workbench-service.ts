import type {
  GroupFollowUpSourceType,
  GroupFollowUpStatus,
  GroupResourceAuditActionType,
  GroupResourceAuditResourceType,
} from "@prisma/client";
import { db } from "@/lib/db";
import { getAggregatedSalesDayRows } from "@/server/services/sales-reporting-service";
import { getTodaySaleDateValue, type DateValue } from "@/server/services/sales-service";

export type LeaderBoundGroup = {
  id: string;
  name: string;
  slogan: string | null;
  remark: string | null;
};

export type LeaderWorkbenchSnapshotInput = {
  leaderUserId: string;
  todaySaleDate?: DateValue;
};

export type LeaderWorkbenchSnapshot = {
  group: LeaderBoundGroup;
  summary: {
    memberCount: number;
    todayCount40: number;
    todayCount60: number;
    todayTotal: number;
  };
  memberRanking: Array<{
    rank: number;
    userId: string;
    userName: string;
    count40: number;
    count60: number;
    total: number;
  }>;
  codePool: Array<{
    id: string;
    code: string;
    currentOwnerUserId: string | null;
    currentOwnerName: string | null;
  }>;
  followUpQueue: Array<{
    id: string;
    sourceType: GroupFollowUpSourceType;
    status: GroupFollowUpStatus;
    summaryNote: string | null;
  }>;
  auditRows: Array<{
    id: string;
    resourceType: GroupResourceAuditResourceType;
    resourceId: string;
    actionType: GroupResourceAuditActionType;
    reason: string;
  }>;
};

function sortByTotalThenName(
  left: { total: number; userName: string },
  right: { total: number; userName: string },
) {
  if (right.total !== left.total) {
    return right.total - left.total;
  }

  return left.userName.localeCompare(right.userName, "zh-CN");
}

export async function getLeaderBoundGroupOrThrow(
  leaderUserId: string,
): Promise<LeaderBoundGroup> {
  const leader = await db.user.findUnique({
    where: { id: leaderUserId },
    select: {
      role: true,
      groupId: true,
      group: {
        select: {
          id: true,
          name: true,
          slogan: true,
          remark: true,
        },
      },
    },
  });

  if (!leader || leader.role !== "LEADER" || !leader.groupId || !leader.group) {
    throw new Error("当前账号还没有绑定小组");
  }

  return {
    id: leader.group.id,
    name: leader.group.name,
    slogan: leader.group.slogan,
    remark: leader.group.remark,
  };
}

export async function getLeaderWorkbenchSnapshot(
  input: LeaderWorkbenchSnapshotInput,
): Promise<LeaderWorkbenchSnapshot> {
  const todaySaleDate = input.todaySaleDate ?? getTodaySaleDateValue();
  const group = await getLeaderBoundGroupOrThrow(input.leaderUserId);

  const [members, salesRows, codes, followUpItems, auditLogs] = await Promise.all([
    db.user.findMany({
      where: {
        groupId: group.id,
        NOT: {
          role: "ADMIN",
        },
      },
      orderBy: [{ name: "asc" }, { username: "asc" }],
      select: {
        id: true,
        name: true,
        username: true,
      },
    }),
    getAggregatedSalesDayRows({
      startDate: todaySaleDate,
      endDate: todaySaleDate,
    }),
    db.identifierCode.findMany({
      where: {
        assignedGroupId: group.id,
        status: "ASSIGNED",
      },
      orderBy: [{ assignedAt: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        code: true,
        currentOwnerUserId: true,
        currentOwner: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    }),
    db.groupFollowUpItem.findMany({
      where: {
        groupId: group.id,
        sourceType: {
          in: [
            "PROSPECT_LEAD",
            "MANUAL_DISCOVERY",
          ],
        },
      },
      orderBy: [{ lastActionAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        sourceType: true,
        status: true,
        summaryNote: true,
        lastActionAt: true,
      },
    }),
    db.groupResourceAuditLog.findMany({
      where: {
        groupId: group.id,
      },
      orderBy: [{ createdAt: "desc" }],
      take: 20,
      select: {
        id: true,
        resourceType: true,
        resourceId: true,
        actionType: true,
        reason: true,
        createdAt: true,
      },
    }),
  ]);

  const memberById = new Map(
    members.map((member) => [member.id, member.name || member.username]),
  );
  const memberSales = new Map<string, { count40: number; count60: number }>(
    members.map((member) => [member.id, { count40: 0, count60: 0 }]),
  );

  for (const row of salesRows) {
    const current = memberSales.get(row.userId);

    if (!current) {
      continue;
    }

    current.count40 += row.count40;
    current.count60 += row.count60;
  }

  const memberRanking = members
    .map((member) => {
      const sales = memberSales.get(member.id) ?? { count40: 0, count60: 0 };
      const total = sales.count40 + sales.count60;

      return {
        userId: member.id,
        userName: memberById.get(member.id) ?? member.username,
        count40: sales.count40,
        count60: sales.count60,
        total,
      };
    })
    .sort(sortByTotalThenName)
    .map((row, index) => ({
      rank: index + 1,
      ...row,
    }));

  const summary = memberRanking.reduce(
    (current, row) => ({
      memberCount: current.memberCount + 1,
      todayCount40: current.todayCount40 + row.count40,
      todayCount60: current.todayCount60 + row.count60,
      todayTotal: current.todayTotal + row.total,
    }),
    {
      memberCount: 0,
      todayCount40: 0,
      todayCount60: 0,
      todayTotal: 0,
    },
  );

  const codePool = codes.map((code) => ({
    id: code.id,
    code: code.code,
    currentOwnerUserId: code.currentOwnerUserId,
    currentOwnerName: code.currentOwner
      ? code.currentOwner.name || code.currentOwner.username
      : null,
  }));

  const followUpQueue = followUpItems
    .map((item) => ({
      id: item.id,
      sourceType: item.sourceType,
      status: item.status,
      summaryNote: item.summaryNote,
    }));

  const auditRows = auditLogs
    .slice()
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .map((row) => ({
      id: row.id,
      resourceType: row.resourceType,
      resourceId: row.resourceId,
      actionType: row.actionType,
      reason: row.reason,
    }));

  return {
    group,
    summary,
    memberRanking,
    codePool,
    followUpQueue,
    auditRows,
  };
}
