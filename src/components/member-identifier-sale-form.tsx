"use client";

import { useState } from "react";
import { StatusCallout } from "@/components/status-callout";
import type {
  IdentifierSaleFormState,
} from "@/app/(member)/entry/form-state";
import type { MemberIdentifierWorkspace } from "@/server/services/member-identifier-sale-service";

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      className="inline-flex w-full items-center justify-center rounded-[20px] bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(8,47,73,0.16)] transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      disabled={pending}
    >
      {pending ? "保存中..." : "保存识别码成交"}
    </button>
  );
}

export function MemberIdentifierSaleForm({
  state,
  workspace,
  formAction,
  pending,
}: {
  state: IdentifierSaleFormState;
  workspace: MemberIdentifierWorkspace;
  formAction: (payload: FormData) => void;
  pending: boolean;
}) {
  const [sourceMode, setSourceMode] = useState(state.values.sourceMode);

  return (
    <form
      action={formAction}
      className="space-y-6 rounded-[28px] border border-white/70 bg-white/84 p-6 shadow-[0_22px_60px_rgba(8,47,73,0.08)] backdrop-blur-xl sm:p-7"
    >
      <div className="space-y-3">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-cyan-700">
            Identifier Sale
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">识别码成交</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            先选择自己名下识别码，再选择套餐类型和新生信息来源。新流程会自动同步旧汇总，不需要再手工补一天总数。
          </p>
        </div>

        {state.status === "success" && state.summary ? (
          <StatusCallout tone="success" title="成交已保存">
            <p role="status">
              已保存 {state.summary.planType === "PLAN_40" ? "40" : "60"} 套餐成交，来源：{state.summary.sourceLabel}
            </p>
          </StatusCallout>
        ) : null}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="identifier-codeId" className="text-sm font-medium text-slate-700">
            识别码
          </label>
          <select
            id="identifier-codeId"
            name="codeId"
            defaultValue={state.values.codeId}
            className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
          >
            <option value="">请选择识别码</option>
            {workspace.codeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.code}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="identifier-planType" className="text-sm font-medium text-slate-700">
            套餐类型
          </label>
          <select
            id="identifier-planType"
            name="planType"
            defaultValue={state.values.planType}
            className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
          >
            <option value="PLAN_40">40 套餐</option>
            <option value="PLAN_60">60 套餐</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="identifier-saleDate" className="text-sm font-medium text-slate-700">
            成交日期
          </label>
          <input
            id="identifier-saleDate"
            name="saleDate"
            type="date"
            defaultValue={state.values.saleDate}
            className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="identifier-sourceMode" className="text-sm font-medium text-slate-700">
            新生信息来源
          </label>
          <select
            id="identifier-sourceMode"
            name="sourceMode"
            defaultValue={state.values.sourceMode}
            onChange={(event) => setSourceMode(event.target.value as "ASSIGNED_LEAD" | "MANUAL_INPUT")}
            className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
          >
            <option value="ASSIGNED_LEAD">使用已分配线索</option>
            <option value="MANUAL_INPUT">手动填写 QQ / 专业</option>
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="identifier-prospectLeadId" className="text-sm font-medium text-slate-700">
            已分配线索
          </label>
          <select
            id="identifier-prospectLeadId"
            name="prospectLeadId"
            defaultValue={state.values.prospectLeadId}
            disabled={sourceMode !== "ASSIGNED_LEAD"}
            className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40 disabled:bg-slate-100"
          >
            <option value="">请选择线索</option>
            {workspace.leadOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.qqNumber} · {option.major} · {option.sourceLabel}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">如果当前没有可用线索，切换到“手动填写 QQ / 专业”。</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="identifier-qqNumber" className="text-sm font-medium text-slate-700">
            QQ 号
          </label>
          <input
            id="identifier-qqNumber"
            name="qqNumber"
            type="text"
            defaultValue={state.values.qqNumber}
            disabled={sourceMode !== "MANUAL_INPUT"}
            className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40 disabled:bg-slate-100"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="identifier-major" className="text-sm font-medium text-slate-700">
            专业
          </label>
          <input
            id="identifier-major"
            name="major"
            type="text"
            defaultValue={state.values.major}
            disabled={sourceMode !== "MANUAL_INPUT"}
            className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40 disabled:bg-slate-100"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="identifier-remark" className="text-sm font-medium text-slate-700">
            备注
          </label>
          <textarea
            id="identifier-remark"
            name="remark"
            rows={3}
            defaultValue={state.values.remark}
            className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
            placeholder="可选，记录来源、点位或特殊情况"
          />
        </div>
      </div>

      {state.status === "error" && state.message ? (
        <StatusCallout tone="error" title="保存失败">
          <p role="alert">{state.message}</p>
        </StatusCallout>
      ) : null}

      <SubmitButton pending={pending} />
    </form>
  );
}
