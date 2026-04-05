"use client";

import { MetricCard } from "@/components/metric-card";

interface SettlementStatsPanelProps {
  stats: {
    totalAmount: number;
    memberCount: number;
    totalCount40: number;
    totalCount60: number;
    riskCount: number;
  };
}

export function SettlementStatsPanel({ stats }: SettlementStatsPanelProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <MetricCard
        title="预估总金额"
        value={`¥${stats.totalAmount.toFixed(2)}`}
        trend={{ value: 0, label: "本期待结算" }}
        className="bg-cyan-50/50 border-cyan-100 dark:bg-cyan-950/20 dark:border-cyan-900/50"
      />
      <MetricCard
        title="涉及成员"
        value={stats.memberCount}
        trend={{ value: 0, label: "人" }}
      />
      <MetricCard
        title="总开卡量"
        value={stats.totalCount40 + stats.totalCount60}
        trend={{ value: 0, label: `40G: ${stats.totalCount40} | 60G: ${stats.totalCount60}` }}
      />
      <MetricCard
        title="规则风险"
        value={stats.riskCount}
        trend={{ value: 0, label: "缺失佣金规则" }}
        className={stats.riskCount > 0 ? "border-red-200 bg-red-50/50 dark:bg-red-900/20 dark:border-red-800/50" : ""}
      />
    </div>
  );
}
