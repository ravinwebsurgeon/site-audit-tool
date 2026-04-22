import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getUserById, updateNotifyOnComplete, updateUserProfile } from '@/db/user';
import { z } from 'zod';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const user = await getUserById(session.user.id);
  if (!user) {
    return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      subscriptionTier: user.subscriptionTier,
      onboardingDone: user.onboardingDone,
      notifyOnComplete: user.notifyOnComplete,
      createdAt: user.createdAt,
      subscription: user.subscription,
    },
  });
}

const patchSchema = z.object({
  notifyOnComplete: z.boolean().optional(),
  name: z.string().min(1).max(100).optional(),
  image: z.string().url().nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Validation failed' }, { status: 400 });
  }

  try {
    const { notifyOnComplete, name, image } = parsed.data;
    if (notifyOnComplete !== undefined) {
      await updateNotifyOnComplete(session.user.id, notifyOnComplete);
    }
    if (name !== undefined || image !== undefined) {
      await updateUserProfile(session.user.id, {
        ...(name !== undefined ? { name } : {}),
        ...(image !== undefined ? { image: image ?? undefined } : {}),
      });
    }
    return NextResponse.json({ success: true, data: parsed.data });
  } catch (err) {
    console.error('PATCH /api/user:', err);
    return NextResponse.json({ success: false, message: 'Failed to update' }, { status: 500 });
  }
}
