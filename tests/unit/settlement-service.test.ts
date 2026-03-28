import { beforeEach, describe, expect, test, vi } from "vitest";

const getAggregatedSalesDayRowsMock = vi.hoisted(() => vi.fn());
const commissionRuleFindManyMock = vi.hoisted(() => vi.fn());

vi.mock("@/server/services/sales-reporting-service", () => ({
  getAggregatedSalesDayRows: getAggregatedSalesDayRowsMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    commissionRule: {
      findMany: commissionRuleFindManyMock,
    },
  },
}));

import {
  calculateSettlementRow,
  getSettlementRows,
} from "@/server/services/settlement-service";

describe("settlement calculation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("calculates amount from matched commission rule", () => {
    const row = calculateSettlementRow(
      { count40: 2, count60: 1 },
      { price40: 10, price60: 20 },
    );

    expect(row.amount).toBe(40);
    expect(row.status).toBe("OK");
  });

  test("flags missing rule instead of defaulting to zero", () => {
    const row = calculateSettlementRow({ count40: 2, count60: 1 }, null);

    expect(row.status).toBe("MISSING_RULE");
    expect(row.amount).toBeNull();
  });

  test("calculates settlements from aggregated sales day rows", async () => {
    getAggregatedSalesDayRowsMock.mockResolvedValue([
      {
        userId: "member-1",
        userName: "成员甲",
        saleDate: new Date("2026-03-28T00:00:00.000Z"),
        count40: 1,
        count60: 2,
        source: "IDENTIFIER_SALE",
      },
      {
        userId: "member-2",
        userName: "成员乙",
        saleDate: new Date("2026-03-29T00:00:00.000Z"),
        count40: 3,
        count60: 0,
        source: "LEGACY_SALES_RECORD",
      },
    ]);
    commissionRuleFindManyMock.mockResolvedValue([
      {
        userId: "member-1",
        effectiveStart: new Date("2026-03-01T00:00:00.000Z"),
        effectiveEnd: null,
        price40: { toString: () => "10" },
        price60: { toString: () => "20" },
        createdAt: new Date("2026-03-01T00:00:00.000Z"),
      },
      {
        userId: "member-2",
        effectiveStart: new Date("2026-03-01T00:00:00.000Z"),
        effectiveEnd: null,
        price40: { toString: () => "8" },
        price60: { toString: () => "16" },
        createdAt: new Date("2026-03-01T00:00:00.000Z"),
      },
    ]);

    await expect(getSettlementRows("2026-03-28", "2026-03-29")).resolves.toEqual([
      {
        userId: "member-1",
        userName: "成员甲",
        count40: 1,
        count60: 2,
        amount: 50,
        status: "OK",
        missingDates: [],
      },
      {
        userId: "member-2",
        userName: "成员乙",
        count40: 3,
        count60: 0,
        amount: 24,
        status: "OK",
        missingDates: [],
      },
    ]);
  });

  test("marks missing-rule dates from aggregated sales day rows", async () => {
    getAggregatedSalesDayRowsMock.mockResolvedValue([
      {
        userId: "member-1",
        userName: "成员甲",
        saleDate: new Date("2026-03-28T00:00:00.000Z"),
        count40: 1,
        count60: 0,
        source: "IDENTIFIER_SALE",
      },
    ]);
    commissionRuleFindManyMock.mockResolvedValue([]);

    await expect(getSettlementRows("2026-03-28", "2026-03-28")).resolves.toEqual([
      {
        userId: "member-1",
        userName: "成员甲",
        count40: 1,
        count60: 0,
        amount: null,
        status: "MISSING_RULE",
        missingDates: ["2026-03-28"],
      },
    ]);
  });
});
