/**
 * Redis-based sliding window rate limiter.
 * Limits audit creation per IP (anonymous) or userId (authenticated).
 * Tier limits: FREE=5/day, PRO=100/day, ENTERPRISE=unlimited
 */
import { redisConnection as redis } from '@/lib/redis';

export type Tier = 'FREE' | 'PRO' | 'ENTERPRISE';

const TIER_LIMITS: Record<Tier, number> = {
  FREE: 5, 
  PRO: 100,
  ENTERPRISE: Infinity,
};

const WINDOW_SECONDS = 86400; // 24 hours

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
}

export async function checkRateLimit(
  key: string,
  tier: Tier = 'FREE'
): Promise<RateLimitResult> {
  const limit = TIER_LIMITS[tier];
  const resetAt = new Date(Date.now() + WINDOW_SECONDS * 1000);

  // Unlimited tier always passes
  if (limit === Infinity) {
    return { allowed: true, limit: 999, remaining: 999, resetAt };
  }

  const redisKey = `rate:audit:${key}`;

  const pipeline = redis.pipeline();
  pipeline.incr(redisKey);
  pipeline.expire(redisKey, WINDOW_SECONDS, 'NX');
  const results = await pipeline.exec();

  const count = (results?.[0]?.[1] as number) ?? 1;
  const remaining = Math.max(0, limit - count);

  return {
    allowed: count <= limit,
    limit,
    remaining,
    resetAt,
  };
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.resetAt.getTime() / 1000)),
  };
}
