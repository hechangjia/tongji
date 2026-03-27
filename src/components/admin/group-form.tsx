"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { StatusCallout } from "@/components/status-callout";
import { createGroupAction } from "@/app/(admin)/admin/groups/actions";
import type { GroupCreateFormState } from "@/app/(admin)/admin/groups/form-state";

type GroupLeaderOption = {
  id: string;
  name: string;
  username: string;
};

const initialState: GroupCreateFormState = {
  status: "idle",
  message: null,
  values: {
    name: "",
    slogan: "",
    remark: "",
    leaderUserId: "",
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

export function GroupForm({
  submitLabel,
  leaderOptions,
}: {
  submitLabel: string;
  leaderOptions: GroupLeaderOption[];
}) {
  const [state, formAction] = useActionState<GroupCreateFormState, FormData>(
    createGroupAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-[28px] border border-white/70 bg-white/84 p-6 shadow-[0_22px_60px_rgba(8,47,73,0.08)]"
    >
      <div className="space-y-2">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-cyan-700">
          组织设置
        </p>
        <h2 className="text-2xl font-semibold text-slate-900">新增小组</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-slate-700">
            小组名称
          </label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={state.values.name}
            className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="slogan" className="text-sm font-medium text-slate-700">
            小组口号（可选）
          </label>
          <input
            id="slogan"
            name="slogan"
            type="text"
            defaultValue={state.values.slogan}
            className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="remark" className="text-sm font-medium text-slate-700">
            备注（可选）
          </label>
          <textarea
            id="remark"
            name="remark"
            rows={3}
            defaultValue={state.values.remark}
            className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="leaderUserId" className="text-sm font-medium text-slate-700">
            指定组长（可选）
          </label>
          <select
            id="leaderUserId"
            name="leaderUserId"
            defaultValue={state.values.leaderUserId}
            className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
          >
            <option value="">暂不指定</option>
            {leaderOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}（{option.username}）
              </option>
            ))}
          </select>
        </div>
      </div>

      {state.message ? (
        <StatusCallout
          tone={state.status === "error" ? "error" : "success"}
          title={state.status === "error" ? "保存失败" : "小组创建成功"}
        >
          <p role={state.status === "error" ? "alert" : "status"}>{state.message}</p>
        </StatusCallout>
      ) : null}

      <SubmitButton submitLabel={submitLabel} />
    </form>
  );
}
