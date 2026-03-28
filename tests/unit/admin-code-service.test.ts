import ExcelJS from "exceljs";
import { beforeEach, describe, expect, test, vi } from "vitest";

const dbTransactionMock = vi.hoisted(() => vi.fn());
const identifierCodeFindManyMock = vi.hoisted(() => vi.fn());
const identifierCodeCreateManyMock = vi.hoisted(() => vi.fn());
const identifierCodeUpdateManyMock = vi.hoisted(() => vi.fn());
const identifierImportBatchCreateMock = vi.hoisted(() => vi.fn());
const codeAssignmentCreateManyMock = vi.hoisted(() => vi.fn());
const prospectLeadFindManyMock = vi.hoisted(() => vi.fn());
const prospectLeadCreateManyMock = vi.hoisted(() => vi.fn());
const prospectLeadUpdateManyMock = vi.hoisted(() => vi.fn());
const prospectImportBatchCreateMock = vi.hoisted(() => vi.fn());
const userFindUniqueMock = vi.hoisted(() => vi.fn());
const userFindManyMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: dbTransactionMock,
    identifierCode: {
      findMany: identifierCodeFindManyMock,
      updateMany: identifierCodeUpdateManyMock,
      createMany: identifierCodeCreateManyMock,
    },
    identifierImportBatch: {
      create: identifierImportBatchCreateMock,
    },
    codeAssignment: {
      createMany: codeAssignmentCreateManyMock,
    },
    prospectLead: {
      findMany: prospectLeadFindManyMock,
      updateMany: prospectLeadUpdateManyMock,
      createMany: prospectLeadCreateManyMock,
    },
    prospectImportBatch: {
      create: prospectImportBatchCreateMock,
    },
    user: {
      findUnique: userFindUniqueMock,
      findMany: userFindManyMock,
    },
  },
}));

import {
  assignIdentifierCodesToUser,
  assignProspectLeadsToUser,
  getAdminCodesDashboardData,
  importIdentifierCodes,
  importProspectLeads,
} from "@/server/services/admin-code-service";

