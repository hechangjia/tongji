import { auth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import {
  getDailyLeaderboard,
} from "@/server/services/leaderboard-service";
import { getTodaySaleDateValue, type DateValue } from "@/server/services/sales-service";

type DailyLeaderboardPageProps = {
  searchParams?: Promise<{
    date?: string | string[];
  }>;
};

function isDateValue(value?: string): value is DateValue {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export default async function DailyLeaderboardPage({
  searchParams,
}: DailyLeaderboardPageProps) {
  const session = await auth();
  const params = searchParams ? await searchParams : undefined;
  const dateParam = Array.isArray(params?.date) ? params?.date[0] : params?.date;
  const selectedDate = isDateValue(dateParam) ? dateParam : getTodaySaleDateValue();
  const rows = await getDailyLeaderboard(selectedDate);
  const champion = rows[0]?.total ?? 0;

  const content = (
    <section className="space-y-6">
      <PageHeader
        eyebrow="共享榜单"
        title="日榜"
        description="按单日销售总数排序展示成员表现。默认打开今天的数据，也可以快速切换到其他日期复盘。"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard label="冠军总数" value={champion} tone="dark" />
          <MetricCard label="参与人数" value={rows.length} />
          <MetricCard label="当前日期" value={selectedDate} tone="accent" />
        </div>
      </PageHeader>

      <form className="rounded-[26px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_50px_rgba(8,47,73,0.08)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <label htmlFor="date" className="text-sm font-medium text-slate-700">
              日期
            </label>
            <input
              id="date"
              name="date"
              type="date"
              defaultValue={selectedDate}
              className="rounded-[18px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
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

      <LeaderboardTable
        rows={rows}
        title={`每日排行榜 · ${selectedDate}`}
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
      currentPath="/leaderboard/daily"
    >
      {content}
    </AppShell>
  );
}
