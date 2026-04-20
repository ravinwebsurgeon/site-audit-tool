import { FETCH_TIMEOUT_MS, USER_AGENT } from '@/lib/constants';
import type { SecurityAuditData } from '@/types';

export async function auditSecurity(url: string): Promise<SecurityAuditData> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let html = '';
  let headers: Headers = new Headers();

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT },
      redirect: 'follow',
    });
    headers = response.headers;
    html = await response.text();
  } finally {
    clearTimeout(timer);
  }

  const isHttps = new URL(url).protocol === 'https:';

  let hasMixedContent = false;
  if (isHttps) {
    hasMixedContent = /(?:src|href|action)=["']http:\/\//i.test(html);
  }

  return {
    isHttps,
    hasHsts: !!headers.get('strict-transport-security'),
    hasXFrameOptions: !!headers.get('x-frame-options'),
    hasXContentTypeOptions: !!headers.get('x-content-type-options'),
    hasCSP: !!headers.get('content-security-policy'),
    hasXXssProtection: !!headers.get('x-xss-protection'),
    hasReferrerPolicy: !!headers.get('referrer-policy'),
    hasMixedContent,
    serverHeader: headers.get('server'),
  };
}
