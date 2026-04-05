import { EmptyState } from "@/components/empty-state";
import { BentoCard } from "@/components/ui/bento-card";
import type { SettlementRow } from "@/server/services/settlement-service";

function formatAmount(amount: number | null) {
  return amount === null ? "规则缺失" : amount.toFixed(2);
}

export function SettlementTable({
  rows,
}: {
  rows: SettlementRow[];
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="暂无结算结果"
        description="当前时间范围内暂无销售记录，建议调整日期范围后重新生成结算。"
      />
    );
  }

  return (
    <BentoCard radius="lg" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="text-left border-b border-maika-muted/10 text-xs text-maika-muted uppercase tracking-[0.1em]">
            <tr>
              <th className="px-5 py-4 font-medium">成员</th>
              <th className="px-5 py-4 font-medium">40 套餐</th>
              <th className="px-5 py-4 font-medium">60 套餐</th>
              <th className="px-5 py-4 font-medium">状态</th>
              <th className="px-5 py-4 font-medium">应结金额</th>
              <th className="px-5 py-4 font-medium">说明</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.userId} className="align-middle text-maika-foreground transition hover:bg-maika-foreground/5">
                <td className="px-5 py-4 font-semibold text-maika-ink mono-accent">{row.userName}</td>
                <td className="px-5 py-4">{row.count40}</td>
                <td className="px-5 py-4">{row.count60}</td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      row.status === "OK"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {row.status === "OK" ? "规则完整" : "规则缺失"}
                  </span>
                </td>
                <td className="px-5 py-4 font-semibold text-slate-900">
                  {formatAmount(row.amount)}
                </td>
                <td className="px-5 py-4 text-slate-500">
                  {row.missingDates.length > 0
                    ? `缺失日期：${row.missingDates.join("、")}`
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </BentoCard>
  );
}
