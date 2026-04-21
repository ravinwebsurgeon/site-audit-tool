import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getAuditById, deleteAuditReport } from '@/db/audit';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const report = await getAuditById(id);

    if (!report) {
      return NextResponse.json({ success: false, message: 'Audit not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error('GET /api/audits/[id]:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch audit' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    const report = await getAuditById(id);
    if (!report) {
      return NextResponse.json({ success: false, message: 'Audit not found' }, { status: 404 });
    }

    // Only the owner can delete their report
    if (report.userId && report.userId !== session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    await deleteAuditReport(id);
    return NextResponse.json({ success: true, message: 'Audit deleted' });
  } catch (error) {
    console.error('DELETE /api/audits/[id]:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete audit' }, { status: 500 });
  }
}
