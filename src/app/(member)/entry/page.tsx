import { Suspense } from "react";
import type { IdentifierSaleFormValues } from "@/app/(member)/entry/form-state";
import { getCachedSession } from "@/lib/auth-request-cache";
import { EntryDailyRhythmSummary } from "@/components/entry-daily-rhythm-summary";
import { EntryDailyTargetCard } from "@/components/entry-daily-target-card";
import { EntryReminderList } from "@/components/entry-reminder-list";
import { EntrySelfTrendSummary } from "@/components/entry-self-trend-summary";
import { SalesEntryPageClient } from "@/components/sales-entry-page-client";
import { getCachedMemberEntryInsights } from "@/server/services/entry-insights-cache";
import { getCachedMemberDailyRhythmSummary } from "@/server/services/leaderboard-cache";
import {
  getCachedMemberCurrentRecord,
  getCachedMemberIdentifierWorkspace,
} from "@/server/services/member-records-cache";
import {
  buildSalesEntryDefaults,
  getTodaySaleDateValue,
  saleDateToValue,
} from "@/server/services/sales-service";

type EntryPageProps = {
  searchParams?: Promise<{
    followUpItemId?: string | string[] | undefined;
  }>;
};

type EntryInsightsSectionData = {
  lastSubmittedAtIso: string | null;
  dailyRhythmSummary: Awaited<ReturnType<typeof getCachedMemberDailyRhythmSummary>>;
  entryInsights: Awaited<ReturnType<typeof getCachedMemberEntryInsights>>;
};

function normalizeSingleSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

function EntryInsightsSkeleton() {
  return (
    <>
      <EntryDailyRhythmSummary
        summary={{
          state: "NO_SUBMISSION",
          title: "正在加载今日节奏",
          message: "正在同步今日提交状态与审核节奏，请稍候。",
          reviewStatus: "NONE",
          reviewStatusLabel: "加载中",
          reviewNote: null,
          isTemporaryTop3: false,
          isFormalTop3: false,
          temporaryRank: null,
          formalRank: null,
          top3Label: null,
          top3Message: null,
          primaryAction: { href: "/entry", label: "刷新当前页面" },
          secondaryActions: [],
          lastSubmittedAtIso: null,
        }}
      />

      <div className="grid gap-4 lg:grid-cols-3" aria-hidden="true">
        <EntryDailyTargetCard
          feedback={{
            targetTotal: 0,
            currentTotal: 0,
            gap: 0,
            completionRate: 0,
            status: "NO_TARGET",
          }}
        />
        <EntrySelfTrendSummary
          summary={{
            direction: "FLAT",
            label: "正在加载趋势",
            message: "正在准备你的近 7 天趋势。",
          }}
        />
        <EntryReminderList reminders={[]} />
      </div>
    </>
  );
}

export async function EntryInsightsSection({
  insightsPromise,
}: {
  insightsPromise: Promise<EntryInsightsSectionData>;
}) {
  const { lastSubmittedAtIso, dailyRhythmSummary, entryInsights } = await insightsPromise;

  return (
    <>
      <EntryDailyRhythmSummary
        summary={{
          lastSubmittedAtIso,
          ...dailyRhythmSummary,
        }}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <EntryDailyTargetCard feedback={entryInsights.targetFeedback} />
        <EntrySelfTrendSummary summary={entryInsights.selfTrend} />
        <EntryReminderList reminders={entryInsights.recentReminders} />
      </div>
    </>
  );
}

export default async function EntryPage({ searchParams }: EntryPageProps = {}) {
  const session = (await getCachedSession())!;

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
  const [currentRecord, identifierWorkspace] = await Promise.all([
    getCachedMemberCurrentRecord(session.user.id, saleDate),
    getCachedMemberIdentifierWorkspace(
      session.user.id,
      saleDate,
    ),
  ]);
  const insightsPromise = Promise.all([
    getCachedMemberDailyRhythmSummary({
      currentUserId: session.user.id,
      todaySaleDate: saleDate,
    }),
    getCachedMemberEntryInsights({
      userId: session.user.id,
      todaySaleDate: saleDate,
    }),
  ]).then(([dailyRhythmSummary, entryInsights]) => ({
    lastSubmittedAtIso:
      (currentRecord?.lastSubmittedAt ?? currentRecord?.updatedAt)?.toISOString() ?? null,
    dailyRhythmSummary,
    entryInsights,
  }));
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
    <SalesEntryPageClient
      initialValues={initialValues}
      hasExistingRecord={Boolean(currentRecord)}
      todayTotal={todayTotal}
      initialTargetFeedback={{
        targetTotal: 0,
        currentTotal: 0,
        gap: 0,
        completionRate: 0,
        status: "NO_TARGET",
      }}
      initialSelfTrend={{
        direction: "FLAT",
        label: "正在加载趋势",
        message: "正在准备你的近 7 天趋势。",
      }}
      initialRecentReminders={[]}
      initialIdentifierWorkspace={identifierWorkspace}
      initialIdentifierValues={initialIdentifierValues}
      initialDailyRhythmSummary={{
        state: "NO_SUBMISSION",
        title: "正在加载今日节奏",
        message: "正在同步今日提交状态与审核节奏，请稍候。",
        reviewStatus: "NONE",
        reviewStatusLabel: "加载中",
        reviewNote: null,
        isTemporaryTop3: false,
        isFormalTop3: false,
        temporaryRank: null,
        formalRank: null,
        top3Label: null,
        top3Message: null,
        primaryAction: { href: "/entry", label: "刷新当前页面" },
        secondaryActions: [],
        lastSubmittedAtIso: null,
      }}
      insightsSlot={
        <Suspense fallback={<EntryInsightsSkeleton />}>
          <EntryInsightsSection insightsPromise={insightsPromise} />
        </Suspense>
      }
    />
  );
}
