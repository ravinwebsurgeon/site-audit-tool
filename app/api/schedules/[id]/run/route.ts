import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getScheduleById, markScheduleRan } from '@/db/schedule';
import { createAudit } from '@/services/audit.service';
import { addAuditJob } from '@/queue/audit.queue';
import type { ScheduleFrequency } from '@/types';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const schedule = await getScheduleById(id, session.user.id);
  if (!schedule) {
    return NextResponse.json({ success: false, message: 'Schedule not found' }, { status: 404 });
  }
  if (!schedule.isActive) {
    return NextResponse.json({ success: false, message: 'Schedule is paused' }, { status: 400 });
  }

  try {
    const { report } = await createAudit(schedule.url, session.user.id, true);
    await addAuditJob({ reportId: report.id, url: schedule.url, userId: session.user.id, isScheduled: true });
    const updated = await markScheduleRan(schedule.id, report.id, schedule.frequency as ScheduleFrequency);
    return NextResponse.json({ success: true, data: { reportId: report.id, schedule: updated } });
  } catch (err) {
    console.error(`[schedules/run] Failed to run schedule ${id}:`, err);
    return NextResponse.json({ success: false, message: 'Failed to run schedule' }, { status: 500 });
  }
}
