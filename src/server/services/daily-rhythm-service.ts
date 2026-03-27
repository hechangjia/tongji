import type { Role, SalesReviewStatus, UserStatus } from "@prisma/client";
import { db } from "@/lib/db";
import {
  getTodaySaleDateValue,
  saleDateToValue,
  saleDateValueToDate,
  type DateValue,
} from "@/server/services/sales-service";

type DailyRhythmAction = {
  href: string;
  label: string;
};

export type DailyRhythmSourceRow = {
  id: string;
  userId: string;
  userName: string;
  role: Role;
  status: UserStatus;
  saleDate: DateValue;
  count40: number;
  count60: number;
  remark: string | null;
  reviewStatus: SalesReviewStatus;
  lastSubmittedAt: Date | null;
  reviewedAt: Date | null;
  reviewNote: string | null;
};

export type DailyRhythmTop3Row = Pick<
  DailyRhythmSourceRow,
  "id" | "userId" | "userName" | "reviewStatus" | "lastSubmittedAt"
> & {
  rank: number;
};

export type DailyTop3Status = {
  temporaryTop3: DailyRhythmTop3Row[];
  formalTop3: DailyRhythmTop3Row[];
  temporaryCount: number;
  formalCount: number;
  isFormalTop3Complete: boolean;
};

export type MemberDailyRhythmState =
  | "NO_SUBMISSION"
  | "PENDING_REVIEW"
  | "FORMAL_TOP3"
  | "APPROVED_NOT_TOP3"
  | "REJECTED";

export type MemberDailyRhythmSummary = {
  state: MemberDailyRhythmState;
  message: string;
  reviewStatus: SalesReviewStatus | "NONE";
  reviewNote: string | null;
  isTemporaryTop3: boolean;
  isFormalTop3: boolean;
  temporaryRank: number | null;
  formalRank: number | null;
  primaryAction: DailyRhythmAction;
  secondaryActions: DailyRhythmAction[];
};

export type AdminDailyRhythmSummary = {
  message: string;
  pendingCount: number;
  top3Status: "NOT_CONFIRMED" | "CONFIRMED";
  top3Details: DailyTop3Status;
  primaryAction: DailyRhythmAction;
  secondaryActions: DailyRhythmAction[];
};

export type AdminTodaySalesRow = Pick<
  DailyRhythmSourceRow,
  | "id"
  | "userId"
  | "userName"
  | "saleDate"
  | "count40"
  | "count60"
  | "remark"
  | "reviewStatus"
  | "lastSubmittedAt"
  | "reviewedAt"
  | "reviewNote"
> & {
  isTemporaryTop3: boolean;
  isFormalTop3: boolean;
};

export type DailyTop3StatusInput = {
  todaySaleDate?: DateValue;
  now?: Date;
};

function isVisibleMemberRow(row: Pick<DailyRhythmSourceRow, "role" | "status">) {
  return row.role === "MEMBER" && row.status === "ACTIVE";
}

function isBusinessDayRow(
  row: Pick<DailyRhythmSourceRow, "saleDate" | "role" | "status">,
  todaySaleDate: DateValue,
) {
  return row.saleDate === todaySaleDate && isVisibleMemberRow(row);
}

function compareBySubmissionOrder(
  left: Pick<DailyRhythmSourceRow, "id" | "lastSubmittedAt">,
  right: Pick<DailyRhythmSourceRow, "id" | "lastSubmittedAt">,
) {
  const leftTimestamp = left.lastSubmittedAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const rightTimestamp = right.lastSubmittedAt?.getTime() ?? Number.MAX_SAFE_INTEGER;

  if (leftTimestamp !== rightTimestamp) {
    return leftTimestamp - rightTimestamp;
  }

  return left.id.localeCompare(right.id);
}

function rankTop3Rows(rows: DailyRhythmSourceRow[]) {
  return rows
    .slice()
    .sort(compareBySubmissionOrder)
    .slice(0, 3)
    .map((row, index) => ({
      id: row.id,
      userId: row.userId,
      userName: row.userName,
      reviewStatus: row.reviewStatus,
      lastSubmittedAt: row.lastSubmittedAt,
      rank: index + 1,
    }));
}

function filterCurrentBusinessDayRows(rows: DailyRhythmSourceRow[], todaySaleDate: DateValue) {
  return rows.filter((row) => isBusinessDayRow(row, todaySaleDate));
}

function buildDailyTop3Status(rows: DailyRhythmSourceRow[], todaySaleDate: DateValue): DailyTop3Status {
  const temporaryTop3 = buildTemporaryTop3(rows, todaySaleDate);
  const formalTop3 = buildFormalTop3(rows, todaySaleDate);

  return {
    temporaryTop3,
    formalTop3,
    temporaryCount: temporaryTop3.length,
    formalCount: formalTop3.length,
    isFormalTop3Complete: formalTop3.length >= 3,
  };
}

