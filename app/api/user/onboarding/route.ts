import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { markOnboardingDone } from '@/db/user';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  await markOnboardingDone(session.user.id);
  return NextResponse.json({ success: true });
}
