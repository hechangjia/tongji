import { auth } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/permissions";
import { buildAttachmentHeaders, buildWorkbookBuffer } from "@/server/services/export-service";
import { getRangeLeaderboard } from "@/server/services/leaderboard-service";
import { getTodaySaleDateValue, type DateValue } from "@/server/services/sales-service";

export const dynamic = "force-dynamic";

function isDateValue(value?: string): value is DateValue {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!canAccessAdmin(session.user)) {
    return new Response("Forbidden", { status: 403 });
  }

  const url = new URL(request.url);
  const today = getTodaySaleDateValue();
  const startDateParam = url.searchParams.get("startDate") ?? undefined;
  const endDateParam = url.searchParams.get("endDate") ?? undefined;
  const startDate = isDateValue(startDateParam) ? startDateParam : today;
  const endDate = isDateValue(endDateParam) ? endDateParam : today;
  const rows = await getRangeLeaderboard(startDate, endDate);
  const buffer = await buildWorkbookBuffer(
    rows.map((row) => ({
      排名: row.rank,
      成员: row.userName,
      "40套餐": row.count40,
      "60套餐": row.count60,
      总数: row.total,
    })),
    "总榜",
  );

  return new Response(buffer, {
    headers: buildAttachmentHeaders(`range-${startDate}-to-${endDate}.xlsx`),
  });
}
