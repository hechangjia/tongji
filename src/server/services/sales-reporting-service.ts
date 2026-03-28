import { PlanType } from "@prisma/client";
import { db } from "@/lib/db";
import { saleDateToValue, saleDateValueToDate, type DateValue } from "@/server/services/sales-service";

export type AggregatedSalesDayRow = {
  userId: string;
  userName: string;
  saleDate: Date;
  count40: number;
  count60: number;
  source: "IDENTIFIER_SALE" | "LEGACY_SALES_RECORD";
};

function buildUserDayKey(userId: string, saleDate: Date) {
  return `${userId}:${saleDateToValue(saleDate)}`;
}

export async function getAggregatedSalesDayRows({
  startDate,
  endDate,
}: {
  startDate: DateValue;
  endDate: DateValue;
}): Promise<AggregatedSalesDayRow[]> {
  const start = saleDateValueToDate(startDate);
  const end = saleDateValueToDate(endDate);
  const [identifierSales, legacySalesRecords] = await Promise.all([
    db.identifierSale.findMany({
      where: {
        saleDate: {
          gte: start,
          lte: end,
        },
      },
      orderBy: [{ saleDate: "asc" }, { createdAt: "asc" }],
      select: {
        sellerUserId: true,
        saleDate: true,
        planType: true,
        seller: {
          select: {
            name: true,
            username: true,
          },
        },
      },
    }),
    db.salesRecord.findMany({
      where: {
        saleDate: {
          gte: start,
          lte: end,
        },
      },
      orderBy: [{ saleDate: "asc" }, { createdAt: "asc" }],
      select: {
        userId: true,
        saleDate: true,
        count40: true,
        count60: true,
        user: {
          select: {
            name: true,
            username: true,
          },
        },
      },
    }),
  ]);

  const factRows = new Map<string, AggregatedSalesDayRow>();

  for (const sale of identifierSales) {
    const key = buildUserDayKey(sale.sellerUserId, sale.saleDate);
    const current = factRows.get(key) ?? {
      userId: sale.sellerUserId,
      userName: sale.seller.name || sale.seller.username,
      saleDate: sale.saleDate,
      count40: 0,
      count60: 0,
      source: "IDENTIFIER_SALE" as const,
    };

    if (sale.planType === PlanType.PLAN_40) {
      current.count40 += 1;
    } else {
      current.count60 += 1;
    }

    factRows.set(key, current);
  }

  const factKeys = new Set(factRows.keys());
  const mergedRows = [...factRows.values()];

  for (const record of legacySalesRecords) {
    const key = buildUserDayKey(record.userId, record.saleDate);

    if (factKeys.has(key)) {
      continue;
    }

    mergedRows.push({
      userId: record.userId,
      userName: record.user.name || record.user.username,
      saleDate: record.saleDate,
      count40: record.count40,
      count60: record.count60,
      source: "LEGACY_SALES_RECORD",
    });
  }

  return mergedRows.sort((left, right) => {
    const dateDiff = left.saleDate.getTime() - right.saleDate.getTime();

    if (dateDiff !== 0) {
      return dateDiff;
    }

    return left.userName.localeCompare(right.userName, "zh-CN");
  });
}
