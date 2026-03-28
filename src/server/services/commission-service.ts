import { db } from "@/lib/db";
import {
  commissionRuleSchema,
  type CommissionRuleInput,
} from "@/lib/validators/commission";
import { saleDateValueToDate } from "@/server/services/sales-service";

type OverlapRule = {
  start: Date;
  end: Date | null;
};

const MAX_DATE = new Date("9999-12-31T00:00:00.000Z");

function normalizedEnd(end: Date | null) {
  return end ?? MAX_DATE;
}

export function hasOverlappingRules(rules: OverlapRule[]) {
  const sortedRules = [...rules].sort(
    (left, right) => left.start.getTime() - right.start.getTime(),
  );

  return sortedRules.some((rule, index) => {
    if (index === 0) {
      return false;
    }

    return rule.start.getTime() <= normalizedEnd(sortedRules[index - 1].end).getTime();
  });
}

export async function createCommissionRule(input: CommissionRuleInput) {
  const payload = commissionRuleSchema.parse(input);
  const start = saleDateValueToDate(payload.effectiveStart);
  const end = payload.effectiveEnd ? saleDateValueToDate(payload.effectiveEnd) : null;
  const existingRules = await db.commissionRule.findMany({
    where: {
      userId: payload.userId,
    },
    orderBy: {
      effectiveStart: "asc",
    },
  });

  const overlap = hasOverlappingRules([
    ...existingRules.map((rule) => ({
      start: rule.effectiveStart,
      end: rule.effectiveEnd,
    })),
    { start, end },
  ]);

  if (overlap) {
    throw new Error("该成员的卡酬规则时间段存在重叠");
  }

  await db.commissionRule.create({
    data: {
      userId: payload.userId,
      price40: payload.price40,
      price60: payload.price60,
      effectiveStart: start,
      effectiveEnd: end,
    },
  });
}

export async function getCommissionRules() {
  return db.commissionRule.findMany({
    include: {
      user: {
        select: {
          name: true,
          username: true,
        },
      },
    },
    orderBy: [{ effectiveStart: "desc" }, { createdAt: "desc" }],
  });
}
