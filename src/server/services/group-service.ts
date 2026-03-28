import { Role, UserStatus } from "@prisma/client";
import { db } from "@/lib/db";

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