export function buildTemporaryTop3(rows: DailyRhythmSourceRow[], todaySaleDate: DateValue) {
  return rankTop3Rows(
    filterCurrentBusinessDayRows(rows, todaySaleDate).filter(
      (row) => row.reviewStatus === "PENDING" || row.reviewStatus === "APPROVED",
    ),
  );
}

export function buildFormalTop3(rows: DailyRhythmSourceRow[], todaySaleDate: DateValue) {
  return rankTop3Rows(
    filterCurrentBusinessDayRows(rows, todaySaleDate).filter(
      (row) => row.reviewStatus === "APPROVED",
    ),
  );
}

export function buildMemberDailyRhythmSummary({
  rows,
  currentUserId,
  todaySaleDate,
}: {
  rows: DailyRhythmSourceRow[];
  currentUserId: string;
  todaySaleDate: DateValue;
}): MemberDailyRhythmSummary {
  const todayRows = filterCurrentBusinessDayRows(rows, todaySaleDate);
  const currentRow = todayRows.find((row) => row.userId === currentUserId);
  const top3Status = buildDailyTop3Status(todayRows, todaySaleDate);
  const temporaryRank =
    top3Status.temporaryTop3.find((row) => row.userId === currentUserId)?.rank ?? null;
  const formalRank = top3Status.formalTop3.find((row) => row.userId === currentUserId)?.rank ?? null;

  if (!currentRow) {
    return {
      state: "NO_SUBMISSION",
      message: "今天还没有提交销售记录",
      reviewStatus: "NONE",
      reviewNote: null,
      isTemporaryTop3: false,
      isFormalTop3: false,
      temporaryRank: null,
      formalRank: null,
      primaryAction: {
        href: "/entry",
        label: "去填写今日记录",
      },
      secondaryActions: [
        {
          href: "/leaderboard/daily",
          label: "查看今日榜单",
        },
        {
          href: "/leaderboard/range",
          label: "查看总榜",
        },
      ],
    };
  }

  if (currentRow.reviewStatus === "REJECTED") {
    return {
      state: "REJECTED",
      message: "今天的记录被退回，请尽快重新提交",
      reviewStatus: currentRow.reviewStatus,
      reviewNote: currentRow.reviewNote,
      isTemporaryTop3: false,
      isFormalTop3: false,
      temporaryRank: null,
      formalRank: null,
      primaryAction: {
        href: "/entry",
        label: "重新提交今日记录",
      },
      secondaryActions: [
        {
          href: "/leaderboard/daily",
          label: "查看今日榜单",
        },
        {
          href: "/leaderboard/range",
          label: "查看总榜",
        },
      ],
    };
  }

  if (currentRow.reviewStatus === "PENDING") {
    return {
      state: "PENDING_REVIEW",
      message: "今天的提交已收到，等待管理员审核",
      reviewStatus: currentRow.reviewStatus,
      reviewNote: null,
      isTemporaryTop3: temporaryRank !== null,
      isFormalTop3: false,
      temporaryRank,
      formalRank: null,
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
    };
  }

  if (formalRank !== null) {
    return {
      state: "FORMAL_TOP3",
      message: "今天的记录已通过审核，已进入正式前三",
      reviewStatus: currentRow.reviewStatus,
      reviewNote: null,
      isTemporaryTop3: temporaryRank !== null,
      isFormalTop3: true,
      temporaryRank,
      formalRank,
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
    };
  }

  return {
    state: "APPROVED_NOT_TOP3",
    message: "今天的记录已通过审核，继续保持",
    reviewStatus: currentRow.reviewStatus,
    reviewNote: null,
    isTemporaryTop3: false,
    isFormalTop3: false,
    temporaryRank: null,
    formalRank: null,
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
  };
}

