import { beforeEach, describe, expect, test, vi } from "vitest";

const userFindUniqueMock = vi.hoisted(() => vi.fn());
const identifierCodeFindUniqueMock = vi.hoisted(() => vi.fn());
const identifierCodeFindManyMock = vi.hoisted(() => vi.fn());
const identifierCodeUpdateMock = vi.hoisted(() => vi.fn());
const prospectLeadFindUniqueMock = vi.hoisted(() => vi.fn());
const prospectLeadFindFirstMock = vi.hoisted(() => vi.fn());
const prospectLeadFindManyMock = vi.hoisted(() => vi.fn());
const prospectLeadCreateMock = vi.hoisted(() => vi.fn());
const prospectLeadUpdateMock = vi.hoisted(() => vi.fn());
const identifierSaleCreateMock = vi.hoisted(() => vi.fn());
const identifierSaleFindManyMock = vi.hoisted(() => vi.fn());
const salesRecordUpsertMock = vi.hoisted(() => vi.fn());
const dbTransactionMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: dbTransactionMock,
    user: {
      findUnique: userFindUniqueMock,
    },
    identifierCode: {
      findUnique: identifierCodeFindUniqueMock,
      findMany: identifierCodeFindManyMock,
      update: identifierCodeUpdateMock,
    },
    prospectLead: {
      findUnique: prospectLeadFindUniqueMock,
      findFirst: prospectLeadFindFirstMock,
      findMany: prospectLeadFindManyMock,
      create: prospectLeadCreateMock,
      update: prospectLeadUpdateMock,
    },
    identifierSale: {
      create: identifierSaleCreateMock,
      findMany: identifierSaleFindManyMock,
    },
    salesRecord: {
      upsert: salesRecordUpsertMock,
    },
  },
}));

import {
  getMemberIdentifierWorkspace,
  saveIdentifierSaleForUser,
} from "@/server/services/member-identifier-sale-service";

