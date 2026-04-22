import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { createSchedule, getUserSchedules } from '@/db/schedule';

const createSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const schedules = await getUserSchedules(session.user.id);
    return NextResponse.json({ success: true, data: schedules });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to fetch schedules' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Validation failed', errors: parsed.error.issues }, { status: 400 });
  }

  try {
    const schedule = await createSchedule({ userId: session.user.id, ...parsed.data });
    return NextResponse.json({ success: true, data: schedule }, { status: 201 });
  } catch (err) {
    console.error('POST /api/schedules:', err);
    return NextResponse.json({ success: false, message: 'Failed to create schedule' }, { status: 500 });
  }
}
