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
        label="预估总金额"
        value={`¥${stats.totalAmount.toFixed(2)}`}
        hint="本期待结算"
        tone="accent"
      />
      <MetricCard
        label="涉及成员"
        value={stats.memberCount}
        hint="人"
      />
      <MetricCard
        label="总开卡量"
        value={stats.totalCount40 + stats.totalCount60}
        hint={`40G: ${stats.totalCount40} | 60G: ${stats.totalCount60}`}
      />
      <MetricCard
        label="规则风险"
        value={stats.riskCount}
        hint="缺失佣金规则"
        tone={stats.riskCount > 0 ? "dark" : "light"}
      />
    </div>
  );
}
