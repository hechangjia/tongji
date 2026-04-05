import type { MemberIdentifierWorkspace } from "@/server/services/member-identifier-sale-service";

export function MemberIdentifierSaleHistory({
  workspace,
}: {
  workspace: MemberIdentifierWorkspace;
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-[24px] border border-white/70 bg-white/84 p-5 shadow-[0_18px_50px_rgba(8,47,73,0.08)]">
        <h2 className="text-lg font-semibold text-slate-950">当前可用资源</h2>
        <div className="mt-4 space-y-3 text-sm text-slate-600">
          <p>待售识别码：{workspace.codeOptions.length} 个</p>
          <p>待转化线索：{workspace.leadOptions.length} 条</p>
        </div>
      </section>

      <section className="rounded-[24px] border border-white/70 bg-white/84 p-5 shadow-[0_18px_50px_rgba(8,47,73,0.08)]">
        <h2 className="text-lg font-semibold text-slate-950">最近识别码成交</h2>
        {workspace.recentSales.length === 0 ? (
          <p className="mt-4 text-sm leading-7 text-slate-500">还没有识别码成交记录，完成第一笔后会在这里显示。</p>
        ) : (
          <div className="mt-4 space-y-3">
            {workspace.recentSales.map((sale) => (
              <div
                key={sale.id}
                className="rounded-[18px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700"
              >
                <div className="font-medium text-slate-950">
                  {sale.code} · {sale.planType === "PLAN_40" ? "40 套餐" : "60 套餐"}
                </div>
                <div className="mt-1 text-slate-500">
                  {sale.qqNumber} · {sale.sourceLabel}
                </div>
                <div className="mt-1 text-xs text-slate-400">成交日 {sale.saleDate}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
