import { Worker } from 'bullmq';
import { redisConnection } from '@/lib/redis';
import { AUDIT_QUEUE_NAME } from '@/lib/constants';
import { processAudit } from '@/services/audit.service';
import type { AuditJobData } from '@/types';

export function createAuditWorker() {
  const worker = new Worker<AuditJobData>(
    AUDIT_QUEUE_NAME,
    async (job) => {
      const { reportId, url } = job.data;
      console.log(`[worker] Processing audit ${reportId} for ${url}`);
      await processAudit(reportId, url);
      console.log(`[worker] Completed audit ${reportId}`);
    },
    {
      connection: redisConnection,
      concurrency: 5,
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`[worker] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('[worker] Error:', err);
  });

  return worker;
}
