import { UserStatus } from "@prisma/client";
import { EmptyState } from "@/components/empty-state";
import {
  resetMemberPasswordAction,
  updateMemberAction,
} from "@/app/(admin)/admin/members/actions";

export type MemberRow = {
  id: string;
  username: string;
  name: string;
  role: "ADMIN" | "MEMBER";
  status: UserStatus;
  createdAt: Date;
};

export function MemberTable({
  rows,
  currentAdminId,
}: {
  rows: MemberRow[];
  currentAdminId: string;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="暂无成员数据"
        description="创建第一位成员后，后续状态调整和密码重置都会显示在这里。"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/82 shadow-[0_22px_60px_rgba(8,47,73,0.08)]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50/90 text-left text-slate-600">
            <tr>
              <th className="px-5 py-4 font-medium">账号</th>
              <th className="px-5 py-4 font-medium">姓名</th>
              <th className="px-5 py-4 font-medium">角色</th>
              <th className="px-5 py-4 font-medium">状态</th>
              <th className="px-5 py-4 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const isCurrentAdmin = row.id === currentAdminId;

              return (
                <tr key={row.id} className="align-top text-slate-700 transition hover:bg-cyan-50/50">
                  <td className="px-5 py-5">
                    <div className="font-medium text-slate-900">{row.username}</div>
                    <div className="text-xs text-slate-500">
                      创建于 {row.createdAt.toISOString().slice(0, 10)}
                    </div>
                  </td>
                  <td className="px-5 py-5">
                    <form action={updateMemberAction} className="space-y-3">
                      <input type="hidden" name="id" value={row.id} />
                      <div className="space-y-1">
                        <label
                          htmlFor={`username-${row.id}`}
                          className="text-xs font-medium text-slate-500"
                        >
                          登录账号
                        </label>
                        <input
                          id={`username-${row.id}`}
                          name="username"
                          type="text"
                          defaultValue={row.username}
                          className="w-full min-w-[160px] rounded-[16px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
                        />
                      </div>

                      <div className="space-y-1">
                        <label
                          htmlFor={`name-${row.id}`}
                          className="text-xs font-medium text-slate-500"
                        >
                          姓名
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
                          htmlFor={`status-${row.id}`}
                          className="text-xs font-medium text-slate-500"
                        >
                          状态
                        </label>
                        <select
                          id={`status-${row.id}`}
                          name="status"
                          defaultValue={row.status}
                          disabled={isCurrentAdmin}
                          className="w-full rounded-[16px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40 disabled:bg-slate-100"
                        >
                          <option value="ACTIVE">启用</option>
                          <option value="INACTIVE">停用</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label
                          htmlFor={`password-${row.id}`}
                          className="text-xs font-medium text-slate-500"
                        >
                          新密码（可选）
                        </label>
                        <input
                          id={`password-${row.id}`}
                          name="password"
                          type="password"
                          placeholder="留空则不修改"
                          className="w-full rounded-[16px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
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
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
                      {row.role === "ADMIN" ? "管理员" : "成员"}
                    </span>
                  </td>
                  <td className="px-5 py-5">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        row.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {row.status === "ACTIVE" ? "启用中" : "已停用"}
                    </span>
                  </td>
                  <td className="px-5 py-5">
                    <form action={resetMemberPasswordAction} className="space-y-3">
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="username" value={row.username} />
                      <p className="text-xs text-slate-500">
                        一键重置为 <span className="font-medium">{row.username}123456</span>
                      </p>
                      <button
                        type="submit"
                        className="inline-flex h-10 items-center justify-center rounded-[16px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition duration-200 hover:border-cyan-300 hover:bg-cyan-50"
                      >
                        重置密码
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
