"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { importIdentifierCodesAction } from "@/app/(admin)/admin/codes/actions";
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
      className="inline-flex h-12 items-center justify-center rounded-[18px] bg-slate-950 px-5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      disabled={pending}
    >
      {pending ? "导入中..." : "导入识别码"}
    </button>
  );
}

export function CodeImportCard() {
  const [state, formAction] = useActionState<CodesImportFormState, FormData>(
    importIdentifierCodesAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-[24px] border border-white/70 bg-white/84 p-6 shadow-[0_22px_60px_rgba(8,47,73,0.08)]"
    >
      <div className="space-y-2">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-cyan-700">
          Identifier Codes
        </p>
        <h2 className="text-2xl font-semibold text-slate-900">识别码导入</h2>
        <p className="text-sm leading-7 text-slate-600">
          支持上传 `.xlsx` 或 `.csv`。默认读取“识别码 / code”列；重复识别码会自动跳过并计入结果。
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="identifier-file" className="text-sm font-medium text-slate-700">
          上传文件
        </label>
        <input
          id="identifier-file"
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
