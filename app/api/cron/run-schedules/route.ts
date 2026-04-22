import { NextRequest, NextResponse } from 'next/server';
import { getDueSchedules, markScheduleRan } from '@/db/schedule';
import { createAudit, processAudit } from '@/services/audit.service';
import type { ScheduleFrequency } from '@/types';

type DueSchedule = Awaited<ReturnType<typeof getDueSchedules>>[number];

// Called by Vercel Cron every 15 minutes
export async function POST(req: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const due = await getDueSchedules();
  if (due.length === 0) {
    return NextResponse.json({ ran: 0 });
  }

  const results: { id: string; url: string; status: 'queued' | 'error' }[] = [];

  await Promise.allSettled(
    due.map(async (schedule: DueSchedule) => {
      try {
        const { report } = await createAudit(schedule.url, schedule.userId, true);
        // Process inline (cron has longer timeout than API routes)
        processAudit(report.id, schedule.url).catch(console.error);
        await markScheduleRan(schedule.id, report.id, schedule.frequency as ScheduleFrequency);
        results.push({ id: schedule.id, url: schedule.url, status: 'queued' });
      } catch (err) {
        console.error(`[cron] Failed to run schedule ${schedule.id}:`, err);
        results.push({ id: schedule.id, url: schedule.url, status: 'error' });
      }
    })
  );

  return NextResponse.json({ ran: results.length, results });
}
