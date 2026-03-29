import { Prisma } from "@prisma/client";
import type {
  IdentifierCodeStatus,
  GroupFollowUpSourceType,
  GroupFollowUpStatus,
  GroupResourceAuditActionType,
  GroupResourceAuditResourceType,
  ProspectLeadStatus,
} from "@prisma/client";
import { db } from "@/lib/db";
import {
  createManualFollowUpSchema,
  reassignFollowUpSchema,
  reassignIdentifierCodeSchema,
  updateFollowUpStatusSchema,
} from "@/lib/validators/leader-workbench";
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

export type LeaderWorkbenchSummary = {
  memberCount: number;
  todayCount40: number;
  todayCount60: number;
  todayTotal: number;
  pendingFollowUpCount: number;
  groupPoolCodeCount: number;
};

export type LeaderWorkbenchMemberRow = {
  rank: number;
  userId: string;
  userName: string;
  count40: number;
  count60: number;
  total: number;
  activeCodeCount: number;
  pendingFollowUpCount: number;
  lastActionAt: Date | null;
};

export type LeaderWorkbenchCodePoolRow = {
  id: string;
  code: string;
  currentOwnerUserId: string | null;
  currentOwnerName: string | null;
  assignedAt: Date | null;
  createdAt: Date;
  isInGroupPool: boolean;
};

export type LeaderWorkbenchFollowUpProspectContext = {
  id: string;
  qqNumber: string;
  major: string;
  status: ProspectLeadStatus;
  assignedToUserId: string | null;
  assignedGroupId: string | null;
};

export type LeaderWorkbenchFollowUpRow = {
  id: string;
  sourceType: GroupFollowUpSourceType;
  status: GroupFollowUpStatus;
  summaryNote: string | null;
  currentOwnerUserId: string | null;
  currentOwnerName: string | null;
  isInGroupPool: boolean;
  lastActionAt: Date;
  createdAt: Date;
  prospectLead: LeaderWorkbenchFollowUpProspectContext | null;
};

export type LeaderWorkbenchAuditRow = {
  id: string;
  resourceType: GroupResourceAuditResourceType;
  resourceId: string;
  actionType: GroupResourceAuditActionType;
  reason: string;
  createdAt: Date;
  operatorUserId: string | null;
  operatorUserName: string | null;
  beforeSnapshot: Prisma.JsonValue | null;
  afterSnapshot: Prisma.JsonValue | null;
};

export type LeaderWorkbenchSnapshot = {
  group: LeaderBoundGroup;
  summary: LeaderWorkbenchSummary;
  memberRanking: LeaderWorkbenchMemberRow[];
  codePool: LeaderWorkbenchCodePoolRow[];
  followUpQueue: LeaderWorkbenchFollowUpRow[];
  auditRows: LeaderWorkbenchAuditRow[];
};

const FINAL_FOLLOW_UP_STATUSES = new Set<GroupFollowUpStatus>(["INVALID", "CONVERTED"]);
type DatabaseClient = typeof db | Prisma.TransactionClient;
type AuditSnapshotInput = Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;

function sortByTotalThenName(
  left: { total: number; userName: string },
  right: { total: number; userName: string },
) {
  if (right.total !== left.total) {
    return right.total - left.total;
  }

  return left.userName.localeCompare(right.userName, "zh-CN");
}

function getDisplayUserName(user: { name: string | null; username: string }) {
  return user.name || user.username;
}

function getLatestDate(current: Date | null, candidate: Date | null) {
  if (!candidate) {
    return current;
  }

  if (!current || candidate.getTime() > current.getTime()) {
    return candidate;
  }

  return current;
}

function isPendingFollowUpStatus(status: GroupFollowUpStatus) {
  return !FINAL_FOLLOW_UP_STATUSES.has(status);
}

function serializeDate(date: Date | null) {
  return date ? date.toISOString() : null;
}

function buildFollowUpAuditSnapshot(item: {
  id: string;
  groupId: string;
  currentOwnerUserId: string | null;
  sourceType: GroupFollowUpSourceType;
  prospectLeadId: string | null;
  status: GroupFollowUpStatus;
  summaryNote: string | null;
  createdByUserId: string | null;
  lastActionAt: Date;
  createdAt: Date;
  convertedAt: Date | null;
}): Prisma.InputJsonObject {
  return {
    id: item.id,
    groupId: item.groupId,
    currentOwnerUserId: item.currentOwnerUserId,
    sourceType: item.sourceType,
    prospectLeadId: item.prospectLeadId,
    status: item.status,
    summaryNote: item.summaryNote,
    createdByUserId: item.createdByUserId,
    lastActionAt: serializeDate(item.lastActionAt),
    createdAt: serializeDate(item.createdAt),
    convertedAt: serializeDate(item.convertedAt),
  };
}

