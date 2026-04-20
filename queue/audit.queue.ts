import { Queue } from 'bullmq';
import { redisConnection } from '@/lib/redis';
import { AUDIT_QUEUE_NAME } from '@/lib/constants';
import type { AuditJobData } from '@/types';

export const auditQueue = new Queue<AuditJobData>(AUDIT_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export async function addAuditJob(data: AuditJobData) {
  return auditQueue.add('process-audit', data, {
    jobId: data.reportId,
  });
}
