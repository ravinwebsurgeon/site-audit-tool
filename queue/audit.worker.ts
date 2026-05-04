import { Worker } from 'bullmq';
import { redisConnection } from '@/lib/redis';
import { AUDIT_QUEUE_NAME, SITE_AUDIT_QUEUE_NAME } from '@/lib/constants';
import { processAudit } from '@/services/audit.service';
import { processSiteAudit } from '@/services/site-audit.service';
import { incrementSiteAuditProgress } from '@/db/site-audit';
import { sendAuditCompleteEmail } from '@/lib/mail';
import { prisma } from '@/lib/prisma';
import type { AuditJobData, SiteAuditJobData } from '@/types';

export function createAuditWorker() {
  if (!redisConnection) {
    throw new Error('[worker] REDIS_URL is required to run the BullMQ worker.');
  }

  const worker = new Worker<AuditJobData>(
    AUDIT_QUEUE_NAME,
    async (job) => {
      const { reportId, url, userId, isScheduled, siteAuditId } = job.data;
      console.log(`[worker] Starting audit ${reportId} — ${url}`);

      // BullMQ increments attemptsMade before running the job, so it equals
      // the current attempt number (1 on first run). When it reaches the
      // configured maximum this is the final attempt.
      const maxAttempts = job.opts.attempts ?? 3;
      const isLastAttempt = job.attemptsMade >= maxAttempts;

      let succeeded = false;
      try {
        await processAudit(reportId, url);
        succeeded = true;
        console.log(`[worker] Audit ${reportId} finished — ${url}`);
      } finally {
        if (siteAuditId && (succeeded || isLastAttempt)) {
          // On the last failed attempt, verify the page isn't already COMPLETED
          // from a previous retry before counting it as failed.
          let countAsSucceeded = succeeded;
          if (!succeeded) {
            const report = await prisma.auditReport.findUnique({
              where: { id: reportId },
              select: { status: true },
            });
            if (report?.status === 'COMPLETED') countAsSucceeded = true;
          }
          try {
            await incrementSiteAuditProgress(siteAuditId, countAsSucceeded);
          } catch (err) {
            console.error(`[worker] Failed to update site audit progress for ${siteAuditId}:`, err);
          }
        }
      }

      // Only send email for scheduled audits where the user opted in
      if (succeeded && isScheduled && userId) {
        try {
          await sendCompletionEmail(reportId, url, userId);
        } catch (err) {
          // Email failure must never fail the job — the audit already succeeded
          console.error(`[worker] Failed to send completion email for report ${reportId}:`, err);
        }
      }
    },
    {
      connection: redisConnection,
      concurrency: 5,
    }
  );

  // ── Visibility events ────────────────────────────────────────────────────────

  worker.on('ready', () => {
    console.log(`[worker] Connected to Redis — listening on queue "${AUDIT_QUEUE_NAME}"`);
  });

  worker.on('active', (job) => {
    console.log(`[worker] Job ${job.id} active — ${job.data.url}`);
  });

  worker.on('completed', (job) => {
    console.log(`[worker] Job ${job.id} completed — ${job.data.url}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[worker] Job ${job?.id} failed (${job?.data?.url ?? 'unknown'}):`, err.message);
  });

  worker.on('stalled', (jobId) => {
    console.warn(`[worker] Job ${jobId} stalled — will be retried`);
  });

  worker.on('error', (err) => {
    console.error('[worker] Worker error:', err);
  });

  return worker;
}

export function createSiteAuditWorker() {
  if (!redisConnection) {
    throw new Error('[site-worker] REDIS_URL is required to run the BullMQ worker.');
  }

  const worker = new Worker<SiteAuditJobData>(
    SITE_AUDIT_QUEUE_NAME,
    async (job) => {
      console.log(`[site-worker] Starting site audit ${job.data.siteAuditId} — ${job.data.rootUrl}`);
      await processSiteAudit(job.data);
      console.log(`[site-worker] Site audit ${job.data.siteAuditId} orchestration done`);
    },
    { connection: redisConnection, concurrency: 3 }
  );

  worker.on('ready', () => {
    console.log(`[site-worker] Connected to Redis — listening on queue "${SITE_AUDIT_QUEUE_NAME}"`);
  });
  worker.on('failed', (job, err) => {
    console.error(`[site-worker] Job ${job?.id} failed (${job?.data?.rootUrl ?? 'unknown'}):`, err.message);
  });
  worker.on('error', (err) => {
    console.error('[site-worker] Worker error:', err);
  });

  return worker;
}

async function sendCompletionEmail(reportId: string, url: string, userId: string) {
  const [user, report] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, notifyOnComplete: true },
    }),
    prisma.auditReport.findUnique({
      where: { id: reportId },
      select: {
        overallScore: true,
        status: true,
        issues: { select: { severity: true } },
      },
    }),
  ]);

  // Bail out if user opted out, has no email, or audit didn't complete cleanly
  if (!user?.email || !user.notifyOnComplete || report?.status !== 'COMPLETED') return;

  const criticalCount = report.issues.filter((i) => i.severity === 'CRITICAL').length;
  const warningCount = report.issues.filter((i) => i.severity === 'WARNING').length;
  const passedCount = report.issues.filter((i) => i.severity === 'PASSED').length;

  await sendAuditCompleteEmail({
    to: user.email,
    reportId,
    auditUrl: url,
    overallScore: report.overallScore ?? 0,
    criticalCount,
    warningCount,
    passedCount,
    appUrl: process.env.NEXTAUTH_URL ?? process.env.APP_URL,
  });

  console.log(`[worker] Sent completion email to ${user.email} for report ${reportId}`);
}
