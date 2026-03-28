import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessAdmin, getDefaultRedirectPath } from "@/lib/permissions";
import { AppShell } from "@/components/app-shell";
import { CommissionRuleForm } from "@/components/admin/commission-rule-form";
import { CommissionRuleTable } from "@/components/admin/commission-rule-table";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { getCommissionRules } from "@/server/services/commission-service";

export default async function CommissionRulesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fadmin%2Fcommission-rules");
  }

  if (!canAccessAdmin(session.user)) {
    redirect(getDefaultRedirectPath(session.user.role));
  }

  const [members, rules] = await Promise.all([
    db.user.findMany({
      orderBy: [{ role: "desc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        username: true,
      },
    }),
    getCommissionRules(),
  ]);
  const longRunningRules = rules.filter((rule) => rule.effectiveEnd === null).length;

  return (
    <AppShell
      role={session.user.role}
      userName={session.user.name ?? session.user.username}
      currentPath="/admin/commission-rules"
    >
      <section className="space-y-6">
        <PageHeader
          eyebrow="管理员功能"
          title="卡酬规则"
          description="为每位成员维护生效时间段内的 40 / 60 套餐卡酬单价。保存前务必确认生效区间不会和已有规则重叠。"
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard label="规则总数" value={rules.length} />
            <MetricCard label="成员数量" value={members.length} tone="dark" />
            <MetricCard label="长期规则" value={longRunningRules} tone="accent" />
          </div>
        </PageHeader>

        <div className="grid gap-6 xl:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
          <CommissionRuleForm
            members={members.map((member) => ({
              id: member.id,
              label: member.name || member.username,
            }))}
            submitLabel="保存规则"
          />
          <CommissionRuleTable rows={rules} />
        </div>
      </section>
    </AppShell>
  );
}
