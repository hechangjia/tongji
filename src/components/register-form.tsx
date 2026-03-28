"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { registerMemberAction } from "@/app/(auth)/login/actions";
import type { RegisterFormState } from "@/app/(auth)/login/form-state";
import { StatusCallout } from "@/components/status-callout";

const initialRegisterFormState: RegisterFormState = {
  status: "idle",
  message: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="inline-flex w-full items-center justify-center rounded-[20px] bg-cyan-700 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(8,47,73,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      disabled={pending}
    >
      {pending ? "注册中..." : "注册并进入"}
    </button>
  );
}

export function RegisterForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, formAction] = useActionState(
    registerMemberAction,
    initialRegisterFormState,
  );

  return (
    <form action={formAction} className="space-y-5">
      {callbackUrl ? (
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
      ) : null}

      <div className="grid gap-4">
        <div className="space-y-2">
          <label
            htmlFor="register-username"
            className="text-sm font-medium text-slate-700"
          >
            新账号
          </label>
          <input
            id="register-username"
            name="username"
            type="text"
            autoComplete="username"
            className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="register-password"
            className="text-sm font-medium text-slate-700"
          >
            设置密码
          </label>
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
          />
        </div>
      </div>

      <div className="rounded-[20px] border border-cyan-100 bg-cyan-50/80 px-4 py-3">
        <p className="text-sm leading-6 text-cyan-800/80">
          注册后将自动创建为激活成员账号，并进入录入页面。
        </p>
      </div>

      {state.status === "error" && state.message ? (
        <StatusCallout tone="error" title="注册失败">
          <p role="alert">{state.message}</p>
        </StatusCallout>
      ) : null}

      {state.status === "manual_login" && state.message ? (
        <StatusCallout tone="success" title="注册成功">
          <p role="status">{state.message}</p>
        </StatusCallout>
      ) : null}

      <SubmitButton />
    </form>
  );
}
