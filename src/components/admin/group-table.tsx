import { EmptyState } from "@/components/empty-state";
import { updateGroupAction } from "@/app/(admin)/admin/groups/actions";

type GroupLeaderOption = {
  id: string;
  name: string;
  username: string;
  role?: "ADMIN" | "MEMBER" | "LEADER";
  groupName?: string | null;
};

function formatLeaderOptionLabel(option: GroupLeaderOption) {
  const roleLabel = option.role === "LEADER" ? "当前是组长" : "普通成员";
  const groupLabel = option.groupName ? `当前分组：${option.groupName}` : "当前未分组";

  return `${option.name}（${option.username}） · ${roleLabel} · ${groupLabel}`;
}

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
    <div className="overflow-hidden rounded-[24px] border border-white/70 bg-white/82 shadow-[0_22px_60px_rgba(8,47,73,0.08)]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50/90 text-left text-slate-600">
            <tr>
              <th className="px-5 py-4 font-medium">小组</th>
              <th className="px-5 py-4 font-medium">当前信息</th>
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
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-slate-500">小组名称</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">{row.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">当前口号</p>
                      <p className="mt-1 text-sm text-slate-600">{row.slogan || "暂未设置，等待组长维护"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">当前备注</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {row.remark || "暂未设置，等待组长维护"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-5">
                  <form action={updateGroupAction} className="space-y-3">
                    <input type="hidden" name="id" value={row.id} />
                    <label
                      htmlFor={`leader-${row.id}`}
                      className="text-xs font-medium text-slate-500"
                    >
                      当前组长
                    </label>
                    <p className="text-xs leading-6 text-slate-500">
                      先在成员管理里维护成员归组；这里指定后，会自动把该成员同步为本组组长。
                    </p>
                    <select
                      id={`leader-${row.id}`}
                      name="leaderUserId"
                      defaultValue={row.leaderUserId ?? ""}
                      className="w-full min-w-[180px] rounded-[16px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
                    >
                      <option value="">暂不指定</option>
                      {leaderOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {formatLeaderOptionLabel(option)}
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
                <td className="px-5 py-5 text-xs leading-6 text-slate-500">
                  管理员负责任命组长。
                  <br />
                  口号和备注由组长维护。
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
