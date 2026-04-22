import { prisma } from '@/lib/prisma';

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { subscription: true },
  });
}

export async function getUserSubscription(userId: string) {
  return prisma.subscription.findUnique({ where: { userId } });
}

export async function getUserAuditCount(userId: string): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return prisma.auditReport.count({
    where: { userId, createdAt: { gte: since } },
  });
}

export async function markOnboardingDone(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { onboardingDone: true },
  });
}

export async function updateUserProfile(userId: string, data: { name?: string; image?: string }) {
  return prisma.user.update({ where: { id: userId }, data });
}

export async function updateNotifyOnComplete(userId: string, value: boolean) {
  return prisma.user.update({ where: { id: userId }, data: { notifyOnComplete: value } });
}

export async function getUserWithAudits(userId: string, limit = 50) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscription: true,
      auditReports: {
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
      },
    },
  });
}
