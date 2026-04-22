import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/db/apikey';
import { getUserAudits } from '@/db/audit';
import { checkRateLimit } from '@/lib/rate-limit';
import type { Tier } from '@/lib/rate-limit';

// Phase 3: Public API — authenticated via Bearer API key
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  const raw = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!raw) {
    return NextResponse.json(
      { error: 'Missing Authorization header. Use: Authorization: Bearer sk_...' },
      { status: 401 }
    );
  }

  const key = await validateApiKey(raw);
  if (!key) {
    return NextResponse.json({ error: 'Invalid or expired API key' }, { status: 401 });
  }

  // Rate limit by API key owner
  const tier = (key.user.subscriptionTier ?? 'FREE') as Tier;
  const rateCheck = await checkRateLimit(`apikey:${key.userId}`, tier);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Resets at ${rateCheck.resetAt.toUTCString()}` },
      { status: 429 }
    );
  }

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(sp.get('pageSize') ?? '20', 10)));

  const { data, total } = await getUserAudits(key.userId, { page, pageSize });
  const totalPages = Math.ceil(total / pageSize);

  return NextResponse.json({
    object: 'list',
    data: data.map((a) => ({
      id: a.id,
      url: a.url,
      status: a.status,
      overallScore: a.overallScore,
      createdAt: a.createdAt,
      completedAt: a.completedAt,
    })),
    pagination: { page, pageSize, total, totalPages },
  });
}
