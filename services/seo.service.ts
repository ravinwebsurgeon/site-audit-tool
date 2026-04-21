import { USER_AGENT } from '@/lib/constants';
import type { PageFetchResult } from '@/lib/fetcher';
import type { SeoAuditData } from '@/types';

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

function extractTwitterContent(html: string, name: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+name=["']twitter:${name}["'][^>]+content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']twitter:${name}["']`, 'i'),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[1];
  }
  return null;
}

function estimateWordCount(html: string): number {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!stripped) return 0;
  return stripped.split(' ').filter((w) => w.length > 1).length;
}

export async function auditSeo(url: string, page: PageFetchResult): Promise<SeoAuditData> {
  const { html, finalUrl } = page;
  const baseUrl = new URL(finalUrl).origin;

  // Title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : null;

  // Meta description
  const metaDescription = extractMetaContent(html, 'description');

  // Meta charset: <meta charset="..."> OR <meta http-equiv="Content-Type"...>
  const metaCharset =
    /<meta[^>]+charset=["'][^"']+["']/i.test(html) ||
    /<meta[^>]+http-equiv=["']content-type["']/i.test(html);

  // Headings
  const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
  const h1Tags = h1Matches.map((m) => m[1].replace(/<[^>]+>/g, '').trim());
  const h2Count = (html.match(/<h2[^>]*>/gi) ?? []).length;
  const h3Count = (html.match(/<h3[^>]*>/gi) ?? []).length;

  // Open Graph
  const ogTitle = extractOgContent(html, 'title');
  const ogDescription = extractOgContent(html, 'description');
  const ogImage = extractOgContent(html, 'image');

  // Twitter Card
  const twitterCard = extractTwitterContent(html, 'card');

  // Canonical
  const canonicalMatch =
    html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i) ??
    html.match(/<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["']/i);
  const canonicalUrl = canonicalMatch ? canonicalMatch[1] : null;

  // Viewport
  const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);

  // Lang attribute
  const langMatch = html.match(/<html[^>]+lang=["']([^"']*)["']/i);
  const langAttribute = langMatch ? langMatch[1] : null;

  // Favicon
  const hasFaviconTag =
    /<link[^>]+rel=["'][^"']*icon[^"']*["']/i.test(html) ||
    /<link[^>]+rel=["']shortcut icon["']/i.test(html);
  let hasFavicon = hasFaviconTag;
  if (!hasFavicon) {
    try {
      const r = await fetch(`${baseUrl}/favicon.ico`, { method: 'HEAD', headers: { 'User-Agent': USER_AGENT } });
      hasFavicon = r.ok;
    } catch { /* silent */ }
  }

  // Schema.org / JSON-LD
  const hasSchemaOrg =
    /<script[^>]+type=["']application\/ld\+json["']/i.test(html) ||
    /itemscope|itemtype=["']https?:\/\/schema\.org/i.test(html);

  // Noindex
  const robotsMeta = extractMetaContent(html, 'robots') ?? '';
  const isNoindex = /noindex/i.test(robotsMeta);

  // Images: count total, missing/empty alt, and those with explicit dimensions
  const imgTags = [...html.matchAll(/<img([^>]*)>/gi)];
  const totalImages = imgTags.length;

  let imagesWithoutAlt = 0;
  let imagesWithDimensions = 0;
  for (const [, attrs] of imgTags) {
    const altMatch = attrs.match(/\balt=["']([^"']*)["']/i);
    if (!altMatch || altMatch[1].trim() === '') imagesWithoutAlt++;
    if (/\bwidth=["']?\d+["']?/i.test(attrs) && /\bheight=["']?\d+["']?/i.test(attrs)) {
      imagesWithDimensions++;
    }
  }

  // Links — count only <a href>, skip mailto/tel/js/anchors
  const linkTags = [...html.matchAll(/<a[^>]+href=["']([^"'#?][^"']*)["']/gi)];
  let internalLinks = 0;
  let externalLinks = 0;
  for (const [, href] of linkTags) {
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;
    try {
      const linkUrl = href.startsWith('http') ? new URL(href) : new URL(href, baseUrl);
      if (linkUrl.origin === baseUrl) internalLinks++;
      else externalLinks++;
    } catch { /* invalid URL */ }
  }

  // Robots.txt
  let hasRobotsTxt = false;
  try {
    const r = await fetch(`${baseUrl}/robots.txt`, { headers: { 'User-Agent': USER_AGENT } });
    if (r.ok) {
      const ct = r.headers.get('content-type') ?? '';
      // Accept text/plain or no content-type (some servers omit it)
      hasRobotsTxt = ct.includes('text') || ct === '';
    }
  } catch { /* silent */ }

  // Sitemap
  let hasSitemap = false;
  try {
    const r = await fetch(`${baseUrl}/sitemap.xml`, { headers: { 'User-Agent': USER_AGENT } });
    hasSitemap = r.ok;
    if (!hasSitemap) {
      const r2 = await fetch(`${baseUrl}/sitemap_index.xml`, { headers: { 'User-Agent': USER_AGENT } });
      hasSitemap = r2.ok;
    }
  } catch { /* silent */ }

  // Word count & reading time
  const wordCount = estimateWordCount(html);
  const readingTimeMinutes = Math.ceil(wordCount / 200);

  return {
    title,
    titleLength: title?.length ?? 0,
    metaDescription,
    metaDescriptionLength: metaDescription?.length ?? 0,
    metaCharset,
    h1Count: h1Tags.length,
    h1Tags,
    h2Count,
    h3Count,
    hasOpenGraph: !!(ogTitle ?? ogDescription ?? ogImage),
    ogTitle,
    ogDescription,
    ogImage,
    hasTwitterCard: !!twitterCard,
    twitterCard,
    hasCanonical: !!canonicalUrl,
    canonicalUrl,
    hasRobotsTxt,
    hasSitemap,
    isNoindex,
    hasViewport,
    hasFavicon,
    langAttribute,
    hasSchemaOrg,
    totalImages,
    imagesWithoutAlt,
    imagesWithDimensions,
    internalLinks,
    externalLinks,
    wordCount,
    readingTimeMinutes,
  };
}
