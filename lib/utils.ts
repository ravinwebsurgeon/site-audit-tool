import crypto from 'crypto';

export function hashUrl(url: string): string {
  return crypto.createHash('sha256').update(url.toLowerCase().trim()).digest('hex');
}

export function normalizeUrl(url: string): string {
  const parsed = new URL(url);
  if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
    parsed.pathname = parsed.pathname.slice(0, -1);
  }
  return parsed.toString();
}

export function extractDomain(url: string): string {
  return new URL(url).hostname;
}
