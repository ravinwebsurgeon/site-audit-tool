import { NextRequest, NextResponse } from 'next/server';
import { getAuditById, deleteAuditReport } from '@/db/audit';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const report = await getAuditById(id);

    if (!report) {
      return NextResponse.json(
        { success: false, message: 'Audit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error('GET /api/audits/[id]:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch audit' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const userId = req.headers.get('x-user-id');

    const report = await getAuditById(id);
    if (!report) {
      return NextResponse.json(
        { success: false, message: 'Audit not found' },
        { status: 404 }
      );
    }

    if (report.userId && report.userId !== userId) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      );
    }

    await deleteAuditReport(id);
    return NextResponse.json({ success: true, message: 'Audit deleted' });
  } catch (error) {
    console.error('DELETE /api/audits/[id]:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete audit' },
      { status: 500 }
    );
  }
}
