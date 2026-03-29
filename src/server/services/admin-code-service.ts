import ExcelJS from "exceljs";
import {
  IdentifierCodeStatus,
  ProspectLeadStatus,
  ProspectLeadSourceType,
  Role,
  UserStatus,
} from "@prisma/client";
import { db } from "@/lib/db";

type UploadParams = {
  file: File;
  importedByUserId: string;
};

type IdentifierAssignmentParams = {
  codeIds: string[];
  userId: string;
  assignedByUserId: string;
  remark?: string | null;
};

type ProspectAssignmentParams = {
  leadIds: string[];
  userId: string;
};

export type AdminCodesOverview = {
  totalCodes: number;
  unassignedCodes: number;
  unassignedProspects: number;
  assignedProspects: number;
};

export type AdminCodeInventoryRow = {
  id: string;
  code: string;
  status: IdentifierCodeStatus;
  ownerName: string | null;
  ownerUsername: string | null;
  importFileName: string;
  assignedAt: Date | null;
  soldAt: Date | null;
  createdAt: Date;
};

export type AdminProspectLeadRow = {
  id: string;
  qqNumber: string;
  major: string;
  status: ProspectLeadStatus;
  assignedToName: string | null;
  assignedToUsername: string | null;
  assignedGroupName: string | null;
  importFileName: string;
  sourceLabel: string;
  assignedAt: Date | null;
  createdAt: Date;
};

export type CodeAssigneeOption = {
  id: string;
  name: string;
  username: string;
  role: Role;
  groupName: string | null;
};

const IDENTIFIER_HEADER_ALIASES = new Set(["识别码", "编码", "code"]);
const PROSPECT_QQ_HEADER_ALIASES = new Set(["qq号", "qq", "qqnumber"]);
const PROSPECT_MAJOR_HEADER_ALIASES = new Set(["专业", "major"]);

function normalizeCellValue(value: unknown) {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .trim();
}

function normalizeHeader(value: unknown) {
  return normalizeCellValue(value).toLowerCase();
}

function getLeadSourceLabel(sourceType: ProspectLeadSourceType | undefined) {
  return sourceType === ProspectLeadSourceType.MEMBER_MANUAL ? "成员手填" : "管理员导入";
}

async function readSpreadsheetRows(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    const text = await file.text();

    return text
      .split(/\r?\n/)
      .filter((line) => line.trim() !== "")
      .map((line) => line.split(",").map((cell) => normalizeCellValue(cell)));
  }

  if (extension === "xls") {
    throw new Error("暂不支持 .xls 文件，请另存为 .xlsx 或 .csv 后再上传");
  }

  const workbook = new ExcelJS.Workbook();
  const workbookBuffer =
    Buffer.from(await file.arrayBuffer()) as unknown as Parameters<typeof workbook.xlsx.load>[0];
  await workbook.xlsx.load(workbookBuffer);
  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    throw new Error("上传文件没有可读取的工作表");
  }

  const rows: string[][] = [];

  worksheet.eachRow((row) => {
    const cells = Array.isArray(row.values) ? row.values.slice(1) : [];
    rows.push(cells.map((cell) => normalizeCellValue(cell)));
  });

  return rows.filter((row) => row.some((cell) => cell !== ""));
}

async function parseIdentifierValues(file: File) {
  const rows = await readSpreadsheetRows(file);

  if (rows.length === 0) {
    throw new Error("上传文件里没有可导入的识别码");
  }

  const firstRow = rows[0] ?? [];
  const headerIndex = firstRow.findIndex((cell) =>
    IDENTIFIER_HEADER_ALIASES.has(normalizeHeader(cell)),
  );
  const valueIndex = headerIndex >= 0 ? headerIndex : 0;
  const dataRows = headerIndex >= 0 ? rows.slice(1) : rows;

  const values = dataRows
    .map((row) => normalizeCellValue(row[valueIndex]))
    .filter((value) => value !== "");

  if (values.length === 0) {
    throw new Error("上传文件里没有可导入的识别码");
  }

  return values;
}

async function parseProspectValues(file: File) {
  const rows = await readSpreadsheetRows(file);

  if (rows.length === 0) {
    throw new Error("上传文件里没有可导入的新生线索");
  }

  const headerRow = rows[0] ?? [];
  const qqIndex = headerRow.findIndex((cell) =>
    PROSPECT_QQ_HEADER_ALIASES.has(normalizeHeader(cell)),
  );
  const majorIndex = headerRow.findIndex((cell) =>
    PROSPECT_MAJOR_HEADER_ALIASES.has(normalizeHeader(cell)),
  );

  if (qqIndex < 0) {
    throw new Error("上传文件缺少“QQ号”列");
  }

  if (majorIndex < 0) {
    throw new Error("上传文件缺少“专业”列");
  }

  const values = rows
    .slice(1)
    .map((row) => ({
      qqNumber: normalizeCellValue(row[qqIndex]),
      major: normalizeCellValue(row[majorIndex]),
    }))
    .filter((row) => row.qqNumber !== "" && row.major !== "");

  if (values.length === 0) {
    throw new Error("上传文件里没有可导入的新生线索");
  }

  return values;
}

