import { beforeEach, describe, expect, test, vi } from "vitest";

const unstableCacheMock = vi.hoisted(() =>
  vi.fn((callback: (...args: unknown[]) => unknown) => callback),
);
const updateTagMock = vi.hoisted(() => vi.fn());
const getSalesRecordForUserOnDateMock = vi.hoisted(() => vi.fn());
const getSalesRecordsForUserMock = vi.hoisted(() => vi.fn());
const getIdentifierSalesForUserMock = vi.hoisted(() => vi.fn());
const getMemberIdentifierWorkspaceMock = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({
  unstable_cache: unstableCacheMock,
  updateTag: updateTagMock,
}));

vi.mock("@/server/services/sales-service", () => ({
  getSalesRecordForUserOnDate: getSalesRecordForUserOnDateMock,
  getSalesRecordsForUser: getSalesRecordsForUserMock,
}));

vi.mock("@/server/services/member-identifier-sale-service", () => ({
  getIdentifierSalesForUser: getIdentifierSalesForUserMock,
  getMemberIdentifierWorkspace: getMemberIdentifierWorkspaceMock,
}));

import {
  MEMBER_RECORDS_CACHE_REVALIDATE_SECONDS,
  MEMBER_RECORDS_CACHE_TAG,
  getCachedMemberCurrentRecord,
  getCachedMemberIdentifierSales,
  getCachedMemberRecords,
  refreshMemberRecordsCache,
} from "@/server/services/member-records-cache";

describe("member records cache", () => {
  beforeEach(() => {
    updateTagMock.mockClear();
    getSalesRecordForUserOnDateMock.mockClear();
    getSalesRecordsForUserMock.mockClear();
    getIdentifierSalesForUserMock.mockClear();
  });

  test("wraps member records reads in Next cache with a shared tag", () => {
    expect(unstableCacheMock).toHaveBeenCalledTimes(4);
    expect(unstableCacheMock).toHaveBeenCalledWith(
      expect.any(Function),
      ["member-current-record"],
      {
        tags: [MEMBER_RECORDS_CACHE_TAG],
        revalidate: MEMBER_RECORDS_CACHE_REVALIDATE_SECONDS,
      },
    );
    expect(unstableCacheMock).toHaveBeenCalledWith(
      expect.any(Function),
      ["member-records"],
      {
        tags: [MEMBER_RECORDS_CACHE_TAG],
        revalidate: MEMBER_RECORDS_CACHE_REVALIDATE_SECONDS,
      },
    );
    expect(unstableCacheMock).toHaveBeenCalledWith(
      expect.any(Function),
      ["member-identifier-workspace"],
      {
        tags: [MEMBER_RECORDS_CACHE_TAG],
        revalidate: MEMBER_RECORDS_CACHE_REVALIDATE_SECONDS,
      },
    );
    expect(unstableCacheMock).toHaveBeenCalledWith(
      expect.any(Function),
      ["member-identifier-sales"],
      {
        tags: [MEMBER_RECORDS_CACHE_TAG],
        revalidate: MEMBER_RECORDS_CACHE_REVALIDATE_SECONDS,
      },
    );
  });

  test("delegates cached member record reads to the sales service", async () => {
    getSalesRecordsForUserMock.mockResolvedValue([
      {
        id: "record-1",
        saleDate: new Date("2026-03-27T00:00:00.000Z"),
        count40: 2,
        count60: 1,
        remark: "地推",
      },
    ]);

    await expect(getCachedMemberRecords("member-1")).resolves.toEqual([
      {
        id: "record-1",
        saleDate: new Date("2026-03-27T00:00:00.000Z"),
        count40: 2,
        count60: 1,
        remark: "地推",
      },
    ]);

    expect(getSalesRecordsForUserMock).toHaveBeenCalledWith("member-1");
  });

  test("delegates cached current-record reads to the sales service", async () => {
    getSalesRecordForUserOnDateMock.mockResolvedValue({
      id: "record-1",
      saleDate: new Date("2026-03-27T00:00:00.000Z"),
      count40: 2,
      count60: 1,
      remark: "地推",
    });

    await expect(
      getCachedMemberCurrentRecord("member-1", "2026-03-27"),
    ).resolves.toEqual({
      id: "record-1",
      saleDate: new Date("2026-03-27T00:00:00.000Z"),
      count40: 2,
      count60: 1,
      remark: "地推",
    });

    expect(getSalesRecordForUserOnDateMock).toHaveBeenCalledWith(
      "member-1",
      "2026-03-27",
    );
  });

  test("delegates cached identifier sales reads to the identifier sales service", async () => {
    getIdentifierSalesForUserMock.mockResolvedValue([
      {
        id: "sale-1",
        planType: "PLAN_40",
      },
    ]);

    await expect(getCachedMemberIdentifierSales("member-1")).resolves.toEqual([
      {
        id: "sale-1",
        planType: "PLAN_40",
      },
    ]);

    expect(getIdentifierSalesForUserMock).toHaveBeenCalledWith("member-1");
  });

  test("refreshes the shared member records tag", () => {
    refreshMemberRecordsCache();

    expect(updateTagMock).toHaveBeenCalledWith(MEMBER_RECORDS_CACHE_TAG);
  });
});
