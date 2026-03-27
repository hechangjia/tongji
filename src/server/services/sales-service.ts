import { db } from "@/lib/db";
import { salesSchema, type SalesInput, type SalesValues } from "@/lib/validators/sales";

const DEFAULT_TIME_ZONE = "Asia/Shanghai";

export type DateValue = `${number}-${number}-${number}`;

export type SalesEntryDefaults = {
  saleDate: string;
  count40: string;
  count60: string;
  remark: string;
};

export type AdminSalesFilters = {
  keyword?: string;
  date?: string;
};

export type AdminSalesRow = {
  id: string;
  saleDate: DateValue;
  userName: string;
  count40: number;
  count60: number;
  remark: string | null;
};

export type SaveSalesRecordResult = {
  isUpdate: boolean;
  record: Awaited<ReturnType<typeof db.salesRecord.upsert>>;
};

export function getTodaySaleDateValue(
  now = new Date(),
  timeZone = DEFAULT_TIME_ZONE,
): DateValue {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
  }).format(now) as DateValue;
}

export function saleDateValueToDate(saleDate: string) {
  return new Date(`${saleDate}T00:00:00.000Z`);
}

export function saleDateToValue(saleDate: Date) {
  return saleDate.toISOString().slice(0, 10) as DateValue;
}

export function normalizeSalePayload(input: SalesInput): SalesValues {
  const payload = salesSchema.parse(input);

  return {
    ...payload,
    remark: payload.remark,
  };
}

export function buildSalesEntryDefaults(
  record?: Partial<Pick<SalesValues, "saleDate" | "count40" | "count60" | "remark">>,
): SalesEntryDefaults {
  return {
    saleDate: record?.saleDate ?? getTodaySaleDateValue(),
    count40: `${record?.count40 ?? 0}`,
    count60: `${record?.count60 ?? 0}`,
    remark: record?.remark ?? "",
  };
}

export function groupRecordsForMember<T extends { saleDate: Date }>(records: T[]) {
  return [...records].sort(
    (left, right) => right.saleDate.getTime() - left.saleDate.getTime(),
  );
}

export function filterSalesRows<T extends { userName: string }>(
  rows: T[],
  query: AdminSalesFilters,
) {
  const keyword = query.keyword?.trim().toLowerCase();

  if (!keyword) {
    return rows;
  }

  return rows.filter((row) => row.userName.toLowerCase().includes(keyword));
}

export async function getSalesRecordForUserOnDate(userId: string, saleDate: string) {
  return db.salesRecord.findUnique({
    where: {
      userId_saleDate: {
        userId,
        saleDate: saleDateValueToDate(saleDate),
      },
    },
  });
}

export async function getSalesRecordsForUser(userId: string) {
  const records = await db.salesRecord.findMany({
    where: {
      userId,
    },
  });

  return groupRecordsForMember(records);
}

export async function getAdminSalesRows(filters: AdminSalesFilters = {}) {
  const rows = await db.salesRecord.findMany({
    where: filters.date
      ? {
          saleDate: saleDateValueToDate(filters.date),
        }
      : undefined,
    include: {
      user: {
        select: {
          name: true,
          username: true,
        },
      },
    },
    orderBy: [{ saleDate: "desc" }, { createdAt: "desc" }],
  });

  const normalizedRows: AdminSalesRow[] = rows.map((row) => ({
    id: row.id,
    saleDate: saleDateToValue(row.saleDate),
    userName: row.user.name || row.user.username,
    count40: row.count40,
    count60: row.count60,
    remark: row.remark,
  }));

  return filterSalesRows(normalizedRows, filters);
}

export async function saveSalesRecordForUser(userId: string, input: SalesInput) {
  const payload = normalizeSalePayload(input);
  const saleDate = saleDateValueToDate(payload.saleDate);
  const submittedAt = new Date();
  const existing = await db.salesRecord.findUnique({
    where: {
      userId_saleDate: {
        userId,
        saleDate,
      },
    },
  });

  const record = await db.salesRecord.upsert({
    where: {
      userId_saleDate: {
        userId,
        saleDate,
      },
    },
    update: {
      count40: payload.count40,
      count60: payload.count60,
      remark: payload.remark,
      lastSubmittedAt: submittedAt,
      reviewStatus: "PENDING",
      reviewedAt: null,
      reviewNote: null,
    },
    create: {
      userId,
      saleDate,
      count40: payload.count40,
      count60: payload.count60,
      remark: payload.remark,
      lastSubmittedAt: submittedAt,
      reviewStatus: "PENDING",
      reviewedAt: null,
      reviewNote: null,
    },
  });

  return {
    isUpdate: Boolean(existing),
    record,
  } satisfies SaveSalesRecordResult;
}
