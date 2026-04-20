import { FETCH_TIMEOUT_MS, USER_AGENT } from '@/lib/constants';
import type { SeoAuditData } from '@/types';

async function fetchHtml(url: string): Promise<{ html: string; status: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT },
      redirect: 'follow',
    });
    const html = await response.text();
    return { html, status: response.status };
  } finally {
    clearTimeout(timer);
  }
}

function extractMetaContent(html: string, name: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${name}["']`, 'i'),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[1];
  }
  return null;
}

function extractOgContent(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']og:${property}["'][^>]+content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:${property}["']`, 'i'),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[1];
  }
  return null;
}

export async function auditSeo(url: string): Promise<SeoAuditData> {
  const { html } = await fetchHtml(url);

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : null;

  const metaDescription = extractMetaContent(html, 'description');

  const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
  const h1Tags = h1Matches.map((m) => m[1].replace(/<[^>]+>/g, '').trim());
  const h2Count = (html.match(/<h2[^>]*>/gi) ?? []).length;

  const ogTitle = extractOgContent(html, 'title');
  const ogDescription = extractOgContent(html, 'description');
  const ogImage = extractOgContent(html, 'image');

  const canonicalMatch =
    html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i) ??
    html.match(/<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["']/i);
  const canonicalUrl = canonicalMatch ? canonicalMatch[1] : null;

  const baseUrl = new URL(url).origin;

  let hasRobotsTxt = false;
  try {
    const r = await fetch(`${baseUrl}/robots.txt`, { headers: { 'User-Agent': USER_AGENT } });
    hasRobotsTxt = r.ok;
  } catch { /* silent */ }

  let hasSitemap = false;
  try {
    const r = await fetch(`${baseUrl}/sitemap.xml`, { headers: { 'User-Agent': USER_AGENT } });
    hasSitemap = r.ok;
  } catch { /* silent */ }

  return {
    title,
    titleLength: title?.length ?? 0,
    metaDescription,
    metaDescriptionLength: metaDescription?.length ?? 0,
    h1Count: h1Tags.length,
    h1Tags,
    h2Count,
    hasOpenGraph: !!(ogTitle ?? ogDescription ?? ogImage),
    ogTitle,
    ogDescription,
    ogImage,
    hasCanonical: !!canonicalUrl,
    canonicalUrl,
    hasRobotsTxt,
    hasSitemap,
  };
}
