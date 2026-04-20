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

export interface SeoAuditData {
  title: string | null;
  titleLength: number;
  metaDescription: string | null;
  metaDescriptionLength: number;
  h1Count: number;
  h1Tags: string[];
  h2Count: number;
  hasOpenGraph: boolean;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  hasCanonical: boolean;
  canonicalUrl: string | null;
  hasRobotsTxt: boolean;
  hasSitemap: boolean;
}

export interface PerformanceAuditData {
  pageSize: number;
  loadTime: number;
  resourceCount: number;
  hasRenderBlockingCss: boolean;
  hasRenderBlockingJs: boolean;
  imageCount: number;
  scriptCount: number;
  styleCount: number;
}

export interface SecurityAuditData {
  isHttps: boolean;
  hasHsts: boolean;
  hasXFrameOptions: boolean;
  hasXContentTypeOptions: boolean;
  hasCSP: boolean;
  hasXXssProtection: boolean;
  hasReferrerPolicy: boolean;
  hasMixedContent: boolean;
  serverHeader: string | null;
}

export interface AuditData {
  url: string;
  seo: SeoAuditData;
  performance: PerformanceAuditData;
  security: SecurityAuditData;
}

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
  overallScore: number;
}
