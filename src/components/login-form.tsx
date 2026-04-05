"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { StatusCallout } from "@/components/status-callout";
import { loginAction } from "@/app/(auth)/login/actions";
import type { LoginFormState } from "@/app/(auth)/login/form-state";

const initialLoginFormState: LoginFormState = {
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="inline-flex w-full items-center justify-center rounded-[18px] bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(8,47,73,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      disabled={pending}
    >
      {pending ? "登录中..." : "登录"}
    </button>
  );
}

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction] = useActionState(loginAction, initialLoginFormState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <div className="grid gap-4">
        <div className="space-y-2">
          <label htmlFor="username" className="text-sm font-medium text-slate-700">
            账号
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            密码
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
          />
        </div>
      </div>

      <div className="rounded-[18px] border border-cyan-100 bg-cyan-50/80 px-4 py-3">
        <p className="text-sm font-medium text-cyan-900">角色自动跳转</p>
        <p className="mt-1 text-sm leading-6 text-cyan-800/80">
          成员登录后进入录入页，管理员登录后进入管理后台。
        </p>
      </div>

      {state.error ? (
        <StatusCallout tone="error" title="登录失败">
          <p role="alert">{state.error}</p>
        </StatusCallout>
      ) : null}

      <SubmitButton />
    </form>
  );
}
