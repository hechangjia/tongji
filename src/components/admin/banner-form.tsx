"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { StatusCallout } from "@/components/status-callout";
import { createBannerQuoteAction } from "@/app/(admin)/admin/banners/actions";
import type { BannerQuoteFormState } from "@/app/(admin)/admin/banners/form-state";

const initialState: BannerQuoteFormState = {
  status: "idle",
  message: null,
  values: {
    content: "",
    author: "",
    status: "ACTIVE",
  },
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="inline-flex h-12 items-center justify-center rounded-[18px] bg-slate-950 px-5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      disabled={pending}
    >
      {pending ? "保存中..." : "保存横幅"}
    </button>
  );
}

export function BannerForm() {
  const [state, formAction] = useActionState<BannerQuoteFormState, FormData>(
    createBannerQuoteAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-[28px] border border-white/70 bg-white/84 p-6 shadow-[0_22px_60px_rgba(8,47,73,0.08)]"
    >
      <div className="space-y-2">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-cyan-700">
          横幅一言
        </p>
        <h2 className="text-2xl font-semibold text-slate-900">新增横幅文案</h2>
      </div>

      <div className="space-y-2">
        <label htmlFor="content" className="text-sm font-medium text-slate-700">
          文案
        </label>
        <textarea
          id="content"
          name="content"
          rows={4}
          defaultValue={state.values.content}
          className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
          placeholder="输入要在全站顶部展示的一句话"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="author" className="text-sm font-medium text-slate-700">
            署名（可选）
          </label>
          <input
            id="author"
            name="author"
            type="text"
            defaultValue={state.values.author}
            className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium text-slate-700">
            状态
          </label>
          <select
            id="status"
            name="status"
            defaultValue={state.values.status}
            className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
          >
            <option value="ACTIVE">启用</option>
            <option value="INACTIVE">停用</option>
          </select>
        </div>
      </div>

      {state.message ? (
        <StatusCallout
          tone={state.status === "error" ? "error" : "success"}
          title={state.status === "error" ? "保存失败" : "横幅已保存"}
        >
          <p role={state.status === "error" ? "alert" : "status"}>{state.message}</p>
        </StatusCallout>
      ) : null}

      <SubmitButton />
    </form>
  );
}
