import type { LeaderWorkbenchMemberRow } from "@/server/services/leader-workbench-service";

function formatDateTime(value: Date | null) {
  if (!value) {
    return "暂无动作";
  }

  return value.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function LeaderMemberRankingPanel({
  rows,
}: {
  rows: LeaderWorkbenchMemberRow[];
}) {
  return (
    <section className="rounded-[28px] border border-white/70 bg-white/84 p-6 shadow-[0_16px_36px_rgba(8,47,73,0.08)]">
      <div className="space-y-2">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-cyan-700">
          Member Ranking
        </p>
        <h2 className="text-2xl font-semibold text-slate-950">组内成员冲榜</h2>
        <p className="text-sm leading-7 text-slate-600">
          同时看成交、持有码数、待推进项和最近动作时间，优先识别谁在冲榜、谁在掉队。
        </p>
      </div>

      {rows.length > 0 ? (
        <ol className="mt-6 space-y-3">
          {rows.map((row) => (
            <li
              key={row.userId}
              className="rounded-[22px] border border-slate-200/80 bg-slate-50/80 p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    #{row.rank} {row.userName}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    最近动作时间：{formatDateTime(row.lastActionAt)}
                  </p>
                </div>
                <p className="text-lg font-semibold text-slate-950">{row.total}</p>
              </div>

              <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-4">
                <span>40 / 60：{row.count40} / {row.count60}</span>
                <span>当前持有码数：{row.activeCodeCount}</span>
                <span>待推进项数：{row.pendingFollowUpCount}</span>
                <span>{row.pendingFollowUpCount > 0 ? "需要跟进" : "节奏正常"}</span>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-6 text-sm text-slate-500">今天还没有可展示的成员冲榜数据。</p>
      )}
    </section>
  );
}
