import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

function generateKey(): { raw: string; prefix: string; hash: string } {
  const raw = `sk_${crypto.randomBytes(32).toString('hex')}`;
  const prefix = raw.slice(0, 10);
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, prefix, hash };
}

export async function createApiKey(userId: string, name: string, expiresInDays?: number) {
  const { raw, prefix, hash } = generateKey();
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 86400_000)
    : null;

  const record = await prisma.apiKey.create({
    data: { userId, name, keyHash: hash, prefix, expiresAt },
  });

  return { ...record, rawKey: raw };
}

export async function getUserApiKeys(userId: string) {
  return prisma.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      prefix: true,
      isActive: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
  });
}

export async function revokeApiKey(id: string, userId: string) {
  return prisma.apiKey.updateMany({
    where: { id, userId },
    data: { isActive: false },
  });
}

export async function validateApiKey(raw: string) {
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const key = await prisma.apiKey.findUnique({
    where: { keyHash: hash },
    include: { user: { select: { id: true, subscriptionTier: true } } },
  });

  if (!key || !key.isActive) return null;
  if (key.expiresAt && key.expiresAt < new Date()) return null;

  await prisma.apiKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  });

  return key;
}
