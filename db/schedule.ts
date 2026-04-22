import { prisma } from '@/lib/prisma';
import type { ScheduleFrequency } from '@/types';

export function nextRunDate(frequency: ScheduleFrequency, from = new Date()): Date {
  const d = new Date(from);
  if (frequency === 'DAILY') d.setDate(d.getDate() + 1);
  else if (frequency === 'WEEKLY') d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

export async function createSchedule(data: {
  userId: string;
  url: string;
  frequency: ScheduleFrequency;
}) {
  return prisma.schedule.create({
    data: {
      userId: data.userId,
      url: data.url,
      frequency: data.frequency,
      nextRunAt: nextRunDate(data.frequency),
    },
  });
}

export async function getUserSchedules(userId: string) {
  return prisma.schedule.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getScheduleById(id: string, userId: string) {
  return prisma.schedule.findFirst({ where: { id, userId } });
}

export async function updateSchedule(
  id: string,
  userId: string,
  data: Partial<{ frequency: ScheduleFrequency; isActive: boolean }>
) {
  const extra: Record<string, unknown> = {};
  if (data.frequency) {
    extra.nextRunAt = nextRunDate(data.frequency);
  }
  return prisma.schedule.updateMany({
    where: { id, userId },
    data: { ...data, ...extra, updatedAt: new Date() },
  });
}

export async function deleteSchedule(id: string, userId: string) {
  return prisma.schedule.deleteMany({ where: { id, userId } });
}

export async function getDueSchedules() {
  return prisma.schedule.findMany({
    where: { isActive: true, nextRunAt: { lte: new Date() } },
    include: { user: { select: { id: true, email: true } } },
  });
}

export async function markScheduleRan(id: string, lastReportId: string, frequency: ScheduleFrequency) {
  return prisma.schedule.update({
    where: { id },
    data: {
      lastRunAt: new Date(),
      lastReportId,
      nextRunAt: nextRunDate(frequency),
    },
  });
}
