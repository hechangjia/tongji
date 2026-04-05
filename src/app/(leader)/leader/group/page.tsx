import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateLeaderGroupProfileAction } from "@/app/(leader)/leader/group/actions";
import { EmptyState } from "@/components/empty-state";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusCallout } from "@/components/status-callout";

type LeaderGroupPageProps = {
  searchParams?: Promise<{
    notice?: string | string[];
    noticeTone?: string | string[];
  }>;
};

export default async function LeaderGroupPage({ searchParams }: LeaderGroupPageProps = {}) {
  const session = (await auth())!;

  const params = searchParams ? await searchParams : undefined;
  const notice = typeof params?.notice === "string" ? params.notice : null;
  const noticeTone = params?.noticeTone === "error" ? "error" : "success";

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
    <section className="space-y-6">
        <PageHeader
          eyebrow="组长工作台"
          title="本组看板"
          description={
            currentGroup
              ? `你现在负责维护 ${currentGroup.name} 的组内展示信息；口号和备注会直接反映本组当前节奏。`
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

        {notice ? (
          <StatusCallout tone={noticeTone} title={noticeTone === "error" ? "保存失败" : "操作完成"}>
            {notice}
          </StatusCallout>
        ) : null}

        {currentGroup ? (
          <div className="grid gap-4 xl:grid-cols-2">
            <section className="rounded-[24px] border border-white/70 bg-white/82 p-6 shadow-[0_16px_36px_rgba(8,47,73,0.08)]">
              <form action={updateLeaderGroupProfileAction} className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-cyan-700">
                    Group Profile
                  </p>
                  <h2 className="text-2xl font-semibold text-slate-950">维护本组信息</h2>
                  <p className="text-sm leading-7 text-slate-600">
                    这里由组长自己维护口号和备注，管理员后台不再直接编辑这两项。
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="slogan" className="text-sm font-medium text-slate-700">
                    小组口号
                  </label>
                  <input
                    id="slogan"
                    name="slogan"
                    type="text"
                    defaultValue={currentGroup.slogan ?? ""}
                    className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="remark" className="text-sm font-medium text-slate-700">
                    小组备注
                  </label>
                  <textarea
                    id="remark"
                    name="remark"
                    rows={5}
                    defaultValue={currentGroup.remark ?? ""}
                    className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center rounded-[18px] bg-slate-950 px-5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-800"
                >
                  保存本组信息
                </button>
              </form>
            </section>

            <section className="rounded-[24px] border border-white/70 bg-white/82 p-6 shadow-[0_16px_36px_rgba(8,47,73,0.08)]">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-cyan-700">
                当前展示
              </p>
              <h2 className="mt-4 font-display text-2xl text-slate-950">
                {currentGroup.slogan || "暂未设置口号"}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {currentGroup.remark || "当前没有额外备注，保存后会在这里显示最新内容。"}
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
  );
}
