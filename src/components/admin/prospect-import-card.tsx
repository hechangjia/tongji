"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { importProspectLeadsAction } from "@/app/(admin)/admin/codes/actions";
import type { CodesImportFormState } from "@/app/(admin)/admin/codes/form-state";
import { StatusCallout } from "@/components/status-callout";

const initialState: CodesImportFormState = {
  status: "idle",
  message: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="inline-flex h-12 items-center justify-center rounded-[18px] border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:bg-slate-100"
      disabled={pending}
    >
      {pending ? "导入中..." : "导入新生 QQ"}
    </button>
  );
}

export function ProspectImportCard() {
  const [state, formAction] = useActionState<CodesImportFormState, FormData>(
    importProspectLeadsAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-[28px] border border-white/70 bg-white/84 p-6 shadow-[0_22px_60px_rgba(8,47,73,0.08)]"
    >
      <div className="space-y-2">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-cyan-700">
          Freshman Leads
        </p>
        <h2 className="text-2xl font-semibold text-slate-900">新生 QQ 导入</h2>
        <p className="text-sm leading-7 text-slate-600">
          这轮最少需要两列：`QQ号` 和 `专业`。系统按 QQ 号去重，已存在线索会直接跳过。
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="prospect-file" className="text-sm font-medium text-slate-700">
          上传文件
        </label>
        <input
          id="prospect-file"
          name="file"
          type="file"
          accept=".xlsx,.csv"
          className="block w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-[14px] file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
        />
      </div>

      {state.message ? (
        <StatusCallout
          tone={state.status === "error" ? "error" : "success"}
          title={state.status === "error" ? "导入失败" : "导入完成"}
        >
          <p role={state.status === "error" ? "alert" : "status"}>{state.message}</p>
        </StatusCallout>
      ) : null}

      <SubmitButton />
    </form>
  );
}
