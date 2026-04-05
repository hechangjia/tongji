"use client";

import type { RefObject } from "react";
import { StatusCallout } from "@/components/status-callout";
import type { SalesEntryFormState } from "@/app/(member)/entry/form-state";
import type { SalesEntryDefaults } from "@/server/services/sales-service";

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      className="inline-flex w-full items-center justify-center rounded-[18px] bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(8,47,73,0.16)] transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      disabled={pending}
    >
      {pending ? "保存中..." : "保存今日记录"}
    </button>
  );
}

export function SalesEntryForm({
  values,
  status,
  message,
  formAction,
  pending,
  hasExistingRecord = false,
  saleDateInputRef,
}: {
  values: SalesEntryDefaults;
  status: SalesEntryFormState["status"];
  message: string | null;
  formAction: (payload: FormData) => void;
  pending: boolean;
  hasExistingRecord?: boolean;
  saleDateInputRef?: RefObject<HTMLInputElement | null>;
}) {
  return (
    <form
      action={formAction}
      className="space-y-6 rounded-[24px] border border-white/70 bg-white/84 p-6 shadow-[0_22px_60px_rgba(8,47,73,0.08)] backdrop-blur-xl sm:p-7"
    >
      <div className="space-y-3">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-cyan-700">
            Daily Entry
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">录入表单</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            数量必须为大于等于 0 的整数，备注可以记录渠道、点位或当天异常情况。
          </p>
        </div>

        {hasExistingRecord ? (
          <StatusCallout tone="info" title="检测到当天已有记录">
            再次保存会直接覆盖当天数据，不会重复新增。
          </StatusCallout>
        ) : null}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="saleDate" className="text-sm font-medium text-slate-700">
            日期
          </label>
          <input
            id="saleDate"
            name="saleDate"
            type="date"
            defaultValue={values.saleDate}
            ref={saleDateInputRef}
            className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="count40" className="text-sm font-medium text-slate-700">
            40 套餐
          </label>
          <input
            id="count40"
            name="count40"
            type="number"
            min="0"
            defaultValue={values.count40}
            className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="count60" className="text-sm font-medium text-slate-700">
            60 套餐
          </label>
          <input
            id="count60"
            name="count60"
            type="number"
            min="0"
            defaultValue={values.count60}
            className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="remark" className="text-sm font-medium text-slate-700">
            备注
          </label>
          <textarea
            id="remark"
            name="remark"
            rows={4}
            defaultValue={values.remark}
            className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
            placeholder="可选，记录渠道或当天特殊情况"
          />
        </div>
      </div>

      {status === "error" && message ? (
        <StatusCallout tone="error" title="保存失败">
          <p role="alert">{message}</p>
        </StatusCallout>
      ) : null}

      <SubmitButton pending={pending} />
    </form>
  );
}
