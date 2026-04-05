"use client";

import type { RefObject } from "react";
import { StatusCallout } from "@/components/status-callout";
import type { SalesEntryFormState } from "@/app/(member)/entry/form-state";
import type { SalesEntryDefaults } from "@/server/services/sales-service";
import { Stepper } from "@/components/ui/stepper";
import { motion, AnimatePresence } from "framer-motion";

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      type="submit"
      className="inline-flex w-full items-center justify-center rounded-[24px] bg-slate-950 px-4 py-4 text-base font-semibold text-white shadow-[0_18px_36px_rgba(8,47,73,0.16)] transition duration-200 hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      disabled={pending}
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          保存中...
        </span>
      ) : "保存今日记录"}
    </motion.button>
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
    <motion.form
      layout
      action={formAction}
      className="space-y-8 rounded-[30px] border border-white/70 bg-white/84 p-6 shadow-[0_22px_60px_rgba(8,47,73,0.08)] backdrop-blur-xl sm:p-8"
    >
      <div className="space-y-4">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-cyan-700">
            Daily Entry
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">数据录入</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            数量必须为大于等于 0 的整数。建议每日完成工作后第一时间录入，确保榜单数据准确。
          </p>
        </div>

        <AnimatePresence mode="wait">
          {hasExistingRecord && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <StatusCallout tone="info" title="检测到当天已有记录">
                再次保存会直接覆盖当天数据，不会重复新增。
              </StatusCallout>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div layout className="space-y-2">
          <label htmlFor="saleDate" className="text-sm font-medium text-slate-700">
            业务日期
          </label>
          <input
            id="saleDate"
            name="saleDate"
            type="date"
            defaultValue={values.saleDate}
            ref={saleDateInputRef}
            className="w-full h-[58px] rounded-[24px] border border-slate-200 bg-white/60 px-5 text-base outline-none transition duration-200 focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100"
          />
        </motion.div>

        <div className="hidden md:block" /> {/* Grid spacer */}

        <Stepper
          id="count40"
          name="count40"
          label="40 套餐数量"
          defaultValue={values.count40}
        />

        <Stepper
          id="count60"
          name="count60"
          label="60 套餐数量"
          defaultValue={values.count60}
        />

        <motion.div layout className="space-y-2 md:col-span-2">
          <label htmlFor="remark" className="text-sm font-medium text-slate-700">
            备注信息
          </label>
          <textarea
            id="remark"
            name="remark"
            rows={3}
            defaultValue={values.remark}
            className="w-full rounded-[24px] border border-slate-200 bg-white/60 px-5 py-4 text-base outline-none transition duration-200 focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100"
            placeholder="可选，记录渠道、点位或当天异常情况"
          />
        </motion.div>
      </div>

      <AnimatePresence>
        {status === "error" && message && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-[24px] overflow-hidden"
          >
            <StatusCallout tone="error" title="保存失败">
              <p role="alert">{message}</p>
            </StatusCallout>
          </motion.div>
        )}
      </AnimatePresence>

      <SubmitButton pending={pending} />
    </motion.form>
  );
}
