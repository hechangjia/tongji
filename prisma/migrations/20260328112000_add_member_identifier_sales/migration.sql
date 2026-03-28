-- CreateEnum
CREATE TYPE "ProspectLeadSourceType" AS ENUM ('ADMIN_IMPORT', 'MEMBER_MANUAL');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('PLAN_40', 'PLAN_60');

-- AlterEnum
ALTER TYPE "ProspectLeadStatus" ADD VALUE IF NOT EXISTS 'CONVERTED';

-- AlterTable
ALTER TABLE "prospect_leads"
ADD COLUMN "createdByUserId" TEXT,
ADD COLUMN "sourceType" "ProspectLeadSourceType" NOT NULL DEFAULT 'ADMIN_IMPORT',
ALTER COLUMN "importBatchId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "identifier_sales" (
    "id" TEXT NOT NULL,
    "codeId" TEXT NOT NULL,
    "sellerUserId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "prospectLeadId" TEXT NOT NULL,
    "planType" "PlanType" NOT NULL,
    "saleDate" DATE NOT NULL,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "identifier_sales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "identifier_sales_codeId_key" ON "identifier_sales"("codeId");

-- CreateIndex
CREATE UNIQUE INDEX "identifier_sales_prospectLeadId_key" ON "identifier_sales"("prospectLeadId");

-- CreateIndex
CREATE INDEX "prospect_leads_sourceType_createdByUserId_idx" ON "prospect_leads"("sourceType", "createdByUserId");

-- CreateIndex
CREATE INDEX "identifier_sales_sellerUserId_saleDate_idx" ON "identifier_sales"("sellerUserId", "saleDate");

-- CreateIndex
CREATE INDEX "identifier_sales_groupId_saleDate_idx" ON "identifier_sales"("groupId", "saleDate");

-- CreateIndex
CREATE INDEX "identifier_sales_saleDate_planType_idx" ON "identifier_sales"("saleDate", "planType");

-- AddForeignKey
ALTER TABLE "prospect_leads" ADD CONSTRAINT "prospect_leads_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identifier_sales" ADD CONSTRAINT "identifier_sales_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "identifier_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identifier_sales" ADD CONSTRAINT "identifier_sales_sellerUserId_fkey" FOREIGN KEY ("sellerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identifier_sales" ADD CONSTRAINT "identifier_sales_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identifier_sales" ADD CONSTRAINT "identifier_sales_prospectLeadId_fkey" FOREIGN KEY ("prospectLeadId") REFERENCES "prospect_leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
