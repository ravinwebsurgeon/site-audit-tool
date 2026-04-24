import { hashUrl, normalizeUrl } from '@/lib/utils';
import { AUDIT_CACHE_TTL_HOURS } from '@/lib/constants';
import {
  createAuditReport,
  findRecentAudit,
  getAuditById,
  updateAuditStatus,
  saveAuditSections,
  saveAuditIssues,
} from '@/db/audit';
import { fetchPage } from '@/lib/fetcher';
import { auditSeo } from './seo.service';
import { auditPerformance } from './performance.service';
import { auditSecurity } from './security.service';
import { auditAccessibility } from './accessibility.service';
import { analyzeWithAi } from './ai.service';
import type {
  AuditCategory,
  AuditData,
  SeoAuditData,
  PerformanceAuditData,
  SecurityAuditData,
  AccessibilityAuditData,
} from '@/types';

export async function createAudit(url: string, userId?: string, forceNew = false) {
  const normalized = normalizeUrl(url);
  const urlHash = hashUrl(normalized);

  if (!forceNew) {
    const cached = await findRecentAudit(urlHash, AUDIT_CACHE_TTL_HOURS, userId);
    if (cached) {
      return { report: cached, fromCache: true };
    }
  }

  const report = await createAuditReport({ userId, url: normalized, urlHash });
  return { report, fromCache: false };
}

