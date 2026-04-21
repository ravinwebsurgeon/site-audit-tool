import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const audits = await prisma.auditReport.findMany({
      where: { status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        url: true,
        overallScore: true,
        status: true,
        createdAt: true,
        completedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: audits });
  } catch (error) {
    console.error('GET /api/audits/recent:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch recent audits' }, { status: 500 });
  }
}
