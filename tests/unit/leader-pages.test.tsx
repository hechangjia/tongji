import { render, screen } from "@testing-library/react";
import { pathToFileURL } from "node:url";
import { beforeEach, describe, expect, test, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() =>
  vi.fn((target: string) => {
    throw new Error(`redirect:${target}`);
  }),
);
const revalidatePathMock = vi.hoisted(() => vi.fn());
const findUniqueMock = vi.hoisted(() => vi.fn());
const getCachedAdminCumulativeTrendMock = vi.hoisted(() => vi.fn());
const getCachedAdminDailyRhythmSummaryMock = vi.hoisted(() => vi.fn());
const getCachedGroupLeaderboardMock = vi.hoisted(() => vi.fn());
const getCachedLeaderWorkbenchSnapshotMock = vi.hoisted(() => vi.fn());
const getVisibleGroupMemberRowsMock = vi.hoisted(() => vi.fn());
const getTodaySaleDateValueMock = vi.hoisted(() => vi.fn(() => "2026-03-29"));
const createManualFollowUpActionMock = vi.hoisted(() => vi.fn());
const reassignFollowUpActionMock = vi.hoisted(() => vi.fn());
const updateFollowUpStatusActionMock = vi.hoisted(() => vi.fn());
const reassignIdentifierCodeActionMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: findUniqueMock,
    },
  },
}));

vi.mock("@/server/services/leaderboard-cache", () => ({
  getCachedAdminCumulativeTrend: getCachedAdminCumulativeTrendMock,
  getCachedAdminDailyRhythmSummary: getCachedAdminDailyRhythmSummaryMock,
  getCachedGroupLeaderboard: getCachedGroupLeaderboardMock,
  getCachedLeaderWorkbenchSnapshot: getCachedLeaderWorkbenchSnapshotMock,
}));

vi.mock("@/app/(leader)/leader/sales/actions", () => ({
  createManualFollowUpAction: createManualFollowUpActionMock,
  reassignFollowUpAction: reassignFollowUpActionMock,
  updateFollowUpStatusAction: updateFollowUpStatusActionMock,
  reassignIdentifierCodeAction: reassignIdentifierCodeActionMock,
}));

vi.mock("@/server/services/group-leaderboard-service", () => ({
  getVisibleGroupMemberRows: getVisibleGroupMemberRowsMock,
}));

vi.mock("@/server/services/sales-service", () => ({
  getTodaySaleDateValue: getTodaySaleDateValueMock,
}));

vi.mock("@/components/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell">{children}</div>
  ),
}));

vi.mock("@/components/page-header", () => ({
  PageHeader: ({
    title,
    description,
    children,
  }: {
    title: string;
    description?: string;
    children?: React.ReactNode;
  }) => (
    <section>
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
      {children}
    </section>
  ),
}));

vi.mock("@/components/metric-card", () => ({
  MetricCard: ({
    label,
    value,
  }: {
    label: string;
    value: React.ReactNode;
  }) => (
    <div>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  ),
}));

vi.mock("@/components/empty-state", () => ({
  EmptyState: ({
    title,
    description,
  }: {
    title: string;
    description: string;
  }) => (
    <section>
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  ),
}));

vi.mock("@/components/admin/admin-cumulative-stats-panel", () => ({
  AdminCumulativeStatsPanel: () => <div>admin-cumulative-stats-panel</div>,
}));

vi.mock("@/components/admin/admin-daily-review-summary", () => ({
  AdminDailyReviewSummary: () => <div>admin-daily-review-summary</div>,
}));

async function importPageFromWorkspace(relativePath: string) {
  const moduleUrl = pathToFileURL(
    `${process.cwd()}/${relativePath}`,
  ).href;

  return import(/* @vite-ignore */ moduleUrl);
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
}

