import { NextRequest, NextResponse } from 'next/server';
import { createAuditSchema } from '@/validators/audit';
import { createAudit, processAudit } from '@/services/audit.service';
import { getUserAudits } from '@/db/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const result = createAuditSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: result.error.issues },
        { status: 400 }
      );
    }

    const { url } = result.data;
    const userId = req.headers.get('x-user-id') ?? undefined;

    const { report, fromCache } = await createAudit(url, userId);

    // Fire-and-forget background processing (no separate worker process needed)
    if (!fromCache && report.status === 'PENDING') {
      processAudit(report.id, url).catch((err) =>
        console.error(`[audit] processAudit failed for ${report.id}:`, err)
      );
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
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/audits:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create audit' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const audits = await getUserAudits(userId);
    return NextResponse.json({ success: true, data: audits });
  } catch (error) {
    console.error('GET /api/audits:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch audits' },
      { status: 500 }
    );
  }
}
