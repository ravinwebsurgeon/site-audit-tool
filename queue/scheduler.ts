import { getDueSchedules, markScheduleRan } from '@/db/schedule';
import { createAudit } from '@/services/audit.service';
import { addAuditJob } from '@/queue/audit.queue';
import type { ScheduleFrequency } from '@/types';

/**
 * Finds every active schedule whose nextRunAt has passed, creates an audit
 * report for each, enqueues it into BullMQ, then advances nextRunAt.
 *
 * Used by both the Vercel cron route (GET /api/cron/run-schedules) and the
 * worker's built-in scheduler so the exact same logic runs in both environments.
 */
export async function runDueSchedules(): Promise<number> {
  const due = await getDueSchedules();
  if (due.length === 0) return 0;

  const results = await Promise.allSettled(
    due.map(async (schedule) => {
      const { report } = await createAudit(schedule.url, schedule.userId, true);
      await addAuditJob({
        reportId: report.id,
        url: schedule.url,
        userId: schedule.userId,
        isScheduled: true,
      });
      await markScheduleRan(schedule.id, report.id, schedule.frequency as ScheduleFrequency);
      console.log(`[scheduler] Queued audit for ${schedule.url} (scheduleId=${schedule.id})`);
    })
  );

  const failed = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
  failed.forEach((r) => console.error('[scheduler] Failed to queue a schedule:', r.reason));

  return results.filter((r) => r.status === 'fulfilled').length;
}
