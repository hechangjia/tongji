import Link from "next/link";
import { StatusCallout } from "@/components/status-callout";
import type { AdminDailyRhythmSummary } from "@/server/services/daily-rhythm-service";

export function AdminDailyReviewSummary({
  summary,
}: {
  summary: AdminDailyRhythmSummary;
}) {
  return (
    <StatusCallout tone={summary.pendingCount > 0 ? "warning" : "success"} title="今日待审核">
      <div className="space-y-4">
        <p className="text-sm font-medium leading-6">{summary.message}</p>

        <dl className="grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
              待审核
            </dt>
            <dd className="mt-1 text-2xl font-semibold">{summary.pendingCount}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
              临时前三
            </dt>
            <dd className="mt-1">{summary.top3Status.temporaryCount} 人</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
              正式前三
            </dt>
            <dd className="mt-1">
              {summary.top3Status.formalCount} 人
              {summary.top3ConfirmationStatus === "CONFIRMED" ? " · 已确认" : " · 未确认"}
            </dd>
          </div>
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
