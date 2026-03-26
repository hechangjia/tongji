import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessMemberArea } from "@/lib/permissions";
import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusCallout } from "@/components/status-callout";
import { SalesEntryForm } from "@/components/sales-entry-form";
import {
  buildSalesEntryDefaults,
  getSalesRecordForUserOnDate,
  getTodaySaleDateValue,
  saleDateToValue,
} from "@/server/services/sales-service";

export default async function EntryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fentry");
  }

  if (!canAccessMemberArea(session.user)) {
    redirect("/login?callbackUrl=%2Fentry");
  }

  const saleDate = getTodaySaleDateValue();
  const currentRecord = await getSalesRecordForUserOnDate(session.user.id, saleDate);
  const initialValues = buildSalesEntryDefaults(
    currentRecord
      ? {
          saleDate: saleDateToValue(currentRecord.saleDate),
          count40: currentRecord.count40,
          count60: currentRecord.count60,
          remark: currentRecord.remark ?? undefined,
        }
      : {
          saleDate,
        },
  );
  const todayTotal =
    Number(initialValues.count40 || "0") + Number(initialValues.count60 || "0");

  return (
    <AppShell
      role={session.user.role}
      userName={session.user.name ?? session.user.username}
      currentPath="/entry"
    >
      <div className="space-y-6">
        <PageHeader
          eyebrow="每日行动面板"
          title="今日录入"
          description="每位成员每天只保留一条记录，再次提交会直接覆盖当天数据。把当天结果录准，比事后补录更重要。"
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <MetricCard label="今日日期" value={initialValues.saleDate} />
            <MetricCard
              label="当前总数"
              value={todayTotal}
              hint={currentRecord ? "已读取当天已保存数据" : "今天还没有保存记录"}
              tone="dark"
            />
            <MetricCard
              label="录入状态"
              value={currentRecord ? "待更新" : "待创建"}
              hint="保存后会立即同步到榜单和结算数据里"
              tone="accent"
            />
          </div>
        </PageHeader>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <section className="space-y-4">
            <SalesEntryForm
              initialValues={initialValues}
              hasExistingRecord={Boolean(currentRecord)}
            />
          </section>

          <aside className="space-y-4">
            <StatusCallout tone="info" title="录入说明">
              <ul className="space-y-2">
                <li>数量必须为大于等于 0 的整数。</li>
                <li>如果当天已录入，再次保存会更新当天数据。</li>
                <li>备注选填，建议记录渠道或特殊情况，方便后续复核。</li>
              </ul>
            </StatusCallout>

            <StatusCallout tone="warning" title="当日修改规则">
              榜单和结算都依赖当天录入数据。若当天数据有误，建议尽快改正，避免后续复核时再回滚。
            </StatusCallout>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
