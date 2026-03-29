-- CreateEnum
CREATE TYPE "GroupFollowUpSourceType" AS ENUM ('PROSPECT_LEAD', 'MANUAL_DISCOVERY');

-- CreateEnum
CREATE TYPE "GroupFollowUpStatus" AS ENUM ('UNTOUCHED', 'FOLLOWING_UP', 'APPOINTED', 'READY_TO_CONVERT', 'INVALID', 'CONVERTED');

-- CreateEnum
CREATE TYPE "GroupResourceAuditResourceType" AS ENUM ('FOLLOW_UP_ITEM', 'PROSPECT_LEAD', 'IDENTIFIER_CODE');

-- CreateEnum
CREATE TYPE "GroupResourceAuditActionType" AS ENUM ('CREATE_MANUAL_FOLLOW_UP', 'REASSIGN', 'RETURN_TO_GROUP_POOL', 'STATUS_CHANGE', 'CONVERTED_LINKED');

-- AlterTable
ALTER TABLE "identifier_codes"
ADD COLUMN "assignedGroupId" TEXT;

-- CreateTable
CREATE TABLE "group_follow_up_items" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "currentOwnerUserId" TEXT,
    "sourceType" "GroupFollowUpSourceType" NOT NULL,
    "prospectLeadId" TEXT,
    "status" "GroupFollowUpStatus" NOT NULL DEFAULT 'UNTOUCHED',
    "summaryNote" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "lastActionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_follow_up_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_resource_audit_logs" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "operatorUserId" TEXT NOT NULL,
    "resourceType" "GroupResourceAuditResourceType" NOT NULL,
    "resourceId" TEXT NOT NULL,
    "actionType" "GroupResourceAuditActionType" NOT NULL,
    "beforeSnapshot" JSONB,
    "afterSnapshot" JSONB,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_resource_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "identifier_codes_assignedGroupId_status_idx"
ON "identifier_codes"("assignedGroupId", "status");

-- CreateIndex
CREATE INDEX "group_follow_up_items_groupId_status_lastActionAt_idx"
ON "group_follow_up_items"("groupId", "status", "lastActionAt");

-- CreateIndex
CREATE INDEX "group_follow_up_items_currentOwnerUserId_status_idx"
ON "group_follow_up_items"("currentOwnerUserId", "status");

-- CreateIndex
CREATE INDEX "group_resource_audit_logs_groupId_createdAt_idx"
ON "group_resource_audit_logs"("groupId", "createdAt");

-- AddForeignKey
ALTER TABLE "identifier_codes"
ADD CONSTRAINT "identifier_codes_assignedGroupId_fkey"
FOREIGN KEY ("assignedGroupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_follow_up_items"
ADD CONSTRAINT "group_follow_up_items_groupId_fkey"
FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_follow_up_items"
ADD CONSTRAINT "group_follow_up_items_currentOwnerUserId_fkey"
FOREIGN KEY ("currentOwnerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_follow_up_items"
ADD CONSTRAINT "group_follow_up_items_prospectLeadId_fkey"
FOREIGN KEY ("prospectLeadId") REFERENCES "prospect_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_follow_up_items"
ADD CONSTRAINT "group_follow_up_items_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_resource_audit_logs"
ADD CONSTRAINT "group_resource_audit_logs_groupId_fkey"
FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_resource_audit_logs"
ADD CONSTRAINT "group_resource_audit_logs_operatorUserId_fkey"
FOREIGN KEY ("operatorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
