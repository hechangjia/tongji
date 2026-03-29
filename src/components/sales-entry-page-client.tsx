"use client";

import { useActionState, useRef, useState } from "react";
import type { RefObject } from "react";
import {
  saveIdentifierSaleAction,
  saveSalesEntryAction,
} from "@/app/(member)/entry/actions";
import type {
  IdentifierSaleFormValues,
  IdentifierSaleFormState,
  SalesEntryFormState,
} from "@/app/(member)/entry/form-state";
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
import { MemberIdentifierSaleForm } from "@/components/member-identifier-sale-form";
import { MemberIdentifierSaleHistory } from "@/components/member-identifier-sale-history";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { SalesEntryForm } from "@/components/sales-entry-form";
import { SalesEntrySuccessCard } from "@/components/sales-entry-success-card";
import { StatusCallout } from "@/components/status-callout";
import type { MemberIdentifierWorkspace } from "@/server/services/member-identifier-sale-service";
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
  initialIdentifierWorkspace,
  initialIdentifierValues,
  initialDailyRhythmSummary,
}: {
  initialValues: SalesEntryDefaults;
  hasExistingRecord: boolean;
  todayTotal: number;
  initialTargetFeedback: EntryDailyTargetFeedback;
  initialSelfTrend: EntrySelfTrendSummaryData;
  initialRecentReminders: EntryReminderListItem[];
  initialIdentifierWorkspace: MemberIdentifierWorkspace;
  initialIdentifierValues: IdentifierSaleFormValues;
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
  const initialIdentifierState: IdentifierSaleFormState = {
    status: "idle",
    message: null,
    values: initialIdentifierValues,
    summary: null,
    workspace: initialIdentifierWorkspace,
  };
  const [identifierState, identifierFormAction, identifierPending] = useActionState(
    saveIdentifierSaleAction,
    initialIdentifierState,
  );
  const identifierWorkspace = identifierState.workspace ?? initialIdentifierWorkspace;
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
        description="识别码成交现在是主入口；旧的按日 `40 / 60` 汇总录入保留为过渡模式，后续会逐步退出主链路。"
      >
        <div className="grid gap-4 lg:grid-cols-4">
          <MetricCard label="待售识别码" value={identifierWorkspace.overview.availableCodeCount} />
          <MetricCard
            label="分配给我的线索"
            value={identifierWorkspace.overview.assignedLeadCount}
            tone="dark"
          />
          <MetricCard
            label="今日识别码成交"
            value={identifierWorkspace.overview.todaySaleCount}
            hint="按识别码成交事实统计"
            tone="accent"
          />
          <MetricCard
            label="今日 40 / 60 汇总"
            value={`${identifierWorkspace.overview.todayCount40} / ${identifierWorkspace.overview.todayCount60}`}
            hint={`旧汇总当前总数 ${todayTotal}，状态 ${statusValue}`}
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
          <MemberIdentifierSaleForm
            key={identifierState.summary?.savedAtIso ?? `identifier-${identifierState.values.sourceMode}`}
            state={identifierState}
            workspace={identifierWorkspace}
            formAction={identifierFormAction}
            pending={identifierPending}
          />

          <StatusCallout tone="warning" title="旧录入模式仅作过渡">
            如果某天已经有识别码成交，下面这张旧表单会被系统阻止保存，避免新旧两套口径把当天数据写乱。
          </StatusCallout>

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
          <MemberIdentifierSaleHistory workspace={identifierWorkspace} />

          <StatusCallout tone="info" title="录入说明">
            <ul className="space-y-2">
              <li>识别码成交是当前主入口，优先在上方完成。</li>
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
