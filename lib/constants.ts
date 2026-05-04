export const AUDIT_CACHE_TTL_HOURS = 24;
export const AUDIT_QUEUE_NAME = 'audit-queue';
export const SITE_AUDIT_QUEUE_NAME = 'site-audit-queue';
export const MAX_AUDITS_PER_USER = 50;
export const FETCH_TIMEOUT_MS = 10000;
export const USER_AGENT = 'SiteAuditBot/1.0';

// -1 = unlimited. schedulesMax is a total active-count cap, not a rolling daily window.
export const TIER_LIMITS = {
  FREE:       { auditsPerDay: 5,  exportsPerDay: 20,  schedulesMax: 2  },
  PRO:        { auditsPerDay: 50, exportsPerDay: 200, schedulesMax: 20 },
  ENTERPRISE: { auditsPerDay: -1, exportsPerDay: -1,  schedulesMax: -1 },
} as const;

export type Tier = keyof typeof TIER_LIMITS;

// Max pages per site audit per subscription tier
export const SITE_AUDIT_PAGE_LIMITS: Record<Tier, number> = {
  FREE:       10,
  PRO:        50,
  ENTERPRISE: 200,
};
