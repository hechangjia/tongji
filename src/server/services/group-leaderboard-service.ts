import { db } from "@/lib/db";
import { getAggregatedSalesDayRows } from "@/server/services/sales-reporting-service";
import { getTodaySaleDateValue, type DateValue } from "@/server/services/sales-service";

type GroupTotals = {
  groupId: string;
  groupName: string;
  count40: number;
  count60: number;
  total: number;
};

export type GroupLeaderboardRow = GroupTotals & {
  rank: number;
};

export type GroupLeaderboardCurrentGroupDelta = {
  groupId: string;
  gapToPrevious: number | null;
  gapToNext: number | null;
};

export type GroupLeaderboardResult = {
  rows: GroupLeaderboardRow[];
  currentGroupDelta: GroupLeaderboardCurrentGroupDelta | null;
};

export type GroupLeaderboardInput = {
  currentUserId: string;
  currentUserRole: "MEMBER" | "LEADER" | "ADMIN";
  todaySaleDate?: DateValue;
};

export type GroupMemberLeaderboardRow = {
  rank: number;
  userId: string;
  userName: string;
  count40: number;
  count60: number;
  total: number;
};

export type VisibleGroupMemberRowsInput = {
  currentUserId: string;
  currentUserRole: "MEMBER" | "LEADER" | "ADMIN";
  groupId: string;
  todaySaleDate?: DateValue;
};

function sortByTotalThenName<T extends { total: number; userName: string }>(left: T, right: T) {
  if (right.total !== left.total) {
    return right.total - left.total;
  }

  return left.userName.localeCompare(right.userName, "zh-CN");
}

function rankRows<T extends { total: number; userName: string }>(rows: T[]) {
  return rows
    .sort(sortByTotalThenName)
    .map((row, index) => ({
      ...row,
      rank: index + 1,
    }));
}

async function resolveCurrentUserGroupId(input: Pick<GroupLeaderboardInput, "currentUserId" | "currentUserRole">) {
  if (input.currentUserRole !== "LEADER") {
    return null;
  }

  const currentUser = await db.user.findUnique({
    where: { id: input.currentUserId },
    select: {
      groupId: true,
    },
  });

  return currentUser?.groupId ?? null;
}

export async function getGroupLeaderboard(input: GroupLeaderboardInput): Promise<GroupLeaderboardResult> {
  const todaySaleDate = input.todaySaleDate ?? getTodaySaleDateValue();
  const [rows, groups, currentGroupId] = await Promise.all([
    getAggregatedSalesDayRows({
      startDate: todaySaleDate,
      endDate: todaySaleDate,
    }),
    db.group.findMany({
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
      },
    }),
    resolveCurrentUserGroupId(input),
  ]);

  const userIds = Array.from(new Set(rows.map((row) => row.userId)));
  const users = userIds.length
    ? await db.user.findMany({
        where: {
          id: {
            in: userIds,
          },
        },
        select: {
          id: true,
          groupId: true,
        },
      })
    : [];

  const groupByUserId = new Map(users.map((user) => [user.id, user.groupId]));
  const totalsByGroupId = new Map<string, GroupTotals>(
    groups.map((group) => [
      group.id,
      {
        groupId: group.id,
        groupName: group.name,
        count40: 0,
        count60: 0,
        total: 0,
      },
    ]),
  );

  for (const row of rows) {
    const groupId = groupByUserId.get(row.userId);

    if (!groupId) {
      continue;
    }

    const current = totalsByGroupId.get(groupId);

    if (!current) {
      continue;
    }

    current.count40 += row.count40;
    current.count60 += row.count60;
    current.total += row.count40 + row.count60;
  }

  const rankedRows = rankRows(Array.from(totalsByGroupId.values()).map((row) => ({
    userName: row.groupName,
    ...row,
  }))).map(({ userName: _userName, ...row }) => row);

  if (!currentGroupId) {
    return {
      rows: rankedRows,
      currentGroupDelta: null,
    };
  }

  const currentIndex = rankedRows.findIndex((row) => row.groupId === currentGroupId);

  if (currentIndex < 0) {
    return {
      rows: rankedRows,
      currentGroupDelta: null,
    };
  }

  const current = rankedRows[currentIndex];
  const previous = currentIndex > 0 ? rankedRows[currentIndex - 1] : null;
  const next = currentIndex < rankedRows.length - 1 ? rankedRows[currentIndex + 1] : null;

  return {
    rows: rankedRows,
    currentGroupDelta: {
      groupId: current.groupId,
      gapToPrevious: previous ? previous.total - current.total : null,
      gapToNext: next ? current.total - next.total : null,
    },
  };
}

async function canExpandGroupMemberRows(input: VisibleGroupMemberRowsInput) {
  if (input.currentUserRole === "ADMIN") {
    return true;
  }

  if (input.currentUserRole === "MEMBER") {
    return false;
  }

  const currentUser = await db.user.findUnique({
    where: { id: input.currentUserId },
    select: {
      groupId: true,
    },
  });

  return currentUser?.groupId === input.groupId;
}

export async function getVisibleGroupMemberRows(
  input: VisibleGroupMemberRowsInput,
): Promise<GroupMemberLeaderboardRow[]> {
  const canExpand = await canExpandGroupMemberRows(input);

  if (!canExpand) {
    return [];
  }

  const todaySaleDate = input.todaySaleDate ?? getTodaySaleDateValue();
  const [members, rows] = await Promise.all([
    db.user.findMany({
      where: {
        groupId: input.groupId,
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
  ]);

  const memberById = new Map(
    members.map((member) => [member.id, member.name || member.username]),
  );
  const totals = new Map<string, { count40: number; count60: number }>(
    members.map((member) => [member.id, { count40: 0, count60: 0 }]),
  );

  for (const row of rows) {
    const current = totals.get(row.userId);

    if (!current) {
      continue;
    }

    current.count40 += row.count40;
    current.count60 += row.count60;
  }

  const rankedRows = rankRows(
    members.map((member) => {
      const memberTotals = totals.get(member.id) ?? { count40: 0, count60: 0 };
      const total = memberTotals.count40 + memberTotals.count60;

      return {
        userId: member.id,
        userName: memberById.get(member.id) ?? member.username,
        count40: memberTotals.count40,
        count60: memberTotals.count60,
        total,
      };
    }),
  );

  return rankedRows;
}
