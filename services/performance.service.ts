import type { PageFetchResult } from '@/lib/fetcher';
import type { PerformanceAuditData } from '@/types';

export async function auditPerformance(url: string, page: PageFetchResult): Promise<PerformanceAuditData> {
  const { html, serverResponseTime, htmlSize, wasCompressed, headers, finalUrl } = page;

  const auditorDomain = new URL(finalUrl).hostname;

  const cacheControlValue = headers.get('cache-control');
  const hasCacheControl = !!cacheControlValue;

  // External scripts with src
  const scriptTags = html.match(/<script[^>]+src=["'][^"']*["']/gi) ?? [];
  const styleTags = html.match(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi) ?? [];
  const imageTags = html.match(/<img[^>]+>/gi) ?? [];

  // Inline scripts (no src attribute)
  const allScriptTags = html.match(/<script(?:[^>]*)>([\s\S]*?)<\/script>/gi) ?? [];
  const inlineScriptCount = allScriptTags.filter((s) => !/<script[^>]+src=/i.test(s)).length;

  // Third-party scripts: external scripts whose src domain !== auditor domain
  let thirdPartyScripts = 0;
  for (const tag of scriptTags) {
    const srcMatch = tag.match(/src=["']([^"']+)["']/i);
    if (!srcMatch) continue;
    try {
      const scriptUrl = new URL(srcMatch[1]);
      if (scriptUrl.hostname !== auditorDomain) thirdPartyScripts++;
    } catch { /* relative URL = same origin */ }
  }

  // Render-blocking: scripts in <head> without defer/async/module
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const headHtml = headMatch ? headMatch[1] : '';
  const blockingScripts = headHtml.match(/<script(?![^>]*(defer|async|type=["']module["']))[^>]+src=/gi) ?? [];
  const renderBlockingScripts = blockingScripts.length;
  const hasRenderBlockingJs = renderBlockingScripts > 0;

  // Render-blocking CSS: stylesheets in <head>
  const headStyles = headHtml.match(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi) ?? [];
  const renderBlockingStyles = headStyles.length;
  // 2+ blocking stylesheets is a concern (Google recommends inlining critical CSS)
  const hasRenderBlockingCss = renderBlockingStyles > 2;

  // Lazy loading images
  const imagesWithLazyLoad = (imageTags.filter((img) => /loading=["']lazy["']/i.test(img))).length;

  // Modern image formats (WebP / AVIF in <source> or <img src>)
  const hasModernImageFormats =
    /type=["']image\/(webp|avif)["']/i.test(html) ||
    /\.(webp|avif)(\?|["'\s>])/i.test(html);

  // Resource hints: preload, prefetch, preconnect, dns-prefetch
  const resourceHints = html.match(/<link[^>]+rel=["'](preload|prefetch|preconnect|dns-prefetch)["'][^>]*>/gi) ?? [];
  const hasResourceHints = resourceHints.length > 0;
  const resourceHintsCount = resourceHints.length;

  return {
    serverResponseTime,
    htmlSize,
    resourceCount: scriptTags.length + styleTags.length + imageTags.length,
    imageCount: imageTags.length,
    scriptCount: scriptTags.length,
    styleCount: styleTags.length,
    inlineScriptCount,
    hasRenderBlockingCss,
    hasRenderBlockingJs,
    renderBlockingScripts,
    renderBlockingStyles,
    imagesWithLazyLoad,
    hasModernImageFormats,
    hasResourceHints,
    resourceHintsCount,
    wasCompressed,
    hasCacheControl,
    cacheControlValue,
    thirdPartyScripts,
  };
}
