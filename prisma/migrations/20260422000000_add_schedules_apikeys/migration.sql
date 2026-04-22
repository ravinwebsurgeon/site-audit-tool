-- CreateEnum (skip if already exists — may have been created manually)
DO $$ BEGIN
  CREATE TYPE "ScheduleFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable: add missing columns to users
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "notifyOnComplete" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: schedules
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "frequency" "ScheduleFrequency" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "nextRunAt" TIMESTAMP(3) NOT NULL,
    "lastRunAt" TIMESTAMP(3),
    "lastReportId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable: api_keys
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "schedules_userId_idx" ON "schedules"("userId");

-- CreateIndex
CREATE INDEX "schedules_nextRunAt_isActive_idx" ON "schedules"("nextRunAt", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_userId_idx" ON "api_keys"("userId");

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
