"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { StatusCallout } from "@/components/status-callout";
import { createMemberAction } from "@/app/(admin)/admin/members/actions";
import type { MemberCreateFormState } from "@/app/(admin)/admin/members/form-state";

type MemberGroupOption = {
  id: string;
  name: string;
};

const initialState: MemberCreateFormState = {
  status: "idle",
  message: null,
  values: {
    username: "",
    name: "",
    password: "",
    groupId: "",
    remark: "",
    status: "ACTIVE",
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

export function MemberForm({
  submitLabel,
  groups,
}: {
  submitLabel: string;
  groups: MemberGroupOption[];
}) {
  const [state, formAction] = useActionState<MemberCreateFormState, FormData>(
    createMemberAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-[24px] border border-white/70 bg-white/84 p-6 shadow-[0_22px_60px_rgba(8,47,73,0.08)]"
    >
      <div className="space-y-2">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-cyan-700">
          新增成员
        </p>
        <h2 className="text-2xl font-semibold text-slate-900">创建成员账号</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="username" className="text-sm font-medium text-slate-700">
            账号
          </label>
          <input
            id="username"
            name="username"
            type="text"
            defaultValue={state.values.username}
            className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-slate-700">
            姓名
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
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            初始密码
          </label>
          <input
            id="password"
            name="password"
            type="password"
            defaultValue={state.values.password}
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

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="groupId" className="text-sm font-medium text-slate-700">
            所属小组（可选）
          </label>
          <select
            id="groupId"
            name="groupId"
            defaultValue={state.values.groupId}
            className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
          >
            <option value="">暂不分组</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
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
      </div>

      {state.message ? (
        <StatusCallout
          tone={state.status === "error" ? "error" : "success"}
          title={state.status === "error" ? "保存失败" : "成员创建成功"}
        >
          <p role={state.status === "error" ? "alert" : "status"}>{state.message}</p>
        </StatusCallout>
      ) : null}

      <SubmitButton submitLabel={submitLabel} />
    </form>
  );
}