function buildIdentifierCodeAuditSnapshot(code: {
  id: string;
  code: string;
  status: IdentifierCodeStatus;
  assignedGroupId: string | null;
  currentOwnerUserId: string | null;
  assignedAt: Date | null;
  soldAt: Date | null;
}): Prisma.InputJsonObject {
  return {
    id: code.id,
    code: code.code,
    status: code.status,
    assignedGroupId: code.assignedGroupId,
    currentOwnerUserId: code.currentOwnerUserId,
    assignedAt: serializeDate(code.assignedAt),
    soldAt: serializeDate(code.soldAt),
  };
}

async function resolveGroupAssignableUserOrThrow(
  database: DatabaseClient,
  groupId: string,
  userId: string | undefined,
) {
  if (!userId) {
    return null;
  }

  const user = await database.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      status: true,
      groupId: true,
    },
  });

  if (
    !user ||
    user.groupId !== groupId ||
    user.role === "ADMIN" ||
    user.status !== "ACTIVE"
  ) {
    throw new Error("只能分配给本组启用中的成员或组长");
  }

  return user;
}

function assertGroupScopedResource(resourceGroupId: string | null, groupId: string) {
  if (!resourceGroupId || resourceGroupId !== groupId) {
    throw new Error("只能操作本组资源");
  }
}

async function appendGroupResourceAuditLog(
  database: DatabaseClient,
  input: {
    groupId: string;
    operatorUserId: string;
    resourceType: GroupResourceAuditResourceType;
    resourceId: string;
    actionType: GroupResourceAuditActionType;
    reason: string;
    beforeSnapshot: AuditSnapshotInput;
    afterSnapshot: AuditSnapshotInput;
  },
) {
  await database.groupResourceAuditLog.create({
    data: {
      groupId: input.groupId,
      operatorUserId: input.operatorUserId,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      actionType: input.actionType,
      reason: input.reason,
      beforeSnapshot: input.beforeSnapshot,
      afterSnapshot: input.afterSnapshot,
    },
  });
}

const mutationFollowUpSelect = {
  id: true,
  groupId: true,
  currentOwnerUserId: true,
  sourceType: true,
  prospectLeadId: true,
  status: true,
  summaryNote: true,
  createdByUserId: true,
  lastActionAt: true,
  createdAt: true,
  convertedAt: true,
} as const;

