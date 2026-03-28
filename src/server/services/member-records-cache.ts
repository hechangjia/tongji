import { unstable_cache, updateTag } from "next/cache";
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

export function getCachedMemberRecords(userId: string) {
  return cachedMemberRecords(userId);
}

export function refreshMemberRecordsCache() {
  updateTag(MEMBER_RECORDS_CACHE_TAG);
}
