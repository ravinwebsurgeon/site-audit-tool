import { Queue } from 'bullmq';
import { redisConnection } from '@/lib/redis';
import { AUDIT_QUEUE_NAME, SITE_AUDIT_QUEUE_NAME } from '@/lib/constants';
import type { AuditJobData, SiteAuditJobData } from '@/types';

const queueOpts = {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
};

// null when REDIS_URL is not set — BullMQ is dev-only, production uses QStash.
export const auditQueue = redisConnection
  ? new Queue<AuditJobData>(AUDIT_QUEUE_NAME, { connection: redisConnection, ...queueOpts })
  : null;

export const siteAuditQueue = redisConnection
  ? new Queue<SiteAuditJobData>(SITE_AUDIT_QUEUE_NAME, { connection: redisConnection, ...queueOpts })
  : null;

export async function addAuditJob(data: AuditJobData, opts?: { delaySeconds?: number }): Promise<void> {
  const delaySeconds = opts?.delaySeconds ?? 0;

  if (process.env.QSTASH_TOKEN) {
    const mask = (v?: string) => v ? `${v.slice(0, 8)}… (${v.length} chars)` : 'NOT SET';
    console.log('[qstash-env] QSTASH_URL            :', process.env.QSTASH_URL ?? 'NOT SET');
    console.log('[qstash-env] QSTASH_TOKEN           :', mask(process.env.QSTASH_TOKEN));
    console.log('[qstash-env] QSTASH_CURRENT_SIGNING_KEY:', mask(process.env.QSTASH_CURRENT_SIGNING_KEY));
    console.log('[qstash-env] QSTASH_NEXT_SIGNING_KEY   :', mask(process.env.QSTASH_NEXT_SIGNING_KEY));

    const { qstash, getWorkerUrl } = await import('@/lib/qstash');
    await qstash.publishJSON({
      url: getWorkerUrl(),
      body: data,
      retries: 3,
      ...(delaySeconds > 0 && { delay: delaySeconds }),
    });
    console.log(`[queue] Published to QStash for report ${data.reportId}${delaySeconds > 0 ? ` (delay ${delaySeconds}s)` : ''}`);
    return;
  }

  if (!auditQueue) {
    const err = new Error('Queue service is not configured. Set QSTASH_TOKEN (for QStash) or REDIS_URL (for BullMQ) in your environment variables.');
    (err as NodeJS.ErrnoException).code = 'MISSING_ENV_KEY';
    throw err;
  }
  await auditQueue.add('process-audit', data, {
    jobId: data.reportId,
    ...(delaySeconds > 0 && { delay: delaySeconds * 1000 }),
  });
  console.log(`[queue] Enqueued BullMQ job for report ${data.reportId}${delaySeconds > 0 ? ` (delay ${delaySeconds}s)` : ''}`);
}

export async function addSiteAuditJob(data: SiteAuditJobData): Promise<void> {
  if (process.env.QSTASH_TOKEN) {
    const { qstash, getSiteWorkerUrl } = await import('@/lib/qstash');
    await qstash.publishJSON({
      url: getSiteWorkerUrl(),
      body: data,
      retries: 3,
    });
    console.log(`[queue] Published site audit to QStash for ${data.siteAuditId}`);
    return;
  }

  if (!siteAuditQueue) {
    const err = new Error('Queue service is not configured. Set QSTASH_TOKEN (for QStash) or REDIS_URL (for BullMQ) in your environment variables.');
    (err as NodeJS.ErrnoException).code = 'MISSING_ENV_KEY';
    throw err;
  }
  await siteAuditQueue.add('process-site-audit', data, { jobId: data.siteAuditId });
  console.log(`[queue] Enqueued BullMQ site audit job for ${data.siteAuditId}`);
}
