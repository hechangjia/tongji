import type {
  GroupLeaderboardCurrentGroupDelta,
  GroupLeaderboardRow,
} from "@/server/services/group-leaderboard-service";

export function LeaderGroupRankingPanel({
  rows,
  currentGroupId,
  viewerGroupDelta,
}: {
  rows: GroupLeaderboardRow[];
  currentGroupId: string;
  viewerGroupDelta: GroupLeaderboardCurrentGroupDelta | null;
}) {
  const currentGroupRow = rows.find((row) => row.groupId === currentGroupId) ?? null;

  return (
    <section className="rounded-[28px] border border-white/70 bg-white/84 p-6 shadow-[0_16px_36px_rgba(8,47,73,0.08)]">
      <div className="space-y-2">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-cyan-700">
          Group Ranking
        </p>
        <h2 className="text-2xl font-semibold text-slate-950">各组排名变化</h2>
        <p className="text-sm leading-7 text-slate-600">
          首屏并排看本组名次、相邻差距和所有小组当日排位，方便组长直接判断冲榜压力。
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[20px] border border-slate-200/80 bg-slate-50/80 p-4">
          <p className="text-xs text-slate-500">当前小组排名</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {currentGroupRow ? `#${currentGroupRow.rank}` : "-"}
          </p>
        </div>
        <div className="rounded-[20px] border border-slate-200/80 bg-slate-50/80 p-4">
          <p className="text-xs text-slate-500">与上一组差距</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {viewerGroupDelta?.gapToPrevious ?? "-"}
          </p>
        </div>
        <div className="rounded-[20px] border border-slate-200/80 bg-slate-50/80 p-4">
          <p className="text-xs text-slate-500">与下一组差距</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {viewerGroupDelta?.gapToNext ?? "-"}
          </p>
        </div>
      </div>

      <ol className="mt-6 space-y-3">
        {rows.map((row) => (
          <li
            key={row.groupId}
            className="flex items-center justify-between gap-4 rounded-[20px] border border-slate-200/80 bg-white p-4"
          >
            <div>
              <p className="text-sm font-semibold text-slate-950">
                #{row.rank} {row.groupName}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                40 / 60：{row.count40} / {row.count60}
              </p>
            </div>
            <p className="text-lg font-semibold text-slate-950">{row.total}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
