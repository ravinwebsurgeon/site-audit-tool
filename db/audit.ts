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

export async function findRecentAudit(urlHash: string, hoursAgo: number) {
  const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  return prisma.auditReport.findFirst({
    where: {
      urlHash,
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

export async function getUserAudits(userId: string, limit = 50) {
  return prisma.auditReport.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      url: true,
      status: true,
      overallScore: true,
      createdAt: true,
      completedAt: true,
    },
  });
}

export async function updateAuditStatus(
  id: string,
  status: AuditStatus,
  extras?: { overallScore?: number; completedAt?: Date; errorMessage?: string }
) {
  return prisma.auditReport.update({
    where: { id },
    data: { status, ...extras },
  });
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
