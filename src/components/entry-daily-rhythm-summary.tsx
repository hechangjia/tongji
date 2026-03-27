import Link from "next/link";
import { StatusCallout } from "@/components/status-callout";
import type { MemberDailyRhythmSummary } from "@/server/services/daily-rhythm-service";

export type EntryDailyRhythmSummaryData = MemberDailyRhythmSummary & {
  lastSubmittedAtIso: string | null;
};

const reviewStatusLabels = {
  NONE: "未提交",
  PENDING: "待审核",
  APPROVED: "已通过",
  REJECTED: "已退回",
} as const;

function formatSubmittedAt(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getTone(summary: EntryDailyRhythmSummaryData) {
  switch (summary.state) {
    case "REJECTED":
      return "error";
    case "PENDING_REVIEW":
      return "info";
    case "FORMAL_TOP3":
      return "success";
    case "APPROVED_NOT_TOP3":
      return "success";
    case "NO_SUBMISSION":
      return "warning";
  }
}

function getTitle(summary: EntryDailyRhythmSummaryData) {
  switch (summary.state) {
    case "REJECTED":
      return "当日节奏提醒";
    case "PENDING_REVIEW":
      return "当日节奏摘要";
    case "FORMAL_TOP3":
      return "当日节奏进展";
    case "APPROVED_NOT_TOP3":
      return "当日节奏进展";
    case "NO_SUBMISSION":
      return "当日节奏提醒";
  }
}

function getTemporaryTop3Text(summary: EntryDailyRhythmSummaryData) {
  if (summary.isTemporaryTop3 && summary.temporaryRank) {
    return `当前处于临时第 ${summary.temporaryRank} 名`;
  }

  return null;
}

export function EntryDailyRhythmSummary({
  summary,
  className,
}: {
  summary: EntryDailyRhythmSummaryData;
  className?: string;
}) {
  const temporaryTop3Text = getTemporaryTop3Text(summary);

  return (
    <StatusCallout tone={getTone(summary)} title={getTitle(summary)}>
      <div className={className ?? "space-y-4"}>
        <p className="text-sm font-medium leading-6">{summary.message}</p>

        <dl className="grid gap-3 sm:grid-cols-2">
          {summary.lastSubmittedAtIso ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                最后提交时间
              </dt>
              <dd className="mt-1">{formatSubmittedAt(summary.lastSubmittedAtIso)}</dd>
            </div>
          ) : null}

          {summary.reviewStatus !== "NONE" ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                当前审核状态
              </dt>
              <dd className="mt-1">{reviewStatusLabels[summary.reviewStatus]}</dd>
            </div>
          ) : null}

          {summary.isTemporaryTop3 && temporaryTop3Text ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                临时前三
              </dt>
              <dd className="mt-1">{temporaryTop3Text}</dd>
            </div>
          ) : null}

          {summary.isFormalTop3 && summary.formalRank ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                正式前三
              </dt>
              <dd className="mt-1">{`正式第 ${summary.formalRank} 名`}</dd>
            </div>
          ) : null}
        </dl>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href={summary.primaryAction.href}
            className="inline-flex h-11 items-center justify-center rounded-[18px] bg-slate-950 px-4 text-sm font-semibold text-white transition duration-200 hover:bg-slate-800"
          >
            {summary.primaryAction.label}
          </Link>
          {summary.secondaryActions.slice(0, 2).map((action) => (
            <Link
              key={`${action.href}-${action.label}`}
              href={action.href}
              className="inline-flex h-11 items-center justify-center rounded-[18px] border border-slate-300 bg-white/70 px-4 text-sm font-semibold text-slate-900 transition duration-200 hover:bg-white"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </StatusCallout>
  );
}
