import { unstable_cache, updateTag } from "next/cache";
import { getMemberIdentifierWorkspace } from "@/server/services/member-identifier-sale-service";
import { getSalesRecordsForUser } from "@/server/services/sales-service";

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

const cachedMemberIdentifierWorkspace = unstable_cache(
  async (userId: string, todaySaleDate: string) =>
    getMemberIdentifierWorkspace({ userId, todaySaleDate }),
  ["member-identifier-workspace"],
  {
    tags: [MEMBER_RECORDS_CACHE_TAG],
    revalidate: MEMBER_RECORDS_CACHE_REVALIDATE_SECONDS,
  },
);

export function getCachedMemberRecords(userId: string) {
  return cachedMemberRecords(userId);
}

export function getCachedMemberIdentifierWorkspace(
  userId: string,
  todaySaleDate: string,
) {
  return cachedMemberIdentifierWorkspace(userId, todaySaleDate);
}

export function refreshMemberRecordsCache() {
  updateTag(MEMBER_RECORDS_CACHE_TAG);
}
