import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessLeader, getDefaultRedirectPath } from "@/lib/permissions";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export default async function LeaderSalesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fleader%2Fsales");
  }

  if (!canAccessLeader(session.user)) {
    redirect(getDefaultRedirectPath(session.user.role));
  }

  return (
    <AppShell
      role={session.user.role}
      userName={session.user.name ?? session.user.username}
      currentPath="/leader/sales"
    >
      <section className="space-y-6">
        <PageHeader
          eyebrow="组长工作台"
          title="小组销售"
          description="这个入口先固定下来，后续阶段会接入本组销售汇总、成员明细和需要跟进的提醒动作。"
        />

        <EmptyState
          title="小组销售能力将在后续阶段补齐"
          description="当前阶段只先完成 leader 专属路由、导航和占位信息。后续阶段会在这里展示本组销量趋势、成员贡献拆分和待跟进名单。"
          action={
            <Link
              href="/leader/group"
              className="inline-flex h-11 items-center justify-center rounded-[18px] bg-slate-950 px-5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-800"
            >
              返回本组看板
            </Link>
          }
        />
      </section>
    </AppShell>
  );
}
