import { Suspense } from "react";
import Link from "next/link";
import { AdminInsightMemberCard } from "@/components/admin/admin-insight-member-card";
import { AdminInsightsOverview } from "@/components/admin/admin-insights-overview";
import { PageHeader } from "@/components/page-header";
import { StatusCallout } from "@/components/status-callout";
import { getCachedAdminInsightsData } from "@/server/services/admin-insights-cache";
import {
  type AdminInsightsData,
} from "@/server/services/admin-insights-service";
import { getTodaySaleDateValue } from "@/server/services/sales-service";

type AdminInsightsPageProps = {
  searchParams?: Promise<{
    notice?: string | string[];
  }>;
};

function pickQueryValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function AdminInsightsContentSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-[24px] border border-white/70 bg-slate-100/80"
          />
        ))}
      </div>

      <div className="h-32 animate-pulse rounded-[24px] border border-white/70 bg-slate-100/80" />

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-48 animate-pulse rounded-[24px] border border-white/70 bg-slate-100/80"
          />
        ))}
      </div>
    </div>
  );
}

export async function AdminInsightsNotice({
  searchParamsPromise,
}: {
  searchParamsPromise?: AdminInsightsPageProps["searchParams"];
}) {
  const params = searchParamsPromise ? await searchParamsPromise : undefined;
  const notice = pickQueryValue(params?.notice) ?? null;

  if (!notice) {
    return null;
  }

  return (
    <StatusCallout tone="success" title="操作结果">
      {notice}
    </StatusCallout>
  );
}

export async function AdminInsightsContent({
  insightsPromise,
}: {
  insightsPromise: Promise<AdminInsightsData>;
}) {
  const insights = await insightsPromise;

  return (
    <>
      <AdminInsightsOverview
        overview={insights.overview}
        anomalyDistribution={insights.anomalyDistribution}
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-950">优先关注成员</h2>
          <p className="text-sm text-slate-500">按风险高到低排序</p>
        </div>
        {insights.memberCards.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/80 px-6 py-8 text-sm text-slate-500">
            今天还没有需要优先处理的成员。
          </div>
        ) : (
          <div className="space-y-4">
            {insights.memberCards.map((card) => (
              <AdminInsightMemberCard key={card.userId} card={card} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default function AdminInsightsPage({
  searchParams,
}: AdminInsightsPageProps = {}) {
  const insightsPromise = getCachedAdminInsightsData({
    todaySaleDate: getTodaySaleDateValue(),
  });

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="管理员功能"
        title="经营诊断中心"
        description="这里优先回答今天谁最值得关注，以及管理员下一步该调目标还是先发提醒。"
        actions={
          <Link
            href="/admin/sales?scope=today"
            className="inline-flex h-11 items-center justify-center rounded-[18px] bg-slate-950 px-4 text-sm font-semibold text-white transition duration-200 hover:bg-slate-800"
          >
            查看今日审核队列
          </Link>
        }
      />

      <Suspense fallback={null}>
        <AdminInsightsNotice searchParamsPromise={searchParams} />
      </Suspense>

      <Suspense fallback={<AdminInsightsContentSkeleton />}>
        <AdminInsightsContent insightsPromise={insightsPromise} />
      </Suspense>
    </section>
  );
}
