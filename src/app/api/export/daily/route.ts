import { auth } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/permissions";
import { buildAttachmentHeaders, buildWorkbookBuffer } from "@/server/services/export-service";
import { getDailyLeaderboard } from "@/server/services/leaderboard-service";
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
  const dateParam = url.searchParams.get("date") ?? undefined;
  const date = isDateValue(dateParam) ? dateParam : getTodaySaleDateValue();
  const rows = await getDailyLeaderboard(date);
  const buffer = await buildWorkbookBuffer(
    rows.map((row) => ({
      排名: row.rank,
      成员: row.userName,
      "40套餐": row.count40,
      "60套餐": row.count60,
      总数: row.total,
    })),
    "日榜",
  );

  return new Response(buffer, {
    headers: buildAttachmentHeaders(`daily-${date}.xlsx`),
  });
}