const mutationIdentifierCodeSelect = {
  id: true,
  code: true,
  status: true,
  assignedGroupId: true,
  currentOwnerUserId: true,
  assignedAt: true,
  soldAt: true,
} as const;

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
        assignedAt: true,
        createdAt: true,
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
        currentOwnerUserId: true,
        createdAt: true,
        lastActionAt: true,
        currentOwnerUser: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        prospectLead: {
          select: {
            id: true,
            qqNumber: true,
            major: true,
            status: true,
            assignedToUserId: true,
            assignedGroupId: true,
          },
        },
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
        operatorUserId: true,
        beforeSnapshot: true,
        afterSnapshot: true,
        createdAt: true,
        operatorUser: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    }),
  ]);

  const memberById = new Map(
    members.map((member) => [member.id, getDisplayUserName(member)]),
  );
  const memberSales = new Map<string, { count40: number; count60: number }>(
    members.map((member) => [member.id, { count40: 0, count60: 0 }]),
  );
  const memberCodeCounts = new Map<string, number>(members.map((member) => [member.id, 0]));
  const memberFollowUpCounts = new Map<string, number>(members.map((member) => [member.id, 0]));
  const memberLastActionAt = new Map<string, Date | null>(
    members.map((member) => [member.id, null]),
  );

  for (const row of salesRows) {
    const current = memberSales.get(row.userId);

    if (!current) {
      continue;
    }

    current.count40 += row.count40;
    current.count60 += row.count60;
  }

  for (const code of codes) {
    if (!code.currentOwnerUserId) {
      continue;
    }

    const currentCount = memberCodeCounts.get(code.currentOwnerUserId);

    if (typeof currentCount !== "number") {
      continue;
    }

    memberCodeCounts.set(code.currentOwnerUserId, currentCount + 1);
    memberLastActionAt.set(
      code.currentOwnerUserId,
      getLatestDate(memberLastActionAt.get(code.currentOwnerUserId) ?? null, code.assignedAt),
    );
  }

  for (const item of followUpItems) {
    if (!item.currentOwnerUserId) {
      continue;
    }

    if (isPendingFollowUpStatus(item.status)) {
      const currentCount = memberFollowUpCounts.get(item.currentOwnerUserId);

      if (typeof currentCount === "number") {
        memberFollowUpCounts.set(item.currentOwnerUserId, currentCount + 1);
      }
    }

    if (!memberLastActionAt.has(item.currentOwnerUserId)) {
      continue;
    }

    memberLastActionAt.set(
      item.currentOwnerUserId,
      getLatestDate(memberLastActionAt.get(item.currentOwnerUserId) ?? null, item.lastActionAt),
    );
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
        activeCodeCount: memberCodeCounts.get(member.id) ?? 0,
        pendingFollowUpCount: memberFollowUpCounts.get(member.id) ?? 0,
        lastActionAt: memberLastActionAt.get(member.id) ?? null,
      };
    })
    .sort(sortByTotalThenName)
    .map((row, index) => ({
      rank: index + 1,
      ...row,
    }));

  const summary = memberRanking.reduce<LeaderWorkbenchSummary>(
    (current, row) => ({
      memberCount: current.memberCount + 1,
      todayCount40: current.todayCount40 + row.count40,
      todayCount60: current.todayCount60 + row.count60,
      todayTotal: current.todayTotal + row.total,
      pendingFollowUpCount: current.pendingFollowUpCount,
      groupPoolCodeCount: current.groupPoolCodeCount,
    }),
    {
      memberCount: 0,
      todayCount40: 0,
      todayCount60: 0,
      todayTotal: 0,
      pendingFollowUpCount: followUpItems.filter((item) => isPendingFollowUpStatus(item.status)).length,
      groupPoolCodeCount: codes.filter((code) => !code.currentOwnerUserId).length,
    },
  );

  const codePool = codes.map((code) => ({
    id: code.id,
    code: code.code,
    currentOwnerUserId: code.currentOwnerUserId,
    currentOwnerName: code.currentOwner
      ? getDisplayUserName(code.currentOwner)
      : null,
    assignedAt: code.assignedAt,
    createdAt: code.createdAt,
    isInGroupPool: !code.currentOwnerUserId,
  }));

  const followUpQueue = followUpItems
    .map((item) => ({
      id: item.id,
      sourceType: item.sourceType,
      status: item.status,
      summaryNote: item.summaryNote,
      currentOwnerUserId: item.currentOwnerUserId,
      currentOwnerName: item.currentOwnerUser
        ? getDisplayUserName(item.currentOwnerUser)
        : null,
      isInGroupPool: !item.currentOwnerUserId,
      lastActionAt: item.lastActionAt,
      createdAt: item.createdAt,
      prospectLead: item.prospectLead
        ? {
            id: item.prospectLead.id,
            qqNumber: item.prospectLead.qqNumber,
            major: item.prospectLead.major,
            status: item.prospectLead.status,
            assignedToUserId: item.prospectLead.assignedToUserId,
            assignedGroupId: item.prospectLead.assignedGroupId,
          }
        : null,
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
      createdAt: row.createdAt,
      operatorUserId: row.operatorUserId,
      operatorUserName: row.operatorUser ? getDisplayUserName(row.operatorUser) : null,
      beforeSnapshot: row.beforeSnapshot,
      afterSnapshot: row.afterSnapshot,
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

export async function createManualFollowUpForLeader(
  leaderUserId: string,
  input: Parameters<typeof createManualFollowUpSchema.parse>[0],
) {
  const group = await getLeaderBoundGroupOrThrow(leaderUserId);
  const payload = createManualFollowUpSchema.parse(input);

  return db.$transaction(async (tx) => {
    await resolveGroupAssignableUserOrThrow(tx, group.id, payload.currentOwnerUserId);

    const created = await tx.groupFollowUpItem.create({
      data: {
        groupId: group.id,
        currentOwnerUserId: payload.currentOwnerUserId ?? null,
        sourceType: "MANUAL_DISCOVERY",
        status: "UNTOUCHED",
        summaryNote: payload.summaryNote,
        createdByUserId: leaderUserId,
      },
      select: mutationFollowUpSelect,
    });

    await appendGroupResourceAuditLog(tx, {
      groupId: group.id,
      operatorUserId: leaderUserId,
      resourceType: "FOLLOW_UP_ITEM",
      resourceId: created.id,
      actionType: "CREATE_MANUAL_FOLLOW_UP",
      reason: "组长手动创建跟进项",
      beforeSnapshot: Prisma.DbNull,
      afterSnapshot: buildFollowUpAuditSnapshot(created),
    });

    return created;
  });
}

export async function reassignFollowUpForLeader(
  leaderUserId: string,
  input: Parameters<typeof reassignFollowUpSchema.parse>[0],
) {
  const group = await getLeaderBoundGroupOrThrow(leaderUserId);
  const payload = reassignFollowUpSchema.parse(input);

  return db.$transaction(async (tx) => {
    const followUpItem = await tx.groupFollowUpItem.findUnique({
      where: { id: payload.followUpItemId },
      select: mutationFollowUpSelect,
    });

    if (!followUpItem) {
      throw new Error("跟进项不存在");
    }

    assertGroupScopedResource(followUpItem.groupId, group.id);
    await resolveGroupAssignableUserOrThrow(tx, group.id, payload.nextOwnerUserId);

    const updated = await tx.groupFollowUpItem.update({
      where: { id: payload.followUpItemId },
      data: {
        currentOwnerUserId: payload.nextOwnerUserId ?? null,
        lastActionAt: new Date(),
      },
      select: mutationFollowUpSelect,
    });

    await appendGroupResourceAuditLog(tx, {
      groupId: group.id,
      operatorUserId: leaderUserId,
      resourceType: "FOLLOW_UP_ITEM",
      resourceId: updated.id,
      actionType: payload.nextOwnerUserId ? "REASSIGN" : "RETURN_TO_GROUP_POOL",
      reason: payload.reason,
      beforeSnapshot: buildFollowUpAuditSnapshot(followUpItem),
      afterSnapshot: buildFollowUpAuditSnapshot(updated),
    });

    return updated;
  });
}

export async function updateFollowUpStatusForLeader(
  leaderUserId: string,
  input: Parameters<typeof updateFollowUpStatusSchema.parse>[0],
) {
  const group = await getLeaderBoundGroupOrThrow(leaderUserId);
  const payload = updateFollowUpStatusSchema.parse(input);

  return db.$transaction(async (tx) => {
    const followUpItem = await tx.groupFollowUpItem.findUnique({
      where: { id: payload.followUpItemId },
      select: mutationFollowUpSelect,
    });

    if (!followUpItem) {
      throw new Error("跟进项不存在");
    }

    assertGroupScopedResource(followUpItem.groupId, group.id);

    if (
      FINAL_FOLLOW_UP_STATUSES.has(followUpItem.status) &&
      followUpItem.status !== payload.status
    ) {
      throw new Error("已关闭的跟进项不能重新开启");
    }

    const updated = await tx.groupFollowUpItem.update({
      where: { id: payload.followUpItemId },
      data: {
        status: payload.status,
        lastActionAt: new Date(),
      },
      select: mutationFollowUpSelect,
    });

    await appendGroupResourceAuditLog(tx, {
      groupId: group.id,
      operatorUserId: leaderUserId,
      resourceType: "FOLLOW_UP_ITEM",
      resourceId: updated.id,
      actionType: "STATUS_CHANGE",
      reason: payload.reason,
      beforeSnapshot: buildFollowUpAuditSnapshot(followUpItem),
      afterSnapshot: buildFollowUpAuditSnapshot(updated),
    });

    return updated;
  });
}

export async function reassignIdentifierCodeForLeader(
  leaderUserId: string,
  input: Parameters<typeof reassignIdentifierCodeSchema.parse>[0],
) {
  const group = await getLeaderBoundGroupOrThrow(leaderUserId);
  const payload = reassignIdentifierCodeSchema.parse(input);

  return db.$transaction(async (tx) => {
    const identifierCode = await tx.identifierCode.findUnique({
      where: { id: payload.codeId },
      select: mutationIdentifierCodeSelect,
    });

    if (!identifierCode) {
      throw new Error("识别码不存在");
    }

    assertGroupScopedResource(identifierCode.assignedGroupId, group.id);

    if (identifierCode.status === "SOLD") {
      throw new Error("已售出的识别码不能再改派");
    }

    if (identifierCode.status !== "ASSIGNED") {
      throw new Error("只有已分配到本组的识别码才能改派");
    }

    await resolveGroupAssignableUserOrThrow(tx, group.id, payload.nextOwnerUserId);

    const updated = await tx.identifierCode.update({
      where: { id: payload.codeId },
      data: {
        currentOwnerUserId: payload.nextOwnerUserId ?? null,
        assignedAt: new Date(),
      },
      select: mutationIdentifierCodeSelect,
    });

    await appendGroupResourceAuditLog(tx, {
      groupId: group.id,
      operatorUserId: leaderUserId,
      resourceType: "IDENTIFIER_CODE",
      resourceId: updated.id,
      actionType: payload.nextOwnerUserId ? "REASSIGN" : "RETURN_TO_GROUP_POOL",
      reason: payload.reason,
      beforeSnapshot: buildIdentifierCodeAuditSnapshot(identifierCode),
      afterSnapshot: buildIdentifierCodeAuditSnapshot(updated),
    });

    return updated;
  });
}
