import type {
  GroupLeaderboardCurrentGroupDelta,
  GroupLeaderboardRow,
  GroupMemberLeaderboardRow,
} from "@/server/services/group-leaderboard-service";

export function GroupLeaderboardTable({
  rows,
  viewerGroupDelta,
  memberRowsByGroupId,
}: {
  rows: GroupLeaderboardRow[];
  viewerGroupDelta: GroupLeaderboardCurrentGroupDelta | null;
  memberRowsByGroupId: Record<string, GroupMemberLeaderboardRow[]>;
}) {
  return (
    <section className="rounded-[28px] border border-white/70 bg-white/84 p-6 shadow-[0_16px_36px_rgba(8,47,73,0.08)]">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[20px] border border-slate-200/80 bg-slate-50/80 p-4">
          <p className="text-xs text-slate-500">当前小组</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {viewerGroupDelta?.groupId ?? "-"}
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

      <div className="mt-6 space-y-4">
        {rows.map((row) => {
          const memberRows = memberRowsByGroupId[row.groupId] ?? [];

          return (
            <article key={row.groupId} className="rounded-[22px] border border-slate-200/80 bg-slate-50/80 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    #{row.rank} {row.groupName}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    40 / 60：{row.count40} / {row.count60}
                  </p>
                </div>
                <p className="text-lg font-semibold text-slate-950">{row.total}</p>
              </div>

              {memberRows.length > 0 ? (
                <ol className="mt-4 space-y-2 rounded-[18px] border border-white bg-white p-3">
                  {memberRows.map((memberRow) => (
                    <li key={memberRow.userId} className="flex items-center justify-between gap-4 text-sm">
                      <span>
                        #{memberRow.rank} {memberRow.userName}
                      </span>
                      <span className="text-slate-500">
                        {memberRow.count40} / {memberRow.count60} · {memberRow.total}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