function dedupeByKey<T>(items: T[], getKey: (item: T) => string) {
  const seen = new Set<string>();
  const unique: T[] = [];

  for (const item of items) {
    const key = getKey(item);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(item);
  }

  return unique;
}

function assertAssignableTarget(target: {
  role: Role;
  status: UserStatus;
} | null): asserts target is {
  role: Role;
  status: UserStatus;
  id: string;
  groupId: string | null;
} {
  if (!target || target.status !== UserStatus.ACTIVE || target.role === Role.ADMIN) {
    throw new Error("只能分配给启用中的成员或组长");
  }
}

export async function importIdentifierCodes({ file, importedByUserId }: UploadParams) {
  const rawValues = await parseIdentifierValues(file);
  const uniqueValues = dedupeByKey(rawValues, (value) => value);
  const existingRows = await db.identifierCode.findMany({
    where: {
      code: {
        in: uniqueValues,
      },
    },
    select: {
      code: true,
    },
  });
  const existingCodes = new Set(existingRows.map((row) => row.code));
  const newValues = uniqueValues.filter((value) => !existingCodes.has(value));
  const skippedCount = rawValues.length - newValues.length;

  return db.$transaction(async (tx) => {
    const batch = await tx.identifierImportBatch.create({
      data: {
        sourceFileName: file.name,
        importedByUserId,
        successCount: newValues.length,
        skippedCount,
      },
    });

    if (newValues.length > 0) {
      await tx.identifierCode.createMany({
        data: newValues.map((code) => ({
          code,
          importBatchId: batch.id,
        })),
      });
    }

    return {
      batchId: batch.id,
      successCount: newValues.length,
      skippedCount,
    };
  });
}

export async function importProspectLeads({ file, importedByUserId }: UploadParams) {
  const rawValues = await parseProspectValues(file);
  const uniqueValues = dedupeByKey(rawValues, (value) => value.qqNumber);
  const existingRows = await db.prospectLead.findMany({
    where: {
      qqNumber: {
        in: uniqueValues.map((value) => value.qqNumber),
      },
    },
    select: {
      qqNumber: true,
    },
  });
  const existingQqNumbers = new Set(existingRows.map((row) => row.qqNumber));
  const newValues = uniqueValues.filter((value) => !existingQqNumbers.has(value.qqNumber));
  const skippedCount = rawValues.length - newValues.length;

  return db.$transaction(async (tx) => {
    const batch = await tx.prospectImportBatch.create({
      data: {
        sourceFileName: file.name,
        importedByUserId,
        successCount: newValues.length,
        skippedCount,
      },
    });

    if (newValues.length > 0) {
      await tx.prospectLead.createMany({
        data: newValues.map((value) => ({
          qqNumber: value.qqNumber,
          major: value.major,
          importBatchId: batch.id,
          sourceType: ProspectLeadSourceType.ADMIN_IMPORT,
        })),
      });
    }

    return {
      batchId: batch.id,
      successCount: newValues.length,
      skippedCount,
    };
  });
}

