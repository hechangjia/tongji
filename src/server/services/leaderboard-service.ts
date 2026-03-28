import {
  getTodaySaleDateValue,
  type DateValue,
} from "@/server/services/sales-service";
import { getAggregatedSalesDayRows } from "@/server/services/sales-reporting-service";

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

function collapseSalesRows(rows: Array<{ count40: number; count60: number; userName: string }>) {
  const groupedRows = new Map<string, LeaderboardInputRow>();

  for (const row of rows) {
    const current = groupedRows.get(row.userName);

    if (current) {
      current.count40 += row.count40;
      current.count60 += row.count60;
      continue;
    }

    groupedRows.set(row.userName, {
      userName: row.userName,
      count40: row.count40,
      count60: row.count60,
    });
  }

  return Array.from(groupedRows.values());
}

export async function getDailyLeaderboard(date = getTodaySaleDateValue()) {
  const rows = await getAggregatedSalesDayRows({
    startDate: date,
    endDate: date,
  });

  return buildLeaderboard(collapseSalesRows(rows));
}

export async function getRangeLeaderboard(startDate: DateValue, endDate: DateValue) {
  const rows = await getAggregatedSalesDayRows({
    startDate,
    endDate,
  });

  return buildLeaderboard(collapseSalesRows(rows));
}
