import { hashUrl, normalizeUrl } from '@/lib/utils';
import { AUDIT_CACHE_TTL_HOURS } from '@/lib/constants';
import {
  createAuditReport,
  findRecentAudit,
  updateAuditStatus,
  saveAuditSections,
  saveAuditIssues,
} from '@/db/audit';
import { addAuditJob } from '@/queue/audit.queue';
import { auditSeo } from './seo.service';
import { auditPerformance } from './performance.service';
import { auditSecurity } from './security.service';
import { analyzeWithAi } from './ai.service';
import type { AuditCategory, AuditData, SeoAuditData, PerformanceAuditData, SecurityAuditData } from '@/types';

export async function createAudit(url: string, userId?: string) {
  const normalized = normalizeUrl(url);
  const urlHash = hashUrl(normalized);

  const cached = await findRecentAudit(urlHash, AUDIT_CACHE_TTL_HOURS);
  if (cached) {
    return { report: cached, fromCache: true };
  }

  const report = await createAuditReport({ userId, url: normalized, urlHash });
  await addAuditJob({ reportId: report.id, url: normalized, userId });

  return { report, fromCache: false };
}

export async function processAudit(reportId: string, url: string): Promise<void> {
  await updateAuditStatus(reportId, 'PROCESSING');

  try {
    const [seo, performance, security] = await Promise.all([
      auditSeo(url),
      auditPerformance(url),
      auditSecurity(url),
    ]);

    const auditData: AuditData = { url, seo, performance, security };
    const aiResult = await analyzeWithAi(auditData);

    await saveAuditSections(reportId, [
      { category: 'SEO' as AuditCategory, score: computeSeoScore(seo), data: seo as unknown as Record<string, unknown> },
      { category: 'PERFORMANCE' as AuditCategory, score: computePerformanceScore(performance), data: performance as unknown as Record<string, unknown> },
      { category: 'SECURITY' as AuditCategory, score: computeSecurityScore(security), data: security as unknown as Record<string, unknown> },
    ]);

    await saveAuditIssues(
      reportId,
      aiResult.recommendations.map((r) => ({
        category: r.category as AuditCategory,
        severity: r.severity,
        title: r.title,
        description: r.description,
        recommendation: r.recommendation,
      }))
    );

    await updateAuditStatus(reportId, 'COMPLETED', {
      overallScore: Math.min(100, Math.max(0, aiResult.overallScore)),
      completedAt: new Date(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error during audit';
    await updateAuditStatus(reportId, 'FAILED', { errorMessage: message });
    throw error;
  }
}

function computeSeoScore(seo: SeoAuditData): number {
  let score = 100;
  if (!seo.title) score -= 20;
  else if (seo.titleLength < 30 || seo.titleLength > 60) score -= 10;
  if (!seo.metaDescription) score -= 15;
  else if (seo.metaDescriptionLength < 120 || seo.metaDescriptionLength > 160) score -= 5;
  if (seo.h1Count === 0) score -= 15;
  else if (seo.h1Count > 1) score -= 5;
  if (!seo.hasOpenGraph) score -= 10;
  if (!seo.hasCanonical) score -= 5;
  if (!seo.hasRobotsTxt) score -= 10;
  if (!seo.hasSitemap) score -= 10;
  return Math.max(0, score);
}

function computePerformanceScore(perf: PerformanceAuditData): number {
  let score = 100;
  if (perf.pageSize > 3 * 1024 * 1024) score -= 25;
  else if (perf.pageSize > 1 * 1024 * 1024) score -= 10;
  if (perf.loadTime > 5000) score -= 25;
  else if (perf.loadTime > 3000) score -= 10;
  if (perf.hasRenderBlockingJs) score -= 20;
  if (perf.hasRenderBlockingCss) score -= 10;
  return Math.max(0, score);
}

function computeSecurityScore(sec: SecurityAuditData): number {
  let score = 100;
  if (!sec.isHttps) score -= 30;
  if (!sec.hasHsts) score -= 15;
  if (!sec.hasXFrameOptions) score -= 10;
  if (!sec.hasXContentTypeOptions) score -= 10;
  if (!sec.hasCSP) score -= 15;
  if (sec.hasMixedContent) score -= 20;
  return Math.max(0, score);
}
