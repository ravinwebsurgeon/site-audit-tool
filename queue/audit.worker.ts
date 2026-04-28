import { Worker } from 'bullmq';
import { redisConnection } from '@/lib/redis';
import { AUDIT_QUEUE_NAME } from '@/lib/constants';
import { processAudit } from '@/services/audit.service';
import { sendAuditCompleteEmail } from '@/lib/mail';
import { prisma } from '@/lib/prisma';
import type { AuditJobData } from '@/types';

export function createAuditWorker() {
  if (!redisConnection) {
    throw new Error('[worker] REDIS_URL is required to run the BullMQ worker.');
  }

  const worker = new Worker<AuditJobData>(
    AUDIT_QUEUE_NAME,
    async (job) => {
      const { reportId, url, userId, isScheduled } = job.data;
      console.log(`[worker] Starting audit ${reportId} — ${url}`);

      await processAudit(reportId, url);
      console.log(`[worker] Audit ${reportId} finished — ${url}`);

      // Only send email for scheduled audits where the user opted in
      if (isScheduled && userId) {
        try {
          await sendCompletionEmail(reportId, url, userId);
        } catch (err) {
          // Email failure must never fail the job — the audit already succeeded
          console.error(`[worker] Failed to send completion email for report ${reportId}:`, err);
        }
      }
    },
    {
      connection: redisConnection,  // narrowed to non-null by the guard above
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
