import Link from "next/link";
import { AdminInsightMemberCard } from "@/components/admin/admin-insight-member-card";
import { AdminInsightsOverview } from "@/components/admin/admin-insights-overview";
import { PageHeader } from "@/components/page-header";
import { StatusCallout } from "@/components/status-callout";
import { getAdminInsightsData } from "@/server/services/admin-insights-service";

type AdminInsightsPageProps = {
  searchParams?: Promise<{
    notice?: string | string[];
  }>;
};

function pickQueryValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminInsightsPage({
  searchParams,
}: AdminInsightsPageProps = {}) {
  const params = searchParams ? await searchParams : undefined;
  const notice = pickQueryValue(params?.notice) ?? null;
  const insights = await getAdminInsightsData({});

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

        {notice ? (
          <StatusCallout tone="success" title="操作结果">
            {notice}
          </StatusCallout>
        ) : null}

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
      </section>
  );
}
