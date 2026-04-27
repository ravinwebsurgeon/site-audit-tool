import { Queue } from 'bullmq';
import { redisConnection } from '@/lib/redis';
import { AUDIT_QUEUE_NAME } from '@/lib/constants';
import type { AuditJobData } from '@/types';

// Used by the local BullMQ worker process (dev / self-hosted only)
export const auditQueue = new Queue<AuditJobData>(AUDIT_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export async function addAuditJob(data: AuditJobData): Promise<void> {
  if (process.env.VERCEL) {
    // Production (Vercel): publish via QStash — serverless functions can't run
    // background work after the response is sent. QStash delivers to
    // /api/worker/process-audit and handles retries automatically.
    const { qstash, getWorkerUrl } = await import('@/lib/qstash');
    await qstash.publishJSON({
      url: getWorkerUrl(),
      body: data,
      retries: 3,
    });
    console.log(`[queue] Published to QStash for report ${data.reportId}`);
    return;
  }

  // Local / self-hosted: enqueue into BullMQ (requires `npm run worker` running).
  // QSTASH_TOKEN may be present in .env for reference but must NOT be used here —
  // QStash rejects localhost/loopback destination URLs.
  await auditQueue.add('process-audit', data, { jobId: data.reportId });
  console.log(`[queue] Enqueued BullMQ job for report ${data.reportId}`);
}
