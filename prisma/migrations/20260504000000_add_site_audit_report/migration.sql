-- CreateTable
CREATE TABLE IF NOT EXISTS "site_audit_reports" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "rootUrl" TEXT NOT NULL,
    "urlHash" TEXT NOT NULL,
    "status" "AuditStatus" NOT NULL DEFAULT 'PENDING',
    "totalPages" INTEGER NOT NULL DEFAULT 0,
    "completedPages" INTEGER NOT NULL DEFAULT 0,
    "failedPages" INTEGER NOT NULL DEFAULT 0,
    "avgScore" DOUBLE PRECISION,
    "sitemapUrl" TEXT,
    "pagesLimit" INTEGER NOT NULL DEFAULT 10,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "site_audit_reports_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "audit_reports" ADD COLUMN IF NOT EXISTS "siteAuditId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "site_audit_reports_userId_idx" ON "site_audit_reports"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "site_audit_reports_urlHash_idx" ON "site_audit_reports"("urlHash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "site_audit_reports_status_idx" ON "site_audit_reports"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "audit_reports_siteAuditId_idx" ON "audit_reports"("siteAuditId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "site_audit_reports" ADD CONSTRAINT "site_audit_reports_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "audit_reports" ADD CONSTRAINT "audit_reports_siteAuditId_fkey"
    FOREIGN KEY ("siteAuditId") REFERENCES "site_audit_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
