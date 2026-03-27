import { CumulativeTrendChart } from "@/components/cumulative-trend-chart";
import type {
  CumulativeMetric,
  CumulativePreset,
  TrendGranularity,
  TrendSeriesRow,
} from "@/server/services/cumulative-sales-stats-service";

const PRESET_OPTIONS: Array<{ value: CumulativePreset; label: string }> = [
  { value: "MONTH", label: "本月" },
  { value: "ROLLING_30", label: "近 30 天" },
  { value: "ALL_TIME", label: "全历史" },
];

const METRIC_OPTIONS: Array<{ value: CumulativeMetric; label: string }> = [
  { value: "TOTAL", label: "总量" },
  { value: "PLAN_40", label: "40 套餐" },
  { value: "PLAN_60", label: "60 套餐" },
];

function FilterButton({
  name,
  value,
  label,
  active,
  hiddenName,
  hiddenValue,
}: {
  name: "preset" | "metric";
  value: string;
  label: string;
  active: boolean;
  hiddenName: "preset" | "metric";
  hiddenValue: string;
}) {
  return (
    <form method="get">
      <input type="hidden" name={hiddenName} value={hiddenValue} />
      <button
        type="submit"
        name={name}
        value={value}
        className={`inline-flex h-10 items-center justify-center rounded-[16px] px-4 text-sm font-semibold transition ${
          active
            ? "bg-slate-950 text-white"
            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        }`}
      >
        {label}
      </button>
    </form>
  );
}

export function AdminCumulativeStatsPanel({
  preset,
  metric,
  granularity,
  series,
}: {
  preset: CumulativePreset;
  metric: CumulativeMetric;
  granularity: TrendGranularity;
  series: TrendSeriesRow[];
}) {
  return (
    <section className="space-y-5 rounded-[28px] border border-white/70 bg-white/82 p-6 shadow-[0_22px_60px_rgba(8,47,73,0.08)]">
      <div className="space-y-2">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-cyan-700">
          Admin Insight
        </p>
        <h2 className="text-2xl font-semibold text-slate-950">成员累计买卡趋势</h2>
        <p className="text-sm text-slate-600">
          观察成员累计走势，快速识别谁在持续增长，谁近期放缓。当前粒度：
          {granularity === "month" ? "按月" : "按天"}。
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {PRESET_OPTIONS.map((option) => (
          <FilterButton
            key={option.value}
            name="preset"
            value={option.value}
            label={option.label}
            active={preset === option.value}
            hiddenName="metric"
            hiddenValue={metric}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        {METRIC_OPTIONS.map((option) => (
          <FilterButton
            key={option.value}
            name="metric"
            value={option.value}
            label={option.label}
            active={metric === option.value}
            hiddenName="preset"
            hiddenValue={preset}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        <CumulativeTrendChart title="成员累计买卡趋势" series={series} />

        <section className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
          <h3 className="text-lg font-semibold text-slate-950">Top 成员</h3>
          <div className="mt-4 space-y-3">
            {series.length === 0 ? (
              <p className="text-sm text-slate-600">当前筛选条件下暂无累计买卡数据</p>
            ) : (
              series.map((row, index) => (
                <article
                  key={row.userId}
                  className="rounded-[18px] border border-white/80 bg-white px-4 py-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Top {index + 1}
                  </p>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <h4 className="font-semibold text-slate-950">{row.userName}</h4>
                    <p className="text-xl font-semibold text-slate-950">{row.total}</p>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
