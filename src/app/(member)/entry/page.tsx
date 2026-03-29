import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessMemberArea } from "@/lib/permissions";
import type { IdentifierSaleFormValues } from "@/app/(member)/entry/form-state";
import { AppShell } from "@/components/app-shell";
import { SalesEntryPageClient } from "@/components/sales-entry-page-client";
import { getMemberIdentifierWorkspace } from "@/server/services/member-identifier-sale-service";
import { getCachedMemberEntryInsights } from "@/server/services/entry-insights-cache";
import { getCachedMemberDailyRhythmSummary } from "@/server/services/leaderboard-cache";
import {
  buildSalesEntryDefaults,
  getSalesRecordForUserOnDate,
  getTodaySaleDateValue,
  saleDateToValue,
} from "@/server/services/sales-service";

type EntryPageProps = {
  searchParams?: Promise<{
    followUpItemId?: string | string[] | undefined;
  }>;
};

function normalizeSingleSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

export default async function EntryPage({ searchParams }: EntryPageProps = {}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fentry");
  }

  if (!canAccessMemberArea(session.user)) {
    redirect("/login?callbackUrl=%2Fentry");
  }

  const saleDate = getTodaySaleDateValue();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialIdentifierValues: IdentifierSaleFormValues = {
    codeId: "",
    planType: "PLAN_40",
    saleDate,
    sourceMode: "ASSIGNED_LEAD",
    prospectLeadId: "",
    qqNumber: "",
    major: "",
    remark: "",
    followUpItemId: normalizeSingleSearchParam(resolvedSearchParams?.followUpItemId),
  };
  const [currentRecord, dailyRhythmSummary, entryInsights, identifierWorkspace] = await Promise.all([
    getSalesRecordForUserOnDate(session.user.id, saleDate),
    getCachedMemberDailyRhythmSummary({
      currentUserId: session.user.id,
      todaySaleDate: saleDate,
    }),
    getCachedMemberEntryInsights({
      userId: session.user.id,
      todaySaleDate: saleDate,
    }),
    getMemberIdentifierWorkspace({
      userId: session.user.id,
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
        initialTargetFeedback={entryInsights.targetFeedback}
        initialSelfTrend={entryInsights.selfTrend}
        initialRecentReminders={entryInsights.recentReminders}
        initialIdentifierWorkspace={identifierWorkspace}
        initialIdentifierValues={initialIdentifierValues}
        initialDailyRhythmSummary={{
          lastSubmittedAtIso:
            (currentRecord?.lastSubmittedAt ?? currentRecord?.updatedAt)?.toISOString() ?? null,
          ...dailyRhythmSummary,
        }}
      />
    </AppShell>
  );
}
