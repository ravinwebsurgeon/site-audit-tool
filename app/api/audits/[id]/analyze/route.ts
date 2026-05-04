import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeWithAi } from '@/services/ai.service';
import { saveAuditIssues } from '@/db/audit';
import type {
  AuditData,
  AuditCategory,
  SeoAuditData,
  PerformanceAuditData,
  SecurityAuditData,
  AccessibilityAuditData,
} from '@/types';

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    const report = await prisma.auditReport.findUnique({
      where: { id },
      include: {
        sections: true,
        issues: { select: { id: true }, take: 1 },
      },
    });

    if (!report) {
      return NextResponse.json({ success: false, message: 'Audit not found' }, { status: 404 });
    }

    if (report.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, message: 'Audit is not completed yet' },
        { status: 400 }
      );
    }

    // Already has recommendations — return existing ones to avoid duplicate generation
    if (report.issues.length > 0) {
      const existing = await prisma.auditIssue.findMany({
        where: { reportId: id },
        orderBy: [{ severity: 'asc' }, { category: 'asc' }],
      });
      return NextResponse.json({ success: true, issues: existing });
    }

    // Rebuild AuditData from the stored JSONB section data
    const sectionMap = Object.fromEntries(
      report.sections.map((s) => [s.category, s.data])
    ) as Record<AuditCategory, unknown>;

    const seo = sectionMap['SEO'] as SeoAuditData;
    const performance = sectionMap['PERFORMANCE'] as PerformanceAuditData;
    const security = sectionMap['SECURITY'] as SecurityAuditData;
    const accessibility = sectionMap['ACCESSIBILITY'] as AccessibilityAuditData;

    if (!seo || !performance || !security) {
      return NextResponse.json(
        { success: false, message: 'Audit section data is incomplete' },
        { status: 400 }
      );
    }

    const auditData: AuditData = {
      url: report.url,
      seo,
      performance,
      security,
      accessibility: accessibility ?? ({} as AccessibilityAuditData),
    };

    const aiResult = await analyzeWithAi(auditData);

    await saveAuditIssues(
      id,
      aiResult.recommendations.map((r) => ({
        category: r.category as AuditCategory,
        severity: r.severity,
        title: r.title,
        description: r.description,
        recommendation: r.recommendation,
      }))
    );

    const issues = await prisma.auditIssue.findMany({
      where: { reportId: id },
      orderBy: [{ severity: 'asc' }, { category: 'asc' }],
    });

    return NextResponse.json({ success: true, issues });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI analysis failed';
    console.error(`[analyze-api] Failed for report ${id}:`, message);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
