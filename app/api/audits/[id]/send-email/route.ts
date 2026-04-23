import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendAuditCompleteEmail } from '@/lib/mail';

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const report = await prisma.auditReport.findUnique({
      where: { id },
      include: {
        user: { select: { email: true } },
        issues: { select: { severity: true } },
      },
    });

    if (!report) {
      return NextResponse.json({ success: false, message: 'Report not found' }, { status: 404 });
    }

    if (report.user?.email !== session.user.email) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    if (report.status !== 'COMPLETED' || report.overallScore === null) {
      return NextResponse.json({ success: false, message: 'Report not complete' }, { status: 400 });
    }

    const criticalCount = report.issues.filter((i) => i.severity === 'CRITICAL').length;
    const warningCount = report.issues.filter((i) => i.severity === 'WARNING').length;
    const passedCount = report.issues.filter((i) => i.severity === 'PASSED').length;

    await sendAuditCompleteEmail({
      to: session.user.email,
      reportId: id,
      auditUrl: report.url,
      overallScore: report.overallScore,
      criticalCount,
      warningCount,
      passedCount,
      appUrl: process.env.NEXTAUTH_URL ?? 'https://siteaudit.app',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/audits/[id]/send-email:', error);
    return NextResponse.json({ success: false, message: 'Failed to send email' }, { status: 500 });
  }
}
