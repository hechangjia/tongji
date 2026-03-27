import { beforeEach, describe, expect, test, vi } from "vitest";
import { getTodaySaleDateValue } from "@/server/services/sales-service";
const salesRecordFindManyMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  db: {
    salesRecord: {
      findMany: salesRecordFindManyMock,
    },
  },
}));

import {
  buildAdminDailyRhythmSummary,
  buildAdminTodaySalesRows,
  buildFormalTop3,
  buildMemberDailyRhythmSummary,
  buildTemporaryTop3,
  getAdminTodaySalesRows,
  type DailyRhythmSourceRow,
} from "@/server/services/daily-rhythm-service";

const sharedSubmittedAt = new Date("2026-03-27T00:30:00.000Z");

function createRow(
  overrides: Partial<DailyRhythmSourceRow> & Pick<DailyRhythmSourceRow, "id" | "userId" | "userName">,
): DailyRhythmSourceRow {
  const { id, userId, userName, ...rest } = overrides;

  return {
    id,
    userId,
    userName,
    role: "MEMBER",
    status: "ACTIVE",
    saleDate: "2026-03-27",
    count40: 1,
    count60: 0,
    remark: null,
    reviewStatus: "PENDING",
    lastSubmittedAt: sharedSubmittedAt,
    reviewedAt: null,
    reviewNote: null,
    ...rest,
  };
}

