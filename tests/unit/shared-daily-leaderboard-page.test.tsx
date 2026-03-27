import { render, screen } from "@testing-library/react";
import { pathToFileURL } from "node:url";
import { describe, expect, test, vi } from "vitest";

const getCachedDailyLeaderboardMock = vi.hoisted(() => vi.fn());
const getCachedDailyTop3StatusMock = vi.hoisted(() => vi.fn());

vi.mock("@/server/services/leaderboard-cache", () => ({
  getCachedDailyLeaderboard: getCachedDailyLeaderboardMock,
  getCachedDailyTop3Status: getCachedDailyTop3StatusMock,
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

vi.mock("@/components/daily-top3-strip", () => ({
  DailyTop3Strip: () => <div>daily-top3-strip</div>,
}));

vi.mock("@/components/leaderboard-table", () => ({
  LeaderboardTable: ({
    title,
  }: {
    title: string;
  }) => <div>{title}</div>,
}));

async function importPageFromWorkspace(relativePath: string) {
  const moduleUrl = pathToFileURL(`${process.cwd()}/${relativePath}`).href;

  return import(/* @vite-ignore */ moduleUrl);
}

describe("shared daily leaderboard page", () => {
  test("renders as a public page without app shell dependencies", async () => {
    getCachedDailyLeaderboardMock.mockResolvedValue([
      {
        rank: 1,
        userName: "张三",
        count40: 2,
        count60: 1,
        total: 3,
      },
    ]);
    getCachedDailyTop3StatusMock.mockResolvedValue({
      temporaryTop3: [],
      formalTop3: [],
    });

    const { default: DailyLeaderboardPage } = await importPageFromWorkspace(
      "src/app/(shared)/leaderboard/daily/page.tsx",
    );

    render(await DailyLeaderboardPage({}));

    expect(screen.getByText("日榜")).toBeInTheDocument();
    expect(screen.getByText("daily-top3-strip")).toBeInTheDocument();
    expect(screen.getByText(/每日排行榜/)).toBeInTheDocument();
  });
});
