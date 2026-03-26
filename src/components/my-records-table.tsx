import { EmptyState } from "@/components/empty-state";
import { saleDateToValue } from "@/server/services/sales-service";

export type MyRecordRow = {
  id: string;
  saleDate: Date;
  count40: number;
  count60: number;
  remark: string | null;
};

export function MyRecordsTable({
  rows,
  emptyText,
}: {
  rows: MyRecordRow[];
  emptyText: string;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="还没有历史记录"
        description={emptyText}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/82 shadow-[0_22px_60px_rgba(8,47,73,0.08)]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50/90 text-left text-slate-600">
            <tr>
              <th className="px-5 py-4 font-medium">日期</th>
              <th className="px-5 py-4 font-medium">40 套餐</th>
              <th className="px-5 py-4 font-medium">60 套餐</th>
              <th className="px-5 py-4 font-medium">总数</th>
              <th className="px-5 py-4 font-medium">备注</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr
                key={row.id}
                className="align-top text-slate-700 transition hover:bg-cyan-50/55"
              >
                <td className="px-5 py-4 font-medium text-slate-900">
                  <div>{saleDateToValue(row.saleDate)}</div>
                  <div className="mt-1 text-xs text-slate-500">个人销售记录快照</div>
                </td>
                <td className="px-5 py-4">{row.count40}</td>
                <td className="px-5 py-4">{row.count60}</td>
                <td className="px-5 py-4 font-semibold text-slate-900">
                  {row.count40 + row.count60}
                </td>
                <td className="px-5 py-4 text-slate-500">{row.remark || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
