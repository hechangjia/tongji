import Link from "next/link";
import { StatusCallout } from "@/components/status-callout";
import type { MemberDailyRhythmSummary } from "@/server/services/daily-rhythm-service";

export type EntryDailyRhythmSummaryData = MemberDailyRhythmSummary & {
  lastSubmittedAtIso: string | null;
};

function formatSubmittedAt(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
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
  return summary.title;
}

export function EntryDailyRhythmSummary({
  summary,
  className,
}: {
  summary: EntryDailyRhythmSummaryData;
  className?: string;
}) {
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

          {summary.reviewStatusLabel ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                当前审核状态
              </dt>
              <dd className="mt-1">{summary.reviewStatusLabel}</dd>
            </div>
          ) : null}

          {summary.top3Label && summary.top3Message ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                {summary.top3Label}
              </dt>
              <dd className="mt-1">{summary.top3Message}</dd>
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
