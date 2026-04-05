"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { StatusCallout } from "@/components/status-callout";
import { createAnnouncementAction } from "@/app/(admin)/admin/announcements/actions";
import type { AnnouncementFormState } from "@/app/(admin)/admin/announcements/form-state";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="inline-flex h-12 items-center justify-center rounded-[18px] bg-slate-950 px-5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      disabled={pending}
    >
      {pending ? "保存中..." : "保存公告"}
    </button>
  );
}

export function AnnouncementForm({
  initialValues,
}: {
  initialValues: AnnouncementFormState["values"];
}) {
  const [state, formAction] = useActionState<AnnouncementFormState, FormData>(
    createAnnouncementAction,
    {
      status: "idle",
      message: null,
      values: initialValues,
    },
  );

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-[24px] border border-white/70 bg-white/84 p-6 shadow-[0_22px_60px_rgba(8,47,73,0.08)]"
    >
      <div className="space-y-2">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-cyan-700">
          全体公告
        </p>
        <h2 className="text-2xl font-semibold text-slate-900">发布公告</h2>
      </div>

      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium text-slate-700">
          标题
        </label>
        <input
          id="title"
          name="title"
          type="text"
          defaultValue={state.values.title}
          className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="content" className="text-sm font-medium text-slate-700">
          内容
        </label>
        <textarea
          id="content"
          name="content"
          rows={5}
          defaultValue={state.values.content}
          className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="publishAt" className="text-sm font-medium text-slate-700">
            发布时间
          </label>
          <input
            id="publishAt"
            name="publishAt"
            type="datetime-local"
            defaultValue={state.values.publishAt}
            className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="expireAt" className="text-sm font-medium text-slate-700">
            过期时间（可选）
          </label>
          <input
            id="expireAt"
            name="expireAt"
            type="datetime-local"
            defaultValue={state.values.expireAt}
            className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
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

        <label className="mt-7 flex items-center gap-3 rounded-[18px] border border-slate-200 bg-cyan-50/60 px-4 py-3 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            name="isPinned"
            defaultChecked={state.values.isPinned}
            className="h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-500"
          />
          置顶公告
        </label>
      </div>

      {state.message ? (
        <StatusCallout
          tone={state.status === "error" ? "error" : "success"}
          title={state.status === "error" ? "保存失败" : "公告已保存"}
        >
          <p role={state.status === "error" ? "alert" : "status"}>{state.message}</p>
        </StatusCallout>
      ) : null}

      <SubmitButton />
    </form>
  );
}
