import { render, screen } from "@testing-library/react";
import { pathToFileURL } from "node:url";
import { beforeEach, describe, expect, test, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() =>
  vi.fn((target: string) => {
    throw new Error(`redirect:${target}`);
  }),
);
const findUniqueMock = vi.hoisted(() => vi.fn());
const getCachedAdminCumulativeTrendMock = vi.hoisted(() => vi.fn());
const getCachedAdminDailyRhythmSummaryMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
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
    expect(screen.getByText("北极星组")).toBeInTheDocument();
    expect(screen.getByText("组员人数")).toBeInTheDocument();
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

  test("leader sales page shows a later-phase placeholder", async () => {
    const { default: LeaderSalesPage } = await importPageFromWorkspace(
      "src/app/(leader)/leader/sales/page.tsx",
    );

    render(await LeaderSalesPage());

    expect(screen.getByText("小组销售")).toBeInTheDocument();
    expect(screen.getByText("小组销售能力将在后续阶段补齐")).toBeInTheDocument();
  });

  test("shared group leaderboard page shows the placeholder title", async () => {
    const { default: GroupLeaderboardPage } = await importPageFromWorkspace(
      "src/app/(shared)/leaderboard/groups/page.tsx",
    );

    render(await GroupLeaderboardPage());

    expect(screen.getByText("小组榜单")).toBeInTheDocument();
    expect(screen.getByText(/建设中/)).toBeInTheDocument();
  });

  test("shared group leaderboard renders without shell for anonymous visitors", async () => {
    authMock.mockResolvedValue(null);
    const { default: GroupLeaderboardPage } = await importPageFromWorkspace(
      "src/app/(shared)/leaderboard/groups/page.tsx",
    );

    render(await GroupLeaderboardPage());

    expect(screen.getByText("小组榜单")).toBeInTheDocument();
    expect(screen.queryByTestId("app-shell")).not.toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
