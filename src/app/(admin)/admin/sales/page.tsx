import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminDailyReviewSummary } from "@/components/admin/admin-daily-review-summary";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { SalesTable } from "@/components/admin/sales-table";
import { StatusCallout } from "@/components/status-callout";
import {
  getTodaySaleDateValue,
  type AdminSalesFilters,
  type DateValue,
} from "@/server/services/sales-service";
import { getAdminSalesReviewData } from "@/server/services/daily-rhythm-service";

type AdminSalesPageProps = {
  searchParams?: Promise<{
    scope?: string | string[];
    keyword?: string | string[];
    date?: string | string[];
    notice?: string | string[];
  }>;
};

function pickQueryValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function isDateValue(value?: string): value is DateValue {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export default async function AdminSalesPage({
  searchParams,
}: AdminSalesPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const scope = pickQueryValue(params?.scope)?.trim() ?? "";

  if (scope && scope !== "today") {
    redirect("/admin/sales?scope=today");
  }

  const todaySaleDate = getTodaySaleDateValue();
  const requestedDate = pickQueryValue(params?.date)?.trim();
  const selectedDate: DateValue = isDateValue(requestedDate) ? requestedDate : todaySaleDate;
  const isTodayView = selectedDate === todaySaleDate;
  const filters: AdminSalesFilters = {
    keyword: pickQueryValue(params?.keyword)?.trim() ?? "",
    date: selectedDate,
  };
  const notice = pickQueryValue(params?.notice) ?? null;
  const { summary: dailySummary, rows } = await getAdminSalesReviewData({
    keyword: filters.keyword,
    todaySaleDate: selectedDate,
  });
  const keyword = filters.keyword ?? "";
  const returnTo = `/admin/sales?date=${encodeURIComponent(selectedDate)}&keyword=${encodeURIComponent(keyword)}`;
  const activeFilterCount = [filters.keyword, isTodayView ? "" : selectedDate].filter(Boolean).length;
  const pageDescription = isTodayView
    ? "默认展示今天的审核队列。你可以先看待审核概况，再直接在同一行完成数量修正、通过或驳回。"
    : `当前查看 ${selectedDate} 的销售记录。这里也支持继续审核历史补录，避免跨天后记录长期停留在待审核状态。`;

  return (
      <section className="space-y-6">
        <PageHeader
          eyebrow="管理员功能"
          title="销售记录管理"
          description={pageDescription}
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard label="结果条数" value={rows.length} />
            <MetricCard
              label={isTodayView ? "待审核" : "该日待审核"}
              value={dailySummary.pendingCount}
              tone="dark"
            />
            <MetricCard
              label="工作状态"
              value={rows.length > 0 ? "可直接审核" : "等待提交"}
              tone="accent"
            />
          </div>
        </PageHeader>

        {isTodayView ? (
          <AdminDailyReviewSummary summary={dailySummary} />
        ) : (
          <StatusCallout
            tone={dailySummary.pendingCount > 0 ? "warning" : "info"}
            title={`历史记录审核 · ${selectedDate}`}
          >
            当前正在查看 {selectedDate} 的销售记录。
            {dailySummary.pendingCount > 0
              ? ` 还有 ${dailySummary.pendingCount} 条记录待审核，可以直接在列表中处理。`
              : " 当前没有待审核记录，但仍可继续复核数量与备注。"}
          </StatusCallout>
        )}

        {notice ? (
          <StatusCallout tone="success" title="操作结果">
            {notice}
          </StatusCallout>
        ) : null}

        <form className="rounded-[26px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_50px_rgba(8,47,73,0.08)]">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-end">
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
            <div className="space-y-2">
              <label htmlFor="date" className="text-sm font-medium text-slate-700">
                日期
              </label>
              <input
                id="date"
                name="date"
                type="date"
                defaultValue={selectedDate}
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
  );
}
