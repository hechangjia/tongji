import { unstable_cache, updateTag } from "next/cache";
import {
  getIdentifierSalesForUser,
  getMemberIdentifierWorkspace,
} from "@/server/services/member-identifier-sale-service";
import {
  getSalesRecordForUserOnDate,
  getSalesRecordsForUser,
} from "@/server/services/sales-service";

export const MEMBER_RECORDS_CACHE_TAG = "member-records";
export const MEMBER_RECORDS_CACHE_REVALIDATE_SECONDS = 30;

const cachedMemberRecords = unstable_cache(
  async (userId: string) => getSalesRecordsForUser(userId),
  ["member-records"],
  {
    tags: [MEMBER_RECORDS_CACHE_TAG],
    revalidate: MEMBER_RECORDS_CACHE_REVALIDATE_SECONDS,
  },
);

const cachedMemberCurrentRecord = unstable_cache(
  async (userId: string, saleDate: string) => getSalesRecordForUserOnDate(userId, saleDate),
  ["member-current-record"],
  {
    tags: [MEMBER_RECORDS_CACHE_TAG],
    revalidate: MEMBER_RECORDS_CACHE_REVALIDATE_SECONDS,
  },
);

const cachedMemberIdentifierWorkspace = unstable_cache(
  async (userId: string, todaySaleDate: string) =>
    getMemberIdentifierWorkspace({ userId, todaySaleDate }),
  ["member-identifier-workspace"],
  {
    tags: [MEMBER_RECORDS_CACHE_TAG],
    revalidate: MEMBER_RECORDS_CACHE_REVALIDATE_SECONDS,
  },
);

const cachedMemberIdentifierSales = unstable_cache(
  async (userId: string) => getIdentifierSalesForUser(userId),
  ["member-identifier-sales"],
  {
    tags: [MEMBER_RECORDS_CACHE_TAG],
    revalidate: MEMBER_RECORDS_CACHE_REVALIDATE_SECONDS,
  },
);

export function getCachedMemberRecords(userId: string) {
  return cachedMemberRecords(userId);
}

export function getCachedMemberCurrentRecord(userId: string, saleDate: string) {
  return cachedMemberCurrentRecord(userId, saleDate);
}

export function getCachedMemberIdentifierWorkspace(
  userId: string,
  todaySaleDate: string,
) {
  return cachedMemberIdentifierWorkspace(userId, todaySaleDate);
}

export function getCachedMemberIdentifierSales(userId: string) {
  return cachedMemberIdentifierSales(userId);
}

export function refreshMemberRecordsCache() {
  updateTag(MEMBER_RECORDS_CACHE_TAG);
}
