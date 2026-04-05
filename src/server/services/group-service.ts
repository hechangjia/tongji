import { Role, UserStatus } from "@prisma/client";
import { db } from "@/lib/db";

function isEligibleLeaderCandidate(candidate: { role: Role; status: UserStatus }) {
  return candidate.status === UserStatus.ACTIVE && candidate.role !== Role.ADMIN;
}

export async function checkGroupNameAvailable(name: string, excludeGroupId?: string) {
  const existing = await db.group.findUnique({
    where: { name },
    select: { id: true },
  });

  if (existing && (!excludeGroupId || existing.id !== excludeGroupId)) {
    throw new Error("该小组名称已存在，请更换后重试");
  }
}

export async function validateLeaderCandidate(userId: string) {
  const candidate = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      status: true,
      groupId: true,
      ledGroup: { select: { id: true } },
    },
  });

  if (!candidate) {
    throw new Error("所选组长不存在，请刷新页面后重试");
  }

  if (!isEligibleLeaderCandidate(candidate)) {
    throw new Error("只能从启用中的成员或组长里指定组长");
  }

  return candidate;
}

export async function createGroupWithLeader(input: {
  name: string;
  slogan?: string | null;
  remark?: string | null;
  leaderUserId?: string | null;
}) {
  return db.$transaction(async (tx) => {
    const createdGroup = await tx.group.create({
      data: {
        name: input.name,
        slogan: input.slogan,
        remark: input.remark,
      },
    });

    if (!input.leaderUserId) {
      return createdGroup;
    }

    await tx.user.update({
      where: { id: input.leaderUserId },
      data: { role: "LEADER", groupId: createdGroup.id },
    });

    await tx.group.update({
      where: { id: createdGroup.id },
      data: { leaderUserId: input.leaderUserId },
    });

    return createdGroup;
  });
}

export async function updateGroupWithLeader(
  groupId: string,
  updateData: {
    name?: string;
    slogan?: string | null;
    remark?: string | null;
    leaderUserId?: string | null;
  },
  changeLeader: boolean,
) {
  if (!changeLeader) {
    return db.group.update({
      where: { id: groupId },
      data: updateData,
    });
  }

  const currentGroup = await db.group.findUnique({
    where: { id: groupId },
    select: { id: true, leaderUserId: true },
  });

  return db.$transaction(async (tx) => {
    if (
      currentGroup?.leaderUserId &&
      currentGroup.leaderUserId !== (updateData.leaderUserId ?? null)
    ) {
      await tx.user.update({
        where: { id: currentGroup.leaderUserId },
        data: { role: "MEMBER" },
      });
    }

    if (updateData.leaderUserId) {
      await tx.user.update({
        where: { id: updateData.leaderUserId },
        data: { role: "LEADER", groupId },
      });
    }

    await tx.group.update({
      where: { id: groupId },
      data: updateData,
    });
  });
}
export async function listGroupsForAdmin() {
  const groups = await db.group.findMany({
    orderBy: [{ createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      slogan: true,
      remark: true,
      leaderUserId: true,
      createdAt: true,
      leader: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  return groups.map((group) => ({
    id: group.id,
    name: group.name,
    slogan: group.slogan,
    remark: group.remark,
    leaderUserId: group.leaderUserId,
    leader: group.leader,
    memberCount: group._count.members,
    createdAt: group.createdAt,
  }));
}

export async function updateLeaderGroupProfile(
  leaderId: string,
  input: { slogan?: string | null; remark?: string | null },
) {
  const currentLeader = await db.user.findUnique({
    where: { id: leaderId },
    select: { groupId: true },
  });

  if (!currentLeader?.groupId) {
    throw new Error("当前账号还没有绑定小组，请先联系管理员处理");
  }

  return db.group.update({
    where: { id: currentLeader.groupId },
    data: {
      slogan: input.slogan ?? null,
      remark: input.remark ?? null,
    },
  });
}

export async function listLeaderCandidates() {
  const rows = await db.user.findMany({
    where: {
      status: UserStatus.ACTIVE,
      NOT: {
        role: Role.ADMIN,
      },
    },
    orderBy: [{ name: "asc" }, { username: "asc" }],
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      group: {
        select: {
          name: true,
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    username: row.username,
    role: row.role,
    groupName: row.group?.name ?? null,
  }));
}
