import { EmptyState } from "@/components/empty-state";
import type { MemberCumulativeRow } from "@/server/services/cumulative-sales-stats-service";

export function CumulativeRankingChart({
  title,
  rows,
}: {
  title: string;
  rows: MemberCumulativeRow[];
}) {
  if (rows.length === 0) {
    return (
      <section className="space-y-3">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-600">按全体成员累计数量统计</p>
        </div>

        <EmptyState
          title="暂无累计卖卡数据"
          description="当前时间范围内暂无累计卖卡数据，可调整当前区间后查看"
        />
      </section>
    );
  }

  const topRows = rows.filter((row) => !row.isMyPositionRow);
  const myPositionRow = rows.find((row) => row.isMyPositionRow);
  const maxTotal = Math.max(...topRows.map((row) => row.total), 1);

  return (
    <section className="space-y-5 rounded-[24px] border border-white/70 bg-white/82 p-5 shadow-[0_22px_60px_rgba(8,47,73,0.08)]">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600">按全体成员累计数量统计</p>
      </div>

      <div className="space-y-3">
        {topRows.map((row) => (
          <article
            key={`${row.rank}-${row.userName}`}
            className={`rounded-[18px] border p-4 ${
              row.isCurrentUser
                ? "border-cyan-300 bg-cyan-50/80"
                : "border-slate-200 bg-white/80"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Rank {row.rank}
                </p>
                <h3 className="mt-2 truncate text-lg font-semibold text-slate-950">
                  {row.userName}
                </h3>
              </div>
              <p className="text-2xl font-semibold text-slate-950">{row.total}</p>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${
                  row.isCurrentUser ? "bg-cyan-500" : "bg-slate-900"
                }`}
                style={{
                  width: `${Math.max((row.total / maxTotal) * 100, 8)}%`,
                }}
              />
            </div>
          </article>
        ))}
      </div>

      {myPositionRow ? (
        <div className="rounded-[18px] border border-cyan-300 bg-cyan-50/75 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
            我的位置
          </p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-slate-600">当前排名 {myPositionRow.rank}</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-950">
                {myPositionRow.userName}
              </h3>
            </div>
            <p className="text-2xl font-semibold text-slate-950">{myPositionRow.total}</p>
          </div>
          {typeof myPositionRow.gapToPrevious === "number" ? (
            <p className="mt-3 text-sm font-medium text-cyan-800">
              距离前一名 {myPositionRow.gapToPrevious}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
