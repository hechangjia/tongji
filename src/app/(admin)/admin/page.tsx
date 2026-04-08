import { Suspense } from "react";
import { AdminHomeRoutePrefetch } from "@/components/admin/admin-home-route-prefetch";
import { AdminCumulativeStatsPanel } from "@/components/admin/admin-cumulative-stats-panel";
import { AdminDailyReviewSummary } from "@/components/admin/admin-daily-review-summary";
import { IntentPrefetchLink } from "@/components/intent-prefetch-link";
import { PageHeader } from "@/components/page-header";
import {
  type CumulativeMetric,
  type CumulativePreset,
} from "@/server/services/cumulative-sales-stats-service";
import {
  getCachedAdminCumulativeTrend,
  getCachedAdminDailyRhythmSummary,
} from "@/server/services/leaderboard-cache";

type AdminHomePageProps = {
  searchParams?: Promise<{
    preset?: string | string[];
    metric?: string | string[];
  }>;
};

function parsePreset(value?: string): CumulativePreset {
  if (value === "ROLLING_30" || value === "ALL_TIME") {
    return value;
  }

  return "MONTH";
}

function parseMetric(value?: string): CumulativeMetric {
  if (value === "PLAN_40" || value === "PLAN_60") {
    return value;
  }

  return "TOTAL";
}

async function getAdminHomeDashboardData(
  searchParamsPromise?: AdminHomePageProps["searchParams"],
) {
  const paramsPromise = searchParamsPromise ?? Promise.resolve(undefined);
  const params = await paramsPromise;
  const presetParam = Array.isArray(params?.preset) ? params?.preset[0] : params?.preset;
  const metricParam = Array.isArray(params?.metric) ? params?.metric[0] : params?.metric;
  const preset = parsePreset(presetParam);
  const metric = parseMetric(metricParam);
  const [cumulativeStats, dailyReviewSummary] = await Promise.all([
    getCachedAdminCumulativeTrend({
      preset,
      metric,
    }),
    getCachedAdminDailyRhythmSummary({}),
  ]);

  return {
    preset,
    metric,
    cumulativeStats,
    dailyReviewSummary,
  };
}

function AdminHomeDashboardSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="h-32 animate-pulse rounded-[24px] border border-white/70 bg-slate-100/80" />
      <div className="h-64 animate-pulse rounded-[24px] border border-white/70 bg-slate-100/80" />
    </div>
  );
}

export async function AdminHomeDashboard({
  dashboardPromise,
}: {
  dashboardPromise: Promise<Awaited<ReturnType<typeof getAdminHomeDashboardData>>>;
}) {
  const { preset, metric, cumulativeStats, dailyReviewSummary } = await dashboardPromise;

  return (
    <>
      <AdminDailyReviewSummary summary={dailyReviewSummary} />

      <AdminCumulativeStatsPanel
        preset={preset}
        metric={metric}
        granularity={cumulativeStats.granularity}
        series={cumulativeStats.series}
      />
    </>
  );
}

export default function AdminHomePage({ searchParams }: AdminHomePageProps = {}) {
  const dashboardPromise = getAdminHomeDashboardData(searchParams);

  const cards = [
    {
      title: "经营诊断",
      href: "/admin/insights",
      description: "集中查看异常成员、今日目标建议和提醒执行情况。",
    },
    {
      title: "成员管理",
      href: "/admin/members",
      description: "新增成员、调整状态、重置密码。",
    },
    {
      title: "小组管理",
      href: "/admin/groups",
      description: "维护业务小组、组长归属与小组备注。",
    },
    {
      title: "识别码与线索",
      href: "/admin/codes",
      description: "导入识别码和新生 QQ，并按成员批量分发。",
    },
    {
      title: "销售记录",
      href: "/admin/sales?scope=today",
      description: "查看今日审核队列，并直接处理待审核销售记录。",
    },
    {
      title: "卡酬规则",
      href: "/admin/commission-rules",
      description: "维护每位成员在不同时间段的卡酬单价。",
    },
    {
      title: "结算",
      href: "/admin/settlements",
      description: "按区间复核规则缺失并导出结算数据。",
    },
    {
      title: "横幅一言",
      href: "/admin/banners",
      description: "管理登录后全站顶部展示的短文案和展示模式。",
    },
    {
      title: "全体公告",
      href: "/admin/announcements",
      description: "发布正式通知，支持置顶、定时显示和过期时间。",
    },
  ];

  return (
      <section className="space-y-6">
        <AdminHomeRoutePrefetch />
        <PageHeader
          eyebrow="管理后台"
          title="管理员功能"
          description="这里是管理员的主控制台。优先从成员、销售、规则和结算四个入口进入，后续内容系统也会挂在这里。"
        />

        <Suspense fallback={<AdminHomeDashboardSkeleton />}>
          <AdminHomeDashboard dashboardPromise={dashboardPromise} />
        </Suspense>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <IntentPrefetchLink
              key={card.href}
              href={card.href}
              className="group rounded-[24px] border border-white/70 bg-white/82 p-6 shadow-[0_20px_50px_rgba(8,47,73,0.08)] transition duration-200 hover:-translate-y-1 hover:border-cyan-300 hover:bg-cyan-50/60"
            >
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-cyan-700">
                Quick Entry
              </p>
              <h2 className="mt-4 text-2xl font-semibold text-slate-950">
                {card.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {card.description}
              </p>
              <span className="mt-6 inline-flex items-center text-sm font-semibold text-cyan-800">
                进入模块 →
              </span>
            </IntentPrefetchLink>
          ))}
        </div>
      </section>
  );
}
