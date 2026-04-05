import { beforeEach, describe, expect, test, vi } from "vitest";

const salesRecordUpdateMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  db: {
    salesRecord: {
      update: salesRecordUpdateMock,
    },
  },
}));

import {
  normalizeSalePayload,
  saleDateValueToDate,
  saleDateToValue,
  getTodaySaleDateValue,
  buildSalesEntryDefaults,
  groupRecordsForMember,
  filterSalesRows,
  updateSalesRecord,
  reviewSalesRecord,
} from "@/server/services/sales-service";

describe("sales payload", () => {
  test("accepts non-negative integer counts", () => {
    expect(
      normalizeSalePayload({
        saleDate: "2026-03-26",
        count40: 2,
        count60: 1,
      }),
    ).toMatchObject({
      saleDate: "2026-03-26",
      count40: 2,
      count60: 1,
      remark: undefined,
    });
  });
});

describe("date conversion utilities", () => {
  test("saleDateValueToDate converts YYYY-MM-DD to UTC midnight Date", () => {
    const date = saleDateValueToDate("2026-03-28");
    expect(date).toEqual(new Date("2026-03-28T00:00:00.000Z"));
  });

  test("saleDateToValue converts Date to YYYY-MM-DD string", () => {
    const value = saleDateToValue(new Date("2026-03-28T00:00:00.000Z"));
    expect(value).toBe("2026-03-28");
  });

  test("getTodaySaleDateValue returns today in YYYY-MM-DD format", () => {
    const result = getTodaySaleDateValue(new Date("2026-03-28T16:00:00.000Z"), "UTC");
    expect(result).toBe("2026-03-28");
  });

  test("getTodaySaleDateValue respects timezone", () => {
    // 2026-03-28 23:00 UTC = 2026-03-29 07:00 in Asia/Shanghai
    const result = getTodaySaleDateValue(
      new Date("2026-03-28T23:00:00.000Z"),
      "Asia/Shanghai",
    );
    expect(result).toBe("2026-03-29");
  });
});

describe("buildSalesEntryDefaults", () => {
  test("returns zero defaults when no record provided", () => {
    const defaults = buildSalesEntryDefaults();
    expect(defaults.count40).toBe("0");
    expect(defaults.count60).toBe("0");
    expect(defaults.remark).toBe("");
    expect(defaults.saleDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("uses record values when provided", () => {
    const defaults = buildSalesEntryDefaults({
      saleDate: "2026-03-28",
      count40: 5,
      count60: 3,
      remark: "测试备注",
    });
    expect(defaults).toEqual({
      saleDate: "2026-03-28",
      count40: "5",
      count60: "3",
      remark: "测试备注",
    });
  });
});

describe("groupRecordsForMember", () => {
  test("sorts records by saleDate descending", () => {
    const records = [
      { saleDate: new Date("2026-03-26"), id: "a" },
      { saleDate: new Date("2026-03-28"), id: "b" },
      { saleDate: new Date("2026-03-27"), id: "c" },
    ];

    const result = groupRecordsForMember(records);
    expect(result.map((r) => r.id)).toEqual(["b", "c", "a"]);
  });

  test("does not mutate the original array", () => {
    const records = [
      { saleDate: new Date("2026-03-26") },
      { saleDate: new Date("2026-03-28") },
    ];
    const original = [...records];

    groupRecordsForMember(records);
    expect(records[0].saleDate).toEqual(original[0].saleDate);
  });
});

describe("filterSalesRows", () => {
  const rows = [
    { userName: "Alice" },
    { userName: "Bob" },
    { userName: "alice_admin" },
  ];

  test("filters by keyword case-insensitively", () => {
    expect(filterSalesRows(rows, { keyword: "ali" })).toHaveLength(2);
  });

  test("returns all rows when keyword is empty", () => {
    expect(filterSalesRows(rows, { keyword: "" })).toHaveLength(3);
    expect(filterSalesRows(rows, {})).toHaveLength(3);
  });

  test("returns empty array when no match", () => {
    expect(filterSalesRows(rows, { keyword: "xyz" })).toHaveLength(0);
  });
});

describe("updateSalesRecord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("updates record fields by id", async () => {
    salesRecordUpdateMock.mockResolvedValue({ id: "record-1" });

    await updateSalesRecord({
      id: "record-1",
      count40: 3,
      count60: 2,
      remark: "更新备注",
    });

    expect(salesRecordUpdateMock).toHaveBeenCalledWith({
      where: { id: "record-1" },
      data: {
        count40: 3,
        count60: 2,
        remark: "更新备注",
      },
    });
  });
});

describe("reviewSalesRecord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("approves record and clears reviewNote", async () => {
    salesRecordUpdateMock.mockResolvedValue({ id: "record-1" });

    await reviewSalesRecord({
      id: "record-1",
      decision: "APPROVED",
      reviewNote: "this note should be cleared",
    });

    expect(salesRecordUpdateMock).toHaveBeenCalledWith({
      where: { id: "record-1" },
      data: {
        reviewStatus: "APPROVED",
        reviewedAt: expect.any(Date),
        reviewNote: null,
      },
    });
  });

  test("rejects record and keeps reviewNote", async () => {
    salesRecordUpdateMock.mockResolvedValue({ id: "record-1" });

    await reviewSalesRecord({
      id: "record-1",
      decision: "REJECTED",
      reviewNote: "数量异常",
    });

    expect(salesRecordUpdateMock).toHaveBeenCalledWith({
      where: { id: "record-1" },
      data: {
        reviewStatus: "REJECTED",
        reviewedAt: expect.any(Date),
        reviewNote: "数量异常",
      },
    });
  });

  test("rejects record with null reviewNote when none provided", async () => {
    salesRecordUpdateMock.mockResolvedValue({ id: "record-1" });

    await reviewSalesRecord({
      id: "record-1",
      decision: "REJECTED",
    });

    expect(salesRecordUpdateMock).toHaveBeenCalledWith({
      where: { id: "record-1" },
      data: {
        reviewStatus: "REJECTED",
        reviewedAt: expect.any(Date),
        reviewNote: null,
      },
    });
  });
});
