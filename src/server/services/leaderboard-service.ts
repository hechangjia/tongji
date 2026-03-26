import { db } from "@/lib/db";
import {
  getTodaySaleDateValue,
  saleDateValueToDate,
  type DateValue,
} from "@/server/services/sales-service";

export type LeaderboardInputRow = {
  userName: string;
  count40: number;
  count60: number;
};

export type LeaderboardRow = LeaderboardInputRow & {
  total: number;
  rank: number;
};

export function buildLeaderboard(rows: LeaderboardInputRow[]): LeaderboardRow[] {
  return rows
    .map((row) => ({
      ...row,
      total: row.count40 + row.count60,
    }))
    .sort((left, right) => {
      if (right.total !== left.total) {
        return right.total - left.total;
      }

      return left.userName.localeCompare(right.userName, "zh-CN");
    })
    .map((row, index) => ({
      ...row,
      rank: index + 1,
    }));
}

function collapseSalesRows(
  rows: Array<{
    count40: number;
    count60: number;
    user: {
      name: string;
      username: string;
    };
  }>,
) {
  const groupedRows = new Map<string, LeaderboardInputRow>();

  for (const row of rows) {
    const userName = row.user.name || row.user.username;
    const current = groupedRows.get(userName);

    if (current) {
      current.count40 += row.count40;
      current.count60 += row.count60;
      continue;
    }

    groupedRows.set(userName, {
      userName,
      count40: row.count40,
      count60: row.count60,
    });
  }

  return Array.from(groupedRows.values());
}

export async function getDailyLeaderboard(date = getTodaySaleDateValue()) {
  const rows = await db.salesRecord.findMany({
    where: {
      saleDate: saleDateValueToDate(date),
    },
    include: {
      user: {
        select: {
          name: true,
          username: true,
        },
      },
    },
  });

  return buildLeaderboard(collapseSalesRows(rows));
}

export async function getRangeLeaderboard(startDate: DateValue, endDate: DateValue) {
  const rows = await db.salesRecord.findMany({
    where: {
      saleDate: {
        gte: saleDateValueToDate(startDate),
        lte: saleDateValueToDate(endDate),
      },
    },
    include: {
      user: {
        select: {
          name: true,
          username: true,
        },
      },
    },
  });

  return buildLeaderboard(collapseSalesRows(rows));
}
