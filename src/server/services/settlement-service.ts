import { db } from "@/lib/db";
import { settlementQuerySchema } from "@/lib/validators/settlement";
import { saleDateToValue, type DateValue } from "@/server/services/sales-service";
import { getAggregatedSalesDayRows } from "@/server/services/sales-reporting-service";

export type SettlementStatus = "OK" | "MISSING_RULE";

export type SettlementCalculation = {
  status: SettlementStatus;
  amount: number | null;
  price40: number | null;
  price60: number | null;
};

export type SettlementRow = {
  userId: string;
  userName: string;
  count40: number;
  count60: number;
  amount: number | null;
  status: SettlementStatus;
  missingDates: DateValue[];
};

type RuleLike = {
  price40: number;
  price60: number;
};

type CommissionRuleLike = {
  effectiveStart: Date;
  effectiveEnd: Date | null;
  price40: { toString(): string } | number;
  price60: { toString(): string } | number;
};

function toNumber(value: { toString(): string } | number) {
  return typeof value === "number" ? value : Number(value.toString());
}

export function calculateSettlementRow(
  sales: { count40: number; count60: number },
  rule: RuleLike | null,
): SettlementCalculation {
  if (!rule) {
    return {
      status: "MISSING_RULE",
      amount: null,
      price40: null,
      price60: null,
    };
  }

  return {
    status: "OK",
    amount: sales.count40 * rule.price40 + sales.count60 * rule.price60,
    price40: rule.price40,
    price60: rule.price60,
  };
}

function findCommissionRuleForDate(
  rules: CommissionRuleLike[],
  saleDate: Date,
) {
  return rules.find((rule) => {
    const start = rule.effectiveStart.getTime();
    const end = rule.effectiveEnd?.getTime() ?? Number.POSITIVE_INFINITY;
    const current = saleDate.getTime();

    return current >= start && current <= end;
  });
}

export async function getSettlementRows(startDate: string, endDate: string) {
  const query = settlementQuerySchema.parse({
    startDate,
    endDate,
  });

  const salesDayRows = await getAggregatedSalesDayRows({
    startDate: query.startDate as DateValue,
    endDate: query.endDate as DateValue,
  });

  if (salesDayRows.length === 0) {
    return [] as SettlementRow[];
  }

  const userIds = Array.from(new Set(salesDayRows.map((record) => record.userId)));
  const commissionRules = await db.commissionRule.findMany({
    where: {
      userId: {
        in: userIds,
      },
    },
    orderBy: [{ effectiveStart: "asc" }, { createdAt: "asc" }],
  });

  const rulesByUser = new Map<string, CommissionRuleLike[]>();

  for (const rule of commissionRules) {
    const current = rulesByUser.get(rule.userId) ?? [];
    current.push(rule);
    rulesByUser.set(rule.userId, current);
  }

  const rows = new Map<string, SettlementRow>();

  for (const record of salesDayRows) {
    const current = rows.get(record.userId) ?? {
      userId: record.userId,
      userName: record.userName,
      count40: 0,
      count60: 0,
      amount: 0,
      status: "OK" as SettlementStatus,
      missingDates: [],
    };

    current.count40 += record.count40;
    current.count60 += record.count60;

    const matchedRule = findCommissionRuleForDate(
      rulesByUser.get(record.userId) ?? [],
      record.saleDate,
    );
    const calculation = calculateSettlementRow(
      {
        count40: record.count40,
        count60: record.count60,
      },
      matchedRule
        ? {
            price40: toNumber(matchedRule.price40),
            price60: toNumber(matchedRule.price60),
          }
        : null,
    );

    if (calculation.status === "MISSING_RULE") {
      current.status = "MISSING_RULE";
      current.amount = null;
      current.missingDates.push(saleDateToValue(record.saleDate));
    } else if (current.amount !== null) {
      current.amount += calculation.amount ?? 0;
    }

    rows.set(record.userId, current);
  }

  return Array.from(rows.values()).sort((left, right) => {
    if (left.status !== right.status) {
      return left.status === "MISSING_RULE" ? -1 : 1;
    }

    if ((right.amount ?? -1) !== (left.amount ?? -1)) {
      return (right.amount ?? -1) - (left.amount ?? -1);
    }

    return left.userName.localeCompare(right.userName, "zh-CN");
  });
}