describe("member identifier sale service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prospectLeadUpdateMock.mockImplementation(async ({ where }: { where: { id: string } }) => ({
      id: where.id,
      sourceType: "ADMIN_IMPORT",
    }));
    dbTransactionMock.mockImplementation(async (callback: (tx: typeof import("@/lib/db").db) => Promise<unknown>) =>
      callback({
        identifierCode: {
          update: identifierCodeUpdateMock,
          findMany: identifierCodeFindManyMock,
        },
        prospectLead: {
          create: prospectLeadCreateMock,
          update: prospectLeadUpdateMock,
          findFirst: prospectLeadFindFirstMock,
          findMany: prospectLeadFindManyMock,
          findUnique: prospectLeadFindUniqueMock,
        },
        identifierSale: {
          create: identifierSaleCreateMock,
          findMany: identifierSaleFindManyMock,
        },
        salesRecord: {
          upsert: salesRecordUpsertMock,
        },
      } as unknown as typeof import("@/lib/db").db),
    );
  });

  test("saves a sale using an assigned lead and syncs the legacy daily summary", async () => {
    userFindUniqueMock.mockResolvedValue({
      id: "member-1",
      groupId: "group-1",
    });
    identifierCodeFindUniqueMock.mockResolvedValue({
      id: "code-1",
      currentOwnerUserId: "member-1",
      status: "ASSIGNED",
    });
    prospectLeadFindUniqueMock.mockResolvedValue({
      id: "lead-1",
      assignedToUserId: "member-1",
      status: "ASSIGNED",
    });
    identifierSaleCreateMock.mockResolvedValue({
      id: "sale-1",
      codeId: "code-1",
      prospectLeadId: "lead-1",
    });
    identifierSaleFindManyMock.mockResolvedValue([
      {
        planType: "PLAN_40",
      },
      {
        planType: "PLAN_60",
      },
      {
        planType: "PLAN_40",
      },
    ]);
    salesRecordUpsertMock.mockResolvedValue({
      id: "legacy-1",
      count40: 2,
      count60: 1,
    });

    await expect(
      saveIdentifierSaleForUser("member-1", {
        codeId: "code-1",
        planType: "PLAN_40",
        saleDate: "2026-03-28",
        sourceMode: "ASSIGNED_LEAD",
        prospectLeadId: "lead-1",
        remark: "现场转化",
      }),
    ).resolves.toMatchObject({
      sale: {
        id: "sale-1",
      },
      legacyRecord: {
        id: "legacy-1",
      },
      sourceLabel: "管理员分配线索",
    });

    expect(identifierCodeUpdateMock).toHaveBeenCalledWith({
      where: { id: "code-1" },
      data: {
        status: "SOLD",
        soldAt: expect.any(Date),
      },
    });
    expect(prospectLeadUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "lead-1" },
        data: expect.objectContaining({
          status: "CONVERTED",
        }),
      }),
    );
    expect(salesRecordUpsertMock).toHaveBeenCalledWith({
      where: {
        userId_saleDate: {
          userId: "member-1",
          saleDate: new Date("2026-03-28T00:00:00.000Z"),
        },
      },
      update: expect.objectContaining({
        count40: 2,
        count60: 1,
      }),
      create: expect.objectContaining({
        userId: "member-1",
        count40: 2,
        count60: 1,
      }),
    });
  });

  test("creates a manual lead when the QQ does not exist", async () => {
    userFindUniqueMock.mockResolvedValue({
      id: "member-1",
      groupId: "group-1",
    });
    identifierCodeFindUniqueMock.mockResolvedValue({
      id: "code-1",
      currentOwnerUserId: "member-1",
      status: "ASSIGNED",
    });
    prospectLeadFindFirstMock.mockResolvedValue(null);
    prospectLeadCreateMock.mockResolvedValue({
      id: "lead-manual-1",
      sourceType: "MEMBER_MANUAL",
      qqNumber: "123456",
      major: "计算机",
    });
    prospectLeadUpdateMock.mockResolvedValueOnce({
      id: "lead-manual-1",
      sourceType: "MEMBER_MANUAL",
    });
    identifierSaleCreateMock.mockResolvedValue({
      id: "sale-1",
      codeId: "code-1",
      prospectLeadId: "lead-manual-1",
    });
    identifierSaleFindManyMock.mockResolvedValue([{ planType: "PLAN_60" }]);
    salesRecordUpsertMock.mockResolvedValue({
      id: "legacy-1",
      count40: 0,
      count60: 1,
    });

    await expect(
      saveIdentifierSaleForUser("member-1", {
        codeId: "code-1",
        planType: "PLAN_60",
        saleDate: "2026-03-28",
        sourceMode: "MANUAL_INPUT",
        qqNumber: "123456",
        major: "计算机",
      }),
    ).resolves.toMatchObject({
      prospectLead: {
        id: "lead-manual-1",
      },
      sourceLabel: "成员手填",
    });

    expect(prospectLeadCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          qqNumber: "123456",
          major: "计算机",
          sourceType: "MEMBER_MANUAL",
          createdByUserId: "member-1",
        }),
      }),
    );
  });

  test("reuses an existing manual or imported lead when the QQ already exists", async () => {
    userFindUniqueMock.mockResolvedValue({
      id: "member-1",
      groupId: "group-1",
    });
    identifierCodeFindUniqueMock.mockResolvedValue({
      id: "code-1",
      currentOwnerUserId: "member-1",
      status: "ASSIGNED",
    });
    prospectLeadFindFirstMock.mockResolvedValue({
      id: "lead-existing-1",
      qqNumber: "123456",
      major: "计算机",
      assignedToUserId: null,
      status: "UNASSIGNED",
      sourceType: "ADMIN_IMPORT",
    });
    prospectLeadUpdateMock.mockResolvedValue({
      id: "lead-existing-1",
      sourceType: "ADMIN_IMPORT",
    });
    identifierSaleCreateMock.mockResolvedValue({
      id: "sale-1",
      codeId: "code-1",
      prospectLeadId: "lead-existing-1",
    });
    identifierSaleFindManyMock.mockResolvedValue([{ planType: "PLAN_40" }]);
    salesRecordUpsertMock.mockResolvedValue({
      id: "legacy-1",
      count40: 1,
      count60: 0,
    });

    await saveIdentifierSaleForUser("member-1", {
      codeId: "code-1",
      planType: "PLAN_40",
      saleDate: "2026-03-28",
      sourceMode: "MANUAL_INPUT",
      qqNumber: "123456",
      major: "计算机",
    });

    expect(prospectLeadCreateMock).not.toHaveBeenCalled();
    expect(prospectLeadUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "lead-existing-1" },
        data: expect.objectContaining({
          status: "CONVERTED",
          assignedToUserId: "member-1",
          assignedGroupId: "group-1",
          assignedAt: expect.any(Date),
        }),
      }),
    );
  });

  test("rejects a reused QQ that is already assigned to a different member", async () => {
    userFindUniqueMock.mockResolvedValue({
      id: "member-1",
      groupId: "group-1",
    });
    identifierCodeFindUniqueMock.mockResolvedValue({
      id: "code-1",
      currentOwnerUserId: "member-1",
      status: "ASSIGNED",
    });
    prospectLeadFindFirstMock.mockResolvedValue({
      id: "lead-other-1",
      qqNumber: "123456",
      major: "计算机",
      assignedToUserId: "member-2",
      status: "ASSIGNED",
      sourceType: "ADMIN_IMPORT",
    });

    await expect(
      saveIdentifierSaleForUser("member-1", {
        codeId: "code-1",
        planType: "PLAN_40",
        saleDate: "2026-03-28",
        sourceMode: "MANUAL_INPUT",
        qqNumber: "123456",
        major: "计算机",
      }),
    ).rejects.toThrow("该 QQ 线索已分配给其他成员，不能直接复用");
  });

  test("builds member workspace with assigned codes, leads, and recent identifier sales", async () => {
    identifierCodeFindManyMock.mockResolvedValue([
      {
        id: "code-1",
        code: "A001",
        status: "ASSIGNED",
      },
    ]);
    prospectLeadFindManyMock.mockResolvedValueOnce([
      {
        id: "lead-1",
        qqNumber: "123456",
        major: "计算机",
        sourceType: "ADMIN_IMPORT",
        status: "ASSIGNED",
      },
    ]);
    identifierSaleFindManyMock.mockResolvedValueOnce([
      {
        id: "sale-1",
        planType: "PLAN_40",
        code: {
          code: "A001",
        },
        prospectLead: {
          qqNumber: "123456",
          sourceType: "ADMIN_IMPORT",
        },
        saleDate: new Date("2026-03-28T00:00:00.000Z"),
        createdAt: new Date("2026-03-28T10:00:00.000Z"),
      },
    ]);
    identifierSaleFindManyMock.mockResolvedValueOnce([
      { planType: "PLAN_40" },
      { planType: "PLAN_60" },
    ]);

    await expect(
      getMemberIdentifierWorkspace({
        userId: "member-1",
        todaySaleDate: "2026-03-28",
      }),
    ).resolves.toMatchObject({
      overview: {
        availableCodeCount: 1,
        assignedLeadCount: 1,
        todaySaleCount: 2,
        todayCount40: 1,
        todayCount60: 1,
      },
      codeOptions: [
        {
          id: "code-1",
          code: "A001",
        },
      ],
      leadOptions: [
        {
          id: "lead-1",
          qqNumber: "123456",
        },
      ],
      recentSales: [
        {
          id: "sale-1",
          code: "A001",
          sourceLabel: "管理员分配线索",
        },
      ],
    });
  });
});
