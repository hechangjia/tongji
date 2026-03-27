import { describe, expect, test, vi } from "vitest";

vi.mock("@/app/(member)/entry/actions", () => ({
  saveSalesEntryAction: vi.fn(),
}));

import { mergeDisplayedDailyRhythmSummary } from "@/components/sales-entry-page-client";
import type { EntryDailyRhythmSummaryData } from "@/components/entry-daily-rhythm-summary";

function createSummary(
  overrides: Partial<EntryDailyRhythmSummaryData> = {},
): EntryDailyRhythmSummaryData {
  return {
    state: "PENDING_REVIEW",
    title: "当日节奏摘要",
    message: "今天的提交已收到，等待管理员审核",
    reviewStatus: "PENDING",
    reviewStatusLabel: "待审核",
    reviewNote: null,
    isTemporaryTop3: false,
    isFormalTop3: false,
    temporaryRank: null,
    formalRank: null,
    top3Label: null,
    top3Message: null,
    lastSubmittedAtIso: "2026-03-27T07:30:45.000Z",
    primaryAction: {
      href: "/leaderboard/daily",
      label: "查看今日榜单",
    },
    secondaryActions: [
      {
        href: "/entry",
        label: "继续填写今日记录",
      },
      {
        href: "/leaderboard/range",
        label: "查看总榜",
      },
    ],
    ...overrides,
  };
}

describe("sales entry page client", () => {
  test("preserves the visible today-summary timestamp when the action summary omits it", () => {
    const initialSummary = createSummary({
      lastSubmittedAtIso: "2026-03-27T07:30:45.000Z",
    });
    const actionSummary = createSummary({
      message: "今天的提交已收到，等待管理员审核",
      lastSubmittedAtIso: null,
    });

    expect(mergeDisplayedDailyRhythmSummary(initialSummary, actionSummary)).toMatchObject({
      message: "今天的提交已收到，等待管理员审核",
      lastSubmittedAtIso: "2026-03-27T07:30:45.000Z",
    });
  });

  test("uses the action timestamp when the action summary provides one", () => {
    const initialSummary = createSummary({
      lastSubmittedAtIso: "2026-03-27T07:30:45.000Z",
    });
    const actionSummary = createSummary({
      lastSubmittedAtIso: "2026-03-27T09:45:12.000Z",
    });

    expect(mergeDisplayedDailyRhythmSummary(initialSummary, actionSummary)).toMatchObject({
      lastSubmittedAtIso: "2026-03-27T09:45:12.000Z",
    });
  });
});
