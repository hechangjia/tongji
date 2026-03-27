import { EmptyState } from "@/components/empty-state";
import { updateGroupAction } from "@/app/(admin)/admin/groups/actions";

type GroupLeaderOption = {
  id: string;
  name: string;
  username: string;
};

type GroupRow = {
  id: string;
  name: string;
  slogan: string | null;
  remark: string | null;
  leaderUserId: string | null;
  leader: {
    id: string;
    name: string;
    username: string;
  } | null;
  memberCount: number;
  createdAt: Date;
};

export function GroupTable({
  rows,
  leaderOptions,
}: {
  rows: GroupRow[];
  leaderOptions: GroupLeaderOption[];
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="暂无小组数据"
        description="创建第一个小组后，后续名称、组长和备注都可以在这里调整。"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/82 shadow-[0_22px_60px_rgba(8,47,73,0.08)]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50/90 text-left text-slate-600">
            <tr>
              <th className="px-5 py-4 font-medium">小组</th>
              <th className="px-5 py-4 font-medium">口号</th>
              <th className="px-5 py-4 font-medium">备注</th>
              <th className="px-5 py-4 font-medium">组长</th>
              <th className="px-5 py-4 font-medium">成员数</th>
              <th className="px-5 py-4 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id} className="align-top text-slate-700 transition hover:bg-cyan-50/50">
                <td className="px-5 py-5">
                  <div className="font-medium text-slate-900">{row.name}</div>
                  <div className="text-xs text-slate-500">
                    创建于 {row.createdAt.toISOString().slice(0, 10)}
                  </div>
                </td>
                <td className="px-5 py-5">
                  <form action={updateGroupAction} className="space-y-3">
                    <input type="hidden" name="id" value={row.id} />

                    <div className="space-y-1">
                      <label
                        htmlFor={`name-${row.id}`}
                        className="text-xs font-medium text-slate-500"
                      >
                        小组名称
                      </label>
                      <input
                        id={`name-${row.id}`}
                        name="name"
                        type="text"
                        defaultValue={row.name}
                        className="w-full min-w-[160px] rounded-[16px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
                      />
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor={`slogan-${row.id}`}
                        className="text-xs font-medium text-slate-500"
                      >
                        小组口号
                      </label>
                      <input
                        id={`slogan-${row.id}`}
                        name="slogan"
                        type="text"
                        defaultValue={row.slogan ?? ""}
                        className="w-full min-w-[160px] rounded-[16px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
                      />
                    </div>

                    <button
                      type="submit"
                      className="inline-flex h-10 items-center justify-center rounded-[16px] bg-slate-950 px-4 text-sm font-semibold text-white transition duration-200 hover:bg-cyan-800"
                    >
                      保存
                    </button>
                  </form>
                </td>
                <td className="px-5 py-5">
                  <form action={updateGroupAction} className="space-y-3">
                    <input type="hidden" name="id" value={row.id} />
                    <input type="hidden" name="name" value={row.name} />
                    <input type="hidden" name="slogan" value={row.slogan ?? ""} />
                    <input type="hidden" name="leaderUserId" value={row.leaderUserId ?? ""} />
                    <label htmlFor={`remark-${row.id}`} className="text-xs font-medium text-slate-500">
                      小组备注
                    </label>
                    <textarea
                      id={`remark-${row.id}`}
                      name="remark"
                      rows={3}
                      defaultValue={row.remark ?? ""}
                      className="w-full min-w-[180px] rounded-[16px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
                    />
                    <button
                      type="submit"
                      className="inline-flex h-10 items-center justify-center rounded-[16px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition duration-200 hover:border-cyan-300 hover:bg-cyan-50"
                    >
                      保存备注
                    </button>
                  </form>
                </td>
                <td className="px-5 py-5">
                  <form action={updateGroupAction} className="space-y-3">
                    <input type="hidden" name="id" value={row.id} />
                    <input type="hidden" name="name" value={row.name} />
                    <input type="hidden" name="slogan" value={row.slogan ?? ""} />
                    <input type="hidden" name="remark" value={row.remark ?? ""} />
                    <label
                      htmlFor={`leader-${row.id}`}
                      className="text-xs font-medium text-slate-500"
                    >
                      当前组长
                    </label>
                    <select
                      id={`leader-${row.id}`}
                      name="leaderUserId"
                      defaultValue={row.leaderUserId ?? ""}
                      className="w-full min-w-[180px] rounded-[16px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
                    >
                      <option value="">暂不指定</option>
                      {leaderOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}（{option.username}）
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="inline-flex h-10 items-center justify-center rounded-[16px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition duration-200 hover:border-cyan-300 hover:bg-cyan-50"
                    >
                      保存组长
                    </button>
                  </form>
                  <p className="mt-2 text-xs text-slate-500">
                    {row.leader
                      ? `${row.leader.name}（${row.leader.username}）`
                      : "当前未指定组长"}
                  </p>
                </td>
                <td className="px-5 py-5">
                  <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
                    {row.memberCount} 人
                  </span>
                </td>
                <td className="px-5 py-5 text-xs text-slate-500">支持创建后即时编辑</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
