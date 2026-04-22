import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { updateSchedule, deleteSchedule, getScheduleById } from '@/db/schedule';

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Validation failed' }, { status: 400 });
  }

  try {
    const existing = await getScheduleById(id, session.user.id);
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Schedule not found' }, { status: 404 });
    }
    await updateSchedule(id, session.user.id, parsed.data);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to update schedule' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await getScheduleById(id, session.user.id);
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Schedule not found' }, { status: 404 });
    }
    await deleteSchedule(id, session.user.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to delete schedule' }, { status: 500 });
  }
}
