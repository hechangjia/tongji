import { EmptyState } from "@/components/empty-state";
import { saleDateToValue } from "@/server/services/sales-service";

export type MyRecordRow = {
  id: string;
  saleDate: Date;
  count40: number;
  count60: number;
  remark: string | null;
};

export type IdentifierSaleHistoryRow = {
  id: string;
  code: string;
  qqNumber: string;
  major: string;
  planType: "PLAN_40" | "PLAN_60";
  sourceLabel: string;
  saleDate: Date;
};

export function MyRecordsTable({
  rows,
  identifierSales,
  emptyText,
}: {
  rows: MyRecordRow[];
  identifierSales: IdentifierSaleHistoryRow[];
  emptyText: string;
}) {
  if (rows.length === 0 && identifierSales.length === 0) {
    return (
      <EmptyState
        title="还没有历史记录"
        description={emptyText}
      />
    );
  }

  return (
    <div className="space-y-6">
      {rows.length > 0 ? (
        <div className="overflow-hidden rounded-[24px] border border-white/70 bg-white/82 shadow-[0_22px_60px_rgba(8,47,73,0.08)]">
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
      ) : null}

      {identifierSales.length > 0 ? (
        <div className="overflow-hidden rounded-[24px] border border-white/70 bg-white/82 shadow-[0_22px_60px_rgba(8,47,73,0.08)]">
          <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-950">识别码成交明细</h2>
            <p className="mt-1 text-sm text-slate-500">这里会显示每一笔识别码成交对应的套餐类型和线索来源。</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50/90 text-left text-slate-600">
                <tr>
                  <th className="px-5 py-4 font-medium">成交日期</th>
                  <th className="px-5 py-4 font-medium">识别码</th>
                  <th className="px-5 py-4 font-medium">套餐</th>
                  <th className="px-5 py-4 font-medium">QQ / 专业</th>
                  <th className="px-5 py-4 font-medium">来源</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {identifierSales.map((sale) => (
                  <tr key={sale.id} className="align-top text-slate-700 transition hover:bg-cyan-50/55">
                    <td className="px-5 py-4 font-medium text-slate-900">{saleDateToValue(sale.saleDate)}</td>
                    <td className="px-5 py-4">{sale.code}</td>
                    <td className="px-5 py-4">{sale.planType === "PLAN_40" ? "40 套餐" : "60 套餐"}</td>
                    <td className="px-5 py-4 text-slate-500">
                      <div>{sale.qqNumber}</div>
                      <div className="mt-1 text-xs">{sale.major}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{sale.sourceLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