export function buildAdminDailyRhythmSummary({
  rows,
  todaySaleDate,
}: {
  rows: DailyRhythmSourceRow[];
  todaySaleDate: DateValue;
}): AdminDailyRhythmSummary {
  const todayRows = filterCurrentBusinessDayRows(rows, todaySaleDate);
  const top3Status = buildDailyTop3Status(todayRows, todaySaleDate);
  const pendingCount = todayRows.filter((row) => row.reviewStatus === "PENDING").length;
  const approvedCount = todayRows.filter((row) => row.reviewStatus === "APPROVED").length;
  const submittedCount = todayRows.filter(
    (row) => row.reviewStatus === "PENDING" || row.reviewStatus === "APPROVED",
  ).length;
  const rejectedCount = todayRows.filter((row) => row.reviewStatus === "REJECTED").length;

  let message = "今天还没有成员提交销售记录";

  if (top3Status.isFormalTop3Complete && pendingCount > 0) {
    message = `今日正式前三已确定，仍有 ${pendingCount} 条待审核记录`;
  } else if (top3Status.isFormalTop3Complete) {
    message = "今日正式前三已确定";
  } else if (pendingCount > 0 && approvedCount === 0) {
    message = `今天已有 ${pendingCount} 条提交，等待管理员审核`;
  } else if (approvedCount > 0) {
    message = `今日正式前三还差 ${Math.max(3 - approvedCount, 0)} 人`;
  } else if (submittedCount === 0 && rejectedCount > 0) {
    message = "今天的提交已全部驳回，等待成员重新提交";
  }

  return {
    message,
    pendingCount,
    top3Status: top3Status.isFormalTop3Complete ? "CONFIRMED" : "NOT_CONFIRMED",
    top3Details: top3Status,
    primaryAction: {
      href: "/admin/sales",
      label: pendingCount > 0 ? "去审核今日记录" : "查看今日销售记录",
    },
    secondaryActions: [
      {
        href: "/leaderboard/range",
        label: "查看总榜",
      },
      {
        href: "/admin/announcements",
        label: "管理公告",
      },
    ],
  };
}

export function buildAdminTodaySalesRows(
  rows: DailyRhythmSourceRow[],
  todaySaleDate: DateValue,
): AdminTodaySalesRow[] {
  const todayRows = filterCurrentBusinessDayRows(rows, todaySaleDate).slice().sort(compareBySubmissionOrder);
  const temporaryIds = new Set(buildTemporaryTop3(todayRows, todaySaleDate).map((row) => row.id));
  const formalIds = new Set(buildFormalTop3(todayRows, todaySaleDate).map((row) => row.id));

  return todayRows.map((row) => ({
    id: row.id,
    userId: row.userId,
    userName: row.userName,
    saleDate: row.saleDate,
    count40: row.count40,
    count60: row.count60,
    remark: row.remark,
    reviewStatus: row.reviewStatus,
    lastSubmittedAt: row.lastSubmittedAt,
    reviewedAt: row.reviewedAt,
    reviewNote: row.reviewNote,
    isTemporaryTop3: temporaryIds.has(row.id),
    isFormalTop3: formalIds.has(row.id),
  }));
}

async function getTodayDailyRhythmRows(todaySaleDate: DateValue) {
  const rows = await db.salesRecord.findMany({
    where: {
      saleDate: saleDateValueToDate(todaySaleDate),
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

  return rows.map(
    (row) =>
      ({
        id: row.id,
        userId: row.user.id,
        userName: row.user.name || row.user.username,
        role: row.user.role,
        status: row.user.status,
        saleDate: saleDateToValue(row.saleDate),
        count40: row.count40,
        count60: row.count60,
        remark: row.remark,
        reviewStatus: row.reviewStatus,
        lastSubmittedAt: row.lastSubmittedAt,
        reviewedAt: row.reviewedAt,
        reviewNote: row.reviewNote,
      }) satisfies DailyRhythmSourceRow,
  );
}

export async function getMemberDailyRhythmSummary({
  currentUserId,
  todaySaleDate,
  now = new Date(),
}: {
  currentUserId: string;
  todaySaleDate?: DateValue;
  now?: Date;
}) {
  const resolvedTodaySaleDate = todaySaleDate ?? getTodaySaleDateValue(now);
  const rows = await getTodayDailyRhythmRows(resolvedTodaySaleDate);

  return buildMemberDailyRhythmSummary({
    rows,
    currentUserId,
    todaySaleDate: resolvedTodaySaleDate,
  });
}

export async function getAdminDailyRhythmSummary({
  todaySaleDate,
  now = new Date(),
}: {
  todaySaleDate?: DateValue;
  now?: Date;
}) {
  const resolvedTodaySaleDate = todaySaleDate ?? getTodaySaleDateValue(now);
  const rows = await getTodayDailyRhythmRows(resolvedTodaySaleDate);

  return buildAdminDailyRhythmSummary({
    rows,
    todaySaleDate: resolvedTodaySaleDate,
  });
}

export async function getDailyTop3Status({
  todaySaleDate,
  now = new Date(),
}: DailyTop3StatusInput = {}) {
  const resolvedTodaySaleDate = todaySaleDate ?? getTodaySaleDateValue(now);
  const rows = await getTodayDailyRhythmRows(resolvedTodaySaleDate);

  return buildDailyTop3Status(rows, resolvedTodaySaleDate);
}

export async function getAdminTodaySalesRows({
  todaySaleDate,
  now = new Date(),
}: {
  todaySaleDate?: DateValue;
  now?: Date;
} = {}) {
  const resolvedTodaySaleDate = todaySaleDate ?? getTodaySaleDateValue(now);
  const rows = await getTodayDailyRhythmRows(resolvedTodaySaleDate);

  return buildAdminTodaySalesRows(rows, resolvedTodaySaleDate);
}
