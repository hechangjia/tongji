import { EmptyState } from "@/components/empty-state";
import { updateSalesRecordAction } from "@/app/(admin)/admin/sales/actions";

export type AdminSalesRow = {
  id: string;
  saleDate: string;
  userName: string;
  count40: number;
  count60: number;
  remark: string | null;
};

export function SalesTable({
  rows,
  returnTo,
}: {
  rows: AdminSalesRow[];
  returnTo: string;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="暂无销售记录"
        description="当前筛选条件下没有结果，建议清空筛选或扩大日期范围后再试。"
      />
    );
  }

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <form
          key={row.id}
          action={updateSalesRecordAction}
          className="space-y-4 rounded-[28px] border border-white/70 bg-white/84 p-5 shadow-[0_20px_52px_rgba(8,47,73,0.08)]"
        >
          <input type="hidden" name="id" value={row.id} />
          <input type="hidden" name="returnTo" value={returnTo} />

          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-semibold text-slate-900">{row.userName}</p>
              <p className="text-xs text-slate-500">{row.saleDate}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-900">
                当前总数 {row.count40 + row.count60}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {row.remark ? "含备注" : "备注待补充"}
              </span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[120px_120px_minmax(0,1fr)_auto] md:items-end">
            <div className="space-y-1">
              <label
                htmlFor={`count40-${row.id}`}
                className="text-xs font-medium text-slate-500"
              >
                40 套餐
              </label>
              <input
                id={`count40-${row.id}`}
                name="count40"
                type="number"
                min="0"
                defaultValue={row.count40}
                className="w-full rounded-[16px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor={`count60-${row.id}`}
                className="text-xs font-medium text-slate-500"
              >
                60 套餐
              </label>
              <input
                id={`count60-${row.id}`}
                name="count60"
                type="number"
                min="0"
                defaultValue={row.count60}
                className="w-full rounded-[16px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor={`remark-${row.id}`}
                className="text-xs font-medium text-slate-500"
              >
                备注
              </label>
              <input
                id={`remark-${row.id}`}
                name="remark"
                type="text"
                defaultValue={row.remark ?? ""}
                className="w-full rounded-[16px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
              />
            </div>

            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-[16px] bg-slate-950 px-5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-800"
            >
              保存
            </button>
          </div>
        </form>
      ))}
    </div>
  );
}
