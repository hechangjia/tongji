import { UserStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export async function checkUsernameAvailable(username: string, excludeUserId?: string) {
  const existing = await db.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (existing && (!excludeUserId || existing.id !== excludeUserId)) {
    throw new Error("该账号已存在，请更换后重试");
  }
}

export async function checkGroupExists(groupId: string) {
  const group = await db.group.findUnique({
    where: { id: groupId },
    select: { id: true },
  });

  if (!group) {
    throw new Error("所选小组不存在，请刷新页面后重试");
  }

  return group;
}

export async function createMember(input: {
  username: string;
  name: string;
  password: string;
  groupId?: string | null;
  remark?: string | null;
  status: "ACTIVE" | "INACTIVE";
}) {
  return db.user.create({
    data: {
      username: input.username,
      name: input.name,
      passwordHash: await hashPassword(input.password),
      role: "MEMBER",
      groupId: input.groupId ?? null,
      remark: input.remark ?? null,
      status: input.status === "ACTIVE" ? UserStatus.ACTIVE : UserStatus.INACTIVE,
    },
  });
}

export async function fetchMemberForAssignment(memberId: string) {
  return db.user.findUnique({
    where: { id: memberId },
    select: {
      role: true,
      groupId: true,
      ledGroup: { select: { id: true } },
    },
  });
}

export async function fetchGroupForLeaderAssignment(groupId: string) {
  const group = await db.group.findUnique({
    where: { id: groupId },
    select: { id: true, leaderUserId: true },
  });

  if (!group) {
    throw new Error("所选小组不存在，请刷新页面后重试");
  }

  return group;
}

export async function updateMemberWithAssignment(
  memberId: string,
  updateData: {
    username?: string;
    name?: string;
    role?: "ADMIN" | "LEADER" | "MEMBER";
    groupId?: string | null;
    remark?: string | null;
    status?: UserStatus;
    passwordHash?: string;
  },
  sideEffects: {
    clearLeaderFromGroupId?: string;
    demoteLeaderUserId?: string;
    setLeaderOnGroupId?: string;
  },
) {
  const operations: Array<
    ReturnType<typeof db.group.update> | ReturnType<typeof db.user.update> | ReturnType<typeof db.user.updateMany>
  > = [];

  if (sideEffects.clearLeaderFromGroupId) {
    operations.push(
      db.group.update({
        where: { id: sideEffects.clearLeaderFromGroupId },
        data: { leaderUserId: null },
      }),
    );
  }

  if (sideEffects.demoteLeaderUserId) {
    operations.push(
      db.user.updateMany({
        where: { id: sideEffects.demoteLeaderUserId, role: "LEADER" },
        data: { role: "MEMBER" },
      }),
    );
  }

  operations.push(
    db.user.update({
      where: { id: memberId },
      data: updateData,
    }),
  );

  if (sideEffects.setLeaderOnGroupId) {
    operations.push(
      db.group.update({
        where: { id: sideEffects.setLeaderOnGroupId },
        data: { leaderUserId: memberId },
      }),
    );
  }

  return db.$transaction(operations);
}

export async function resetMemberPassword(memberId: string, newPassword: string) {
  return db.user.update({
    where: { id: memberId },
    data: { passwordHash: await hashPassword(newPassword) },
  });
}

export async function checkMemberDeletable(memberId: string) {
  const member = await db.user.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      ledGroup: { select: { id: true } },
      _count: {
        select: {
          salesRecords: true,
          commissionRules: true,
          dailyTargets: true,
          adjustedDailyTargets: true,
          receivedReminders: true,
          sentReminders: true,
          identifierImportBatches: true,
          importedProspectBatches: true,
          ownedIdentifierCodes: true,
          receivedCodeAssignments: true,
          sentCodeAssignments: true,
          assignedProspectLeads: true,
          createdProspectLeads: true,
          identifierSales: true,
        },
      },
    },
  });

  if (!member) {
    throw new Error("所选成员不存在，请刷新页面后重试");
  }

  const totalRelations = Object.values(member._count).reduce((sum, count) => sum + count, 0);

  if (totalRelations > 0) {
    throw new Error("该成员已有历史数据，不能直接删除，请改为停用");
  }

  return member;
}

export async function deleteMember(memberId: string) {
  return db.user.delete({ where: { id: memberId } });
}