async function createIdentifierWorkbookFile(values: string[]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("codes");
  worksheet.addRow(["识别码"]);

  for (const value of values) {
    worksheet.addRow([value]);
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new File([buffer], "codes.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function createProspectCsvFile(lines: string[]) {
  return new File([lines.join("\n")], "prospects.csv", {
    type: "text/csv",
  });
}

describe("admin code service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbTransactionMock.mockImplementation(async (callback: (tx: typeof import("@/lib/db").db) => Promise<unknown>) =>
      callback({
        identifierCode: {
          createMany: identifierCodeCreateManyMock,
          updateMany: identifierCodeUpdateManyMock,
        },
        identifierImportBatch: {
          create: identifierImportBatchCreateMock,
        },
        codeAssignment: {
          createMany: codeAssignmentCreateManyMock,
        },
        prospectLead: {
          createMany: prospectLeadCreateManyMock,
          updateMany: prospectLeadUpdateManyMock,
        },
        prospectImportBatch: {
          create: prospectImportBatchCreateMock,
        },
      } as unknown as typeof import("@/lib/db").db),
    );
  });

  test("imports identifier codes and skips duplicates", async () => {
    const file = await createIdentifierWorkbookFile(["A001", "A002", "A002", "A003"]);
    identifierCodeFindManyMock.mockResolvedValue([{ code: "A003" }]);
    identifierImportBatchCreateMock.mockResolvedValue({ id: "batch-1" });
    identifierCodeCreateManyMock.mockResolvedValue({ count: 2 });

    await expect(
      importIdentifierCodes({
        file,
        importedByUserId: "admin-1",
      }),
    ).resolves.toMatchObject({
      successCount: 2,
      skippedCount: 2,
      batchId: "batch-1",
    });
  });

  test("imports prospect leads from QQ and major columns and skips duplicate QQs", async () => {
    const file = createProspectCsvFile([
      "QQ号,专业",
      "123456,计算机",
      "234567,数学",
      "234567,数学",
      "345678,物理",
    ]);
    prospectLeadFindManyMock.mockResolvedValue([{ qqNumber: "345678" }]);
    prospectImportBatchCreateMock.mockResolvedValue({ id: "prospect-batch-1" });
    prospectLeadCreateManyMock.mockResolvedValue({ count: 2 });

    await expect(
      importProspectLeads({
        file,
        importedByUserId: "admin-1",
      }),
    ).resolves.toMatchObject({
      successCount: 2,
      skippedCount: 2,
      batchId: "prospect-batch-1",
    });
  });

  test("rejects prospect uploads when required columns are missing", async () => {
    const file = createProspectCsvFile([
      "QQ号",
      "123456",
    ]);

    await expect(
      importProspectLeads({
        file,
        importedByUserId: "admin-1",
      }),
    ).rejects.toThrow("上传文件缺少“专业”列");
  });

  test("assigns identifier codes to an active non-admin user and writes history", async () => {
    userFindUniqueMock.mockResolvedValue({
      id: "member-1",
      role: "MEMBER",
      status: "ACTIVE",
      groupId: "group-1",
    });
    identifierCodeFindManyMock.mockResolvedValue([
      { id: "code-1", status: "UNASSIGNED" },
      { id: "code-2", status: "UNASSIGNED" },
    ]);
    identifierCodeUpdateManyMock.mockResolvedValue({ count: 2 });
    codeAssignmentCreateManyMock.mockResolvedValue({ count: 2 });

    await expect(
      assignIdentifierCodesToUser({
        codeIds: ["code-1", "code-2"],
        userId: "member-1",
        assignedByUserId: "admin-1",
      }),
    ).resolves.toMatchObject({
      assignedCount: 2,
    });
  });

  test("rejects assignments to inactive or admin users", async () => {
    userFindUniqueMock.mockResolvedValue({
      id: "admin-1",
      role: "ADMIN",
      status: "ACTIVE",
      groupId: null,
    });

    await expect(
      assignIdentifierCodesToUser({
        codeIds: ["code-1"],
        userId: "admin-1",
        assignedByUserId: "admin-2",
      }),
    ).rejects.toThrow("只能分配给启用中的成员或组长");
  });

  test("assigns prospect leads to an active non-admin user", async () => {
    userFindUniqueMock.mockResolvedValue({
      id: "member-1",
      role: "LEADER",
      status: "ACTIVE",
      groupId: "group-1",
    });
    prospectLeadFindManyMock.mockResolvedValue([
      { id: "lead-1", status: "UNASSIGNED" },
      { id: "lead-2", status: "UNASSIGNED" },
    ]);
    prospectLeadUpdateManyMock.mockResolvedValue({ count: 2 });

    await expect(
      assignProspectLeadsToUser({
        leadIds: ["lead-1", "lead-2"],
        userId: "member-1",
      }),
    ).resolves.toMatchObject({
      assignedCount: 2,
    });
  });

  test("builds admin dashboard metrics from identifier and prospect rows", async () => {
    identifierCodeFindManyMock.mockResolvedValue([
      {
        id: "code-1",
        code: "A001",
        status: "UNASSIGNED",
        currentOwner: null,
        importBatch: { sourceFileName: "codes.xlsx" },
        assignedAt: null,
        soldAt: null,
        createdAt: new Date("2026-03-28T00:00:00.000Z"),
      },
      {
        id: "code-2",
        code: "A002",
        status: "ASSIGNED",
        currentOwner: { id: "member-1", name: "成员1", username: "member01" },
        importBatch: { sourceFileName: "codes.xlsx" },
        assignedAt: new Date("2026-03-28T08:00:00.000Z"),
        soldAt: null,
        createdAt: new Date("2026-03-28T00:00:00.000Z"),
      },
    ]);
    prospectLeadFindManyMock.mockResolvedValue([
      {
        id: "lead-1",
        qqNumber: "123456",
        major: "计算机",
        status: "UNASSIGNED",
        assignedToUser: null,
        assignedGroup: null,
        importBatch: { sourceFileName: "prospects.csv" },
        assignedAt: null,
        createdAt: new Date("2026-03-28T00:00:00.000Z"),
      },
      {
        id: "lead-2",
        qqNumber: "234567",
        major: "数学",
        status: "ASSIGNED",
        assignedToUser: { id: "member-1", name: "成员1", username: "member01" },
        assignedGroup: { id: "group-1", name: "一组" },
        importBatch: { sourceFileName: "prospects.csv" },
        assignedAt: new Date("2026-03-28T09:00:00.000Z"),
        createdAt: new Date("2026-03-28T00:00:00.000Z"),
      },
      {
        id: "lead-3",
        qqNumber: "345678",
        major: "物理",
        status: "CONVERTED",
        assignedToUser: { id: "member-2", name: "成员2", username: "member02" },
        assignedGroup: { id: "group-2", name: "二组" },
        importBatch: null,
        sourceType: "MEMBER_MANUAL",
        assignedAt: new Date("2026-03-28T10:00:00.000Z"),
        createdAt: new Date("2026-03-28T10:00:00.000Z"),
      },
    ]);
    userFindManyMock.mockResolvedValue([
      {
        id: "member-1",
        name: "成员1",
        username: "member01",
        role: "MEMBER",
        group: { name: "一组" },
      },
    ]);

    await expect(getAdminCodesDashboardData()).resolves.toMatchObject({
      overview: {
        totalCodes: 2,
        unassignedCodes: 1,
        unassignedProspects: 1,
        assignedProspects: 1,
      },
      assigneeOptions: [
        {
          id: "member-1",
          role: "MEMBER",
          groupName: "一组",
        },
      ],
      prospectRows: expect.arrayContaining([
        expect.objectContaining({
          qqNumber: "345678",
          importFileName: "成员手填",
          sourceLabel: "成员手填",
        }),
      ]),
    });
  });
});
