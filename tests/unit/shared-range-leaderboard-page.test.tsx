import { render, screen } from "@testing-library/react";
import { pathToFileURL } from "node:url";
import { beforeEach, describe, expect, test, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const cookiesMock = vi.hoisted(() => vi.fn());
const getCachedRangeLeaderboardMock = vi.hoisted(() => vi.fn());
const getCachedMemberCumulativeRankingMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@/server/services/leaderboard-cache", () => ({
  getCachedRangeLeaderboard: getCachedRangeLeaderboardMock,
  getCachedMemberCumulativeRanking: getCachedMemberCumulativeRankingMock,
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
    actions,
    children,
  }: {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    children?: React.ReactNode;
  }) => (
    <section>
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
      {actions}
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

vi.mock("@/components/leaderboard-table", () => ({
  LeaderboardTable: ({
    title,
  }: {
    title: string;
  }) => <div>{title}</div>,
}));

vi.mock("@/components/cumulative-ranking-chart", () => ({
  CumulativeRankingChart: () => <div>cumulative-ranking-chart</div>,
}));

async function importPageFromWorkspace(relativePath: string) {
  const moduleUrl = pathToFileURL(`${process.cwd()}/${relativePath}`).href;

  return import(/* @vite-ignore */ moduleUrl);
}

describe("shared range leaderboard page", () => {
  test("exports a deferred personalized chart section so leaderboard content can render first", async () => {
    const module = await import("@/app/(shared)/leaderboard/range/page");

    expect(module).toHaveProperty("RangeLeaderboardPersonalizedChartSection");
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    cookiesMock.mockResolvedValue({
      has: vi.fn().mockReturnValue(false),
    });
    getCachedRangeLeaderboardMock.mockResolvedValue([
      {
        rank: 1,
        userName: "张三",
        count40: 8,
        count60: 4,
        total: 12,
      },
    ]);
    getCachedMemberCumulativeRankingMock.mockResolvedValue([
      {
        rank: 1,
        userName: "张三",
        total: 12,
        isCurrentUser: true,
      },
    ]);
  });

  test("renders the public range leaderboard without personalized chart for anonymous visitors", async () => {
    authMock.mockResolvedValue(null);

    const { default: RangeLeaderboardPage } = await importPageFromWorkspace(
      "src/app/(shared)/leaderboard/range/page.tsx",
    );

    render(await RangeLeaderboardPage({}));

    expect(screen.getByText("总榜")).toBeInTheDocument();
    expect(screen.queryByText("cumulative-ranking-chart")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "导出 Excel" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-shell")).not.toBeInTheDocument();
    expect(authMock).not.toHaveBeenCalled();
  });

  test("checks auth when a session cookie candidate is present", async () => {
    cookiesMock.mockResolvedValue({
      has: vi
        .fn()
        .mockImplementation((name: string) => name === "authjs.session-token"),
    });
    authMock.mockResolvedValue({
      user: {
        id: "member-1",
        role: "MEMBER",
        username: "member01",
        name: "成员一号",
      },
    });

    const { default: RangeLeaderboardPage } = await importPageFromWorkspace(
      "src/app/(shared)/leaderboard/range/page.tsx",
    );

    render(await RangeLeaderboardPage({}));

    expect(authMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText("cumulative-ranking-chart")).toBeInTheDocument();
  });

  test("renders personalized chart for signed-in members", async () => {
    cookiesMock.mockResolvedValue({
      has: vi
        .fn()
        .mockImplementation((name: string) => name === "authjs.session-token"),
    });
    authMock.mockResolvedValue({
      user: {
        id: "member-1",
        role: "MEMBER",
        username: "member01",
        name: "成员一号",
      },
    });

    const { default: RangeLeaderboardPage } = await importPageFromWorkspace(
      "src/app/(shared)/leaderboard/range/page.tsx",
    );

    render(await RangeLeaderboardPage({}));

    expect(screen.getByText("总榜")).toBeInTheDocument();
    expect(screen.getByText("cumulative-ranking-chart")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "导出 Excel" })).not.toBeInTheDocument();
    expect(screen.getByTestId("app-shell")).toBeInTheDocument();
  });

  test("renders export entry for admins", async () => {
    cookiesMock.mockResolvedValue({
      has: vi
        .fn()
        .mockImplementation((name: string) => name === "__Secure-authjs.session-token"),
    });
    authMock.mockResolvedValue({
      user: {
        id: "admin-1",
        role: "ADMIN",
        username: "admin",
        name: "管理员",
      },
    });

    const { default: RangeLeaderboardPage } = await importPageFromWorkspace(
      "src/app/(shared)/leaderboard/range/page.tsx",
    );

    render(await RangeLeaderboardPage({}));

    expect(screen.getByRole("link", { name: "导出 Excel" })).toBeInTheDocument();
    expect(screen.getByText("cumulative-ranking-chart")).toBeInTheDocument();
  });
});
