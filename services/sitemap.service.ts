import { FETCH_TIMEOUT_MS, USER_AGENT } from '@/lib/constants';

export interface SitemapDiscoveryResult {
  urls: string[];
  sitemapUrl: string | null;
  source: 'sitemap' | 'sitemap_index' | 'links' | 'homepage_only';
  totalFound: number;
}

async function fetchText(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/xml,application/xml,text/html,*/*' },
      redirect: 'follow',
    });
    return res.ok ? res.text() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function parseLocUrls(xml: string, baseDomain: string): string[] {
  const urls: string[] = [];
  const re = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    try {
      const u = new URL(m[1].trim());
      if (u.hostname === baseDomain) {
        u.hash = '';
        urls.push(u.href);
      }
    } catch {
      // skip malformed
    }
  }
  return urls;
}

function parseSitemapIndexUrls(xml: string): string[] {
  const urls: string[] = [];
  // Match <loc> tags that are children of <sitemap> elements
  const re = /<sitemap[\s\S]*?<loc>\s*([^<\s]+)\s*<\/loc>[\s\S]*?<\/sitemap>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    urls.push(m[1].trim());
  }
  return urls;
}

function extractInternalLinks(html: string, baseUrl: string, baseDomain: string): string[] {
  const seen = new Set<string>();
  const re = /href=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      const u = new URL(m[1].trim(), baseUrl);
      if (u.protocol.startsWith('http') && u.hostname === baseDomain) {
        u.hash = '';
        // Skip common non-content paths
        if (/\.(css|js|jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|pdf|zip|xml)$/i.test(u.pathname)) continue;
        seen.add(u.href);
      }
    } catch {
      // skip
    }
  }
  return Array.from(seen);
}

function dedup(urls: string[]): string[] {
  return Array.from(new Set(urls));
}

export async function discoverSiteUrls(
  rootUrl: string,
  limit: number
): Promise<SitemapDiscoveryResult> {
  const parsed = new URL(rootUrl);
  const baseDomain = parsed.hostname;
  const origin = parsed.origin;

  // 1. Try /sitemap.xml
  const primarySitemapUrl = `${origin}/sitemap.xml`;
  const sitemapText = await fetchText(primarySitemapUrl);

  if (sitemapText) {
    // Check if it's a sitemap index
    if (/<sitemapindex/i.test(sitemapText)) {
      const nestedUrls = parseSitemapIndexUrls(sitemapText);
      const allUrls: string[] = [];

      for (const nsUrl of nestedUrls.slice(0, 5)) {
        const nsText = await fetchText(nsUrl);
        if (nsText) allUrls.push(...parseLocUrls(nsText, baseDomain));
        if (allUrls.length >= limit * 2) break;
      }

      if (allUrls.length > 0) {
        const unique = dedup([rootUrl, ...allUrls]);
        return {
          urls: unique.slice(0, limit),
          sitemapUrl: primarySitemapUrl,
          source: 'sitemap_index',
          totalFound: unique.length,
        };
      }
    }

    // Regular sitemap
    const urls = parseLocUrls(sitemapText, baseDomain);
    if (urls.length > 0) {
      const unique = dedup([rootUrl, ...urls]);
      return {
        urls: unique.slice(0, limit),
        sitemapUrl: primarySitemapUrl,
        source: 'sitemap',
        totalFound: unique.length,
      };
    }
  }

  // 2. Try /sitemap_index.xml
  const altIndexUrl = `${origin}/sitemap_index.xml`;
  const altIndexText = await fetchText(altIndexUrl);
  if (altIndexText) {
    const nestedUrls = parseSitemapIndexUrls(altIndexText);
    const allUrls: string[] = [];
    for (const nsUrl of nestedUrls.slice(0, 5)) {
      const nsText = await fetchText(nsUrl);
      if (nsText) allUrls.push(...parseLocUrls(nsText, baseDomain));
      if (allUrls.length >= limit * 2) break;
    }
    if (allUrls.length > 0) {
      const unique = dedup([rootUrl, ...allUrls]);
      return {
        urls: unique.slice(0, limit),
        sitemapUrl: altIndexUrl,
        source: 'sitemap_index',
        totalFound: unique.length,
      };
    }
  }

  // 3. Fallback: scrape internal links from homepage HTML
  const homeText = await fetchText(rootUrl);
  if (homeText) {
    const links = extractInternalLinks(homeText, rootUrl, baseDomain);
    if (links.length > 0) {
      const unique = dedup([rootUrl, ...links]);
      return {
        urls: unique.slice(0, limit),
        sitemapUrl: null,
        source: 'links',
        totalFound: unique.length,
      };
    }
  }

  // 4. Last resort: just the root URL
  return { urls: [rootUrl], sitemapUrl: null, source: 'homepage_only', totalFound: 1 };
}
