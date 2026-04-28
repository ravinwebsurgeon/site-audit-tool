import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createAuditSchema } from '@/validators/audit';
import { createAudit } from '@/services/audit.service';
import { addAuditJob } from '@/queue/audit.queue';
import { getUserAudits } from '@/db/audit';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';
import type { Tier } from '@/lib/rate-limit';

async function isUrlReachable(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'SiteAuditBot/1.0' },
    });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
    }

    const result = createAuditSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: result.error.issues },
        { status: 400 }
      );
    }

    const { url } = result.data;
    const forceNew = req.nextUrl.searchParams.get('refresh') === '1';

    // Reject before queuing if the domain doesn't resolve or is unreachable
    const reachable = await isUrlReachable(url);
    if (!reachable) {
      return NextResponse.json(
        { success: false, message: 'Website not found or unreachable.', code: 'URL_NOT_REACHABLE' },
        { status: 422 }
      );
    }

    // Get session — optional auth
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const tier = (session?.user?.subscriptionTier ?? 'FREE') as Tier;

    // Rate limiting: key = userId or IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'anonymous';
    const rateLimitKey = userId ?? `ip:${ip}`;
    const rateLimit = await checkRateLimit(rateLimitKey, tier, 'audits', userId);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Rate limit exceeded. You can run ${rateLimit.limit} audits per day. Resets at ${rateLimit.resetAt.toUTCString()}.`,
        },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      );
    }

    const { report, fromCache } = await createAudit(url, userId, forceNew);

    if (!fromCache && report.status === 'PENDING') {
      // Always enqueue through addAuditJob:
      //   • Vercel  → published to QStash (VERCEL env is set automatically)
      //   • Local   → enqueued into BullMQ (requires `npm run worker`)
      await addAuditJob({ reportId: report.id, url, userId, isScheduled: false });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: report.id,
          url: report.url,
          status: report.status,
          overallScore: report.overallScore,
          fromCache,
        },
      },
      { status: 201, headers: rateLimitHeaders(rateLimit) }
    );
  } catch (error) {
    if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'MISSING_ENV_KEY') {
      return NextResponse.json(
        { success: false, message: error.message, code: 'MISSING_ENV_KEY' },
        { status: 503 }
      );
    }
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[POST /api/audits] Unhandled error:', msg, error instanceof Error ? error.stack : '');
    return NextResponse.json({ success: false, message: 'Failed to create audit' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(sp.get('pageSize') ?? '10', 10)));

    const { data, total } = await getUserAudits(session.user.id, { page, pageSize });
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, pageSize, total, totalPages },
    });
  } catch (error) {
    console.error('GET /api/audits:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch audits' }, { status: 500 });
  }
}
