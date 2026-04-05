"use client";

import { ResponsiveTable, type Column } from "@/components/ui/responsive-table";

export interface SettlementRowData {
  userId: string;
  userName: string;
  groupName: string;
  count40: number;
  count60: number;
  amount: number | null;
  status: "OK" | "MISSING_RULE";
  isSettled: boolean;
}

interface SettlementTableProps {
  data: SettlementRowData[];
}

export function SettlementTable({ data }: SettlementTableProps) {
  const columns: Column<SettlementRowData>[] = [
    {
      key: "userName",
      label: "成员信息",
      mobilePriority: true,
      render: (row) => (
        <div>
          <div className="font-semibold">{row.userName}</div>
          <div className="text-xs text-slate-500">{row.groupName || "未分配"}</div>
        </div>
      ),
    },
    {
      key: "sales",
      label: "销售明细",
      render: (row) => (
        <div className="text-sm">
          <span className="text-cyan-600 font-medium">{row.count40}</span> (40G) / <span className="text-indigo-600 font-medium">{row.count60}</span> (60G)
        </div>
      ),
    },
    {
      key: "status",
      label: "结算状态",
      render: (row) => {
        if (row.status === "MISSING_RULE") {
          return <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">规则缺失</span>;
        }
        if (row.isSettled) {
          return <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">已结算</span>;
        }
        return <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">待结算</span>;
      },
    },
    {
      key: "amount",
      label: "佣金金额",
      mobilePriority: true,
      render: (row) => (
        <div className="font-mono text-base font-semibold">
          {row.amount !== null ? `¥${row.amount.toFixed(2)}` : "-"}
        </div>
      ),
    },
  ];

  return (
    <ResponsiveTable
      data={data}
      columns={columns}
      rowKey={(row) => row.userId}
      emptyText="当前周期暂无结算数据"
    />
  );
}
