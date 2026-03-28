-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('UNREAD', 'READ');

-- CreateEnum
CREATE TYPE "ReminderTemplate" AS ENUM ('TARGET_GAP', 'MISSING_SUBMISSION', 'FOLLOW_UP', 'CUSTOM');

-- CreateTable
CREATE TABLE "daily_targets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetDate" DATE NOT NULL,
    "suggestedTotal" INTEGER NOT NULL,
    "finalTotal" INTEGER NOT NULL,
    "suggestionReason" TEXT NOT NULL,
    "adjustedById" TEXT,
    "adjustedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_reminders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ReminderTemplate" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'UNREAD',
    "sentById" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_targets_userId_targetDate_key" ON "daily_targets"("userId", "targetDate");

-- CreateIndex
CREATE INDEX "daily_targets_targetDate_idx" ON "daily_targets"("targetDate");

-- CreateIndex
CREATE INDEX "daily_targets_targetDate_userId_idx" ON "daily_targets"("targetDate", "userId");

-- CreateIndex
CREATE INDEX "member_reminders_userId_sentAt_idx" ON "member_reminders"("userId", "sentAt");

-- CreateIndex
CREATE INDEX "member_reminders_userId_status_sentAt_idx" ON "member_reminders"("userId", "status", "sentAt");

-- AddForeignKey
ALTER TABLE "daily_targets" ADD CONSTRAINT "daily_targets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_targets" ADD CONSTRAINT "daily_targets_adjustedById_fkey" FOREIGN KEY ("adjustedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_reminders" ADD CONSTRAINT "member_reminders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_reminders" ADD CONSTRAINT "member_reminders_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