describe("leader task pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    authMock.mockResolvedValue({
      user: {
        id: "leader-1",
        role: "LEADER",
        username: "leader01",
        name: "组长一号",
      },
    });
    findUniqueMock.mockResolvedValue({
      name: "组长一号",
      username: "leader01",
      group: {
        id: "group-1",
        name: "北极星组",
        slogan: "今天继续拉开差距",
        remark: "晚间重点跟进复购",
        _count: {
          members: 6,
        },
      },
    });
    getCachedAdminCumulativeTrendMock.mockResolvedValue({
      granularity: "day",
      series: [],
    });
    getCachedAdminDailyRhythmSummaryMock.mockResolvedValue({});
    getCachedGroupLeaderboardMock.mockResolvedValue({
      rows: [
        {
          rank: 1,
          groupId: "group-2",
          groupName: "开拓者组",
          count40: 2,
          count60: 1,
          total: 3,
        },
        {
          rank: 2,
          groupId: "group-1",
          groupName: "北极星组",
          count40: 1,
          count60: 1,
          total: 2,
        },
      ],
      viewerGroupDelta: {
        groupId: "group-1",
        gapToPrevious: 1,
        gapToNext: null,
      },
    });
    getCachedLeaderWorkbenchSnapshotMock.mockResolvedValue({
      group: {
        id: "group-1",
        name: "北极星组",
        slogan: "今天继续拉开差距",
        remark: "晚间重点跟进复购",
      },
      summary: {
        memberCount: 2,
        todayCount40: 1,
        todayCount60: 1,
        todayTotal: 2,
        pendingFollowUpCount: 2,
        groupPoolCodeCount: 1,
      },
      memberRanking: [
        {
          rank: 1,
          userId: "member-1",
          userName: "成员甲",
          count40: 1,
          count60: 1,
          total: 2,
          activeCodeCount: 1,
          pendingFollowUpCount: 1,
          lastActionAt: new Date("2026-03-29T08:00:00.000Z"),
        },
      ],
      codePool: [
        {
          id: "code-1",
          code: "ABC001",
          currentOwnerUserId: null,
          currentOwnerName: null,
          assignedAt: new Date("2026-03-29T07:00:00.000Z"),
          createdAt: new Date("2026-03-29T06:00:00.000Z"),
          isInGroupPool: true,
        },
      ],
      followUpQueue: [
        {
          id: "follow-1",
          sourceType: "PROSPECT_LEAD",
          status: "FOLLOWING_UP",
          summaryNote: "今晚回访",
          currentOwnerUserId: "member-1",
          currentOwnerName: "成员甲",
          isInGroupPool: false,
          lastActionAt: new Date("2026-03-29T08:30:00.000Z"),
          createdAt: new Date("2026-03-29T07:30:00.000Z"),
          prospectLead: {
            id: "lead-1",
            qqNumber: "123456",
            major: "计算机",
            status: "ASSIGNED",
            assignedToUserId: "member-1",
            assignedGroupId: "group-1",
          },
        },
      ],
      auditRows: [
        {
          id: "audit-1",
          resourceType: "FOLLOW_UP_ITEM",
          resourceId: "follow-1",
          actionType: "STATUS_CHANGE",
          reason: "已约今晚成交",
          createdAt: new Date("2026-03-29T09:00:00.000Z"),
          operatorUserId: "leader-1",
          operatorUserName: "组长一号",
          beforeSnapshot: { status: "FOLLOWING_UP" },
          afterSnapshot: { status: "READY_TO_CONVERT" },
        },
      ],
    });
    getVisibleGroupMemberRowsMock.mockResolvedValue([]);
  });

  test("admin home page includes the groups quick entry", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "admin-1",
        role: "ADMIN",
        username: "admin",
        name: "管理员",
      },
    });

    const { default: AdminHomePage } = await import("@/app/(admin)/admin/page");

    render(await AdminHomePage({}));

    expect(screen.getByRole("link", { name: /小组管理/ })).toHaveAttribute(
      "href",
      "/admin/groups",
    );
  });

  test("admin home page starts both dashboard reads before waiting on the trend response", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "admin-1",
        role: "ADMIN",
        username: "admin",
        name: "管理员",
      },
    });
    const cumulativeDeferred = createDeferred<{
      granularity: "day";
      series: [];
    }>();
    const calls: string[] = [];
    getCachedAdminCumulativeTrendMock.mockImplementation(async () => {
      calls.push("trend");
      return cumulativeDeferred.promise;
    });
    getCachedAdminDailyRhythmSummaryMock.mockImplementation(async () => {
      calls.push("summary");
      return {};
    });

    const { default: AdminHomePage } = await import("@/app/(admin)/admin/page");
    const pagePromise = AdminHomePage({
      searchParams: Promise.resolve({}),
    });

    await Promise.resolve();
    await Promise.resolve();

    expect(calls).toEqual(["trend", "summary"]);

    cumulativeDeferred.resolve({
      granularity: "day",
      series: [],
    });

    render(await pagePromise);

    expect(screen.getByText("admin-daily-review-summary")).toBeInTheDocument();
    expect(screen.getByText("admin-cumulative-stats-panel")).toBeInTheDocument();
  });

  test("leader group page shows the current group overview", async () => {
    const { default: LeaderGroupPage } = await importPageFromWorkspace(
      "src/app/(leader)/leader/group/page.tsx",
    );

    render(await LeaderGroupPage());

    expect(screen.getByText("本组看板")).toBeInTheDocument();
    expect(screen.getAllByText(/北极星组/).length).toBeGreaterThan(0);
    expect(screen.getByText("组员人数")).toBeInTheDocument();
    expect(screen.getByLabelText("小组口号")).toHaveValue("今天继续拉开差距");
    expect(screen.getByLabelText("小组备注")).toHaveValue("晚间重点跟进复购");
    expect(screen.getByRole("button", { name: "保存本组信息" })).toBeInTheDocument();
  });

  test("leader group page redirects guests to login", async () => {
    authMock.mockResolvedValue(null);
    const { default: LeaderGroupPage } = await importPageFromWorkspace(
      "src/app/(leader)/leader/group/page.tsx",
    );

    await expect(LeaderGroupPage()).rejects.toThrow(
      "redirect:/login?callbackUrl=%2Fleader%2Fgroup",
    );
  });

  test("leader group page redirects members back to their default home", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "member-1",
        role: "MEMBER",
        username: "member01",
        name: "成员一号",
      },
    });
    const { default: LeaderGroupPage } = await importPageFromWorkspace(
      "src/app/(leader)/leader/group/page.tsx",
    );

    await expect(LeaderGroupPage()).rejects.toThrow("redirect:/entry");
  });

  test("leader sales page renders the workbench summary strip and major panels", async () => {
    const { default: LeaderSalesPage } = await importPageFromWorkspace(
      "src/app/(leader)/leader/sales/page.tsx",
    );

    render(await LeaderSalesPage());

    expect(screen.getByText("小组销售")).toBeInTheDocument();
    expect(screen.getByText("本组今日成交")).toBeInTheDocument();
    expect(screen.getByText("组内成员冲榜")).toBeInTheDocument();
    expect(screen.getByText("各组排名变化")).toBeInTheDocument();
    expect(screen.getByText("线索推进区")).toBeInTheDocument();
    expect(screen.getByText("识别码调度区")).toBeInTheDocument();
    expect(screen.getByText("审计时间线")).toBeInTheDocument();
    expect(screen.getAllByText(/北极星组/).length).toBeGreaterThan(0);
    expect(getCachedLeaderWorkbenchSnapshotMock).toHaveBeenCalledWith({
      leaderUserId: "leader-1",
    });
    expect(getCachedGroupLeaderboardMock).toHaveBeenCalledWith({
      currentUserId: "leader-1",
    });
  });

  test("leader sales page shows a bound-group empty state instead of the old placeholder", async () => {
    getCachedLeaderWorkbenchSnapshotMock.mockRejectedValueOnce(
      new Error("当前账号还没有绑定小组"),
    );

    const { default: LeaderSalesPage } = await importPageFromWorkspace(
      "src/app/(leader)/leader/sales/page.tsx",
    );

    render(await LeaderSalesPage());

    expect(screen.getByText("暂未绑定小组")).toBeInTheDocument();
    expect(screen.queryByText("小组销售能力将在后续阶段补齐")).not.toBeInTheDocument();
  });

  test("leader sales page redirects guests to login", async () => {
    authMock.mockResolvedValue(null);
    const { default: LeaderSalesPage } = await importPageFromWorkspace(
      "src/app/(leader)/leader/sales/page.tsx",
    );

    await expect(LeaderSalesPage()).rejects.toThrow(
      "redirect:/login?callbackUrl=%2Fleader%2Fsales",
    );
  });

  test("leader sales page redirects members back to their default home", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "member-1",
        role: "MEMBER",
        username: "member01",
        name: "成员一号",
      },
    });
    const { default: LeaderSalesPage } = await importPageFromWorkspace(
      "src/app/(leader)/leader/sales/page.tsx",
    );

    await expect(LeaderSalesPage()).rejects.toThrow("redirect:/entry");
  });

  test("shared group leaderboard shows group totals and current date for members", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "member-1",
        role: "MEMBER",
        username: "member01",
        name: "成员一号",
      },
    });
    const { default: GroupLeaderboardPage } = await importPageFromWorkspace(
      "src/app/(shared)/leaderboard/groups/page.tsx",
    );

    render(await GroupLeaderboardPage());

    expect(screen.getByText("小组榜单")).toBeInTheDocument();
    expect(screen.getByText("统计日期")).toBeInTheDocument();
    expect(screen.getByText("2026-03-29")).toBeInTheDocument();
    expect(screen.getAllByText(/北极星组/).length).toBeGreaterThan(0);
    expect(screen.queryByText("成员甲")).not.toBeInTheDocument();
    expect(screen.getByTestId("app-shell")).toBeInTheDocument();
  });

  test("shared group leaderboard renders without shell for anonymous visitors", async () => {
    authMock.mockResolvedValue(null);
    const { default: GroupLeaderboardPage } = await importPageFromWorkspace(
      "src/app/(shared)/leaderboard/groups/page.tsx",
    );

    render(await GroupLeaderboardPage());

    expect(screen.getByText("小组榜单")).toBeInTheDocument();
    expect(screen.getAllByText(/开拓者组/).length).toBeGreaterThan(0);
    expect(screen.queryByTestId("app-shell")).not.toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  test("shared group leaderboard lets leaders see expandable detail only for their own group", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "leader-1",
        role: "LEADER",
        username: "leader01",
        name: "组长一号",
      },
    });
    getVisibleGroupMemberRowsMock.mockImplementation(async ({ groupId }: { groupId: string }) => {
      if (groupId === "group-1") {
        return [
          {
            rank: 1,
            userId: "member-1",
            userName: "成员甲",
            count40: 1,
            count60: 1,
            total: 2,
          },
        ];
      }

      return [];
    });

    const { default: GroupLeaderboardPage } = await importPageFromWorkspace(
      "src/app/(shared)/leaderboard/groups/page.tsx",
    );

    render(await GroupLeaderboardPage());

    expect(screen.getByText(/成员甲/)).toBeInTheDocument();
    expect(screen.getAllByText("与上一组差距").length).toBeGreaterThan(0);
    expect(screen.queryByText("外组成员")).not.toBeInTheDocument();
  });

  test("shared group leaderboard lets admins expand every group", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "admin-1",
        role: "ADMIN",
        username: "admin",
        name: "管理员",
      },
    });
    getVisibleGroupMemberRowsMock.mockImplementation(async ({ groupId }: { groupId: string }) => {
      if (groupId === "group-1") {
        return [
          {
            rank: 1,
            userId: "member-1",
            userName: "成员甲",
            count40: 1,
            count60: 1,
            total: 2,
          },
        ];
      }

      return [
        {
          rank: 1,
          userId: "member-9",
          userName: "外组成员",
          count40: 2,
          count60: 1,
          total: 3,
        },
      ];
    });

    const { default: GroupLeaderboardPage } = await importPageFromWorkspace(
      "src/app/(shared)/leaderboard/groups/page.tsx",
    );

    render(await GroupLeaderboardPage());

    expect(screen.getByText(/成员甲/)).toBeInTheDocument();
    expect(screen.getByText(/外组成员/)).toBeInTheDocument();
  });
});
