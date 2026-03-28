import { beforeEach, describe, expect, test, vi } from "vitest";

const identifierSaleFindManyMock = vi.hoisted(() => vi.fn());
const salesRecordFindManyMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  db: {
    identifierSale: {
      findMany: identifierSaleFindManyMock,
    },
    salesRecord: {
      findMany: salesRecordFindManyMock,
    },
  },
}));

import { getAggregatedSalesDayRows } from "@/server/services/sales-reporting-service";

describe("sales reporting service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("prefers identifier sale facts and falls back to legacy daily summaries only for uncovered user-days", async () => {
    identifierSaleFindManyMock.mockResolvedValue([
      {
        sellerUserId: "member-1",
        saleDate: new Date("2026-03-28T00:00:00.000Z"),
        planType: "PLAN_40",
        seller: {
          name: "成员甲",
          username: "member_a",
        },
      },
      {
        sellerUserId: "member-1",
        saleDate: new Date("2026-03-28T00:00:00.000Z"),
        planType: "PLAN_60",
        seller: {
          name: "成员甲",
          username: "member_a",
        },
      },
    ]);
    salesRecordFindManyMock.mockResolvedValue([
      {
        userId: "member-1",
        saleDate: new Date("2026-03-28T00:00:00.000Z"),
        count40: 9,
        count60: 9,
        user: {
          name: "成员甲",
          username: "member_a",
        },
      },
      {
        userId: "member-2",
        saleDate: new Date("2026-03-29T00:00:00.000Z"),
        count40: 2,
        count60: 1,
        user: {
          name: "成员乙",
          username: "member_b",
        },
      },
    ]);

    await expect(
      getAggregatedSalesDayRows({
        startDate: "2026-03-28",
        endDate: "2026-03-29",
      }),
    ).resolves.toEqual([
      {
        userId: "member-1",
        userName: "成员甲",
        saleDate: new Date("2026-03-28T00:00:00.000Z"),
        count40: 1,
        count60: 1,
        source: "IDENTIFIER_SALE",
      },
      {
        userId: "member-2",
        userName: "成员乙",
        saleDate: new Date("2026-03-29T00:00:00.000Z"),
        count40: 2,
        count60: 1,
        source: "LEGACY_SALES_RECORD",
      },
    ]);
  });
});
