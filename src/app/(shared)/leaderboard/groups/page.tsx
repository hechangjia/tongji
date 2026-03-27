import Link from "next/link";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export default async function GroupLeaderboardPage() {
  const session = await auth();

  const content = (
    <section className="space-y-6">
      <PageHeader
        eyebrow="共享榜单"
        title="小组榜单"
        description="小组维度的排行榜入口已经预留，后续阶段会接入各组销量、冲榜节奏和阶段趋势对比。"
      />

      <EmptyState
        title="小组排行榜建设中"
        description="当前阶段先完成共享路由和导航入口，后续阶段会补上小组排名、榜单筛选和管理员/组长可共用的复盘视图。"
        action={
          <Link
            href="/leaderboard/range"
            className="inline-flex h-11 items-center justify-center rounded-[18px] bg-slate-950 px-5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-800"
          >
            先看现有总榜
          </Link>
        }
      />
    </section>
  );

  if (!session?.user?.role) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">{content}</div>
      </main>
    );
  }

  return (
    <AppShell
      role={session.user.role}
      userName={session.user.name ?? session.user.username}
      currentPath="/leaderboard/groups"
    >
      {content}
    </AppShell>
  );
}
