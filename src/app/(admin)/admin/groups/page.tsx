import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessAdmin, getDefaultRedirectPath } from "@/lib/permissions";
import { AppShell } from "@/components/app-shell";
import { GroupForm } from "@/components/admin/group-form";
import { GroupTable } from "@/components/admin/group-table";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusCallout } from "@/components/status-callout";
import {
  listGroupsForAdmin,
  listLeaderCandidates,
} from "@/server/services/group-service";

type AdminGroupsPageProps = {
  searchParams?: Promise<{
    notice?: string | string[];
  }>;
};

export default async function AdminGroupsPage({ searchParams }: AdminGroupsPageProps = {}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fadmin%2Fgroups");
  }

  if (!canAccessAdmin(session.user)) {
    redirect(getDefaultRedirectPath(session.user.role));
  }

  const params = searchParams ? await searchParams : undefined;
  const notice = typeof params?.notice === "string" ? params.notice : null;
  const [rows, leaderOptions] = await Promise.all([
    listGroupsForAdmin(),
    listLeaderCandidates(),
  ]);
  const assignedLeaderCount = rows.filter((row) => row.leaderUserId).length;

  return (
    <AppShell
      role={session.user.role}
      userName={session.user.name ?? session.user.username}
      currentPath="/admin/groups"
    >
      <section className="space-y-6">
        <PageHeader
          eyebrow="管理员功能"
          title="小组管理"
          description="在这里创建和维护业务小组，支持设置小组口号、备注，并可按需为小组指定组长。"
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard label="小组总数" value={rows.length} />
            <MetricCard label="已分配组长" value={assignedLeaderCount} tone="dark" />
            <MetricCard label="可选组长" value={leaderOptions.length} tone="accent" />
          </div>
        </PageHeader>

        {notice ? (
          <StatusCallout tone="success" title="操作完成">
            {notice}
          </StatusCallout>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(320px,360px)_minmax(0,1fr)]">
          <GroupForm submitLabel="新增小组" leaderOptions={leaderOptions} />
          <GroupTable rows={rows} leaderOptions={leaderOptions} />
        </div>
      </section>
    </AppShell>
  );
}
