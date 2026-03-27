-- CreateEnum
CREATE TYPE "SalesReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "sales_records"
ADD COLUMN "lastSubmittedAt" TIMESTAMP(3),
ADD COLUMN "reviewStatus" "SalesReviewStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "reviewNote" TEXT;

-- Backfill legacy rows so historical leaderboards remain formalized instead of
-- appearing as newly pending once reviewStatus is introduced.
UPDATE "sales_records"
SET "lastSubmittedAt" = COALESCE("updatedAt", "createdAt"),
    "reviewStatus" = 'APPROVED',
    "reviewedAt" = COALESCE("updatedAt", "createdAt")
WHERE "lastSubmittedAt" IS NULL;

-- CreateIndex
CREATE INDEX "sales_records_saleDate_reviewStatus_lastSubmittedAt_idx"
ON "sales_records"("saleDate", "reviewStatus", "lastSubmittedAt");

-- CreateIndex
CREATE INDEX "sales_records_saleDate_lastSubmittedAt_idx"
ON "sales_records"("saleDate", "lastSubmittedAt");
