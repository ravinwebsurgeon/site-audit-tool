import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getUserById } from '@/db/user';

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
      createdAt: user.createdAt,
      subscription: user.subscription,
    },
  });
}
