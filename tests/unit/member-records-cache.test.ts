import { beforeEach, describe, expect, test, vi } from "vitest";

const unstableCacheMock = vi.hoisted(() =>
  vi.fn((callback: (...args: unknown[]) => unknown) => callback),
);
const updateTagMock = vi.hoisted(() => vi.fn());
const getSalesRecordsForUserMock = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({
  unstable_cache: unstableCacheMock,
  updateTag: updateTagMock,
}));

vi.mock("@/server/services/sales-service", () => ({
  getSalesRecordsForUser: getSalesRecordsForUserMock,
}));

import {
  MEMBER_RECORDS_CACHE_REVALIDATE_SECONDS,
  MEMBER_RECORDS_CACHE_TAG,
  getCachedMemberRecords,
  refreshMemberRecordsCache,
} from "@/server/services/member-records-cache";

describe("member records cache", () => {
  beforeEach(() => {
    updateTagMock.mockClear();
    getSalesRecordsForUserMock.mockClear();
  });

  test("wraps member records reads in Next cache with a shared tag", () => {
    expect(unstableCacheMock).toHaveBeenCalledTimes(1);
    expect(unstableCacheMock).toHaveBeenCalledWith(
      expect.any(Function),
      ["member-records"],
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

  test("refreshes the shared member records tag", () => {
    refreshMemberRecordsCache();

    expect(updateTagMock).toHaveBeenCalledWith(MEMBER_RECORDS_CACHE_TAG);
  });
});
