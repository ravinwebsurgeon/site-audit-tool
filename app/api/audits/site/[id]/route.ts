import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getSiteAuditById, getSiteAuditSummary, deleteSiteAuditReport } from '@/db/site-audit';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const isSummary = req.nextUrl.searchParams.get('summary') === '1';

    if (isSummary) {
      const summary = await getSiteAuditSummary(id);
      if (!summary) {
        return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
      }
      if (summary.userId && summary.userId !== session.user.id) {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({ success: true, data: summary });
    }

    const report = await getSiteAuditById(id);

    if (!report) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }

    if (report.userId && report.userId !== session.user.id) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error('GET /api/audits/site/[id]:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch site audit' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const report = await getSiteAuditById(id);

    if (!report) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }

    if (report.userId !== session.user.id) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    await deleteSiteAuditReport(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/audits/site/[id]:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete site audit' }, { status: 500 });
  }
}
