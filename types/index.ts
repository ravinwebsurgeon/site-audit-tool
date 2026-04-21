export type AuditStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type IssueSeverity = 'CRITICAL' | 'WARNING' | 'PASSED';
export type AuditCategory = 'SEO' | 'PERFORMANCE' | 'SECURITY';

export interface AuditReport {
  id: string;
  url: string;
  status: AuditStatus;
  overallScore: number | null;
  createdAt: Date;
  completedAt: Date | null;
  sections?: AuditSection[];
  issues?: AuditIssue[];
}

export interface AuditSection {
  id: string;
  reportId: string;
  category: AuditCategory;
  score: number;
  data: Record<string, unknown>;
}

export interface AuditIssue {
  id: string;
  reportId: string;
  category: AuditCategory;
  severity: IssueSeverity;
  title: string;
  description: string;
  recommendation: string;
}

export interface AuditJobData {
  reportId: string;
  url: string;
  userId?: string;
}

// ── SEO ───────────────────────────────────────────────────────────────────────
export interface SeoAuditData {
  // Title
  title: string | null;
  titleLength: number;
  // Meta
  metaDescription: string | null;
  metaDescriptionLength: number;
  metaCharset: boolean;            // <meta charset> or http-equiv Content-Type present
  // Headings
  h1Count: number;
  h1Tags: string[];
  h2Count: number;
  h3Count: number;
  // Open Graph
  hasOpenGraph: boolean;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  // Twitter Card
  hasTwitterCard: boolean;
  twitterCard: string | null;
  // Canonical & robots
  hasCanonical: boolean;
  canonicalUrl: string | null;
  hasRobotsTxt: boolean;
  hasSitemap: boolean;
  isNoindex: boolean;
  // Technical basics
  hasViewport: boolean;
  hasFavicon: boolean;
  langAttribute: string | null;
  hasSchemaOrg: boolean;
  // Images
  totalImages: number;
  imagesWithoutAlt: number;        // images missing alt OR with empty alt=""
  imagesWithDimensions: number;    // images with width + height attributes (prevents CLS)
  // Links
  internalLinks: number;
  externalLinks: number;
  // Content
  wordCount: number;
  readingTimeMinutes: number;
}

// ── Performance ───────────────────────────────────────────────────────────────
export interface PerformanceAuditData {
  /**
   * Time in ms from request start to full body received, measured server-side.
   * This is a proxy for TTFB + document download — NOT browser FCP/LCP.
   * Typically 2–10× faster than real user experience.
   */
  serverResponseTime: number;
  /** Uncompressed HTML document size in bytes (excludes JS/CSS/images) */
  htmlSize: number;
  // Resources found in HTML
  resourceCount: number;
  imageCount: number;
  scriptCount: number;           // external scripts (<script src>)
  styleCount: number;            // external stylesheets (<link rel=stylesheet>)
  inlineScriptCount: number;     // inline <script> blocks
  // Render blocking
  hasRenderBlockingJs: boolean;
  hasRenderBlockingCss: boolean;
  renderBlockingScripts: number; // scripts in <head> without defer/async/type=module
  renderBlockingStyles: number;  // stylesheets in <head>
  // Image optimization
  imagesWithLazyLoad: number;
  hasModernImageFormats: boolean; // WebP or AVIF found
  // Network hints
  hasResourceHints: boolean;
  resourceHintsCount: number;
  // HTTP optimizations
  wasCompressed: boolean;         // response had Content-Encoding header
  hasCacheControl: boolean;
  cacheControlValue: string | null;
  // Third-party scripts (any script src not matching the audited domain)
  thirdPartyScripts: number;
}

// ── Security ──────────────────────────────────────────────────────────────────
export interface SecurityAuditData {
  // Protocol
  isHttps: boolean;
  // Security headers
  hasHsts: boolean;
  hstsMaxAge: number | null;         // parsed from max-age=N in HSTS header
  hstsIncludesSubdomains: boolean;
  hasXFrameOptions: boolean;
  xFrameOptionsValue: string | null;
  hasXContentTypeOptions: boolean;
  hasCSP: boolean;
  hasXXssProtection: boolean;
  hasReferrerPolicy: boolean;
  hasPermissionsPolicy: boolean;
  hasCOOP: boolean;
  // Content issues
  hasMixedContent: boolean;          // ONLY checks resource tags (script/img/iframe/link/form)
  mixedContentCount: number;         // approximate count of mixed resources
  // Server info
  serverHeader: string | null;
  fingerprintingExposed: boolean;    // server header reveals software version number
  // Cookies & CORS
  cookiesFound: boolean;
  corsAllowAll: boolean;
}

// ── Combined audit input ───────────────────────────────────────────────────────
export interface AuditData {
  url: string;
  seo: SeoAuditData;
  performance: PerformanceAuditData;
  security: SecurityAuditData;
}

// ── AI output ─────────────────────────────────────────────────────────────────
export interface AiRecommendation {
  category: AuditCategory;
  severity: IssueSeverity;
  title: string;
  description: string;
  recommendation: string;
}

export interface AiAnalysisResult {
  recommendations: AiRecommendation[];
  summary: string;
}
