import { EmptyState } from "@/components/empty-state";
import type { AdminCodeInventoryRow } from "@/server/services/admin-code-service";

function statusLabel(status: AdminCodeInventoryRow["status"]) {
  if (status === "ASSIGNED") {
    return "已分发";
  }

  if (status === "SOLD") {
    return "已售出";
  }

  return "待分发";
}

function statusClassName(status: AdminCodeInventoryRow["status"]) {
  if (status === "ASSIGNED") {
    return "bg-amber-100 text-amber-700";
  }

  if (status === "SOLD") {
    return "bg-emerald-100 text-emerald-700";
  }

  return "bg-slate-200 text-slate-700";
}

export function CodeInventoryTable({ rows }: { rows: AdminCodeInventoryRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="还没有识别码库存"
        description="先导入第一批识别码，系统会在这里展示库存状态、导入来源和当前持有人。"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/82 shadow-[0_22px_60px_rgba(8,47,73,0.08)]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50/90 text-left text-slate-600">
            <tr>
              <th className="px-5 py-4 font-medium">识别码</th>
              <th className="px-5 py-4 font-medium">状态</th>
              <th className="px-5 py-4 font-medium">当前归属</th>
              <th className="px-5 py-4 font-medium">导入批次</th>
              <th className="px-5 py-4 font-medium">时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id} className="align-top text-slate-700 transition hover:bg-cyan-50/50">
                <td className="px-5 py-4 font-medium text-slate-900">{row.code}</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClassName(row.status)}`}>
                    {statusLabel(row.status)}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-500">
                  {row.ownerName && row.ownerUsername
                    ? `${row.ownerName}（${row.ownerUsername}）`
                    : "暂未分配"}
                </td>
                <td className="px-5 py-4 text-slate-500">{row.importFileName}</td>
                <td className="px-5 py-4 text-slate-500">
                  <div>导入：{row.createdAt.toISOString().slice(0, 10)}</div>
                  <div>分发：{row.assignedAt ? row.assignedAt.toISOString().slice(0, 16).replace("T", " ") : "-"}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
