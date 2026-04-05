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
    noticeTone?: string | string[];
  }>;
};

export default async function AdminGroupsPage({ searchParams }: AdminGroupsPageProps = {}) {
  const params = searchParams ? await searchParams : undefined;
  const notice = typeof params?.notice === "string" ? params.notice : null;
  const noticeTone = params?.noticeTone === "error" ? "error" : "success";
  const [rows, leaderOptions] = await Promise.all([
    listGroupsForAdmin(),
    listLeaderCandidates(),
  ]);
  const assignedLeaderCount = rows.filter((row) => row.leaderUserId).length;

  return (
      <section className="space-y-6">
        <PageHeader
          eyebrow="管理员功能"
          title="小组管理"
          description="管理员只负责创建小组和任命组长；小组口号与备注改由组长在自己的工作台维护。"
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard label="小组总数" value={rows.length} />
            <MetricCard label="已分配组长" value={assignedLeaderCount} tone="dark" />
            <MetricCard label="可选组长人选" value={leaderOptions.length} tone="accent" />
          </div>
        </PageHeader>

        {notice ? (
          <StatusCallout tone={noticeTone} title={noticeTone === "error" ? "保存失败" : "操作完成"}>
            {notice}
          </StatusCallout>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(320px,360px)_minmax(0,1fr)]">
          <GroupForm submitLabel="新增小组" leaderOptions={leaderOptions} />
          <GroupTable rows={rows} leaderOptions={leaderOptions} />
        </div>
      </section>
  );
}