export async function assignIdentifierCodesToUser({
  codeIds,
  userId,
  assignedByUserId,
  remark,
}: IdentifierAssignmentParams) {
  const targetUser = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      status: true,
      groupId: true,
    },
  });
  assertAssignableTarget(targetUser);

  const availableCodes = await db.identifierCode.findMany({
    where: {
      id: {
        in: codeIds,
      },
      status: IdentifierCodeStatus.UNASSIGNED,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (availableCodes.length !== codeIds.length) {
    throw new Error("所选识别码已被分发、售出或不存在，请刷新页面后重试");
  }

  const now = new Date();

  await db.$transaction(async (tx) => {
    await tx.identifierCode.updateMany({
      where: {
        id: {
          in: codeIds,
        },
      },
      data: {
        status: IdentifierCodeStatus.ASSIGNED,
        currentOwnerUserId: userId,
        assignedGroupId: targetUser.groupId ?? null,
        assignedAt: now,
      },
    });

    await tx.codeAssignment.createMany({
      data: codeIds.map((codeId) => ({
        codeId,
        assignedToUserId: userId,
        assignedByUserId,
        remark: remark ?? null,
        assignedAt: now,
      })),
    });
  });

  return {
    assignedCount: codeIds.length,
  };
}

export async function assignProspectLeadsToUser({ leadIds, userId }: ProspectAssignmentParams) {
  const targetUser = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      status: true,
      groupId: true,
    },
  });
  assertAssignableTarget(targetUser);

  if (!targetUser.groupId) {
    throw new Error("目标成员还没有绑定小组，不能分配新生线索");
  }

  const targetGroupId = targetUser.groupId;
  const availableLeads = await db.prospectLead.findMany({
    where: {
      id: {
        in: leadIds,
      },
      status: ProspectLeadStatus.UNASSIGNED,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (availableLeads.length !== leadIds.length) {
    throw new Error("所选新生线索已被分配或不存在，请刷新页面后重试");
  }

  const now = new Date();

  await db.$transaction(async (tx) => {
    await tx.prospectLead.updateMany({
      where: {
        id: {
          in: leadIds,
        },
      },
      data: {
        status: ProspectLeadStatus.ASSIGNED,
        assignedToUserId: userId,
        assignedGroupId: targetUser.groupId,
        assignedAt: now,
      },
    });

    const existingFollowUpItems = await tx.groupFollowUpItem.findMany({
      where: {
        prospectLeadId: {
          in: leadIds,
        },
        sourceType: "PROSPECT_LEAD",
      },
      select: {
        id: true,
        prospectLeadId: true,
        status: true,
      },
    });

    const existingLeadIds = new Set(
      existingFollowUpItems
        .map((item) => item.prospectLeadId)
        .filter((value): value is string => Boolean(value)),
    );

    if (existingFollowUpItems.length > 0) {
      await tx.groupFollowUpItem.updateMany({
        where: {
          id: {
            in: existingFollowUpItems.map((item) => item.id),
          },
        },
        data: {
          groupId: targetGroupId,
          currentOwnerUserId: userId,
          status: "UNTOUCHED",
          lastActionAt: now,
          convertedAt: null,
        },
      });
    }

    const leadIdsNeedingFollowUp = leadIds.filter((leadId) => !existingLeadIds.has(leadId));

    if (leadIdsNeedingFollowUp.length > 0) {
      await tx.groupFollowUpItem.createMany({
        data: leadIdsNeedingFollowUp.map((leadId) => ({
          groupId: targetGroupId,
          currentOwnerUserId: userId,
          sourceType: "PROSPECT_LEAD",
          prospectLeadId: leadId,
          status: "UNTOUCHED",
          lastActionAt: now,
        })),
      });
    }
  });

  return {
    assignedCount: leadIds.length,
  };
}

export async function getAdminCodesDashboardData() {
  const [codes, leads, assignees] = await Promise.all([
    db.identifierCode.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        code: true,
        status: true,
        assignedAt: true,
        soldAt: true,
        createdAt: true,
        currentOwner: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        importBatch: {
          select: {
            sourceFileName: true,
          },
        },
      },
    }),
    db.prospectLead.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        qqNumber: true,
        major: true,
        sourceType: true,
        status: true,
        assignedAt: true,
        createdAt: true,
        assignedToUser: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        assignedGroup: {
          select: {
            id: true,
            name: true,
          },
        },
        importBatch: {
          select: {
            sourceFileName: true,
          },
        },
      },
    }),
    db.user.findMany({
      where: {
        status: UserStatus.ACTIVE,
        NOT: {
          role: Role.ADMIN,
        },
      },
      orderBy: [{ name: "asc" }, { username: "asc" }],
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        group: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  return {
    overview: {
      totalCodes: codes.length,
      unassignedCodes: codes.filter((code) => code.status === IdentifierCodeStatus.UNASSIGNED)
        .length,
      unassignedProspects: leads.filter((lead) => lead.status === ProspectLeadStatus.UNASSIGNED)
        .length,
      assignedProspects: leads.filter((lead) => lead.status === ProspectLeadStatus.ASSIGNED)
        .length,
    } satisfies AdminCodesOverview,
    assigneeOptions: assignees.map((user) => ({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      groupName: user.group?.name ?? null,
    })) satisfies CodeAssigneeOption[],
    codeRows: codes.map((code) => ({
      id: code.id,
      code: code.code,
      status: code.status,
      ownerName: code.currentOwner?.name ?? null,
      ownerUsername: code.currentOwner?.username ?? null,
      importFileName: code.importBatch.sourceFileName,
      assignedAt: code.assignedAt,
      soldAt: code.soldAt,
      createdAt: code.createdAt,
    })) satisfies AdminCodeInventoryRow[],
    prospectRows: leads.map((lead) => ({
      id: lead.id,
      qqNumber: lead.qqNumber,
      major: lead.major,
      status: lead.status,
      assignedToName: lead.assignedToUser?.name ?? null,
      assignedToUsername: lead.assignedToUser?.username ?? null,
      assignedGroupName: lead.assignedGroup?.name ?? null,
      importFileName: lead.importBatch?.sourceFileName ?? "成员手填",
      sourceLabel: getLeadSourceLabel(lead.sourceType),
      assignedAt: lead.assignedAt,
      createdAt: lead.createdAt,
    })) satisfies AdminProspectLeadRow[],
  };
}
