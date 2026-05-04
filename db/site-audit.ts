import { prisma } from '@/lib/prisma';

export async function createSiteAuditReport(data: {
  userId?: string;
  rootUrl: string;
  urlHash: string;
  pagesLimit: number;
}) {
  return prisma.siteAuditReport.create({
    data: {
      userId: data.userId ?? null,
      rootUrl: data.rootUrl,
      urlHash: data.urlHash,
      status: 'PENDING',
      pagesLimit: data.pagesLimit,
    },
  });
}

export async function getSiteAuditSummary(id: string) {
  return prisma.siteAuditReport.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      status: true,
      totalPages: true,
      completedPages: true,
      failedPages: true,
      avgScore: true,
    },
  });
}

export async function getSiteAuditById(id: string) {
  return prisma.siteAuditReport.findUnique({
    where: { id },
    include: {
      pageReports: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          url: true,
          status: true,
          overallScore: true,
          createdAt: true,
          completedAt: true,
        },
      },
    },
  });
}

export async function getUserSiteAudits(
  userId: string,
  options: { page?: number; pageSize?: number } = {}
) {
  const { page = 1, pageSize = 10 } = options;
  const skip = (page - 1) * pageSize;

  const [data, total] = await Promise.all([
    prisma.siteAuditReport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      select: {
        id: true,
        rootUrl: true,
        status: true,
        avgScore: true,
        totalPages: true,
        completedPages: true,
        failedPages: true,
        sitemapUrl: true,
        createdAt: true,
        completedAt: true,
      },
    }),
    prisma.siteAuditReport.count({ where: { userId } }),
  ]);

  return { data, total };
}

export async function deleteSiteAuditReport(id: string) {
  return prisma.siteAuditReport.delete({ where: { id } });
}

export async function incrementSiteAuditProgress(
  siteAuditId: string,
  succeeded: boolean
): Promise<void> {
  // Only increment completedPages on success. failedPages is always derived
  // as totalPages - completedPages so it never drifts out of sync.
  if (succeeded) {
    await prisma.siteAuditReport.update({
      where: { id: siteAuditId },
      data: { completedPages: { increment: 1 } },
    });
  }

  // Re-read the latest counts after the update to avoid stale data from the
  // update response (another worker may have incremented concurrently).
  const current = await prisma.siteAuditReport.findUnique({
    where: { id: siteAuditId },
    select: { totalPages: true, completedPages: true, status: true },
  });

  if (!current || current.totalPages === 0 || current.status !== 'PROCESSING') return;

  // Count actual terminal page statuses from the source of truth.
  const terminalCount = await prisma.auditReport.count({
    where: {
      siteAuditId,
      status: { in: ['COMPLETED', 'FAILED'] },
    },
  });

  if (terminalCount < current.totalPages) return;

  // All pages are done — compute derived fields and finalise.
  const completedReports = await prisma.auditReport.findMany({
    where: { siteAuditId, status: 'COMPLETED' },
    select: { overallScore: true },
  });

  const scores = completedReports
    .map((r) => r.overallScore)
    .filter((s): s is number => s !== null);

  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;

  // Re-read completedPages fresh for the final update
  const fresh = await prisma.siteAuditReport.findUnique({
    where: { id: siteAuditId },
    select: { completedPages: true },
  });
  const finalCompleted = fresh?.completedPages ?? current.completedPages;
  const finalFailed = current.totalPages - finalCompleted;

  // Atomic CAS: only the worker that wins this race finalises the site audit.
  await prisma.siteAuditReport.updateMany({
    where: { id: siteAuditId, status: 'PROCESSING' },
    data: {
      status: 'COMPLETED',
      avgScore,
      failedPages: finalFailed,
      completedAt: new Date(),
    },
  });
}
