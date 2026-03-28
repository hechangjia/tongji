import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessAdmin, getDefaultRedirectPath } from "@/lib/permissions";
import { AppShell } from "@/components/app-shell";
import { CodeAssignmentPanel } from "@/components/admin/code-assignment-panel";
import { CodeImportCard } from "@/components/admin/code-import-card";
import { CodeInventoryTable } from "@/components/admin/code-inventory-table";
import { ProspectImportCard } from "@/components/admin/prospect-import-card";
import { ProspectLeadTable } from "@/components/admin/prospect-lead-table";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusCallout } from "@/components/status-callout";
import { getAdminCodesDashboardData } from "@/server/services/admin-code-service";

type AdminCodesPageProps = {
  searchParams?: Promise<{
    notice?: string | string[];
    noticeTone?: string | string[];
  }>;
};

export default async function AdminCodesPage({ searchParams }: AdminCodesPageProps = {}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fadmin%2Fcodes");
  }

  if (!canAccessAdmin(session.user)) {
    redirect(getDefaultRedirectPath(session.user.role));
  }

  const params = searchParams ? await searchParams : undefined;
  const notice = typeof params?.notice === "string" ? params.notice : null;
  const noticeTone = params?.noticeTone === "error" ? "error" : "success";
  const { overview, assigneeOptions, codeRows, prospectRows } = await getAdminCodesDashboardData();

  return (
    <AppShell
      role={session.user.role}
      userName={session.user.name ?? session.user.username}
      currentPath="/admin/codes"
    >
      <section className="space-y-6">
        <PageHeader
          eyebrow="管理员功能"
          title="识别码与线索"
          description="这一页先补齐管理员侧闭环：导入识别码、导入新生 QQ、查看库存和线索池，并按成员批量分发。"
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="识别码库存" value={overview.totalCodes} />
            <MetricCard label="待分发识别码" value={overview.unassignedCodes} tone="dark" />
            <MetricCard label="待分配线索" value={overview.unassignedProspects} tone="accent" />
            <MetricCard label="已分配线索" value={overview.assignedProspects} />
          </div>
        </PageHeader>

        {notice ? (
          <StatusCallout
            tone={noticeTone}
            title={noticeTone === "error" ? "操作失败" : "操作完成"}
          >
            {notice}
          </StatusCallout>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-2">
          <CodeImportCard />
          <ProspectImportCard />
        </div>

        <CodeAssignmentPanel
          assigneeOptions={assigneeOptions}
          codeRows={codeRows}
          prospectRows={prospectRows}
        />

        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-slate-950">识别码库存</h2>
            <p className="text-sm leading-7 text-slate-600">
              当前先展示导入来源、库存状态和最新持有人。成员侧的预发放和售出流转将在后续阶段接入。
            </p>
          </div>
          <CodeInventoryTable rows={codeRows} />
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-slate-950">新生线索池</h2>
            <p className="text-sm leading-7 text-slate-600">
              当前按成员分配；系统会同步记录分配当下的小组，为下一轮“按组分配”保留兼容位。
            </p>
          </div>
          <ProspectLeadTable rows={prospectRows} />
        </div>
      </section>
    </AppShell>
  );
}
