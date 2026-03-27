import Link from "next/link";
import { auth } from "@/lib/auth";
import { hasAuthSessionCookie } from "@/lib/auth-session-cookie";
import { AppShell } from "@/components/app-shell";
import { CumulativeRankingChart } from "@/components/cumulative-ranking-chart";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import {
  getCachedMemberCumulativeRanking,
  getCachedRangeLeaderboard,
} from "@/server/services/leaderboard-cache";
import { resolvePresetRange } from "@/server/services/cumulative-sales-stats-service";
import { getTodaySaleDateValue, type DateValue } from "@/server/services/sales-service";

type RangeLeaderboardPageProps = {
  searchParams?: Promise<{
    startDate?: string | string[];
    endDate?: string | string[];
  }>;
};

function isDateValue(value?: string): value is DateValue {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export default async function RangeLeaderboardPage({
  searchParams,
}: RangeLeaderboardPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const startDateParam = Array.isArray(params?.startDate)
    ? params?.startDate[0]
    : params?.startDate;
  const endDateParam = Array.isArray(params?.endDate)
    ? params?.endDate[0]
    : params?.endDate;
  const defaultRange = resolvePresetRange("MONTH");
  const today = getTodaySaleDateValue();
  const startDate = isDateValue(startDateParam) ? startDateParam : defaultRange.startDate;
  const endDate = isDateValue(endDateParam) ? endDateParam : today;
  const rowsPromise = getCachedRangeLeaderboard(startDate, endDate);
  const sessionPromise = hasAuthSessionCookie().then((hasSessionCookie) =>
    hasSessionCookie ? auth() : null,
  );
  const rows = await rowsPromise;
  const champion = rows[0]?.total ?? 0;
  const exportHref = `/api/export/range?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
  const session = await sessionPromise;
  const cumulativeRanking = session?.user
    ? await getCachedMemberCumulativeRanking({
        startDate,
        endDate,
        currentUserId: session.user.id,
      })
    : null;

  const content = (
    <section className="space-y-6">
      <PageHeader
        eyebrow="共享榜单"
        title="总榜"
        description="按自定义时间范围统计每位成员的累计销量。管理员可以直接从这里导出对应区间的 Excel 数据。"
        actions={
          session?.user?.role === "ADMIN" ? (
            <Link
              href={exportHref}
              className="inline-flex h-12 items-center justify-center rounded-[18px] border border-slate-200 bg-white/92 px-5 text-sm font-semibold text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-50"
            >
              导出 Excel
            </Link>
          ) : null
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard label="冠军总数" value={champion} tone="dark" />
          <MetricCard label="参与人数" value={rows.length} />
          <MetricCard label="统计区间" value={`${startDate} 至 ${endDate}`} tone="accent" />
        </div>
      </PageHeader>

      <form className="rounded-[26px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_50px_rgba(8,47,73,0.08)]">
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
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
            查看
          </button>
        </div>
      </form>

      {cumulativeRanking ? (
        <CumulativeRankingChart title="本月累计卖卡" rows={cumulativeRanking} />
      ) : null}

      <LeaderboardTable
        rows={rows}
        title={`总排行榜 · ${startDate} 至 ${endDate}`}
        emptyText="当前时间范围内暂无数据，建议切换日期后重试"
      />
    </section>
  );

  if (!session?.user?.role) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">{content}</div>
      </main>
    );
  }

  return (
    <AppShell
      role={session.user.role}
      userName={session.user.name ?? session.user.username}
      currentPath="/leaderboard/range"
    >
      {content}
    </AppShell>
  );
}
