import {
  BannerDisplayMode,
  BannerSourceType,
  ContentStatus,
  PrismaClient,
} from "@prisma/client";
import { hashPassword } from "../src/lib/password";
import { ensureDefaultUsers } from "../src/server/services/default-user-seed";

const prisma = new PrismaClient();

const builtinBannerQuotes = [
  {
    content: "好的结果来自每天都把录入和复盘做扎实。",
    author: "Maika",
  },
  {
    content: "先把当天数据录准，再谈复盘和优化。",
    author: "Maika",
  },
  {
    content: "团队的节奏感，往往藏在每一条及时录入里。",
    author: "Maika",
  },
];

async function main() {
  const adminPasswordHash = await hashPassword("admin123456");
  const memberPasswordHash = await hashPassword("member123456");

  const { admin, member } = await ensureDefaultUsers(prisma, {
    adminPasswordHash,
    memberPasswordHash,
  });

  if ((await prisma.commissionRule.count()) === 0) {
    await prisma.commissionRule.createMany({
      data: [
        {
          userId: admin.id,
          price40: 8,
          price60: 12,
          effectiveStart: new Date("2026-01-01"),
        },
        {
          userId: member.id,
          price40: 6,
          price60: 10,
          effectiveStart: new Date("2026-01-01"),
        },
      ],
    });
  }

  await prisma.bannerSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      isEnabled: true,
      displayMode: BannerDisplayMode.RANDOM,
    },
  });

  if ((await prisma.bannerQuote.count()) === 0) {
    await prisma.bannerQuote.createMany({
      data: builtinBannerQuotes.map((quote) => ({
        ...quote,
        sourceType: BannerSourceType.BUILTIN,
        status: ContentStatus.ACTIVE,
      })),
    });
  }

  if ((await prisma.announcement.count()) === 0) {
    await prisma.announcement.create({
      data: {
        title: "卡酬规则复核提醒",
        content:
          "若结算结果中出现规则缺失，请先到“卡酬规则”页面补齐对应成员的时间区间，再重新生成结算。",
        isPinned: true,
        status: ContentStatus.ACTIVE,
        publishAt: new Date("2026-03-26T09:30:00.000Z"),
        expireAt: new Date("2026-12-31T15:59:59.000Z"),
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
