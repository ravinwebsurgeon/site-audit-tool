import { FETCH_TIMEOUT_MS, USER_AGENT } from '@/lib/constants';
import type { PerformanceAuditData } from '@/types';

export async function auditPerformance(url: string): Promise<PerformanceAuditData> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  const start = Date.now();
  let html = '';
  let pageSize = 0;

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT },
      redirect: 'follow',
    });
    const buffer = await response.arrayBuffer();
    pageSize = buffer.byteLength;
    html = new TextDecoder().decode(buffer);
  } finally {
    clearTimeout(timer);
  }

  const loadTime = Date.now() - start;

  const scriptTags = html.match(/<script[^>]+src=["'][^"']*["']/gi) ?? [];
  const styleTags = html.match(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi) ?? [];
  const imageTags = html.match(/<img[^>]+>/gi) ?? [];

  // Scripts in <head> without defer/async/module = render-blocking
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const headHtml = headMatch ? headMatch[1] : '';
  const blockingScriptPattern =
    /<script(?![^>]*(defer|async|type=["']module["']))[^>]+src=/gi;
  const hasRenderBlockingJs = blockingScriptPattern.test(headHtml);
  const hasRenderBlockingCss = styleTags.length > 4;

  return {
    pageSize,
    loadTime,
    resourceCount: scriptTags.length + styleTags.length + imageTags.length,
    hasRenderBlockingCss,
    hasRenderBlockingJs,
    imageCount: imageTags.length,
    scriptCount: scriptTags.length,
    styleCount: styleTags.length,
  };
}
