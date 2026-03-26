import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessAdmin, getDefaultRedirectPath } from "@/lib/permissions";
import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { SalesTable } from "@/components/admin/sales-table";
import { StatusCallout } from "@/components/status-callout";
import {
  getAdminSalesRows,
  type AdminSalesFilters,
} from "@/server/services/sales-service";

type AdminSalesPageProps = {
  searchParams?: Promise<{
    keyword?: string | string[];
    date?: string | string[];
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
    redirect("/login?callbackUrl=%2Fadmin%2Fsales");
  }

  if (!canAccessAdmin(session.user)) {
    redirect(getDefaultRedirectPath(session.user.role));
  }

  const params = searchParams ? await searchParams : undefined;
  const filters: AdminSalesFilters = {
    keyword: pickQueryValue(params?.keyword)?.trim() ?? "",
    date: pickQueryValue(params?.date)?.trim() ?? "",
  };
  const notice = pickQueryValue(params?.notice) ?? null;
  const rows = await getAdminSalesRows(filters);
  const keyword = filters.keyword ?? "";
  const date = filters.date ?? "";
  const returnTo = `/admin/sales?keyword=${encodeURIComponent(keyword)}&date=${encodeURIComponent(date)}`;
  const activeFilterCount = [filters.keyword, filters.date].filter(Boolean).length;

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
          description="支持按成员关键词或单日筛选，并直接修改销售数量与备注。筛选条件越明确，复核效率越高。"
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard label="结果条数" value={rows.length} />
            <MetricCard label="当前筛选" value={activeFilterCount} tone="dark" />
            <MetricCard
              label="工作状态"
              value={rows.length > 0 ? "可直接修正" : "等待筛选"}
              tone="accent"
            />
          </div>
        </PageHeader>

        {notice ? (
          <StatusCallout tone="success" title="记录已更新">
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
                defaultValue={filters.date}
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
                  href="/admin/sales"
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
