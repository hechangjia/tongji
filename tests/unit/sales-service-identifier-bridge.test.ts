import { beforeEach, describe, expect, test, vi } from "vitest";

const salesRecordFindUniqueMock = vi.hoisted(() => vi.fn());
const salesRecordUpsertMock = vi.hoisted(() => vi.fn());
const identifierSaleCountMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  db: {
    salesRecord: {
      findUnique: salesRecordFindUniqueMock,
      upsert: salesRecordUpsertMock,
    },
    identifierSale: {
      count: identifierSaleCountMock,
    },
  },
}));

import { saveSalesRecordForUser } from "@/server/services/sales-service";

describe("sales service identifier bridge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    identifierSaleCountMock.mockResolvedValue(0);
  });

  test("rejects legacy day-summary writes when identifier sales already exist for that day", async () => {
    identifierSaleCountMock.mockResolvedValue(2);

    await expect(
      saveSalesRecordForUser("member-1", {
        saleDate: "2026-03-28",
        count40: 1,
        count60: 0,
        remark: "",
      }),
    ).rejects.toThrow("当天已经有识别码成交记录，请改用识别码工作台继续录单");

    expect(salesRecordUpsertMock).not.toHaveBeenCalled();
  });

  test("still allows the legacy save path on dates without identifier sales", async () => {
    salesRecordFindUniqueMock.mockResolvedValue(null);
    salesRecordUpsertMock.mockResolvedValue({
      id: "record-1",
      count40: 2,
      count60: 1,
    });

    await expect(
      saveSalesRecordForUser("member-1", {
        saleDate: "2026-03-28",
        count40: 2,
        count60: 1,
        remark: "旧模式补录",
      }),
    ).resolves.toMatchObject({
      isUpdate: false,
      record: {
        id: "record-1",
      },
    });

    expect(salesRecordUpsertMock).toHaveBeenCalledTimes(1);
  });
});
