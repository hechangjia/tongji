import { EmptyState } from "@/components/empty-state";
import type { TrendPoint, TrendSeriesRow } from "@/server/services/cumulative-sales-stats-service";

const SERIES_COLORS = ["#0f172a", "#0891b2", "#14b8a6", "#f59e0b", "#ef4444"];

function buildPoints(points: TrendPoint[]) {
  if (points.length === 0) {
    return "";
  }

  const maxValue = Math.max(...points.map((point) => point.value), 1);

  return points
    .map((point: TrendPoint, index: number) => {
      const x = points.length === 1 ? 20 : 20 + (index / (points.length - 1)) * 600;
      const y = 220 - (point.value / maxValue) * 180;

      return `${x},${y}`;
    })
    .join(" ");
}

export function CumulativeTrendChart({
  title,
  series,
}: {
  title: string;
  series: TrendSeriesRow[];
}) {
  if (series.length === 0) {
    return (
      <EmptyState
        title="暂无趋势数据"
        description="当前筛选条件下暂无累计买卡数据"
      />
    );
  }

  return (
    <div className="space-y-4">
      <svg
        aria-label={title}
        viewBox="0 0 640 240"
        className="w-full rounded-[22px] border border-slate-200 bg-white p-4"
      >
        {series.map((line, index) => (
          <polyline
            key={line.userId}
            fill="none"
            stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
            strokeWidth="4"
            points={buildPoints(line.points)}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>

      <div className="flex flex-wrap gap-3 text-sm text-slate-700">
        {series.map((line, index) => (
          <div key={line.userId} className="inline-flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: SERIES_COLORS[index % SERIES_COLORS.length] }}
            />
            <span>{line.userName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
