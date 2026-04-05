"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { StatusCallout } from "@/components/status-callout";
import { createCommissionRuleAction } from "@/app/(admin)/admin/commission-rules/actions";
import type { CommissionRuleFormState } from "@/app/(admin)/admin/commission-rules/form-state";

type MemberOption = {
  id: string;
  label: string;
};

const initialState: CommissionRuleFormState = {
  status: "idle",
  message: null,
  values: {
    userId: "",
    price40: "",
    price60: "",
    effectiveStart: "",
    effectiveEnd: "",
  },
};

function SubmitButton({ submitLabel }: { submitLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="inline-flex h-12 items-center justify-center rounded-[18px] bg-slate-950 px-5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      disabled={pending}
    >
      {pending ? "保存中..." : submitLabel}
    </button>
  );
}

export function CommissionRuleForm({
  members,
  submitLabel,
}: {
  members: MemberOption[];
  submitLabel: string;
}) {
  const [state, formAction] = useActionState<CommissionRuleFormState, FormData>(
    createCommissionRuleAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-[24px] border border-white/70 bg-white/84 p-6 shadow-[0_22px_60px_rgba(8,47,73,0.08)]"
    >
      <div className="space-y-2">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-cyan-700">
          新增规则
        </p>
        <h2 className="text-2xl font-semibold text-slate-900">配置卡酬规则</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="userId" className="text-sm font-medium text-slate-700">
            成员
          </label>
          <select
            id="userId"
            name="userId"
            defaultValue={state.values.userId}
            className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
          >
            <option value="">请选择成员</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="price40" className="text-sm font-medium text-slate-700">
            40 套餐卡酬
          </label>
          <input
            id="price40"
            name="price40"
            type="number"
            min="0"
            step="0.01"
            defaultValue={state.values.price40}
            className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="price60" className="text-sm font-medium text-slate-700">
            60 套餐卡酬
          </label>
          <input
            id="price60"
            name="price60"
            type="number"
            min="0"
            step="0.01"
            defaultValue={state.values.price60}
            className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="effectiveStart"
            className="text-sm font-medium text-slate-700"
          >
            生效开始
          </label>
          <input
            id="effectiveStart"
            name="effectiveStart"
            type="date"
            defaultValue={state.values.effectiveStart}
            className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="effectiveEnd" className="text-sm font-medium text-slate-700">
            生效结束（可选）
          </label>
          <input
            id="effectiveEnd"
            name="effectiveEnd"
            type="date"
            defaultValue={state.values.effectiveEnd}
            className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
          />
        </div>
      </div>

      {state.message ? (
        <StatusCallout
          tone={state.status === "error" ? "error" : "success"}
          title={state.status === "error" ? "保存失败" : "规则已保存"}
        >
          <p role={state.status === "error" ? "alert" : "status"}>{state.message}</p>
        </StatusCallout>
      ) : null}

      <SubmitButton submitLabel={submitLabel} />
    </form>
  );
}
