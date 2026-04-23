import { NextRequest, NextResponse } from 'next/server';
import { runDueSchedules } from '@/queue/scheduler';

// Called by Vercel Cron every 15 minutes via GET request
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
