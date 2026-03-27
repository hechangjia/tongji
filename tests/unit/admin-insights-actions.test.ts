import { beforeEach, describe, expect, test, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() =>
  vi.fn((target: string) => {
    throw new Error(`redirect:${target}`);
  }),
);
const revalidatePathMock = vi.hoisted(() => vi.fn());
const refreshLeaderboardCachesMock = vi.hoisted(() => vi.fn());
const dailyTargetUpdateMock = vi.hoisted(() => vi.fn());
const memberReminderCreateMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/server/services/leaderboard-cache", () => ({
  refreshLeaderboardCaches: refreshLeaderboardCachesMock,
}));

vi.mock("@/server/services/daily-target-service", () => ({
  updateFinalDailyTarget: dailyTargetUpdateMock,
}));

vi.mock("@/server/services/member-reminder-service", async () => {
  const actual =
    await vi.importActual<typeof import("@/server/services/member-reminder-service")>(
      "@/server/services/member-reminder-service",
    );

  return {
    ...actual,
    createMemberReminder: memberReminderCreateMock,
  };
});

import {
  adjustDailyTargetAction,
  sendMemberReminderAction,
} from "@/app/(admin)/admin/insights/actions";

describe("admin insights actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({
      user: {
        id: "admin-1",
        role: "ADMIN",
      },
    });
  });

  test("admin can update final target from the insights page", async () => {
    dailyTargetUpdateMock.mockResolvedValue({});

    const formData = new FormData();
    formData.set("targetId", "target-1");
    formData.set("finalTotal", "8");
    formData.set("returnTo", "/admin/insights");

    await expect(adjustDailyTargetAction(formData)).rejects.toThrow(
      "redirect:/admin/insights?notice=",
    );

    expect(dailyTargetUpdateMock).toHaveBeenCalledWith({
      targetId: "target-1",
      finalTotal: 8,
      adjustedById: "admin-1",
    });
  });

  test("admin can create a reminder from template context", async () => {
    memberReminderCreateMock.mockResolvedValue({});

    const formData = new FormData();
    formData.set("userId", "member-1");
    formData.set("template", "TARGET_GAP");
    formData.set("title", "今日目标仍有差距");
    formData.set("content", "你今天距离目标还差 3 单，请尽快跟进。");
    formData.set("returnTo", "/admin/insights");

    await expect(sendMemberReminderAction(formData)).rejects.toThrow(
      "redirect:/admin/insights?notice=",
    );

    expect(memberReminderCreateMock).toHaveBeenCalledWith({
      userId: "member-1",
      type: "TARGET_GAP",
      title: "今日目标仍有差距",
      content: "你今天距离目标还差 3 单，请尽快跟进。",
      sentById: "admin-1",
    });
  });
});
