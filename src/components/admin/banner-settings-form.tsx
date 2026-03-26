"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { StatusCallout } from "@/components/status-callout";
import { updateBannerSettingsAction } from "@/app/(admin)/admin/banners/actions";
import type { BannerSettingsFormState } from "@/app/(admin)/admin/banners/form-state";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="inline-flex h-12 items-center justify-center rounded-[18px] bg-slate-950 px-5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      disabled={pending}
    >
      {pending ? "保存中..." : "保存设置"}
    </button>
  );
}

export function BannerSettingsForm({
  initialValues,
}: {
  initialValues: BannerSettingsFormState["values"];
}) {
  const [state, formAction] = useActionState<BannerSettingsFormState, FormData>(
    updateBannerSettingsAction,
    {
      status: "idle",
      message: null,
      values: initialValues,
    },
  );

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-[28px] border border-white/70 bg-white/84 p-6 shadow-[0_22px_60px_rgba(8,47,73,0.08)]"
    >
      <div className="space-y-2">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-cyan-700">
          展示设置
        </p>
        <h2 className="text-2xl font-semibold text-slate-900">横幅模式</h2>
      </div>

      <label className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-cyan-50/60 px-4 py-4 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          name="isEnabled"
          defaultChecked={state.values.isEnabled}
          className="h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-500"
        />
        启用登录后全站横幅
      </label>

      <div className="space-y-2">
        <label htmlFor="displayMode" className="text-sm font-medium text-slate-700">
          展示模式
        </label>
        <select
          id="displayMode"
          name="displayMode"
          defaultValue={state.values.displayMode}
          className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
        >
          <option value="RANDOM">随机显示</option>
          <option value="ROTATE">轮播显示</option>
        </select>
      </div>

      {state.message ? (
        <StatusCallout
          tone={state.status === "error" ? "error" : "success"}
          title={state.status === "error" ? "保存失败" : "设置已更新"}
        >
          <p role={state.status === "error" ? "alert" : "status"}>{state.message}</p>
        </StatusCallout>
      ) : null}

      <SubmitButton />
    </form>
  );
}
