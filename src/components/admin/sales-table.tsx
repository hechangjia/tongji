import "server-only";

import { EmptyState } from "@/components/empty-state";
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

  const unreachableReviewStatus: never = reviewStatus;
  throw new Error(`Unhandled review status label: ${unreachableReviewStatus}`);
}

function getReviewStatusTone(reviewStatus: AdminTodaySalesRow["reviewStatus"]) {
  switch (reviewStatus) {
    case "APPROVED":
      return "bg-emerald-100 text-emerald-900";
    case "REJECTED":
      return "bg-rose-100 text-rose-900";
    case "PENDING":
      return "bg-amber-100 text-amber-900";
  }

  const unreachableReviewStatus: never = reviewStatus;
  throw new Error(`Unhandled review status tone: ${unreachableReviewStatus}`);
}

export function SalesTable({
  rows,
  returnTo,
}: {
  rows: AdminTodaySalesRow[];
  returnTo: string;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="暂无销售记录"
        description="当前筛选条件下没有结果，建议清空关键词后再试，或等待成员提交今日记录。"
      />
    );
  }

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <form
          key={row.id}
          action={updateSalesRecordAction}
          className="space-y-4 rounded-[28px] border border-white/70 bg-white/84 p-5 shadow-[0_20px_52px_rgba(8,47,73,0.08)]"
        >
          <input type="hidden" name="id" value={row.id} />
          <input type="hidden" name="returnTo" value={returnTo} />

          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-semibold text-slate-900">{row.userName}</p>
              <p className="text-xs text-slate-500">{row.saleDate}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-900">
                当前总数 {row.count40 + row.count60}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {row.remark ? "含备注" : "备注待补充"}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${getReviewStatusTone(row.reviewStatus)}`}
              >
                {getReviewStatusLabel(row.reviewStatus)}
              </span>
              {row.isTemporaryTop3 ? (
                <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-900">
                  临时前三
                </span>
              ) : null}
              {row.isFormalTop3 ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
                  正式前三
                </span>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[120px_120px_minmax(0,1fr)_minmax(0,220px)_auto] xl:items-end">
            <div className="space-y-1">
              <label
                htmlFor={`count40-${row.id}`}
                className="text-xs font-medium text-slate-500"
              >
                40 套餐
              </label>
              <input
                id={`count40-${row.id}`}
                name="count40"
                type="number"
                min="0"
                defaultValue={row.count40}
                className="w-full rounded-[16px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor={`count60-${row.id}`}
                className="text-xs font-medium text-slate-500"
              >
                60 套餐
              </label>
              <input
                id={`count60-${row.id}`}
                name="count60"
                type="number"
                min="0"
                defaultValue={row.count60}
                className="w-full rounded-[16px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
              />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500">最后提交时间</span>
              <p className="rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {formatSubmittedAt(row.lastSubmittedAt)}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center rounded-[16px] bg-slate-950 px-5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-800"
              >
                保存
              </button>
              <button
                type="submit"
                formAction={reviewSalesRecordAction}
                name="decision"
                value="APPROVED"
                className="inline-flex h-12 items-center justify-center rounded-[16px] bg-emerald-600 px-5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-500"
              >
                通过
              </button>
              <button
                type="submit"
                formAction={reviewSalesRecordAction}
                name="decision"
                value="REJECTED"
                className="inline-flex h-12 items-center justify-center rounded-[16px] bg-rose-600 px-5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-rose-500"
              >
                驳回
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label
                htmlFor={`reviewNote-${row.id}`}
                className="text-xs font-medium text-slate-500"
              >
                驳回备注（选填）
              </label>
              <textarea
                id={`reviewNote-${row.id}`}
                name="reviewNote"
                defaultValue={row.reviewStatus === "REJECTED" ? row.reviewNote ?? "" : ""}
                rows={3}
                className="w-full rounded-[16px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor={`remark-${row.id}`}
                className="text-xs font-medium text-slate-500"
              >
                备注
              </label>
              <input
                id={`remark-${row.id}`}
                name="remark"
                type="text"
                defaultValue={row.remark ?? ""}
                className="w-full rounded-[16px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
              />
            </div>
          </div>
        </form>
      ))}
    </div>
  );
}
