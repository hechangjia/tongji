import type { Decimal } from "@prisma/client/runtime/library";
import { EmptyState } from "@/components/empty-state";

type CommissionRuleRow = {
  id: string;
  price40: Decimal;
  price60: Decimal;
  effectiveStart: Date;
  effectiveEnd: Date | null;
  user: {
    name: string | null;
    username: string;
  };
};

function formatDate(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "长期有效";
}

export function CommissionRuleTable({
  rows,
}: {
  rows: CommissionRuleRow[];
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="暂无卡酬规则"
        description="保存第一条规则后，这里会按成员和生效区间展示全部规则。"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-white/70 bg-white/82 shadow-[0_22px_60px_rgba(8,47,73,0.08)]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50/90 text-left text-slate-600">
            <tr>
              <th className="px-5 py-4 font-medium">成员</th>
              <th className="px-5 py-4 font-medium">40 套餐</th>
              <th className="px-5 py-4 font-medium">60 套餐</th>
              <th className="px-5 py-4 font-medium">生效区间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id} className="text-slate-700 transition hover:bg-cyan-50/50">
                <td className="px-5 py-4 font-medium text-slate-900">
                  <div>{row.user.name || row.user.username}</div>
                  <div className="mt-1 text-xs text-slate-500">规则 ID: {row.id.slice(-6)}</div>
                </td>
                <td className="px-5 py-4">{row.price40.toString()}</td>
                <td className="px-5 py-4">{row.price60.toString()}</td>
                <td className="px-5 py-4">
                  {formatDate(row.effectiveStart)} 至 {formatDate(row.effectiveEnd)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
