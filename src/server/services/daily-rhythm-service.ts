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
  title: string;
  message: string;
  reviewStatus: SalesReviewStatus | "NONE";
  reviewStatusLabel: string | null;
  reviewNote: string | null;
  isTemporaryTop3: boolean;
  isFormalTop3: boolean;
  temporaryRank: number | null;
  formalRank: number | null;
  top3Label: string | null;
  top3Message: string | null;
  primaryAction: DailyRhythmAction;
  secondaryActions: DailyRhythmAction[];
};

export type AdminDailyRhythmSummary = {
  message: string;
  pendingCount: number;
  top3Status: DailyTop3Status;
  top3ConfirmationStatus: "NOT_CONFIRMED" | "CONFIRMED";
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

const ADMIN_REVIEW_STATUS_ORDER: Record<SalesReviewStatus, number> = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2,
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

function compareAdminReviewQueueOrder(
  left: Pick<DailyRhythmSourceRow, "id" | "lastSubmittedAt" | "reviewStatus">,
  right: Pick<DailyRhythmSourceRow, "id" | "lastSubmittedAt" | "reviewStatus">,
) {
  const statusOrderDiff =
    ADMIN_REVIEW_STATUS_ORDER[left.reviewStatus] - ADMIN_REVIEW_STATUS_ORDER[right.reviewStatus];

  if (statusOrderDiff !== 0) {
    return statusOrderDiff;
  }

  return compareBySubmissionOrder(left, right);
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
  const top3Status = buildDailyTop3Status(todayRows, todaySaleDate);
  // If bad legacy data creates multiple rows for the same user/day, use the earliest
  // submission so the member summary stays deterministic.
  const currentRow = todayRows
    .filter((row) => row.userId === currentUserId)
    .sort(compareBySubmissionOrder)[0];
  const temporaryRank = currentRow
    ? top3Status.temporaryTop3.find((row) => row.id === currentRow.id)?.rank ?? null
    : null;
  const formalRank = currentRow
    ? top3Status.formalTop3.find((row) => row.id === currentRow.id)?.rank ?? null
    : null;

  if (!currentRow) {
    return {
      state: "NO_SUBMISSION",
      title: "当日节奏提醒",
      message: "今天还没有提交销售记录",
      reviewStatus: "NONE",
      reviewStatusLabel: null,
      reviewNote: null,
      isTemporaryTop3: false,
      isFormalTop3: false,
      temporaryRank: null,
      formalRank: null,
      top3Label: null,
      top3Message: null,
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
      title: "当日节奏提醒",
      message: "今天的记录被退回，请尽快重新提交",
      reviewStatus: currentRow.reviewStatus,
      reviewStatusLabel: "已退回",
      reviewNote: currentRow.reviewNote,
      isTemporaryTop3: false,
      isFormalTop3: false,
      temporaryRank: null,
      formalRank: null,
      top3Label: null,
      top3Message: null,
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
      title: "当日节奏摘要",
      message: "今天的提交已收到，等待管理员审核",
      reviewStatus: currentRow.reviewStatus,
      reviewStatusLabel: "待审核",
      reviewNote: null,
      isTemporaryTop3: temporaryRank !== null,
      isFormalTop3: false,
      temporaryRank,
      formalRank: null,
      top3Label: temporaryRank !== null ? "临时前三" : null,
      top3Message: temporaryRank !== null ? `当前处于临时第 ${temporaryRank} 名` : null,
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
      title: "当日节奏进展",
      message: "今天的记录已通过审核，已进入正式前三",
      reviewStatus: currentRow.reviewStatus,
      reviewStatusLabel: "已通过",
      reviewNote: null,
      isTemporaryTop3: temporaryRank !== null,
      isFormalTop3: true,
      temporaryRank,
      formalRank,
      top3Label: "正式前三",
      top3Message: `正式第 ${formalRank} 名`,
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
    title: "当日节奏进展",
    message: "今天的记录已通过审核，继续保持",
    reviewStatus: currentRow.reviewStatus,
    reviewStatusLabel: "已通过",
    reviewNote: null,
    isTemporaryTop3: false,
    isFormalTop3: false,
    temporaryRank: null,
    formalRank: null,
    top3Label: null,
    top3Message: null,
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
    top3Status,
    top3ConfirmationStatus: top3Status.isFormalTop3Complete ? "CONFIRMED" : "NOT_CONFIRMED",
    primaryAction: {
      href: "/admin/sales?scope=today",
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
  const todayRows = filterCurrentBusinessDayRows(rows, todaySaleDate)
    .slice()
    .sort(compareAdminReviewQueueOrder);
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
