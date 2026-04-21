/**
 * Shared page fetcher — fetches a URL exactly ONCE and returns everything
 * needed by all three audit services.
 *
 * Previously each service fetched independently (3 requests per audit).
 * That caused: inconsistent timing, CDN rate-limit hits, and wasted latency.
 */
import { FETCH_TIMEOUT_MS, USER_AGENT } from '@/lib/constants';

export interface PageFetchResult {
  /** Full decoded HTML body */
  html: string;
  /** Response headers from the final response (after redirects) */
  headers: Headers;
  /** HTTP status code */
  statusCode: number;
  /**
   * Server response time in milliseconds.
   * Measures: DNS + TCP + TLS + request + full body download from the
   * audit server's location. NOT the same as browser FCP/LCP.
   */
  serverResponseTime: number;
  /** Uncompressed HTML size in bytes */
  htmlSize: number;
  /** Final URL after any redirects */
  finalUrl: string;
  /** True when the response carried a Content-Encoding header (gzip / br / etc.) */
  wasCompressed: boolean;
}

export async function fetchPage(url: string): Promise<PageFetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const start = Date.now();

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        // Advertise we accept compression — server decides whether to send it.
        // Node.js native fetch decompresses transparently; the Content-Encoding
        // header is still visible in response.headers even after decompression.
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow',
    });

    const buffer = await response.arrayBuffer();
    const serverResponseTime = Date.now() - start;
    const html = new TextDecoder().decode(buffer);
    const htmlSize = buffer.byteLength;

    const encoding = response.headers.get('content-encoding') ?? '';
    const wasCompressed = /gzip|deflate|br|zstd/i.test(encoding);

    return {
      html,
      headers: response.headers,
      statusCode: response.status,
      serverResponseTime,
      htmlSize,
      finalUrl: response.url || url,
      wasCompressed,
    };
  } finally {
    clearTimeout(timer);
  }
}
