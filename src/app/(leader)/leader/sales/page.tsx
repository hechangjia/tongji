import Link from "next/link";
import { getCachedSession } from "@/lib/auth-request-cache";
import { EmptyState } from "@/components/empty-state";
import { LeaderAuditTimeline } from "@/components/leader/leader-audit-timeline";
import { LeaderCodeAssignmentSection } from "@/components/leader/leader-code-assignment-section";
import { LeaderFollowUpSection } from "@/components/leader/leader-follow-up-section";
import { LeaderGroupRankingPanel } from "@/components/leader/leader-group-ranking-panel";
import { LeaderMemberRankingPanel } from "@/components/leader/leader-member-ranking-panel";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusCallout } from "@/components/status-callout";
import {
  getCachedGroupLeaderboard,
  getCachedLeaderWorkbenchSnapshot,
} from "@/server/services/leaderboard-cache";

type LeaderSalesPageProps = {
  searchParams?: Promise<{
    notice?: string | string[];
    noticeTone?: string | string[];
  }>;
};

function normalizeSingleSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

async function loadLeaderWorkbenchPageState(leaderUserId: string) {
  try {
    const [snapshot, groupLeaderboard] = await Promise.all([
      getCachedLeaderWorkbenchSnapshot({
        leaderUserId,
      }),
      getCachedGroupLeaderboard({
        currentUserId: leaderUserId,
      }),
    ]);

    return {
      snapshot,
      groupLeaderboard,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "当前账号还没有绑定小组") {
      return null;
    }

    throw error;
  }
}

export default async function LeaderSalesPage({ searchParams }: LeaderSalesPageProps = {}) {
  const session = (await getCachedSession())!;

  const params = searchParams ? await searchParams : undefined;
  const notice = normalizeSingleSearchParam(params?.notice);
  const noticeTone = normalizeSingleSearchParam(params?.noticeTone) === "error" ? "error" : "success";
  const workbenchState = await loadLeaderWorkbenchPageState(session.user.id);

  if (workbenchState) {
    const { snapshot, groupLeaderboard } = workbenchState;
    const currentGroupRank = groupLeaderboard.rows.find((row) => row.groupId === snapshot.group.id);

    return (
      <section className="space-y-6">
          <PageHeader
            eyebrow="组长工作台"
            title="小组销售"
            description={`围绕 ${snapshot.group.name} 的当日冲榜督战主入口，同时看组内成员冲榜、各组排名变化、待推进线索、可调度识别码和最近审计。`}
          >
            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-700">{snapshot.group.name}</p>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <MetricCard label="本组今日成交" value={snapshot.summary.todayTotal} />
                <MetricCard
                  label="40 / 60 结构"
                  value={`${snapshot.summary.todayCount40} / ${snapshot.summary.todayCount60}`}
                  tone="dark"
                />
                <MetricCard
                  label="当前小组排名"
                  value={currentGroupRank ? `#${currentGroupRank.rank}` : "-"}
                  tone="accent"
                />
                <MetricCard label="待跟进项数量" value={snapshot.summary.pendingFollowUpCount} />
                <MetricCard label="空置识别码数" value={snapshot.summary.groupPoolCodeCount} />
              </div>
            </div>
          </PageHeader>

          {notice ? (
            <StatusCallout tone={noticeTone} title={noticeTone === "error" ? "操作失败" : "操作完成"}>
              {notice}
            </StatusCallout>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-2">
            <LeaderMemberRankingPanel rows={snapshot.memberRanking} />
            <LeaderGroupRankingPanel
              rows={groupLeaderboard.rows}
              currentGroupId={snapshot.group.id}
              viewerGroupDelta={groupLeaderboard.viewerGroupDelta}
            />
          </div>

          <LeaderFollowUpSection
            items={snapshot.followUpQueue}
            memberOptions={snapshot.memberRanking}
          />
          <LeaderCodeAssignmentSection
            items={snapshot.codePool}
            memberOptions={snapshot.memberRanking}
          />
          <LeaderAuditTimeline items={snapshot.auditRows} />
        </section>
    );
  }

  return (
    <section className="space-y-6">
        <PageHeader
          eyebrow="组长工作台"
          title="小组销售"
          description="当前账号还没有绑定小组，先给出明确空态和后续入口，不再继续停留在历史占位页。"
        />

        {notice ? (
          <StatusCallout tone={noticeTone} title={noticeTone === "error" ? "操作失败" : "操作完成"}>
            {notice}
          </StatusCallout>
        ) : null}

        <EmptyState
          title="暂未绑定小组"
          description="请先在管理员后台把当前组长绑定到具体小组。绑定完成后，这里会展示完整的组长督战工作台、成员冲榜视图和组内调度能力。"
          action={
            <Link
              href="/leader/group"
              className="inline-flex h-11 items-center justify-center rounded-[18px] bg-slate-950 px-5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-800"
            >
              返回本组信息页
            </Link>
          }
        />
      </section>
  );
}