export async function processAudit(reportId: string, url: string): Promise<void> {
  const existing = await getAuditById(reportId);
  if (!existing) {
    console.warn(`[audit] processAudit: report ${reportId} not found — job skipped`);
    return;
  }

  await updateAuditStatus(reportId, 'PROCESSING');

  try {
    // Fetch ONCE — all four services share the same page data
    const page = await fetchPage(url);

    const [seo, performance, security, accessibility] = await Promise.all([
      auditSeo(url, page),
      auditPerformance(url, page),
      auditSecurity(url, page),
      auditAccessibility(url, page),
    ]);

    const auditData: AuditData = { url, seo, performance, security, accessibility };
    const aiResult = await analyzeWithAi(auditData);

    const seoScore = computeSeoScore(seo);
    const perfScore = computePerformanceScore(performance);
    const secScore = computeSecurityScore(security);
    const accessScore = computeAccessibilityScore(accessibility);

    // Weighted overall — SEO 30% · Performance 35% · Security 20% · Accessibility 15%
    const overallScore = Math.round(
      seoScore * 0.30 + perfScore * 0.35 + secScore * 0.20 + accessScore * 0.15
    );

    await saveAuditSections(reportId, [
      { category: 'SEO' as AuditCategory, score: seoScore, data: seo as unknown as Record<string, unknown> },
      { category: 'PERFORMANCE' as AuditCategory, score: perfScore, data: performance as unknown as Record<string, unknown> },
      { category: 'SECURITY' as AuditCategory, score: secScore, data: security as unknown as Record<string, unknown> },
      { category: 'ACCESSIBILITY' as AuditCategory, score: accessScore, data: accessibility as unknown as Record<string, unknown> },
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

    const finalScore = Math.min(100, Math.max(0, overallScore));
    await updateAuditStatus(reportId, 'COMPLETED', {
      overallScore: finalScore,
      completedAt: new Date(),
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error during audit';
    await updateAuditStatus(reportId, 'FAILED', { errorMessage: message });
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SEO SCORE  (100 pts)
// ─────────────────────────────────────────────────────────────────────────────
function computeSeoScore(seo: SeoAuditData): number {
  let score = 100;

  // Title — 20 pts. Length matters: ideal 30-60 chars
  if (!seo.title) {
    score -= 20;
  } else if (seo.titleLength < 10) {
    score -= 15;
  } else if (seo.titleLength < 30 || seo.titleLength > 70) {
    score -= 8;
  }

  // Meta description — 15 pts. Length ideal: 120-160
  if (!seo.metaDescription) {
    score -= 15;
  } else if (seo.metaDescriptionLength < 50) {
    score -= 10;  // too short is worse than too long
  } else if (seo.metaDescriptionLength < 80 || seo.metaDescriptionLength > 160) {
    score -= 5;
  }

  // H1 — 12 pts
  if (seo.h1Count === 0) score -= 12;
  else if (seo.h1Count > 1) score -= 5;

  // Technical basics
  if (!seo.hasViewport) score -= 5;
  if (!seo.hasFavicon) score -= 3;
  if (!seo.langAttribute) score -= 3;
  if (!seo.metaCharset) score -= 2;

  // Social — sites with OG/Twitter rank better in social previews
  if (!seo.hasOpenGraph) score -= 5;
  if (!seo.hasTwitterCard) score -= 3;

  // Robots & discoverability
  if (!seo.hasRobotsTxt) score -= 5;
  if (!seo.hasSitemap) score -= 5;
  if (seo.isNoindex) score -= 10;  // major: page won't be indexed

  // Canonical
  if (!seo.hasCanonical) score -= 3;

  // Schema.org structured data
  if (!seo.hasSchemaOrg) score -= 3;

  // Images — alt text missing is an accessibility + SEO issue
  if (seo.totalImages > 0) {
    const missingRatio = seo.imagesWithoutAlt / seo.totalImages;
    if (missingRatio > 0.7) score -= 10;
    else if (missingRatio > 0.4) score -= 6;
    else if (missingRatio > 0.15) score -= 3;
  }

  // Content depth — thin pages rank poorly
  if (seo.wordCount < 50) score -= 10;
  else if (seo.wordCount < 200) score -= 6;
  else if (seo.wordCount < 400) score -= 2;

  // Internal linking (crawlability)
  if (seo.internalLinks === 0) score -= 3;

  return Math.max(0, score);
}

// ─────────────────────────────────────────────────────────────────────────────
// PERFORMANCE SCORE  (100 pts)
// Key insight: server-side response time is ~3-5× faster than real browser.
// Script count and render-blocking are more reliable discriminators.
// ─────────────────────────────────────────────────────────────────────────────
function computePerformanceScore(perf: PerformanceAuditData): number {
  let score = 100;

  // Server response time — even server-side, fast hosts vs slow hosts differ clearly
  if (perf.serverResponseTime > 3000) score -= 22;
  else if (perf.serverResponseTime > 1500) score -= 14;
  else if (perf.serverResponseTime > 800) score -= 8;
  else if (perf.serverResponseTime > 400) score -= 3;

  // HTML document size — a 200KB+ HTML doc is a red flag
  if (perf.htmlSize > 400 * 1024) score -= 16;
  else if (perf.htmlSize > 200 * 1024) score -= 10;
  else if (perf.htmlSize > 100 * 1024) score -= 5;
  else if (perf.htmlSize > 50 * 1024) score -= 2;

  // External script count — this varies dramatically between sites (2 vs 30+)
  if (perf.scriptCount >= 20) score -= 15;
  else if (perf.scriptCount >= 12) score -= 10;
  else if (perf.scriptCount >= 7) score -= 5;
  else if (perf.scriptCount >= 4) score -= 2;

  // Render-blocking scripts in <head>
  if (perf.renderBlockingScripts >= 4) score -= 14;
  else if (perf.renderBlockingScripts >= 2) score -= 9;
  else if (perf.renderBlockingScripts === 1) score -= 4;

  // Render-blocking stylesheets (>2 in head)
  if (perf.hasRenderBlockingCss) score -= 7;

  // Compression — serving uncompressed HTML wastes significant bandwidth
  if (!perf.wasCompressed) score -= 10;

  // Cache-Control — without it, every resource re-downloads on repeat visits
  if (!perf.hasCacheControl) score -= 7;

  // Image lazy loading
  if (perf.imageCount > 3) {
    const lazyRatio = perf.imagesWithLazyLoad / perf.imageCount;
    if (lazyRatio < 0.25) score -= 8;
    else if (lazyRatio < 0.6) score -= 4;
  }

  // Modern image formats (WebP/AVIF vs JPEG/PNG)
  if (!perf.hasModernImageFormats && perf.imageCount > 0) score -= 6;

  // Resource hints (preconnect/preload saves DNS + TCP handshake time)
  if (!perf.hasResourceHints) score -= 5;

  // Third-party scripts — each one is an external request + potential tracking
  if (perf.thirdPartyScripts >= 10) score -= 8;
  else if (perf.thirdPartyScripts >= 5) score -= 4;
  else if (perf.thirdPartyScripts >= 3) score -= 2;

  return Math.max(0, score);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECURITY SCORE  (additive from 0 — not deductive from 100)
// This prevents the "everyone gets 52" convergence since most sites lack headers.
// HTTPS is the critical foundation: no HTTPS → cap at 30.
// ─────────────────────────────────────────────────────────────────────────────
function computeSecurityScore(sec: SecurityAuditData): number {
  let score = 0;

  // HTTPS is the non-negotiable foundation (35 pts)
  if (!sec.isHttps) {
    // Without HTTPS, max possible is 30. Mixed content + no headers expected.
    // Give partial credit if they have some headers but penalize harshly.
    score += 0; // no HTTPS = 0 base, will only earn points from a few checks below
  } else {
    score += 35;
  }

  // HSTS — forces HTTPS on repeat visits (12 pts total)
  if (sec.hasHsts) {
    if (sec.hstsMaxAge !== null && sec.hstsMaxAge >= 31536000) {
      score += 8; // 1 year+
    } else if (sec.hstsMaxAge !== null && sec.hstsMaxAge >= 86400) {
      score += 4; // at least 1 day
    } else {
      score += 2; // present but very short
    }
    if (sec.hstsIncludesSubdomains) score += 4;
  }

  // X-Frame-Options — prevents clickjacking (8 pts)
  if (sec.hasXFrameOptions) score += 8;

  // X-Content-Type-Options — prevents MIME sniffing (6 pts)
  if (sec.hasXContentTypeOptions) score += 6;

  // Content-Security-Policy — most impactful XSS mitigation (14 pts)
  if (sec.hasCSP) score += 14;

  // Referrer-Policy — controls info sent on navigation (5 pts)
  if (sec.hasReferrerPolicy) score += 5;

  // Permissions-Policy — restricts access to browser APIs (5 pts)
  if (sec.hasPermissionsPolicy) score += 5;

  // Cross-Origin-Opener-Policy — Spectre mitigation (5 pts)
  if (sec.hasCOOP) score += 5;

  // Clean: no mixed content (bonus pts on HTTPS sites)
  if (sec.isHttps && !sec.hasMixedContent) score += 5;
  else if (sec.hasMixedContent) score -= 12; // actively harmful

  // Penalties for bad practices
  if (sec.corsAllowAll) score -= 8;
  if (sec.fingerprintingExposed) score -= 5;

  // Cap and floor
  return Math.min(100, Math.max(0, score));
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCESSIBILITY SCORE  (additive from 0)
// ─────────────────────────────────────────────────────────────────────────────
function computeAccessibilityScore(a: AccessibilityAuditData): number {
  let score = 0;

  // Language attribute (10 pts)
  if (a.hasLangAttribute) score += 10;

  // Image alt text (20 pts)
  if (a.totalImages === 0) {
    score += 20;
  } else {
    const altRatio = 1 - a.imagesWithoutAlt / a.totalImages;
    score += Math.round(altRatio * 20);
  }

  // Skip link (10 pts)
  if (a.hasSkipLink) score += 10;

  // Heading hierarchy (15 pts)
  if (a.headingHierarchyValid) score += 15;

  // Buttons accessible text (15 pts)
  if (a.totalButtons === 0) {
    score += 15;
  } else {
    const ratio = 1 - a.buttonsWithoutText / a.totalButtons;
    score += Math.round(ratio * 15);
  }

  // Links accessible text (10 pts)
  if (a.totalLinks === 0) {
    score += 10;
  } else {
    const ratio = 1 - a.linksWithoutText / a.totalLinks;
    score += Math.round(ratio * 10);
  }

  // Form labels (10 pts)
  if (a.totalFormInputs === 0) {
    score += 10;
  } else {
    const ratio = 1 - a.formInputsWithoutLabel / a.totalFormInputs;
    score += Math.round(ratio * 10);
  }

  // ARIA usage (5 pts)
  if (a.hasAriaLabels) score += 3;
  if (a.hasRoleAttributes) score += 2;

  // Role attributes (5 pts — already factored above via ARIA)
  // Bonus for tabindex usage showing intentional focus management
  if (a.tabindexCount > 0) score += 5;

  return Math.min(100, Math.max(0, score));
}
