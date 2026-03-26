import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getDefaultRedirectPath,
  sanitizeCallbackUrl,
} from "@/lib/permissions";
import { LoginForm } from "@/components/login-form";

type LoginPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();

  if (session?.user?.role) {
    redirect(getDefaultRedirectPath(session.user.role));
  }

  const params = searchParams ? await searchParams : undefined;
  const callbackUrlValue = params?.callbackUrl;
  const callbackUrl = sanitizeCallbackUrl(
    typeof callbackUrlValue === "string" ? callbackUrlValue : undefined,
  );

  return (
    <main className="relative flex min-h-dvh items-center overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
      <div className="maika-login-backdrop pointer-events-none absolute inset-0" />
      <div className="relative mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(380px,460px)] lg:items-center">
        <section className="maika-fade-up relative overflow-hidden rounded-[32px] border border-white/12 bg-white/8 p-7 text-white shadow-[0_28px_90px_rgba(8,47,73,0.28)] backdrop-blur-xl sm:p-8 lg:min-h-[560px] lg:p-10">
          <div className="absolute -left-10 -top-12 h-36 w-36 rounded-full bg-white/14 blur-3xl" />
          <div className="absolute -bottom-12 right-0 h-48 w-48 rounded-full bg-cyan-200/20 blur-3xl" />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-cyan-100/90">
                Maika Team Ops
              </p>
              <h1 className="mt-6 max-w-xl font-display text-4xl leading-tight text-white sm:text-5xl">
                校园销售作战台
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-cyan-50/90">
                从成员每日录入、榜单追踪到管理员规则配置和结算导出，把团队当天最重要的动作集中在一个更清晰的工作台里。
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/90">
                  成员录入
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/90">
                  实时榜单
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/90">
                  结算导出
                </span>
              </div>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-4">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-cyan-100/70">
                  Member
                </p>
                <p className="mt-3 text-2xl font-semibold text-white">每日录入</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-4">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-cyan-100/70">
                  Shared
                </p>
                <p className="mt-3 text-2xl font-semibold text-white">榜单追踪</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-4">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-cyan-100/70">
                  Admin
                </p>
                <p className="mt-3 text-2xl font-semibold text-white">结算管理</p>
              </div>
            </div>
          </div>
        </section>

        <div className="maika-fade-up rounded-[32px] border border-white/55 bg-white/82 p-8 shadow-[0_28px_90px_rgba(8,47,73,0.2)] backdrop-blur-xl sm:p-10">
          <div className="space-y-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-cyan-700">
              Secure Access
            </p>
            <h2 className="font-display text-3xl text-slate-950">账号登录</h2>
            <p className="text-sm leading-7 text-slate-600">
              使用管理员或成员账号进入系统。登录后会根据角色自动进入对应工作区。
            </p>
          </div>

          <div className="mt-8">
            <LoginForm callbackUrl={callbackUrl} />
          </div>
        </div>
      </div>
    </main>
  );
}
