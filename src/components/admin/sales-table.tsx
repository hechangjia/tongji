"use client";

import * as React from "react";
import { EmptyState } from "@/components/empty-state";
import { BentoCard } from "@/components/ui/bento-card";
import { SlideOver } from "@/components/ui/slide-over";
import {
  reviewSalesRecordAction,
  updateSalesRecordAction,
} from "@/app/(admin)/admin/sales/actions";
import type { AdminTodaySalesRow } from "@/server/services/daily-rhythm-service";

const submittedAtFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  hour12: false,
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function formatSubmittedAt(value: Date | null) {
  if (!value) {
    return "未提交";
  }
  return submittedAtFormatter.format(value);
}

function getReviewStatusLabel(reviewStatus: AdminTodaySalesRow["reviewStatus"]) {
  switch (reviewStatus) {
    case "APPROVED":
      return "已通过";
    case "REJECTED":
      return "已驳回";
    case "PENDING":
      return "待审核";
  }
}

function getReviewStatusTone(reviewStatus: AdminTodaySalesRow["reviewStatus"]) {
  switch (reviewStatus) {
    case "APPROVED":
      return "bg-green-500/10 text-green-700";
    case "REJECTED":
      return "bg-rose-500/10 text-rose-700";
    case "PENDING":
      return "bg-amber-500/10 text-amber-600";
  }
}

function SalesEditDrawer({
  row,
  returnTo,
  onClose,
}: {
  row: AdminTodaySalesRow;
  returnTo: string;
  onClose: () => void;
}) {
  const approveSalesRecordAction = reviewSalesRecordAction.bind(null, "APPROVED");
  const rejectSalesRecordAction = reviewSalesRecordAction.bind(null, "REJECTED");

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-wrap gap-2">
        <span className="mono-accent font-semibold px-2 py-1 bg-maika-muted/10 rounded text-xs text-maika-ink">
          {row.saleDate}
        </span>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getReviewStatusTone(row.reviewStatus)}`}>
          {getReviewStatusLabel(row.reviewStatus)}
        </span>
        <span className="rounded-full bg-maika-accent-strong/10 px-3 py-1 text-xs font-semibold text-maika-accent-strong mono-accent">
          总计 {row.count40 + row.count60}
        </span>
      </div>

      <section className="space-y-3">
        <p className="eyebrow text-maika-ink">审核与状态流转</p>
        <div className="grid grid-cols-2 gap-3">
          <form action={approveSalesRecordAction} onSubmit={() => setTimeout(onClose, 100)}>
            <input type="hidden" name="id" value={row.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <button
              type="submit"
              disabled={row.reviewStatus === "APPROVED"}
              className="w-full rounded-[18px] bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-500/20 disabled:opacity-50"
            >
              直接通过
            </button>
          </form>

          <form action={rejectSalesRecordAction} onSubmit={() => setTimeout(onClose, 100)}>
            <input type="hidden" name="id" value={row.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <button
              type="submit"
              disabled={row.reviewStatus === "REJECTED"}
              className="w-full rounded-[18px] bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-500/20 disabled:opacity-50"
            >
              驳回重新录单
            </button>
          </form>
        </div>
      </section>

      <section className="space-y-3">
        <p className="eyebrow text-maika-ink">修改详细数据</p>
        <form action={updateSalesRecordAction} onSubmit={() => setTimeout(onClose, 100)} className="grid gap-4">
          <input type="hidden" name="id" value={row.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-maika-muted">40套餐开卡数</label>
              <input
                name="count40"
                type="number"
                min="0"
                step="1"
                defaultValue={row.count40}
                className="w-full rounded-[18px] border border-maika-muted/20 bg-white dark:bg-black/20 px-4 py-3 text-sm font-medium mono-accent outline-none focus:border-maika-accent-strong"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-maika-muted">60套餐开卡数</label>
              <input
                name="count60"
                type="number"
                min="0"
                step="1"
                defaultValue={row.count60}
                className="w-full rounded-[18px] border border-maika-muted/20 bg-white dark:bg-black/20 px-4 py-3 text-sm font-medium mono-accent outline-none focus:border-maika-accent-strong"
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-medium text-maika-muted">审核备注（如不符合规范等）</label>
            <input
              name="remark"
              type="text"
              defaultValue={row.remark ?? ""}
              placeholder="填写备注"
              className="w-full rounded-[18px] border border-maika-muted/20 bg-white dark:bg-black/20 px-4 py-3 text-sm outline-none focus:border-maika-accent-strong"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-[18px] bg-maika-ink px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 shadow-md"
          >
            保存并维持原状态
          </button>
        </form>
      </section>
    </div>
  );
}

export function SalesTable({
  rows,
  returnTo,
}: {
  rows: AdminTodaySalesRow[];
  returnTo: string;
}) {
  const [editingRow, setEditingRow] = React.useState<AdminTodaySalesRow | null>(null);

  if (rows.length === 0) {
    return (
      <EmptyState
        title="暂无销售记录"
        description="当前筛选条件下没有结果，建议清空关键词后再试，或等待成员提交今日记录。"
      />
    );
  }

  return (
    <>
      <BentoCard radius="lg" className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
          <thead>
            <tr className="border-b border-maika-muted/10 text-xs text-maika-muted uppercase tracking-[0.1em]">
              <th className="px-6 py-4 font-semibold">人员与日期</th>
              <th className="px-6 py-4 font-semibold">报单结构</th>
              <th className="px-6 py-4 font-semibold">记录状态</th>
              <th className="px-6 py-4 font-semibold text-right">管理</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-maika-muted/5">
            {rows.map((row) => (
              <tr key={row.id} className="align-middle text-maika-foreground transition hover:bg-maika-foreground/5">
                <td className="px-6 py-4">
                  <div className="font-semibold text-maika-ink mono-accent">{row.userName}</div>
                  <div className="text-xs text-maika-muted mt-1 mono-accent">{row.saleDate}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-4 mono-accent">
                    <span className="flex flex-col"><span className="text-[10px] text-maika-muted uppercase">Plan 40</span><span className="font-medium text-maika-ink">{row.count40}</span></span>
                    <span className="flex flex-col"><span className="text-[10px] text-maika-muted uppercase">Plan 60</span><span className="font-medium text-maika-ink">{row.count60}</span></span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col items-start gap-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${getReviewStatusTone(row.reviewStatus)}`}>
                      {getReviewStatusLabel(row.reviewStatus)}
                    </span>
                    <span className="text-xs text-maika-muted mt-1">提交于 <span className="mono-accent">{formatSubmittedAt(row.lastSubmittedAt)}</span></span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => setEditingRow(row)}
                    className="inline-flex items-center justify-center rounded-[14px] bg-maika-ink/5 hover:bg-maika-ink/10 px-4 py-2 text-xs font-semibold text-maika-ink transition"
                  >
                    审核详情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </BentoCard>

      <SlideOver
        open={editingRow !== null}
        onOpenChange={(open) => !open && setEditingRow(null)}
        title={editingRow ? `审核单据: ${editingRow.userName}` : ""}
        description={editingRow ? `提交时间: ${formatSubmittedAt(editingRow.lastSubmittedAt)}` : ""}
      >
        {editingRow && (
          <SalesEditDrawer 
            row={editingRow} 
            returnTo={returnTo}
            onClose={() => setEditingRow(null)}
          />
        )}
      </SlideOver>
    </>
  );
}
