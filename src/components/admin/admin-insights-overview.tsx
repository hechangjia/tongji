import { MetricCard } from "@/components/metric-card";
import type { AdminInsightsDistributionRow, AdminInsightsOverview } from "@/server/services/admin-insights-service";

export function AdminInsightsOverview({
  overview,
  anomalyDistribution,
}: {
  overview: AdminInsightsOverview;
  anomalyDistribution: AdminInsightsDistributionRow[];
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="今日高风险成员" value={overview.highRiskCount} tone="dark" />
        <MetricCard label="今日中风险成员" value={overview.mediumRiskCount} />
        <MetricCard label="今日目标达成率" value={`${overview.targetCompletionRate}%`} tone="accent" />
        <MetricCard label="今日已发送提醒" value={overview.remindersSentCount} />
      </div>

      <section className="rounded-[24px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_50px_rgba(8,47,73,0.08)]">
        <h2 className="text-lg font-semibold text-slate-950">异常原因分布</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {anomalyDistribution.length === 0 ? (
            <p className="text-sm text-slate-500">今天还没有异常原因分布数据。</p>
          ) : (
            anomalyDistribution.map((item) => (
              <div
                key={item.label}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700"
              >
                {item.label} · {item.count}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
