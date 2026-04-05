import { EmptyState } from "@/components/empty-state";
import { saleDateToValue } from "@/server/services/sales-service";
import { ResponsiveTable, type Column } from "@/components/ui/responsive-table";

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

  const salesColumns: Column<MyRecordRow>[] = [
    {
      key: "saleDate",
      label: "日期",
      mobilePriority: true,
      render: (row) => (
        <div>
          <div className="font-medium text-slate-900">{saleDateToValue(row.saleDate)}</div>
          <div className="mt-1 text-xs text-slate-500 md:hidden lg:block">个人销售记录快照</div>
        </div>
      )
    },
    { key: "count40", label: "40 套餐" },
    { key: "count60", label: "60 套餐" },
    {
      key: "total",
      label: "总数",
      render: (row) => <span className="font-semibold text-slate-900">{row.count40 + row.count60}</span>
    },
    {
      key: "remark",
      label: "备注",
      render: (row) => <span className="text-slate-500">{row.remark || "-"}</span>
    }
  ];

  const historyColumns: Column<IdentifierSaleHistoryRow>[] = [
    {
      key: "saleDate",
      label: "成交日期",
      mobilePriority: true,
      render: (row) => <span className="font-medium text-slate-900">{saleDateToValue(row.saleDate)}</span>
    },
    { key: "code", label: "识别码", mobilePriority: true },
    {
      key: "planType",
      label: "套餐",
      render: (row) => (
        <span className={row.planType === "PLAN_40" ? "text-cyan-700" : "text-slate-900"}>
          {row.planType === "PLAN_40" ? "40 套餐" : "60 套餐"}
        </span>
      )
    },
    {
      key: "qqNumber",
      label: "QQ / 专业",
      render: (row) => (
        <div>
          <div className="text-slate-900">{row.qqNumber}</div>
          <div className="mt-0.5 text-xs text-slate-500">{row.major}</div>
        </div>
      )
    },
    { key: "sourceLabel", label: "来源" }
  ];

  return (
    <div className="space-y-10">
      {rows.length > 0 && (
        <ResponsiveTable
          data={rows}
          columns={salesColumns}
          rowKey={(r) => r.id}
          title="每日销售总览"
        />
      )}

      {identifierSales.length > 0 && (
        <ResponsiveTable
          data={identifierSales}
          columns={historyColumns}
          rowKey={(r) => r.id}
          title="识别码成交明细"
        />
      )}
    </div>
  );
}
