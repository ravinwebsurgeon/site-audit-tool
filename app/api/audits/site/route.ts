import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createAuditSchema } from '@/validators/audit';
import { createSiteAuditReport, getUserSiteAudits } from '@/db/site-audit';
import { addSiteAuditJob } from '@/queue/audit.queue';
import { hashUrl, normalizeUrl } from '@/lib/utils';
import { SITE_AUDIT_PAGE_LIMITS } from '@/lib/constants';
import type { Tier } from '@/lib/constants';

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

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { url } = result.data;
    const normalized = normalizeUrl(url);
    const urlHash = hashUrl(normalized);
    const tier = (session.user.subscriptionTier ?? 'FREE') as Tier;
    const pagesLimit = SITE_AUDIT_PAGE_LIMITS[tier];

    const report = await createSiteAuditReport({
      userId: session.user.id,
      rootUrl: normalized,
      urlHash,
      pagesLimit,
    });

    await addSiteAuditJob({
      siteAuditId: report.id,
      rootUrl: normalized,
      userId: session.user.id,
      pagesLimit,
    });

    return NextResponse.json(
      { success: true, data: { id: report.id, rootUrl: report.rootUrl, status: report.status, pagesLimit } },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'MISSING_ENV_KEY') {
      return NextResponse.json(
        { success: false, message: error.message, code: 'MISSING_ENV_KEY' },
        { status: 503 }
      );
    }
    console.error('[POST /api/audits/site]', error);
    return NextResponse.json({ success: false, message: 'Failed to create site audit' }, { status: 500 });
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

    const { data, total } = await getUserSiteAudits(session.user.id, { page, pageSize });
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, pageSize, total, totalPages },
    });
  } catch (error) {
    console.error('GET /api/audits/site:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch site audits' }, { status: 500 });
  }
}
