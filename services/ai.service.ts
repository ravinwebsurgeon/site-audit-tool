import Anthropic from '@anthropic-ai/sdk';
import type { AuditData, AiAnalysisResult } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 30_000, // 30 s — keeps the Claude call well within the 60 s worker budget
});

function repairTruncatedJson(raw: string): string {
  const lastComplete = raw.lastIndexOf('},');
  if (lastComplete !== -1) {
    raw = raw.slice(0, lastComplete + 1);
  }
  const opens = (raw.match(/\[/g) ?? []).length - (raw.match(/\]/g) ?? []).length;
  const braces = (raw.match(/\{/g) ?? []).length - (raw.match(/\}/g) ?? []).length;
  raw = raw.trimEnd().replace(/,\s*$/, '');
  raw += ']'.repeat(Math.max(0, opens)) + '}'.repeat(Math.max(0, braces));
  return raw;
}

function buildAuditPrompt(data: AuditData): string {
  const { seo, performance, security } = data;

  return `You are an expert web performance, SEO, and security auditor. Analyze the following site audit data and return actionable recommendations.

URL: ${data.url}

SEO METRICS:
- Title: "${seo.title ?? 'MISSING'}" (${seo.titleLength} chars, ideal: 30-60)
- Meta description: ${seo.metaDescription ? `"${seo.metaDescription}" (${seo.metaDescriptionLength} chars, ideal: 120-160)` : 'MISSING'}
- H1 tags: ${seo.h1Count} (ideal: exactly 1)
- Open Graph: ${seo.hasOpenGraph ? 'present' : 'missing'}
- Twitter Card: ${seo.hasTwitterCard ? 'present' : 'missing'}
- Canonical URL: ${seo.hasCanonical ? seo.canonicalUrl : 'missing'}
- robots.txt: ${seo.hasRobotsTxt ? 'found' : 'not found'}
- Sitemap: ${seo.hasSitemap ? 'found' : 'not found'}
- Noindex: ${seo.isNoindex}
- Schema.org: ${seo.hasSchemaOrg ? 'present' : 'missing'}
- Images without alt: ${seo.imagesWithoutAlt}/${seo.totalImages}
- Internal links: ${seo.internalLinks}, External links: ${seo.externalLinks}
- Word count: ${seo.wordCount}

PERFORMANCE METRICS:
- Server response time: ${performance.serverResponseTime}ms (server-side TTFB proxy — real browser FCP/LCP is typically 2-5x higher)
- HTML size: ${(performance.htmlSize / 1024).toFixed(1)} KB
- Total resources: ${performance.resourceCount} (${performance.scriptCount} scripts, ${performance.styleCount} styles, ${performance.imageCount} images)
- Render-blocking scripts in <head>: ${performance.renderBlockingScripts}
- Render-blocking stylesheets: ${performance.renderBlockingStyles}
- Compression: ${performance.wasCompressed ? 'enabled' : 'DISABLED'}
- Cache-Control header: ${performance.hasCacheControl ? performance.cacheControlValue : 'missing'}
- Images with lazy loading: ${performance.imagesWithLazyLoad}/${performance.imageCount}
- Modern image formats (WebP/AVIF): ${performance.hasModernImageFormats ? 'found' : 'not found'}
- Resource hints (preload/prefetch/preconnect): ${performance.resourceHintsCount}
- Third-party scripts: ${performance.thirdPartyScripts}

SECURITY METRICS:
- HTTPS: ${security.isHttps ? 'yes' : 'NO — CRITICAL'}
- HSTS: ${security.hasHsts ? `yes (max-age=${security.hstsMaxAge}s${security.hstsIncludesSubdomains ? ', includeSubDomains' : ''})` : 'missing'}
- X-Frame-Options: ${security.hasXFrameOptions ? security.xFrameOptionsValue : 'missing'}
- X-Content-Type-Options: ${security.hasXContentTypeOptions ? 'present' : 'missing'}
- Content-Security-Policy: ${security.hasCSP ? 'present' : 'missing'}
- Referrer-Policy: ${security.hasReferrerPolicy ? 'present' : 'missing'}
- Permissions-Policy: ${security.hasPermissionsPolicy ? 'present' : 'missing'}
- Cross-Origin-Opener-Policy: ${security.hasCOOP ? 'present' : 'missing'}
- Mixed content (HTTP resources on HTTPS page): ${security.mixedContentCount} resource(s)
- Server header fingerprinting: ${security.fingerprintingExposed ? `exposed (${security.serverHeader})` : 'safe'}
- CORS wildcard: ${security.corsAllowAll ? 'YES — allows all origins' : 'no'}

Return ONLY a valid JSON object (no markdown, no extra text):
{
  "summary": "<2-3 sentence overview of the site's health and top priorities>",
  "recommendations": [
    {
      "category": "<SEO|PERFORMANCE|SECURITY>",
      "severity": "<CRITICAL|WARNING|PASSED>",
      "title": "<concise title under 60 chars>",
      "description": "<what was found, under 150 chars>",
      "recommendation": "<what to do, under 150 chars>"
    }
  ]
}

Rules:
- Return exactly 3 recommendations per category (9 total)
- CRITICAL: missing HTTPS, no title/meta description, no H1, render-blocking resources, missing CSP/HSTS
- WARNING: suboptimal but fixable — title length off, no schema, slow response, missing lazy load
- PASSED: for checks that pass (title present, HTTPS enabled, etc.) — always include these
- Do NOT invent data not present above
- Scores are computed separately; do not include an overallScore field`;
}

export async function analyzeWithAi(data: AuditData): Promise<AiAnalysisResult> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048, // 9 recommendations × ~100 tokens each ≈ 1100 tokens; 2048 is ample
    messages: [{ role: 'user', content: buildAuditPrompt(data) }],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected AI response type');
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in AI response');
  }

  let raw = jsonMatch[0];

  if (message.stop_reason === 'max_tokens') {
    raw = repairTruncatedJson(raw);
  }

  const parsed = JSON.parse(raw);
  // Ensure the shape matches AiAnalysisResult (no overallScore)
  return {
    recommendations: parsed.recommendations ?? [],
    summary: parsed.summary ?? '',
  } as AiAnalysisResult;
}
