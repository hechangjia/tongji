import { PageHeader } from "@/components/page-header";
import { SettlementFilterArea } from "@/components/admin/settlement-filter-area";
import { SettlementStatsPanel } from "@/components/admin/settlement-stats-panel";
import { SettlementTable, type SettlementRowData } from "@/components/admin/settlement-table";
import { Suspense } from "react";

// Mock Data fetching
async function getMockSettlementData() {
  // Simulate network
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  const mockData: SettlementRowData[] = [
    { userId: "1", userName: "张三", groupName: "东区销售组", count40: 10, count60: 5, amount: 450, status: "OK", isSettled: false },
    { userId: "2", userName: "李四", groupName: "东区销售组", count40: 0, count60: 12, amount: 600, status: "OK", isSettled: false },
    { userId: "3", userName: "王五", groupName: "西区推广组", count40: 8, count60: 2, amount: null, status: "MISSING_RULE", isSettled: false },
  ];

  const stats = {
    totalAmount: 1050,
    memberCount: 3,
    totalCount40: 18,
    totalCount60: 19,
    riskCount: 1,
  };

  return { data: mockData, stats };
}

export default async function SettlementsPage() {
  const { data, stats } = await getMockSettlementData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="佣金结算"
        description="一键结算团队佣金，查看成员销售明细与提成状态"
      />

      <SettlementFilterArea />
      
      <Suspense fallback={<div className="h-32 animate-pulse bg-slate-100 rounded-[24px]"></div>}>
        <SettlementStatsPanel stats={stats} />
      </Suspense>

      <Suspense fallback={<div className="h-64 animate-pulse bg-slate-100 rounded-[24px]"></div>}>
        <SettlementTable data={data} />
      </Suspense>
    </div>
  );
}
