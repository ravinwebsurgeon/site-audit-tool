import { TIER_LIMITS } from '@/lib/constants';
import type { Tier } from '@/lib/constants';
import { redisConnection } from '@/lib/redis';
import { prisma } from '@/lib/prisma';

export type { Tier };
export type RateLimitAction = 'audits' | 'exports';

const WINDOW_SECONDS = 86400; // 24-hour rolling window

export interface RateLimitResult {
  allowed: boolean;
  limit: number;     // -1 = unlimited
  remaining: number; // -1 = unlimited
  resetAt: Date;
}

function getTierLimit(tier: Tier, action: RateLimitAction): number {
  return action === 'audits'
    ? TIER_LIMITS[tier].auditsPerDay
    : TIER_LIMITS[tier].exportsPerDay;
}

// Redis path — atomic INCR + EXPIRE NX + PTTL in one round-trip.
// PTTL gives the actual expiry so resetAt is accurate, not just "now + 24h".
async function checkViaRedis(key: string, limit: number): Promise<RateLimitResult | null> {
  if (!redisConnection) return null;
  try {
    const pipeline = redisConnection.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, WINDOW_SECONDS, 'NX');
    pipeline.pttl(key);
    const results = await pipeline.exec();

    const count    = (results?.[0]?.[1] as number) ?? 1;
    const pttl     = (results?.[2]?.[1] as number) ?? WINDOW_SECONDS * 1000;
    const resetAt  = new Date(Date.now() + Math.max(0, pttl));
    const remaining = Math.max(0, limit - count);

    return { allowed: count <= limit, limit, remaining, resetAt };
  } catch {
    return null; // Redis error — fall through to DB
  }
}

// DB fallback (audits only) — counts rows created in the last 24 h.
// resetAt is derived from the oldest record in the window so it's accurate.
async function checkViaDB(userId: string, limit: number): Promise<RateLimitResult> {
  const since = new Date(Date.now() - WINDOW_SECONDS * 1000);

  const [count, oldest] = await Promise.all([
    prisma.auditReport.count({ where: { userId, createdAt: { gte: since } } }),
    prisma.auditReport.findFirst({
      where:   { userId, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
      select:  { createdAt: true },
    }),
  ]);

  const resetAt = oldest
    ? new Date(oldest.createdAt.getTime() + WINDOW_SECONDS * 1000)
    : new Date(Date.now() + WINDOW_SECONDS * 1000);

  return {
    allowed:   count < limit,
    limit,
    remaining: Math.max(0, limit - count),
    resetAt,
  };
}

export async function checkRateLimit(
  key:    string,
  tier:   Tier            = 'FREE',
  action: RateLimitAction = 'audits',
  userId?: string,
): Promise<RateLimitResult> {
  const limit   = getTierLimit(tier, action);
  const resetAt = new Date(Date.now() + WINDOW_SECONDS * 1000);

  // Unlimited tier — skip all checks
  if (limit === -1) {
    return { allowed: true, limit: -1, remaining: -1, resetAt };
  }

  const redisKey    = `rl:${action}:${key}`;
  const redisResult = await checkViaRedis(redisKey, limit);
  if (redisResult) return redisResult;

  // DB fallback — available for audit action on authenticated users
  if (userId && action === 'audits') {
    return checkViaDB(userId, limit);
  }

  // Anonymous users without Redis: allow (can't enforce without a counter store)
  return { allowed: true, limit, remaining: limit, resetAt };
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  if (result.limit === -1) return {};
  const headers: Record<string, string> = {
    'X-RateLimit-Limit':     String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset':     String(Math.floor(result.resetAt.getTime() / 1000)),
  };
  if (!result.allowed) {
    headers['Retry-After'] = String(
      Math.max(0, Math.floor((result.resetAt.getTime() - Date.now()) / 1000))
    );
  }
  return headers;
}
