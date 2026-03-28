import {
  IdentifierCodeStatus,
  PlanType,
  ProspectLeadSourceType,
  ProspectLeadStatus,
} from "@prisma/client";
import { db } from "@/lib/db";
import { identifierSaleSchema } from "@/lib/validators/identifier-sale";
import { saleDateValueToDate, saleDateToValue, type DateValue } from "@/server/services/sales-service";

export type MemberIdentifierWorkspaceOverview = {
  availableCodeCount: number;
  assignedLeadCount: number;
  todaySaleCount: number;
  todayCount40: number;
  todayCount60: number;
};

export type MemberIdentifierCodeOption = {
  id: string;
  code: string;
};

export type MemberIdentifierLeadOption = {
  id: string;
  qqNumber: string;
  major: string;
  sourceLabel: string;
};

export type MemberIdentifierRecentSale = {
  id: string;
  code: string;
  qqNumber: string;
  planType: PlanType;
  sourceLabel: string;
  saleDate: DateValue;
  createdAtIso: string;
};

export type MemberIdentifierWorkspace = {
  overview: MemberIdentifierWorkspaceOverview;
  codeOptions: MemberIdentifierCodeOption[];
  leadOptions: MemberIdentifierLeadOption[];
  recentSales: MemberIdentifierRecentSale[];
};

function getLeadSourceLabel(sourceType: ProspectLeadSourceType) {
  return sourceType === ProspectLeadSourceType.MEMBER_MANUAL ? "成员手填" : "管理员分配线索";
}

function countPlans(rows: Array<{ planType: PlanType }>) {
  return rows.reduce(
    (summary, row) => {
      if (row.planType === PlanType.PLAN_40) {
        summary.count40 += 1;
      } else {
        summary.count60 += 1;
      }

      return summary;
    },
    {
      count40: 0,
      count60: 0,
    },
  );
}

export async function hasIdentifierSalesForUserOnDate(userId: string, saleDate: string) {
  return db.identifierSale.count({
    where: {
      sellerUserId: userId,
      saleDate: saleDateValueToDate(saleDate),
    },
  });
}

async function syncLegacySalesRecordFromIdentifierSales(
  tx: Pick<typeof db, "identifierSale" | "salesRecord">,
  userId: string,
  saleDate: string,
) {
  const normalizedSaleDate = saleDateValueToDate(saleDate);
  const sales = await tx.identifierSale.findMany({
    where: {
      sellerUserId: userId,
      saleDate: normalizedSaleDate,
    },
    select: {
      planType: true,
    },
  });
  const summary = countPlans(sales);

  return tx.salesRecord.upsert({
    where: {
      userId_saleDate: {
        userId,
        saleDate: normalizedSaleDate,
      },
    },
    update: {
      count40: summary.count40,
      count60: summary.count60,
      remark: "识别码成交汇总（自动同步）",
      lastSubmittedAt: new Date(),
      reviewStatus: "PENDING",
      reviewedAt: null,
      reviewNote: null,
    },
    create: {
      userId,
      saleDate: normalizedSaleDate,
      count40: summary.count40,
      count60: summary.count60,
      remark: "识别码成交汇总（自动同步）",
      lastSubmittedAt: new Date(),
      reviewStatus: "PENDING",
      reviewedAt: null,
      reviewNote: null,
    },
  });
}

