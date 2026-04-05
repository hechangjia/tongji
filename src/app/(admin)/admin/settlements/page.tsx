import Link from "next/link";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { SettlementTable } from "@/components/admin/settlement-table";
import { StatusCallout } from "@/components/status-callout";
import { getSettlementRows } from "@/server/services/settlement-service";
import { getTodaySaleDateValue } from "@/server/services/sales-service";

type SettlementsPageProps = {
  searchParams?: Promise<{
    startDate?: string | string[];
    endDate?: string | string[];
  }>;
};

function pickQueryValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SettlementsPage({
  searchParams,
}: SettlementsPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const today = getTodaySaleDateValue();
  const startDate = pickQueryValue(params?.startDate) ?? today;
  const endDate = pickQueryValue(params?.endDate) ?? today;
  const rows = await getSettlementRows(startDate, endDate);
  const missingRuleCount = rows.filter((row) => row.status !== "OK").length;
  const settledAmount = rows.reduce((sum, row) => sum + (row.amount ?? 0), 0);
  const exportHref = `/api/export/settlement?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;

  return (
      <section className="space-y-6">
        <PageHeader
          eyebrow="管理员功能"
          title="结算"
          description="按时间范围生成成员结算结果。若某笔销售找不到对应规则，会明确标记为规则缺失并进入风险提醒。"
          actions={
            <Link
              href={exportHref}
              className="inline-flex h-12 items-center justify-center rounded-[18px] border border-slate-200 bg-white/92 px-5 text-sm font-semibold text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-50"
            >
              导出 Excel
            </Link>
          }
        >
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-950">结算总览</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="统计区间" value={`${startDate} 至 ${endDate}`} />
              <MetricCard label="成员结果数" value={rows.length} tone="dark" />
              <MetricCard label="规则风险" value={missingRuleCount} tone="accent" />
              <MetricCard
                label="已结金额"
                value={settledAmount.toFixed(2)}
                hint="仅统计规则完整的数据"
              />
            </div>
          </div>
        </PageHeader>

        {missingRuleCount > 0 ? (
          <StatusCallout tone="warning" title="存在规则缺失">
            当前结果中有 {missingRuleCount} 名成员存在未匹配到规则的销售记录。请先补齐卡酬规则，再重新生成结算。
          </StatusCallout>
        ) : null}

        <form className="rounded-[24px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_50px_rgba(8,47,73,0.08)]">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div className="space-y-2">
              <label htmlFor="startDate" className="text-sm font-medium text-slate-700">
                开始日期
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={startDate}
                className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="endDate" className="text-sm font-medium text-slate-700">
                结束日期
              </label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                defaultValue={endDate}
                className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
              />
            </div>

          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center rounded-[18px] bg-slate-950 px-5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-800"
          >
            生成结算
          </button>
          </div>
        </form>

        <SettlementTable rows={rows} />
      </section>
  );
}
