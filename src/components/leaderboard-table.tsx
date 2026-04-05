import { EmptyState } from "@/components/empty-state";

export type LeaderboardRow = {
  rank: number;
  userName: string;
  count40: number;
  count60: number;
  total: number;
};

export function LeaderboardTable({
  rows,
  title,
  emptyText = "当前时间范围内暂无数据",
}: {
  rows: LeaderboardRow[];
  title: string;
  emptyText?: string;
}) {
  const podium = rows.slice(0, 3);

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600">
          冠军、亚军和季军会优先高亮显示，帮助团队更快看出当天或当前区间的领先者。
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="暂无榜单数据"
          description={emptyText}
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {podium.map((row, index) => (
              <article
                key={`${row.userName}-${row.rank}`}
                className={`rounded-[24px] border px-5 py-5 shadow-[0_18px_42px_rgba(8,47,73,0.08)] ${
                  index === 0
                    ? "maika-podium-surface border-cyan-300/50 text-white"
                    : "border-white/70 bg-white/82 text-slate-950"
                }`}
              >
                <p
                  className={`text-[0.72rem] font-semibold uppercase tracking-[0.22em] ${
                    index === 0 ? "text-cyan-100/85" : "text-cyan-700"
                  }`}
                >
                  TOP {row.rank}
                </p>
                <div className="mt-4 flex items-end justify-between gap-4">
                  <div>
                    <h3
                      className={`text-2xl font-semibold ${
                        index === 0 ? "text-white" : "text-slate-950"
                      }`}
                    >
                      {row.userName}
                    </h3>
                    <p
                      className={`mt-2 text-sm ${
                        index === 0 ? "text-cyan-50/80" : "text-slate-500"
                      }`}
                    >
                      40 套餐 {row.count40} · 60 套餐 {row.count60}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-[0.72rem] font-semibold uppercase tracking-[0.18em] ${
                        index === 0 ? "text-cyan-100/80" : "text-slate-500"
                      }`}
                    >
                      总数
                    </p>
                    <p className="mt-2 text-3xl font-semibold">{row.total}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="overflow-hidden rounded-[24px] border border-white/70 bg-white/82 shadow-[0_22px_60px_rgba(8,47,73,0.08)]">
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50/90 text-left text-slate-600">
                <tr>
                  <th className="px-5 py-4 font-medium">排名</th>
                  <th className="px-5 py-4 font-medium">成员</th>
                  <th className="px-5 py-4 font-medium">40 套餐</th>
                  <th className="px-5 py-4 font-medium">60 套餐</th>
                  <th className="px-5 py-4 font-medium">总数</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr
                    key={`${row.userName}-${row.rank}`}
                    className="text-slate-700 transition hover:bg-cyan-50/55"
                  >
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-950">
                        {row.rank}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-900">{row.userName}</td>
                    <td className="px-5 py-4">{row.count40}</td>
                    <td className="px-5 py-4">{row.count60}</td>
                    <td className="px-5 py-4 font-semibold text-slate-900">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </>
      )}
    </section>
  );
}
