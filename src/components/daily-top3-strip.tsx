import type { DailyTop3Status, DailyRhythmTop3Row } from "@/server/services/daily-rhythm-service";

function formatSubmittedAt(value: Date | null) {
  if (!value) {
    return "提交时间待补充";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(value);
}

function getReviewStatusLabel(reviewStatus: DailyRhythmTop3Row["reviewStatus"]) {
  return reviewStatus === "PENDING" ? "待审核" : "已通过";
}

function Top3List({
  title,
  description,
  count,
  rows,
  emptyText,
}: {
  title: string;
  description: string;
  count: number;
  rows: DailyRhythmTop3Row[];
  emptyText: string;
}) {
  return (
    <article className="rounded-[24px] border border-white/70 bg-white/82 p-4 shadow-[0_18px_42px_rgba(8,47,73,0.08)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          <p className="text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <span className="inline-flex min-w-10 items-center justify-center rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">
          {count}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 rounded-[18px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-4 text-sm leading-6 text-slate-500">
          {emptyText}
        </p>
      ) : (
        <ol className="mt-4 space-y-3">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex items-start gap-3 rounded-[18px] border border-slate-100 bg-slate-50/80 px-4 py-3"
            >
              <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                {row.rank}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-slate-950">{row.userName}</p>
                  <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[0.72rem] font-semibold text-slate-600 ring-1 ring-slate-200">
                    {getReviewStatusLabel(row.reviewStatus)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  提交时间 {formatSubmittedAt(row.lastSubmittedAt)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}

export function DailyTop3Strip({ top3Status }: { top3Status: DailyTop3Status }) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Top3List
        title="临时前三"
        description="包含待审核和已通过记录，结果会随着审核进度实时变动。"
        count={top3Status.temporaryCount}
        rows={top3Status.temporaryTop3}
        emptyText="暂无待审核中的临时前三"
      />
      <Top3List
        title="正式前三"
        description="仅展示已通过审核的记录，作为当前日期的正式结果。"
        count={top3Status.formalCount}
        rows={top3Status.formalTop3}
        emptyText="暂无已通过审核的正式前三"
      />
    </section>
  );
}
