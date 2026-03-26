import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessAdmin, getDefaultRedirectPath } from "@/lib/permissions";
import { AppShell } from "@/components/app-shell";
import { BannerForm } from "@/components/admin/banner-form";
import { BannerSettingsForm } from "@/components/admin/banner-settings-form";
import { BannerTable } from "@/components/admin/banner-table";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusCallout } from "@/components/status-callout";
import {
  getBannerSettings,
  listBannerQuotes,
} from "@/server/services/banner-service";

type BannersPageProps = {
  searchParams?: Promise<{
    notice?: string | string[];
  }>;
};

export default async function AdminBannersPage({
  searchParams,
}: BannersPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fadmin%2Fbanners");
  }

  if (!canAccessAdmin(session.user)) {
    redirect(getDefaultRedirectPath(session.user.role));
  }

  const params = searchParams ? await searchParams : undefined;
  const notice = typeof params?.notice === "string" ? params.notice : null;
  const [settings, rows] = await Promise.all([getBannerSettings(), listBannerQuotes()]);
  const activeCount = rows.filter((row) => row.status === "ACTIVE").length;

  return (
    <AppShell
      role={session.user.role}
      userName={session.user.name ?? session.user.username}
      currentPath="/admin/banners"
    >
      <section className="space-y-6">
        <PageHeader
          eyebrow="内容系统"
          title="横幅一言"
          description="管理登录后全站顶部展示的短文案。支持内容池随机显示，也支持多条内容自动轮播。"
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard label="文案总数" value={rows.length} />
            <MetricCard label="启用数量" value={activeCount} tone="dark" />
            <MetricCard
              label="当前模式"
              value={settings.displayMode === "ROTATE" ? "轮播" : "随机"}
              tone="accent"
            />
          </div>
        </PageHeader>

        {notice ? (
          <StatusCallout tone="success" title="操作完成">
            {notice}
          </StatusCallout>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(320px,360px)_minmax(0,1fr)]">
          <div className="space-y-6">
            <BannerForm />
            <BannerSettingsForm
              initialValues={{
                displayMode: settings.displayMode,
                isEnabled: settings.isEnabled,
              }}
            />
          </div>

          <BannerTable
            rows={rows.map((row) => ({
              id: row.id,
              content: row.content,
              author: row.author,
              sourceType: row.sourceType,
              status: row.status,
              createdAt: row.createdAt,
            }))}
          />
        </div>
      </section>
    </AppShell>
  );
}
