import { getCachedSessionIfCookiePresent } from "@/lib/auth-request-cache";
import { AppShell } from "@/components/app-shell";
import { GroupLeaderboardTable } from "@/components/leader/group-leaderboard-table";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { getVisibleGroupMemberRows } from "@/server/services/group-leaderboard-service";
import { getCachedGroupLeaderboard } from "@/server/services/leaderboard-cache";
import { getTodaySaleDateValue } from "@/server/services/sales-service";

export default async function GroupLeaderboardPage() {
  const session = await getCachedSessionIfCookiePresent();
  const todaySaleDate = getTodaySaleDateValue();
  const leaderboard = await getCachedGroupLeaderboard({
    currentUserId: session?.user?.id,
    todaySaleDate,
  });
  const visibleGroupIds =
    session?.user?.role === "ADMIN"
      ? leaderboard.rows.map((row) => row.groupId)
      : session?.user?.role === "LEADER" && leaderboard.viewerGroupDelta?.groupId
        ? [leaderboard.viewerGroupDelta.groupId]
        : [];
  const memberRowsByGroupId = Object.fromEntries(
    await Promise.all(
      visibleGroupIds.map(async (groupId) => [
        groupId,
        await getVisibleGroupMemberRows({
          currentUserId: session?.user?.id,
          groupId,
          todaySaleDate,
        }),
      ]),
    ),
  );

  const content = (
    <section className="space-y-6">
      <PageHeader
        eyebrow="共享榜单"
        title="小组榜单"
        description="公开层展示小组总榜；登录后再按角色决定是否展开成员层细节，不在页面层复制权限逻辑。"
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="统计日期" value={todaySaleDate} />
          <MetricCard label="上榜小组数" value={leaderboard.rows.length} tone="dark" />
          <MetricCard
            label="与上一组差距"
            value={leaderboard.viewerGroupDelta?.gapToPrevious ?? "-"}
            tone="accent"
          />
          <MetricCard
            label="与下一组差距"
            value={leaderboard.viewerGroupDelta?.gapToNext ?? "-"}
          />
        </div>
      </PageHeader>

      <GroupLeaderboardTable
        rows={leaderboard.rows}
        viewerGroupDelta={leaderboard.viewerGroupDelta}
        memberRowsByGroupId={memberRowsByGroupId}
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
