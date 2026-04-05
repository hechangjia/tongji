import { EmptyState } from "@/components/empty-state";
import { BentoCard } from "@/components/ui/bento-card";
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
    return "bg-amber-500/10 text-amber-600";
  }

  if (status === "SOLD") {
    return "bg-green-500/10 text-green-700";
  }

  return "bg-maika-muted/10 text-maika-muted";
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
    <BentoCard radius="lg" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="text-left border-b border-maika-muted/10 text-xs text-maika-muted uppercase tracking-[0.1em]">
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
                <td className="px-5 py-4 font-medium text-maika-ink mono-accent tracking-wider">{row.code}</td>
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
      </BentoCard>
  );
}
