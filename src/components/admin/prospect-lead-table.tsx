import { EmptyState } from "@/components/empty-state";
import type { AdminProspectLeadRow } from "@/server/services/admin-code-service";

function statusLabel(status: AdminProspectLeadRow["status"]) {
  return status === "ASSIGNED" ? "已分配" : "待分配";
}

function statusClassName(status: AdminProspectLeadRow["status"]) {
  return status === "ASSIGNED"
    ? "bg-amber-100 text-amber-700"
    : "bg-slate-200 text-slate-700";
}

export function ProspectLeadTable({ rows }: { rows: AdminProspectLeadRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="还没有新生线索"
        description="先导入 QQ 和专业，系统会在这里展示线索池状态以及当前分配归属。"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/82 shadow-[0_22px_60px_rgba(8,47,73,0.08)]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50/90 text-left text-slate-600">
            <tr>
              <th className="px-5 py-4 font-medium">QQ 号</th>
              <th className="px-5 py-4 font-medium">专业</th>
              <th className="px-5 py-4 font-medium">状态</th>
              <th className="px-5 py-4 font-medium">当前归属</th>
              <th className="px-5 py-4 font-medium">导入批次</th>
              <th className="px-5 py-4 font-medium">时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id} className="align-top text-slate-700 transition hover:bg-cyan-50/50">
                <td className="px-5 py-4 font-medium text-slate-900">{row.qqNumber}</td>
                <td className="px-5 py-4 text-slate-500">{row.major}</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClassName(row.status)}`}>
                    {statusLabel(row.status)}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-500">
                  {row.assignedToName && row.assignedToUsername
                    ? `${row.assignedToName}（${row.assignedToUsername}）${row.assignedGroupName ? ` · ${row.assignedGroupName}` : ""}`
                    : "暂未分配"}
                </td>
                <td className="px-5 py-4 text-slate-500">{row.importFileName}</td>
                <td className="px-5 py-4 text-slate-500">
                  <div>导入：{row.createdAt.toISOString().slice(0, 10)}</div>
                  <div>分配：{row.assignedAt ? row.assignedAt.toISOString().slice(0, 16).replace("T", " ") : "-"}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
