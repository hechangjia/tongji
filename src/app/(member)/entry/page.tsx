import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessMemberArea } from "@/lib/permissions";
import { AppShell } from "@/components/app-shell";
import { SalesEntryPageClient } from "@/components/sales-entry-page-client";
import { getCachedMemberDailyRhythmSummary } from "@/server/services/leaderboard-cache";
import {
  buildSalesEntryDefaults,
  getSalesRecordForUserOnDate,
  getTodaySaleDateValue,
  saleDateToValue,
} from "@/server/services/sales-service";

export default async function EntryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fentry");
  }

  if (!canAccessMemberArea(session.user)) {
    redirect("/login?callbackUrl=%2Fentry");
  }

  const saleDate = getTodaySaleDateValue();
  const [currentRecord, dailyRhythmSummary] = await Promise.all([
    getSalesRecordForUserOnDate(session.user.id, saleDate),
    getCachedMemberDailyRhythmSummary({
      currentUserId: session.user.id,
      todaySaleDate: saleDate,
    }),
  ]);
  const initialValues = buildSalesEntryDefaults(
    currentRecord
      ? {
          saleDate: saleDateToValue(currentRecord.saleDate),
          count40: currentRecord.count40,
          count60: currentRecord.count60,
          remark: currentRecord.remark ?? undefined,
        }
      : {
          saleDate,
        },
  );
  const todayTotal =
    Number(initialValues.count40 || "0") + Number(initialValues.count60 || "0");

  return (
    <AppShell
      role={session.user.role}
      userName={session.user.name ?? session.user.username}
      currentPath="/entry"
    >
      <SalesEntryPageClient
        initialValues={initialValues}
        hasExistingRecord={Boolean(currentRecord)}
        todayTotal={todayTotal}
        initialDailyRhythmSummary={{
          lastSubmittedAtIso:
            (currentRecord?.lastSubmittedAt ?? currentRecord?.updatedAt)?.toISOString() ?? null,
          ...dailyRhythmSummary,
        }}
      />
    </AppShell>
  );
}
