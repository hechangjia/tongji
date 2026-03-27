import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessAdmin, getDefaultRedirectPath } from "@/lib/permissions";
import { AdminDailyReviewSummary } from "@/components/admin/admin-daily-review-summary";
import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { SalesTable } from "@/components/admin/sales-table";
import { StatusCallout } from "@/components/status-callout";
import { type AdminSalesFilters } from "@/server/services/sales-service";
import { getAdminSalesReviewData } from "@/server/services/daily-rhythm-service";

type AdminSalesPageProps = {
  searchParams?: Promise<{
    scope?: string | string[];
    keyword?: string | string[];
    notice?: string | string[];
  }>;
};

function pickQueryValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminSalesPage({
  searchParams,
}: AdminSalesPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fadmin%2Fsales%3Fscope%3Dtoday");
  }

  if (!canAccessAdmin(session.user)) {
    redirect(getDefaultRedirectPath(session.user.role));
  }

  const params = searchParams ? await searchParams : undefined;
  const scope = pickQueryValue(params?.scope)?.trim() || "today";

  if (scope !== "today") {
    redirect("/admin/sales?scope=today");
  }

  const filters: AdminSalesFilters = {
    keyword: pickQueryValue(params?.keyword)?.trim() ?? "",
  };
  const notice = pickQueryValue(params?.notice) ?? null;
  const { summary: dailySummary, rows } = await getAdminSalesReviewData({
    keyword: filters.keyword,
  });
  const keyword = filters.keyword ?? "";
  const returnTo = `/admin/sales?scope=today&keyword=${encodeURIComponent(keyword)}`;
  const activeFilterCount = [filters.keyword].filter(Boolean).length;

  return (
    <AppShell
      role={session.user.role}
      userName={session.user.name ?? session.user.username}
      currentPath="/admin/sales"
    >
      <section className="space-y-6">
        <PageHeader
          eyebrow="管理员功能"
          title="销售记录管理"
          description="默认展示今天的审核队列。你可以先看待审核概况，再直接在同一行完成数量修正、通过或驳回。"
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard label="结果条数" value={rows.length} />
            <MetricCard label="待审核" value={dailySummary.pendingCount} tone="dark" />
            <MetricCard
              label="工作状态"
              value={rows.length > 0 ? "可直接审核" : "等待提交"}
              tone="accent"
            />
          </div>
        </PageHeader>

        <AdminDailyReviewSummary summary={dailySummary} />

        {notice ? (
          <StatusCallout tone="success" title="操作结果">
            {notice}
          </StatusCallout>
        ) : null}

        <form className="rounded-[26px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_50px_rgba(8,47,73,0.08)]">
          <input type="hidden" name="scope" value="today" />
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div className="space-y-2">
              <label htmlFor="keyword" className="text-sm font-medium text-slate-700">
                成员关键词
              </label>
              <input
                id="keyword"
                name="keyword"
                type="text"
                defaultValue={filters.keyword}
                placeholder="按姓名或账号筛选"
                className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center rounded-[18px] bg-slate-950 px-5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-800"
              >
                查询
              </button>
              {activeFilterCount > 0 ? (
                <Link
                  href="/admin/sales?scope=today"
                  className="inline-flex h-12 items-center justify-center rounded-[18px] border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:border-cyan-300 hover:bg-cyan-50"
                >
                  清空
                </Link>
              ) : null}
            </div>
          </div>
        </form>

        <SalesTable rows={rows} returnTo={returnTo} />
      </section>
    </AppShell>
  );
}
