import { unstable_cache, updateTag } from "next/cache";
import type { DateValue } from "@/server/services/sales-service";
import {
  getAdminInsightsData,
  type AdminInsightsData,
} from "@/server/services/admin-insights-service";

export const ADMIN_INSIGHTS_CACHE_TAG = "admin-insights";
export const ADMIN_INSIGHTS_CACHE_REVALIDATE_SECONDS = 30;

const cachedAdminInsightsData = unstable_cache(
  async (input: { todaySaleDate: DateValue }): Promise<AdminInsightsData> =>
    getAdminInsightsData(input),
  ["admin-insights"],
  {
    tags: [ADMIN_INSIGHTS_CACHE_TAG],
    revalidate: ADMIN_INSIGHTS_CACHE_REVALIDATE_SECONDS,
  },
);

export function getCachedAdminInsightsData(input: { todaySaleDate: DateValue }) {
  return cachedAdminInsightsData(input);
}

export function refreshAdminInsightsCache() {
  updateTag(ADMIN_INSIGHTS_CACHE_TAG);
}