describe("daily rhythm service pure helpers", () => {
  beforeEach(() => {
    salesRecordFindManyMock.mockReset();
  });

  test("buildTemporaryTop3 keeps only visible members for the current Asia/Shanghai business day, excludes rejected rows, and uses submission/id tie-breakers", () => {
    const todaySaleDate = getTodaySaleDateValue(new Date("2026-03-27T00:30:00+08:00"));
    const rows: DailyRhythmSourceRow[] = [
      createRow({
        id: "pending-earliest",
        userId: "member-1",
        userName: "最早提交",
        reviewStatus: "PENDING",
        lastSubmittedAt: new Date("2026-03-26T16:01:00.000Z"),
      }),
      createRow({
        id: "approved-same-time-b",
        userId: "member-2",
        userName: "同秒-B",
        reviewStatus: "APPROVED",
      }),
      createRow({
        id: "approved-same-time-a",
        userId: "member-3",
        userName: "同秒-A",
        reviewStatus: "APPROVED",
      }),
      createRow({
        id: "rejected-hidden",
        userId: "member-4",
        userName: "被拒绝",
        reviewStatus: "REJECTED",
        lastSubmittedAt: new Date("2026-03-26T16:00:00.000Z"),
      }),
      createRow({
        id: "yesterday-record",
        userId: "member-5",
        userName: "昨天记录",
        saleDate: "2026-03-26",
        reviewStatus: "APPROVED",
        lastSubmittedAt: new Date("2026-03-27T03:00:00.000Z"),
      }),
      createRow({
        id: "inactive-member",
        userId: "member-6",
        userName: "停用成员",
        status: "INACTIVE",
        reviewStatus: "APPROVED",
      }),
      createRow({
        id: "admin-user",
        userId: "admin-1",
        userName: "管理员",
        role: "ADMIN",
        reviewStatus: "APPROVED",
      }),
    ];

    expect(buildTemporaryTop3(rows, todaySaleDate).map((row) => row.userName)).toEqual([
      "最早提交",
      "同秒-A",
      "同秒-B",
    ]);
  });

  test("buildFormalTop3 includes approved rows only and keeps the same ordering rules", () => {
    const rows: DailyRhythmSourceRow[] = [
      createRow({
        id: "pending-1",
        userId: "member-1",
        userName: "待审核",
        reviewStatus: "PENDING",
        lastSubmittedAt: new Date("2026-03-26T16:00:00.000Z"),
      }),
      createRow({
        id: "approved-2",
        userId: "member-2",
        userName: "正式第二",
        reviewStatus: "APPROVED",
        lastSubmittedAt: new Date("2026-03-26T16:02:00.000Z"),
      }),
      createRow({
        id: "approved-1",
        userId: "member-3",
        userName: "正式第一",
        reviewStatus: "APPROVED",
        lastSubmittedAt: new Date("2026-03-26T16:01:00.000Z"),
      }),
      createRow({
        id: "approved-3",
        userId: "member-4",
        userName: "正式第三",
        reviewStatus: "APPROVED",
        lastSubmittedAt: new Date("2026-03-26T16:03:00.000Z"),
      }),
      createRow({
        id: "rejected-1",
        userId: "member-5",
        userName: "已拒绝",
        reviewStatus: "REJECTED",
        lastSubmittedAt: new Date("2026-03-26T15:59:00.000Z"),
      }),
    ];

    expect(buildFormalTop3(rows, "2026-03-27").map((row) => row.userName)).toEqual([
      "正式第一",
      "正式第二",
      "正式第三",
    ]);
  });

  test("buildMemberDailyRhythmSummary returns no-submission guidance", () => {
    expect(
      buildMemberDailyRhythmSummary({
        rows: [],
        currentUserId: "member-1",
        todaySaleDate: "2026-03-27",
      }),
    ).toMatchObject({
      state: "NO_SUBMISSION",
      message: "今天还没有提交销售记录",
      title: "当日节奏提醒",
      primaryAction: { href: "/entry", label: "去填写今日记录" },
      secondaryActions: [
        { href: "/leaderboard/daily", label: "查看今日榜单" },
        { href: "/leaderboard/range", label: "查看总榜" },
      ],
      isTemporaryTop3: false,
      isFormalTop3: false,
      reviewStatusLabel: null,
      top3Label: null,
      top3Message: null,
    });
  });

  test("buildMemberDailyRhythmSummary collapses submitted but unapproved rows into pending review", () => {
    expect(
      buildMemberDailyRhythmSummary({
        rows: [
          createRow({
            id: "pending-top3",
            userId: "member-1",
            userName: "我",
            reviewStatus: "PENDING",
            lastSubmittedAt: new Date("2026-03-26T16:00:00.000Z"),
          }),
          createRow({
            id: "approved-1",
            userId: "member-2",
            userName: "成员2",
            reviewStatus: "APPROVED",
            lastSubmittedAt: new Date("2026-03-26T16:01:00.000Z"),
          }),
          createRow({
            id: "approved-2",
            userId: "member-3",
            userName: "成员3",
            reviewStatus: "APPROVED",
            lastSubmittedAt: new Date("2026-03-26T16:02:00.000Z"),
          }),
        ],
        currentUserId: "member-1",
        todaySaleDate: "2026-03-27",
      }),
    ).toMatchObject({
      state: "PENDING_REVIEW",
      message: "今天的提交已收到，等待管理员审核",
      title: "当日节奏摘要",
      isTemporaryTop3: true,
      isFormalTop3: false,
      reviewStatusLabel: "待审核",
      top3Label: "临时前三",
      top3Message: "当前处于临时第 1 名",
    });
  });

  test("buildMemberDailyRhythmSummary deterministically chooses the earliest current-user row if bad duplicate rows exist", () => {
    expect(
      buildMemberDailyRhythmSummary({
        rows: [
          createRow({
            id: "self-later",
            userId: "member-1",
            userName: "我",
            reviewStatus: "APPROVED",
            lastSubmittedAt: new Date("2026-03-26T16:05:00.000Z"),
          }),
          createRow({
            id: "self-earlier",
            userId: "member-1",
            userName: "我",
            reviewStatus: "PENDING",
            lastSubmittedAt: new Date("2026-03-26T16:01:00.000Z"),
          }),
          createRow({
            id: "approved-1",
            userId: "member-2",
            userName: "成员2",
            reviewStatus: "APPROVED",
            lastSubmittedAt: new Date("2026-03-26T16:02:00.000Z"),
          }),
        ],
        currentUserId: "member-1",
        todaySaleDate: "2026-03-27",
      }),
    ).toMatchObject({
      state: "PENDING_REVIEW",
      reviewStatus: "PENDING",
      temporaryRank: 1,
      formalRank: null,
    });
  });

  test("buildMemberDailyRhythmSummary marks approved members outside the formal top 3 when approved count reaches three", () => {
    expect(
      buildMemberDailyRhythmSummary({
        rows: [
          createRow({
            id: "approved-4",
            userId: "member-1",
            userName: "我",
            reviewStatus: "APPROVED",
            lastSubmittedAt: new Date("2026-03-26T16:04:00.000Z"),
          }),
          createRow({
            id: "approved-1",
            userId: "member-2",
            userName: "成员2",
            reviewStatus: "APPROVED",
            lastSubmittedAt: new Date("2026-03-26T16:01:00.000Z"),
          }),
          createRow({
            id: "approved-2",
            userId: "member-3",
            userName: "成员3",
            reviewStatus: "APPROVED",
            lastSubmittedAt: new Date("2026-03-26T16:02:00.000Z"),
          }),
          createRow({
            id: "approved-3",
            userId: "member-4",
            userName: "成员4",
            reviewStatus: "APPROVED",
            lastSubmittedAt: new Date("2026-03-26T16:03:00.000Z"),
          }),
          createRow({
            id: "pending-1",
            userId: "member-5",
            userName: "成员5",
            reviewStatus: "PENDING",
            lastSubmittedAt: new Date("2026-03-26T16:05:00.000Z"),
          }),
        ],
        currentUserId: "member-1",
        todaySaleDate: "2026-03-27",
      }),
    ).toMatchObject({
      state: "APPROVED_NOT_TOP3",
      message: "今天的记录已通过审核，继续保持",
      isTemporaryTop3: false,
      isFormalTop3: false,
    });
  });

  test("buildMemberDailyRhythmSummary treats rejected-only submissions as needing resubmission", () => {
    expect(
      buildMemberDailyRhythmSummary({
        rows: [
          createRow({
            id: "rejected-self",
            userId: "member-1",
            userName: "我",
            reviewStatus: "REJECTED",
            reviewNote: "请补充备注",
          }),
          createRow({
            id: "rejected-other",
            userId: "member-2",
            userName: "成员2",
            reviewStatus: "REJECTED",
          }),
        ],
        currentUserId: "member-1",
        todaySaleDate: "2026-03-27",
      }),
    ).toMatchObject({
      state: "REJECTED",
      message: "今天的记录被退回，请尽快重新提交",
      reviewNote: "请补充备注",
      primaryAction: { href: "/entry", label: "重新提交今日记录" },
      secondaryActions: [
        { href: "/leaderboard/daily", label: "查看今日榜单" },
        { href: "/leaderboard/range", label: "查看总榜" },
      ],
    });
  });

  test("buildAdminDailyRhythmSummary reports review progress for no submissions, pending-only, approved-under-3, approved-with-pending, and all-rejected cases", () => {
    expect(
      buildAdminDailyRhythmSummary({
        rows: [],
        todaySaleDate: "2026-03-27",
      }),
    ).toMatchObject({
      message: "今天还没有成员提交销售记录",
      pendingCount: 0,
      top3ConfirmationStatus: "NOT_CONFIRMED",
      top3Status: {
        temporaryCount: 0,
        formalCount: 0,
        isFormalTop3Complete: false,
      },
      secondaryActions: [
        { href: "/leaderboard/range", label: "查看总榜" },
        { href: "/admin/announcements", label: "管理公告" },
      ],
    });

    expect(
      buildAdminDailyRhythmSummary({
        rows: [
          createRow({
            id: "pending-1",
            userId: "member-1",
            userName: "成员1",
            reviewStatus: "PENDING",
          }),
          createRow({
            id: "pending-2",
            userId: "member-2",
            userName: "成员2",
            reviewStatus: "PENDING",
            lastSubmittedAt: new Date("2026-03-26T16:01:00.000Z"),
          }),
        ],
        todaySaleDate: "2026-03-27",
      }),
    ).toMatchObject({
      message: "今天已有 2 条提交，等待管理员审核",
      pendingCount: 2,
      top3ConfirmationStatus: "NOT_CONFIRMED",
      top3Status: {
        temporaryCount: 2,
        formalCount: 0,
        isFormalTop3Complete: false,
      },
    });

    expect(
      buildAdminDailyRhythmSummary({
        rows: [
          createRow({
            id: "approved-1",
            userId: "member-1",
            userName: "成员1",
            reviewStatus: "APPROVED",
          }),
          createRow({
            id: "approved-2",
            userId: "member-2",
            userName: "成员2",
            reviewStatus: "APPROVED",
            lastSubmittedAt: new Date("2026-03-26T16:01:00.000Z"),
          }),
        ],
        todaySaleDate: "2026-03-27",
      }),
    ).toMatchObject({
      message: "今日正式前三还差 1 人",
      pendingCount: 0,
      top3ConfirmationStatus: "NOT_CONFIRMED",
      top3Status: {
        temporaryCount: 2,
        formalCount: 2,
        isFormalTop3Complete: false,
      },
    });

    expect(
      buildAdminDailyRhythmSummary({
        rows: [
          createRow({
            id: "approved-1",
            userId: "member-1",
            userName: "成员1",
            reviewStatus: "APPROVED",
          }),
          createRow({
            id: "approved-2",
            userId: "member-2",
            userName: "成员2",
            reviewStatus: "APPROVED",
            lastSubmittedAt: new Date("2026-03-26T16:01:00.000Z"),
          }),
          createRow({
            id: "approved-3",
            userId: "member-3",
            userName: "成员3",
            reviewStatus: "APPROVED",
            lastSubmittedAt: new Date("2026-03-26T16:02:00.000Z"),
          }),
          createRow({
            id: "pending-1",
            userId: "member-4",
            userName: "成员4",
            reviewStatus: "PENDING",
            lastSubmittedAt: new Date("2026-03-26T16:03:00.000Z"),
          }),
        ],
        todaySaleDate: "2026-03-27",
      }),
    ).toMatchObject({
      message: "今日正式前三已确定，仍有 1 条待审核记录",
      pendingCount: 1,
      top3ConfirmationStatus: "CONFIRMED",
      top3Status: {
        temporaryCount: 3,
        formalCount: 3,
        isFormalTop3Complete: true,
      },
    });

    expect(
      buildAdminDailyRhythmSummary({
        rows: [
          createRow({
            id: "rejected-1",
            userId: "member-1",
            userName: "成员1",
            reviewStatus: "REJECTED",
          }),
          createRow({
            id: "rejected-2",
            userId: "member-2",
            userName: "成员2",
            reviewStatus: "REJECTED",
            reviewNote: "请重提",
          }),
        ],
        todaySaleDate: "2026-03-27",
      }),
    ).toMatchObject({
      message: "今天的提交已全部驳回，等待成员重新提交",
      pendingCount: 0,
      top3ConfirmationStatus: "NOT_CONFIRMED",
      top3Status: {
        temporaryCount: 0,
        formalCount: 0,
        isFormalTop3Complete: false,
      },
    });
  });

  test("buildAdminTodaySalesRows pre-annotates temporary and formal top3 flags", () => {
    expect(
      buildAdminTodaySalesRows(
        [
          createRow({
            id: "pending-1",
            userId: "member-1",
            userName: "成员1",
            reviewStatus: "PENDING",
            lastSubmittedAt: new Date("2026-03-26T16:01:00.000Z"),
          }),
          createRow({
            id: "approved-1",
            userId: "member-2",
            userName: "成员2",
            reviewStatus: "APPROVED",
            lastSubmittedAt: new Date("2026-03-26T16:02:00.000Z"),
          }),
          createRow({
            id: "approved-2",
            userId: "member-3",
            userName: "成员3",
            reviewStatus: "APPROVED",
            lastSubmittedAt: new Date("2026-03-26T16:03:00.000Z"),
          }),
          createRow({
            id: "approved-3",
            userId: "member-4",
            userName: "成员4",
            reviewStatus: "APPROVED",
            lastSubmittedAt: new Date("2026-03-26T16:04:00.000Z"),
          }),
        ],
        "2026-03-27",
      ),
    ).toEqual([
      expect.objectContaining({
        id: "pending-1",
        isTemporaryTop3: true,
        isFormalTop3: false,
      }),
      expect.objectContaining({
        id: "approved-1",
        isTemporaryTop3: true,
        isFormalTop3: true,
      }),
      expect.objectContaining({
        id: "approved-2",
        isTemporaryTop3: true,
        isFormalTop3: true,
      }),
      expect.objectContaining({
        id: "approved-3",
        isTemporaryTop3: false,
        isFormalTop3: true,
      }),
    ]);
  });

  test("getAdminTodaySalesRows maps database rows into the admin DTO shape", async () => {
    salesRecordFindManyMock.mockResolvedValueOnce([
      {
        id: "record-1",
        saleDate: new Date("2026-03-27T00:00:00.000Z"),
        count40: 2,
        count60: 1,
        remark: "地推",
        reviewStatus: "APPROVED",
        lastSubmittedAt: new Date("2026-03-26T16:01:00.000Z"),
        reviewedAt: new Date("2026-03-26T17:00:00.000Z"),
        reviewNote: "通过",
        user: {
          id: "member-1",
          name: "",
          username: "fallback-user",
          role: "MEMBER",
          status: "ACTIVE",
        },
      },
      {
        id: "record-2",
        saleDate: new Date("2026-03-27T00:00:00.000Z"),
        count40: 1,
        count60: 0,
        remark: null,
        reviewStatus: "PENDING",
        lastSubmittedAt: new Date("2026-03-26T16:02:00.000Z"),
        reviewedAt: null,
        reviewNote: null,
        user: {
          id: "member-2",
          name: "实名成员",
          username: "named-user",
          role: "MEMBER",
          status: "ACTIVE",
        },
      },
    ]);

    await expect(
      getAdminTodaySalesRows({
        todaySaleDate: "2026-03-27",
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        id: "record-1",
        userId: "member-1",
        userName: "fallback-user",
        saleDate: "2026-03-27",
        reviewStatus: "APPROVED",
        lastSubmittedAt: new Date("2026-03-26T16:01:00.000Z"),
        reviewedAt: new Date("2026-03-26T17:00:00.000Z"),
        reviewNote: "通过",
        isTemporaryTop3: true,
        isFormalTop3: true,
      }),
      expect.objectContaining({
        id: "record-2",
        userId: "member-2",
        userName: "实名成员",
        saleDate: "2026-03-27",
        reviewStatus: "PENDING",
        lastSubmittedAt: new Date("2026-03-26T16:02:00.000Z"),
        reviewedAt: null,
        reviewNote: null,
        isTemporaryTop3: true,
        isFormalTop3: false,
      }),
    ]);
    expect(salesRecordFindManyMock).toHaveBeenCalledWith({
      where: {
        saleDate: new Date("2026-03-27T00:00:00.000Z"),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
            status: true,
          },
        },
      },
    });
  });
});
