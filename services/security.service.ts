import type { PageFetchResult } from '@/lib/fetcher';
import type { SecurityAuditData } from '@/types';

function parseHstsMaxAge(hstsHeader: string | null): number | null {
  if (!hstsHeader) return null;
  const m = hstsHeader.match(/max-age=(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

function isServerFingerprintingExposed(serverHeader: string | null): boolean {
  if (!serverHeader) return false;
  // Version number like "nginx/1.24.0" or "Apache/2.4.54"
  return /\d+\.\d+/.test(serverHeader);
}

export async function auditSecurity(url: string, page: PageFetchResult): Promise<SecurityAuditData> {
  const { html, headers, finalUrl } = page;

  const isHttps = new URL(finalUrl).protocol === 'https:';

  // Mixed content: only resource-loading tags (not <a href>)
  let mixedContentCount = 0;
  if (isHttps) {
    const resourcePatterns = [
      /<script[^>]+src=["']http:\/\//gi,
      /<img[^>]+src=["']http:\/\//gi,
      /<iframe[^>]+src=["']http:\/\//gi,
      /<link[^>]+(?:rel=["']stylesheet["'])[^>]+href=["']http:\/\//gi,
      /<link[^>]+href=["']http:\/\/[^>]+(?:rel=["']stylesheet["'])/gi,
      /<form[^>]+action=["']http:\/\//gi,
    ];
    for (const pat of resourcePatterns) {
      const matches = html.match(pat) ?? [];
      mixedContentCount += matches.length;
    }
  }
  const hasMixedContent = mixedContentCount > 0;

  const hstsHeader = headers.get('strict-transport-security');
  const xFrameOptionsValue = headers.get('x-frame-options');
  const serverHeader = headers.get('server');
  const setCookieHeader = headers.get('set-cookie');

  const hstsIncludesSubdomains = !!hstsHeader && /includeSubDomains/i.test(hstsHeader);

  // CORS wildcard
  const corsOrigin = headers.get('access-control-allow-origin');
  const corsAllowAll = corsOrigin === '*';

  const cookiesFound = !!setCookieHeader;

  return {
    isHttps,
    hasHsts: !!hstsHeader,
    hstsMaxAge: parseHstsMaxAge(hstsHeader),
    hstsIncludesSubdomains,
    hasXFrameOptions: !!xFrameOptionsValue,
    xFrameOptionsValue,
    hasXContentTypeOptions: !!headers.get('x-content-type-options'),
    hasCSP: !!headers.get('content-security-policy'),
    hasXXssProtection: !!headers.get('x-xss-protection'),
    hasReferrerPolicy: !!headers.get('referrer-policy'),
    hasPermissionsPolicy: !!headers.get('permissions-policy'),
    hasCOOP: !!headers.get('cross-origin-opener-policy'),
    hasMixedContent,
    mixedContentCount,
    serverHeader,
    fingerprintingExposed: isServerFingerprintingExposed(serverHeader),
    cookiesFound,
    corsAllowAll,
  };
}
