import { EmptyState } from "@/components/empty-state";
import { ResponsiveTable, type Column } from "@/components/ui/responsive-table";

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
  
  const columns: Column<LeaderboardRow>[] = [
    { 
      key: "rank", 
      label: "排名", 
      mobilePriority: true,
      render: (row) => (
        <span aria-hidden="true" className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-950">
          {row.rank}
        </span>
      )
    },
    { key: "userName", label: "成员", mobilePriority: true },
    { key: "count40", label: "40 套餐" },
    { key: "count60", label: "60 套餐" },
    { 
      key: "total", 
      label: "总数", 
      render: (row) => <span className="font-semibold text-slate-900">{row.total}</span>
    },
  ];

  return (
    <section className="space-y-6" aria-label={title}>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h2>
        <p className="text-sm leading-relaxed text-slate-600 max-w-2xl">
          冠军、亚军和季军会优先高亮显示，帮助团队更快看出当天或当前区间的领先者。
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="暂无榜单数据"
          description={emptyText}
        />
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-3" role="list" aria-label="前三名荣誉榜">
            {podium.map((row, index) => (
              <article
                key={`${row.userName}-${row.rank}`}
                role="listitem"
                aria-label={`排名第 ${row.rank}：${row.userName}`}
                className={`group relative overflow-hidden rounded-[24px] border px-6 py-6 shadow-[0_18px_42px_rgba(8,47,73,0.08)] transition-colors ${
                  index === 0
                    ? "maika-podium-surface border-[var(--maika-accent)]/50 text-white"
                    : "maika-glass bg-[var(--maika-surface)] border-white/40 text-slate-950"
                }`}
              >
                {index === 0 ? (
                  <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                ) : null}

                <p
                  className={`text-[0.72rem] font-semibold uppercase tracking-[0.22em] ${
                    index === 0 ? "text-[var(--maika-accent)] opacity-90" : "text-[var(--maika-accent-strong)]"
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
                        index === 0 ? "text-[var(--maika-accent)]/80" : "text-slate-500"
                      }`}
                    >
                      40套餐 {row.count40} · 60套餐 {row.count60}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-[0.72rem] font-semibold uppercase tracking-[0.18em] ${
                        index === 0 ? "text-[var(--maika-accent)]/80" : "text-slate-500"
                      }`}
                    >
                      总数
                    </p>
                    <p className="mt-2 text-4xl font-display font-semibold">{row.total}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <ResponsiveTable
            data={rows}
            columns={columns}
            rowKey={(r) => `${r.userName}-${r.rank}`}
            title="完整排行明细"
          />
        </div>
      )}
    </section>
  );
}
