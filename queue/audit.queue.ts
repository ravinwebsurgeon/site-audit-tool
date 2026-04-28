import { Queue } from 'bullmq';
import { redisConnection } from '@/lib/redis';
import { AUDIT_QUEUE_NAME } from '@/lib/constants';
import type { AuditJobData } from '@/types';

// null when REDIS_URL is not set — BullMQ is dev-only, production uses QStash.
export const auditQueue = redisConnection
  ? new Queue<AuditJobData>(AUDIT_QUEUE_NAME, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    })
  : null;

export async function addAuditJob(data: AuditJobData): Promise<void> {
  if (process.env.QSTASH_TOKEN) {
    const { qstash, getWorkerUrl } = await import('@/lib/qstash');
    await qstash.publishJSON({
      url: getWorkerUrl(),
      body: data,
      retries: 3,
    });
    console.log(`[queue] Published to QStash for report ${data.reportId}`);
    return;
  }

  if (!auditQueue) {
    const err = new Error('Queue service is not configured. Set QSTASH_TOKEN (for QStash) or REDIS_URL (for BullMQ) in your environment variables.');
    (err as NodeJS.ErrnoException).code = 'MISSING_ENV_KEY';
    throw err;
  }
  await auditQueue.add('process-audit', data, { jobId: data.reportId });
  console.log(`[queue] Enqueued BullMQ job for report ${data.reportId}`);
}
