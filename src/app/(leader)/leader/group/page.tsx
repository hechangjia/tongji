import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessLeader, getDefaultRedirectPath } from "@/lib/permissions";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";

export default async function LeaderGroupPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fleader%2Fgroup");
  }

  if (!canAccessLeader(session.user)) {
    redirect(getDefaultRedirectPath(session.user.role));
  }

  const currentLeader = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      username: true,
      group: {
        select: {
          id: true,
          name: true,
          slogan: true,
          remark: true,
          _count: {
            select: {
              members: true,
            },
          },
        },
      },
    },
  });

  const currentGroup = currentLeader?.group ?? null;
  const leaderName = currentLeader?.name ?? currentLeader?.username ?? session.user.username;

  return (
    <AppShell
      role={session.user.role}
      userName={session.user.name ?? session.user.username}
      currentPath="/leader/group"
    >
      <section className="space-y-6">
        <PageHeader
          eyebrow="组长工作台"
          title="本组看板"
          description={
            currentGroup
              ? `先锁定 ${currentGroup.name} 的编组信息，后续阶段会在这里接入小组销售追踪、提醒动作和阶段复盘。`
              : "当前账号还没有绑定小组，先把组信息展示和入口固定下来，后续阶段再补齐销售与提醒能力。"
          }
        >
          {currentGroup ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <MetricCard label="小组名称" value={currentGroup.name} />
              <MetricCard
                label="组员人数"
                value={currentGroup._count.members}
                tone="dark"
              />
              <MetricCard label="当前组长" value={leaderName} tone="accent" />
            </div>
          ) : null}
        </PageHeader>

        {currentGroup ? (
          <div className="grid gap-4 xl:grid-cols-2">
            <section className="rounded-[28px] border border-white/70 bg-white/82 p-6 shadow-[0_16px_36px_rgba(8,47,73,0.08)]">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-cyan-700">
                本组口号
              </p>
              <h2 className="mt-4 font-display text-2xl text-slate-950">
                {currentGroup.slogan || "暂未设置口号"}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                这里先展示小组基础信息，后续阶段会把小组销售趋势和成员状态卡片接进来。
              </p>
            </section>

            <section className="rounded-[28px] border border-white/70 bg-white/82 p-6 shadow-[0_16px_36px_rgba(8,47,73,0.08)]">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-cyan-700">
                组内备注
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                {currentGroup.remark || "当前没有额外备注，后续可在管理员的小组管理中补充。"}
              </p>
              <Link
                href="/leaderboard/groups"
                className="mt-6 inline-flex items-center text-sm font-semibold text-cyan-800 transition hover:text-cyan-700"
              >
                查看小组榜单 →
              </Link>
            </section>
          </div>
        ) : (
          <EmptyState
            title="暂未绑定小组"
            description="请先在管理员的小组管理中为当前组长分配所属小组。分配完成后，这里会展示本组成员规模、口号和后续阶段的小组销售概览。"
            action={
              <Link
                href="/leaderboard/groups"
                className="inline-flex h-11 items-center justify-center rounded-[18px] bg-slate-950 px-5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-800"
              >
                先看小组榜单入口
              </Link>
            }
          />
        )}
      </section>
    </AppShell>
  );
}
