import { auth } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/permissions";
import { buildAttachmentHeaders, buildWorkbookBuffer } from "@/server/services/export-service";
import { getSettlementRows } from "@/server/services/settlement-service";
import { getTodaySaleDateValue } from "@/server/services/sales-service";

export const dynamic = "force-dynamic";

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
  const startDate = url.searchParams.get("startDate") || today;
  const endDate = url.searchParams.get("endDate") || today;
  const rows = await getSettlementRows(startDate, endDate);
  const buffer = await buildWorkbookBuffer(
    rows.map((row) => ({
      成员: row.userName,
      "40套餐": row.count40,
      "60套餐": row.count60,
      状态: row.status,
      应结金额: row.amount ?? "规则缺失",
      说明: row.missingDates.length > 0 ? row.missingDates.join("、") : "",
    })),
    "结算",
  );

  return new Response(buffer, {
    headers: buildAttachmentHeaders(`settlement-${startDate}-to-${endDate}.xlsx`),
  });
}
