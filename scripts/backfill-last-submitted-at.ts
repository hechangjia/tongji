import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function backfillLastSubmittedAt() {
  const pendingBefore = await prisma.salesRecord.count({
    where: { lastSubmittedAt: null },
  });
  console.log(`[backfill-last-submitted-at] pending before: ${pendingBefore}`);

  if (pendingBefore === 0) {
    return;
  }

  await prisma.$executeRaw`
    UPDATE "sales_records"
    SET "lastSubmittedAt" = "updatedAt"
    WHERE "lastSubmittedAt" IS NULL
  `;

  const pendingAfter = await prisma.salesRecord.count({
    where: { lastSubmittedAt: null },
  });
  console.log(`[backfill-last-submitted-at] pending after: ${pendingAfter}`);

  if (pendingAfter > 0) {
    throw new Error(
      `backfill-last-submitted-at failed, ${pendingAfter} rows still pending`,
    );
  }
}

backfillLastSubmittedAt()
  .catch((error) => {
    console.error("[backfill-last-submitted-at] failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
