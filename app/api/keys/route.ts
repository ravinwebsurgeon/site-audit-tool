import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { createApiKey, getUserApiKeys, revokeApiKey } from '@/db/apikey';

const createSchema = z.object({
  name: z.string().min(1).max(64),
  expiresInDays: z.number().int().positive().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const keys = await getUserApiKeys(session.user.id);
    return NextResponse.json({ success: true, data: keys });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to fetch API keys' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  // Only PRO/ENTERPRISE can create API keys
  const tier = session.user.subscriptionTier ?? 'FREE';
  if (tier === 'FREE') {
    return NextResponse.json(
      { success: false, message: 'API key access requires a Pro or Enterprise subscription' },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Validation failed', errors: parsed.error.issues }, { status: 400 });
  }

  try {
    const { rawKey, ...record } = await createApiKey(
      session.user.id,
      parsed.data.name,
      parsed.data.expiresInDays
    );
    // rawKey returned only once — caller must save it
    return NextResponse.json({ success: true, data: { ...record, rawKey } }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to create API key' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ success: false, message: 'Missing key id' }, { status: 400 });
  }

  try {
    await revokeApiKey(id, session.user.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to revoke key' }, { status: 500 });
  }
}
