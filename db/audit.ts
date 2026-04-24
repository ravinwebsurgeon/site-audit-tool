import { prisma } from '@/lib/prisma';
import { Prisma } from '@/app/generated/prisma/client';
import type { AuditStatus, AuditCategory, IssueSeverity } from '@/types';

export async function createAuditReport(data: {
  userId?: string;
  url: string;
  urlHash: string;
}) {
  return prisma.auditReport.create({
    data: {
      userId: data.userId ?? null,
      url: data.url,
      urlHash: data.urlHash,
      status: 'PENDING',
    },
  });
}

export async function findRecentAudit(urlHash: string, hoursAgo: number, userId?: string) {
  // Cache is scoped per-user. Anonymous users (no userId) never hit the cache.
  if (!userId) return null;

  const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  return prisma.auditReport.findFirst({
    where: {
      urlHash,
      userId,
      status: 'COMPLETED',
      createdAt: { gte: since },
    },
    orderBy: { createdAt: 'desc' },
    include: { sections: true, issues: true },
  });
}

export async function getAuditById(id: string) {
  return prisma.auditReport.findUnique({
    where: { id },
    include: {
      sections: true,
      issues: {
        orderBy: [{ severity: 'asc' }, { category: 'asc' }],
      },
    },
  });
}

export async function getUserAudits(
  userId: string,
  options: { page?: number; pageSize?: number; limit?: number } = {}
) {
  const { page = 1, pageSize = 10, limit } = options;
  const take = limit ?? pageSize;
  const skip = limit ? 0 : (page - 1) * pageSize;

  const [data, total] = await Promise.all([
    prisma.auditReport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        url: true,
        status: true,
        overallScore: true,
        createdAt: true,
        completedAt: true,
      },
    }),
    prisma.auditReport.count({ where: { userId } }),
  ]);

  return { data, total };
}

export async function getScoreTrend(userId: string, limit = 20) {
  return prisma.auditReport.findMany({
    where: { userId, status: 'COMPLETED', overallScore: { not: null } },
    orderBy: { completedAt: 'asc' },
    take: limit,
    select: { id: true, url: true, overallScore: true, completedAt: true, createdAt: true },
  });
}

export async function updateAuditStatus(
  id: string,
  status: AuditStatus,
  extras?: { overallScore?: number; completedAt?: Date; errorMessage?: string }
) {
  const { count } = await prisma.auditReport.updateMany({
    where: { id },
    data: { status, ...extras },
  });
  return count > 0;
}

export async function saveAuditSections(
  reportId: string,
  sections: Array<{ category: AuditCategory; score: number; data: Record<string, unknown> }>
) {
  return prisma.auditSection.createMany({
    data: sections.map((s) => ({
      reportId,
      category: s.category,
      score: s.score,
      data: s.data as unknown as Prisma.InputJsonValue,
    })),
  });
}

export async function saveAuditIssues(
  reportId: string,
  issues: Array<{
    category: AuditCategory;
    severity: IssueSeverity;
    title: string;
    description: string;
    recommendation: string;
  }>
) {
  return prisma.auditIssue.createMany({
    data: issues.map((i) => ({ reportId, ...i })),
  });
}

export async function deleteAuditReport(id: string) {
  return prisma.auditReport.delete({ where: { id } });
}
