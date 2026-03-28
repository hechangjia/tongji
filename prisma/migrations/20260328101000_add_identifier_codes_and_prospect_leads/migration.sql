-- CreateEnum
CREATE TYPE "IdentifierCodeStatus" AS ENUM ('UNASSIGNED', 'ASSIGNED', 'SOLD');

-- CreateEnum
CREATE TYPE "ProspectLeadStatus" AS ENUM ('UNASSIGNED', 'ASSIGNED');

-- CreateTable
CREATE TABLE "identifier_import_batches" (
    "id" TEXT NOT NULL,
    "sourceFileName" TEXT NOT NULL,
    "importedByUserId" TEXT NOT NULL,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "identifier_import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identifier_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "IdentifierCodeStatus" NOT NULL DEFAULT 'UNASSIGNED',
    "importBatchId" TEXT NOT NULL,
    "currentOwnerUserId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "soldAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "identifier_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "code_assignments" (
    "id" TEXT NOT NULL,
    "codeId" TEXT NOT NULL,
    "assignedToUserId" TEXT NOT NULL,
    "assignedByUserId" TEXT NOT NULL,
    "remark" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "code_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prospect_import_batches" (
    "id" TEXT NOT NULL,
    "sourceFileName" TEXT NOT NULL,
    "importedByUserId" TEXT NOT NULL,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prospect_import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prospect_leads" (
    "id" TEXT NOT NULL,
    "qqNumber" TEXT NOT NULL,
    "major" TEXT NOT NULL,
    "importBatchId" TEXT NOT NULL,
    "status" "ProspectLeadStatus" NOT NULL DEFAULT 'UNASSIGNED',
    "assignedToUserId" TEXT,
    "assignedGroupId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prospect_leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "identifier_import_batches_importedByUserId_createdAt_idx" ON "identifier_import_batches"("importedByUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "identifier_codes_code_key" ON "identifier_codes"("code");

-- CreateIndex
CREATE INDEX "identifier_codes_status_idx" ON "identifier_codes"("status");

-- CreateIndex
CREATE INDEX "identifier_codes_currentOwnerUserId_status_idx" ON "identifier_codes"("currentOwnerUserId", "status");

-- CreateIndex
CREATE INDEX "code_assignments_assignedToUserId_assignedAt_idx" ON "code_assignments"("assignedToUserId", "assignedAt");

-- CreateIndex
CREATE INDEX "code_assignments_assignedByUserId_assignedAt_idx" ON "code_assignments"("assignedByUserId", "assignedAt");

-- CreateIndex
CREATE INDEX "code_assignments_codeId_assignedAt_idx" ON "code_assignments"("codeId", "assignedAt");

-- CreateIndex
CREATE INDEX "prospect_import_batches_importedByUserId_createdAt_idx" ON "prospect_import_batches"("importedByUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "prospect_leads_qqNumber_key" ON "prospect_leads"("qqNumber");

-- CreateIndex
CREATE INDEX "prospect_leads_status_assignedToUserId_idx" ON "prospect_leads"("status", "assignedToUserId");

-- CreateIndex
CREATE INDEX "prospect_leads_status_assignedGroupId_idx" ON "prospect_leads"("status", "assignedGroupId");

-- AddForeignKey
ALTER TABLE "identifier_import_batches" ADD CONSTRAINT "identifier_import_batches_importedByUserId_fkey" FOREIGN KEY ("importedByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identifier_codes" ADD CONSTRAINT "identifier_codes_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "identifier_import_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identifier_codes" ADD CONSTRAINT "identifier_codes_currentOwnerUserId_fkey" FOREIGN KEY ("currentOwnerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "code_assignments" ADD CONSTRAINT "code_assignments_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "identifier_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "code_assignments" ADD CONSTRAINT "code_assignments_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "code_assignments" ADD CONSTRAINT "code_assignments_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_import_batches" ADD CONSTRAINT "prospect_import_batches_importedByUserId_fkey" FOREIGN KEY ("importedByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_leads" ADD CONSTRAINT "prospect_leads_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "prospect_import_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_leads" ADD CONSTRAINT "prospect_leads_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_leads" ADD CONSTRAINT "prospect_leads_assignedGroupId_fkey" FOREIGN KEY ("assignedGroupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
