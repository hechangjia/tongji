import { getCachedSession } from "@/lib/auth-request-cache";
import { MetricCard } from "@/components/metric-card";
import { MyRecordsTable } from "@/components/my-records-table";
import { PageHeader } from "@/components/page-header";
import {
  getCachedMemberIdentifierSales,
  getCachedMemberRecords,
} from "@/server/services/member-records-cache";

export default async function RecordsPage() {
  const session = (await getCachedSession())!;

  const [records, identifierSales] = await Promise.all([
    getCachedMemberRecords(session.user.id),
    getCachedMemberIdentifierSales(session.user.id),
  ]);
  const totalSales = records.reduce(
    (sum, record) => sum + record.count40 + record.count60,
    0,
  );

  return (
    <section className="space-y-6">
        <PageHeader
          eyebrow="成员记录"
          title="我的记录"
          description="展示你最近的销售记录，默认按日期从近到远排序。每一条记录都能帮助你快速回看最近的销售节奏。"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard label="记录条数" value={records.length} />
            <MetricCard label="累计销量" value={totalSales} tone="dark" />
            <MetricCard
              label="最近状态"
              value={records.length > 0 ? "持续更新中" : "暂未开始"}
              tone="accent"
            />
          </div>
        </PageHeader>

        <MyRecordsTable
          rows={records}
          identifierSales={identifierSales.map((sale) => ({
            id: sale.id,
            code: sale.code.code,
            qqNumber: sale.prospectLead.qqNumber,
            major: sale.prospectLead.major,
            planType: sale.planType,
            sourceLabel:
              sale.prospectLead.sourceType === "MEMBER_MANUAL" ? "成员手填" : "管理员分配线索",
            saleDate: sale.saleDate,
          }))}
          emptyText="暂无历史记录，保存今日录入后会在这里看到完整回顾。"
        />
      </section>
  );
}