export async function getIdentifierSalesForUser(userId: string) {
  return db.identifierSale.findMany({
    where: {
      sellerUserId: userId,
    },
    orderBy: [{ saleDate: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      planType: true,
      saleDate: true,
      createdAt: true,
      code: {
        select: {
          code: true,
        },
      },
      prospectLead: {
        select: {
          qqNumber: true,
          major: true,
          sourceType: true,
        },
      },
    },
  });
}

export async function getMemberIdentifierWorkspace({
  userId,
  todaySaleDate,
}: {
  userId: string;
  todaySaleDate: string;
}): Promise<MemberIdentifierWorkspace> {
  const [codes, leads, recentSales, todaySales] = await Promise.all([
    db.identifierCode.findMany({
      where: {
        currentOwnerUserId: userId,
        status: IdentifierCodeStatus.ASSIGNED,
      },
      orderBy: [{ assignedAt: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        code: true,
        status: true,
      },
    }),
    db.prospectLead.findMany({
      where: {
        assignedToUserId: userId,
        status: ProspectLeadStatus.ASSIGNED,
      },
      orderBy: [{ assignedAt: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        qqNumber: true,
        major: true,
        sourceType: true,
        status: true,
      },
    }),
    db.identifierSale.findMany({
      where: {
        sellerUserId: userId,
      },
      orderBy: [{ saleDate: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: {
        id: true,
        planType: true,
        saleDate: true,
        createdAt: true,
        code: {
          select: {
            code: true,
          },
        },
        prospectLead: {
          select: {
            qqNumber: true,
            sourceType: true,
          },
        },
      },
    }),
    db.identifierSale.findMany({
      where: {
        sellerUserId: userId,
        saleDate: saleDateValueToDate(todaySaleDate),
      },
      select: {
        planType: true,
      },
    }),
  ]);
  const todaySummary = countPlans(todaySales);

  return {
    overview: {
      availableCodeCount: codes.length,
      assignedLeadCount: leads.length,
      todaySaleCount: todaySales.length,
      todayCount40: todaySummary.count40,
      todayCount60: todaySummary.count60,
    },
    codeOptions: codes.map((code) => ({
      id: code.id,
      code: code.code,
    })),
    leadOptions: leads.map((lead) => ({
      id: lead.id,
      qqNumber: lead.qqNumber,
      major: lead.major,
      sourceLabel: getLeadSourceLabel(lead.sourceType),
    })),
    recentSales: recentSales.map((sale) => ({
      id: sale.id,
      code: sale.code.code,
      qqNumber: sale.prospectLead.qqNumber,
      planType: sale.planType,
      sourceLabel: getLeadSourceLabel(sale.prospectLead.sourceType),
      saleDate: saleDateToValue(sale.saleDate),
      createdAtIso: sale.createdAt.toISOString(),
    })),
  };
}

export async function saveIdentifierSaleForUser(
  userId: string,
  input: Parameters<typeof identifierSaleSchema.parse>[0],
) {
  const payload = identifierSaleSchema.parse(input);
  const currentUser = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      groupId: true,
    },
  });

  if (!currentUser?.groupId) {
    throw new Error("当前账号还没有绑定小组，请先联系管理员处理");
  }

  const currentGroupId = currentUser.groupId;

  const identifierCode = await db.identifierCode.findUnique({
    where: { id: payload.codeId },
    select: {
      id: true,
      currentOwnerUserId: true,
      status: true,
    },
  });

  if (
    !identifierCode ||
    identifierCode.currentOwnerUserId !== userId ||
    identifierCode.status !== IdentifierCodeStatus.ASSIGNED
  ) {
    throw new Error("只能成交自己名下、且尚未售出的识别码");
  }

  const now = new Date();

  return db.$transaction(async (tx) => {
    let prospectLead:
      | {
          id: string;
          sourceType: ProspectLeadSourceType;
          assignedToUserId: string | null;
          status: ProspectLeadStatus;
        }
      | null = null;

    if (payload.sourceMode === "ASSIGNED_LEAD") {
      prospectLead = await tx.prospectLead.findUnique({
        where: { id: payload.prospectLeadId },
        select: {
          id: true,
          sourceType: true,
          assignedToUserId: true,
          status: true,
        },
      });

      if (
        !prospectLead ||
        prospectLead.assignedToUserId !== userId ||
        prospectLead.status !== ProspectLeadStatus.ASSIGNED
      ) {
        throw new Error("所选新生线索不存在、未分配给你或已被转化");
      }
    } else {
      const existingLead = await tx.prospectLead.findFirst({
        where: {
          qqNumber: payload.qqNumber,
        },
        select: {
          id: true,
          sourceType: true,
          assignedToUserId: true,
          status: true,
        },
      });

      if (existingLead?.status === ProspectLeadStatus.CONVERTED) {
        throw new Error("该 QQ 已经转化过，不能重复成交");
      }

      if (existingLead?.assignedToUserId && existingLead.assignedToUserId !== userId) {
        throw new Error("该 QQ 线索已分配给其他成员，不能直接复用");
      }

      if (existingLead) {
        prospectLead = existingLead;
      } else {
        prospectLead = await tx.prospectLead.create({
          data: {
            qqNumber: payload.qqNumber,
            major: payload.major,
            sourceType: ProspectLeadSourceType.MEMBER_MANUAL,
            createdByUserId: userId,
            status: ProspectLeadStatus.ASSIGNED,
            assignedToUserId: userId,
            assignedGroupId: currentGroupId,
            assignedAt: now,
          },
          select: {
            id: true,
            sourceType: true,
            assignedToUserId: true,
            status: true,
          },
        });
      }
    }

    const sale = await tx.identifierSale.create({
      data: {
        codeId: payload.codeId,
        sellerUserId: userId,
        groupId: currentGroupId,
        prospectLeadId: prospectLead.id,
        planType: payload.planType,
        saleDate: saleDateValueToDate(payload.saleDate),
        remark: payload.remark,
      },
    });

    await tx.identifierCode.update({
      where: { id: payload.codeId },
      data: {
        status: IdentifierCodeStatus.SOLD,
        soldAt: now,
      },
    });

    const updatedLead = await tx.prospectLead.update({
      where: { id: prospectLead.id },
      data: {
        status: ProspectLeadStatus.CONVERTED,
        assignedToUserId: userId,
        assignedGroupId: currentGroupId,
        assignedAt: now,
      },
      select: {
        id: true,
        sourceType: true,
      },
    });

    const legacyRecord = await syncLegacySalesRecordFromIdentifierSales(tx, userId, payload.saleDate);

    return {
      sale,
      prospectLead: updatedLead,
      legacyRecord,
      sourceLabel: getLeadSourceLabel(updatedLead.sourceType),
    };
  });
}
