import { NextRequest, NextResponse } from 'next/server';
import { runDueSchedules } from '@/queue/scheduler';

// Called by Vercel Cron every default 24 hours via GET request but you can set a custom time for local testing in vercel.json (e.g. "schedule": "*/1 * * * *" to run every minute).
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const queued = await runDueSchedules();
    return NextResponse.json({ queued });
  } catch (err) {
    console.error('[cron] run-schedules error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
