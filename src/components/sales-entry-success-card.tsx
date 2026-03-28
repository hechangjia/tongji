"use client";

import Link from "next/link";
import type { SalesEntrySummary } from "@/app/(member)/entry/form-state";
import { StatusCallout } from "@/components/status-callout";

function formatSavedAt(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function SalesEntrySuccessCard({
  summary,
  onContinue,
}: {
  summary: SalesEntrySummary;
  onContinue?: () => void;
}) {
  return (
    <StatusCallout
      tone="success"
      title={summary.isUpdate ? "今日记录已更新" : "今日记录已保存"}
    >
      <div className="space-y-4">
        <p>
          {summary.isUpdate
            ? "系统已用本次内容覆盖你今天原有记录。"
            : "以下为本次提交内容。"}
        </p>

        {summary.recoveredFromError ? (
          <p className="font-medium">刚才的提交未成功，这次已经保存完成。</p>
        ) : null}

        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
              销售日期
            </dt>
            <dd className="mt-1">{summary.saleDate}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
              40 套餐数量
            </dt>
            <dd className="mt-1">{summary.count40}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
              60 套餐数量
            </dt>
            <dd className="mt-1">{summary.count60}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
              总数
            </dt>
            <dd className="mt-1">{summary.total}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
              备注摘要
            </dt>
            <dd className="mt-1 line-clamp-2">{summary.remark || "无备注"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
              保存时间
            </dt>
            <dd className="mt-1">{formatSavedAt(summary.savedAtIso)}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/records"
            className="inline-flex h-11 items-center justify-center rounded-[18px] bg-emerald-900 px-4 text-sm font-semibold text-white transition duration-200 hover:bg-emerald-800"
          >
            查看我的记录
          </Link>
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex h-11 items-center justify-center rounded-[18px] border border-emerald-300 bg-white/70 px-4 text-sm font-semibold text-emerald-900 transition duration-200 hover:bg-white"
          >
            继续调整今天记录
          </button>
        </div>
      </div>
    </StatusCallout>
  );
}
