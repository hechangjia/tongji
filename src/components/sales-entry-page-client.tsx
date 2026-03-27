"use client";

import { useActionState, useRef, useState } from "react";
import type { RefObject } from "react";
import { saveSalesEntryAction } from "@/app/(member)/entry/actions";
import type { SalesEntryFormState } from "@/app/(member)/entry/form-state";
import { EntryDailyTargetCard, type EntryDailyTargetFeedback } from "@/components/entry-daily-target-card";
import {
  EntryDailyRhythmSummary,
  type EntryDailyRhythmSummaryData,
} from "@/components/entry-daily-rhythm-summary";
import { EntryReminderList, type EntryReminderListItem } from "@/components/entry-reminder-list";
import {
  EntrySelfTrendSummary,
  type EntrySelfTrendSummaryData,
} from "@/components/entry-self-trend-summary";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { SalesEntryForm } from "@/components/sales-entry-form";
import { SalesEntrySuccessCard } from "@/components/sales-entry-success-card";
import { StatusCallout } from "@/components/status-callout";
import type { SalesEntryDefaults } from "@/server/services/sales-service";

function focusSaleDateField(inputRef: RefObject<HTMLInputElement | null>) {
  inputRef.current?.focus();
}

export function mergeDisplayedDailyRhythmSummary(
  initialSummary: EntryDailyRhythmSummaryData,
  actionSummary: EntryDailyRhythmSummaryData | null | undefined,
) {
  if (!actionSummary) {
    return initialSummary;
  }

  return {
    ...actionSummary,
    lastSubmittedAtIso: actionSummary.lastSubmittedAtIso ?? initialSummary.lastSubmittedAtIso,
  } satisfies EntryDailyRhythmSummaryData;
}

export function SalesEntryPageClient({
  initialValues,
  hasExistingRecord,
  todayTotal,
  initialTargetFeedback,
  initialSelfTrend,
  initialRecentReminders,
  initialDailyRhythmSummary,
}: {
  initialValues: SalesEntryDefaults;
  hasExistingRecord: boolean;
  todayTotal: number;
  initialTargetFeedback: EntryDailyTargetFeedback;
  initialSelfTrend: EntrySelfTrendSummaryData;
  initialRecentReminders: EntryReminderListItem[];
  initialDailyRhythmSummary: EntryDailyRhythmSummaryData;
}) {
  const saleDateInputRef = useRef<HTMLInputElement>(null);
  const [dismissedSummaryKey, setDismissedSummaryKey] = useState<string | null>(null);
  const initialState: SalesEntryFormState = {
    status: "idle",
    message: null,
    values: initialValues,
    summary: null,
  };

  const [state, formAction, pending] = useActionState(saveSalesEntryAction, initialState);
  const summaryKey = state.summary?.savedAtIso ?? null;
  const showSummary = Boolean(state.summary && dismissedSummaryKey !== summaryKey);
  const dailyRhythmSummary = mergeDisplayedDailyRhythmSummary(
    initialDailyRhythmSummary,
    state.summary?.dailyRhythm,
  );
  const targetFeedback = state.summary?.targetFeedback ?? initialTargetFeedback;
  const selfTrend = state.summary?.selfTrend ?? initialSelfTrend;
  const recentReminders = state.summary?.recentReminders ?? initialRecentReminders;
  const statusValue = pending
    ? "提交中"
    : state.summary
      ? state.summary.isUpdate
        ? "已更新"
        : "已保存"
      : hasExistingRecord
        ? "待更新"
        : "待创建";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="每日行动面板"
        title="今日录入"
        description="每位成员每天只保留一条记录，再次提交会直接覆盖当天数据。把当天结果录准，比事后补录更重要。"
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <MetricCard label="今日日期" value={initialValues.saleDate} />
          <MetricCard
            label="当前总数"
            value={todayTotal}
            hint={hasExistingRecord ? "已读取当天已保存数据" : "今天还没有保存记录"}
            tone="dark"
          />
          <MetricCard
            label="录入状态"
            value={statusValue}
            hint="保存后会立即同步到榜单和结算数据里"
            tone="accent"
          />
        </div>
      </PageHeader>

      <EntryDailyRhythmSummary summary={dailyRhythmSummary} />

      <div className="grid gap-4 lg:grid-cols-3">
        <EntryDailyTargetCard feedback={targetFeedback} />
        <EntrySelfTrendSummary summary={selfTrend} />
        <EntryReminderList reminders={recentReminders} />
      </div>

      {showSummary && state.summary ? (
        <SalesEntrySuccessCard
          summary={state.summary}
          onContinue={() => {
            setDismissedSummaryKey(summaryKey);
            focusSaleDateField(saleDateInputRef);
          }}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <section className="space-y-4">
          <SalesEntryForm
            values={state.values}
            status={state.status}
            message={state.message}
            formAction={formAction}
            pending={pending}
            hasExistingRecord={hasExistingRecord}
            saleDateInputRef={saleDateInputRef}
          />
        </section>

        <aside className="space-y-4">
          <StatusCallout tone="info" title="录入说明">
            <ul className="space-y-2">
              <li>数量必须为大于等于 0 的整数。</li>
              <li>如果当天已录入，再次保存会更新当天数据。</li>
              <li>备注选填，建议记录渠道或特殊情况，方便后续复核。</li>
            </ul>
          </StatusCallout>

          <StatusCallout tone="warning" title="当日修改规则">
            榜单和结算都依赖当天录入数据。若当天数据有误，建议尽快改正，避免后续复核时再回滚。
          </StatusCallout>
        </aside>
      </div>
    </div>
  );
}
