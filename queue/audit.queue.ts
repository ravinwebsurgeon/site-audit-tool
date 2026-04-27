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
  if (process.env.QSTASH_TOKEN) {
    // QStash is configured — use it in both local dev and production.
    // Local dev: set QSTASH_URL=http://localhost:8080 and run `npm run qstash:dev`
    // so the local emulator forwards jobs to /api/worker/process-audit.
    // Production: QSTASH_URL points to the real QStash cloud endpoint.
    const { qstash, getWorkerUrl } = await import('@/lib/qstash');
    await qstash.publishJSON({
      url: getWorkerUrl(),
      body: data,
      retries: 3,
    });
    console.log(`[queue] Published to QStash for report ${data.reportId}`);
    return;
  }

  // Fallback: BullMQ (local dev without QStash — requires `npm run worker`).
  await auditQueue.add('process-audit', data, { jobId: data.reportId });
  console.log(`[queue] Enqueued BullMQ job for report ${data.reportId}`);
}
