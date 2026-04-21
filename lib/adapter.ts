/**
 * Custom NextAuth Prisma adapter — compatible with Prisma 7 custom output path.
 * Implements the NextAuth v4 Adapter interface using our prisma singleton.
 */
import type { Adapter, AdapterUser, AdapterAccount, AdapterSession, VerificationToken } from 'next-auth/adapters';
import type { Awaitable } from 'next-auth';
import { prisma } from '@/lib/prisma';

function toAdapterUser(user: {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  emailVerified: Date | null;
}): AdapterUser {
  return {
    id: user.id,
    email: user.email ?? '',
    name: user.name,
    image: user.image,
    emailVerified: user.emailVerified,
  };
}

export function buildPrismaAdapter(): Adapter {
  return {
    // ── User ──────────────────────────────────────────────────────────────────
    async createUser(data: Omit<AdapterUser, 'id'>): Promise<AdapterUser> {
      const user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name ?? null,
          image: data.image ?? null,
          emailVerified: data.emailVerified ?? null,
        },
      });
      return toAdapterUser(user);
    },

    async getUser(id) {
      const user = await prisma.user.findUnique({ where: { id } });
      return user ? toAdapterUser(user) : null;
    },

    async getUserByEmail(email) {
      const user = await prisma.user.findUnique({ where: { email } });
      return user ? toAdapterUser(user) : null;
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const account = await prisma.account.findUnique({
        where: { provider_providerAccountId: { provider, providerAccountId } },
        include: { user: true },
      });
      return account ? toAdapterUser(account.user) : null;
    },

    async updateUser(data) {
      const user = await prisma.user.update({
        where: { id: data.id },
        data: {
          email: data.email,
          name: data.name,
          image: data.image,
          emailVerified: data.emailVerified,
        },
      });
      return toAdapterUser(user);
    },

    async deleteUser(id) {
      await prisma.user.delete({ where: { id } });
    },

    // ── Account ───────────────────────────────────────────────────────────────
    async linkAccount(account: AdapterAccount) {
      await prisma.account.create({
        data: {
          userId: account.userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token as string | undefined,
          access_token: account.access_token as string | undefined,
          expires_at: account.expires_at as number | undefined,
          token_type: account.token_type as string | undefined,
          scope: account.scope as string | undefined,
          id_token: account.id_token as string | undefined,
          session_state: account.session_state as string | undefined,
        },
      });
    },

    async unlinkAccount({ provider, providerAccountId }: Pick<AdapterAccount, 'provider' | 'providerAccountId'>): Promise<void> {
      await prisma.account.delete({
        where: { provider_providerAccountId: { provider, providerAccountId } },
      });
    },

    // ── Session ───────────────────────────────────────────────────────────────
    // These are called with database strategy. With jwt strategy they're not used.
    async createSession(session) {
      const created = await prisma.session.create({ data: session });
      return created as AdapterSession;
    },

    async getSessionAndUser(sessionToken) {
      const sessionAndUser = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      });
      if (!sessionAndUser) return null;
      const { user, ...session } = sessionAndUser;
      return { session: session as AdapterSession, user: toAdapterUser(user) };
    },

    async updateSession(data) {
      const session = await prisma.session.update({
        where: { sessionToken: data.sessionToken },
        data,
      });
      return session as AdapterSession;
    },

    async deleteSession(sessionToken) {
      await prisma.session.delete({ where: { sessionToken } });
    },

    // ── Verification token (magic link) ───────────────────────────────────────
    async createVerificationToken(data: VerificationToken) {
      const token = await prisma.verificationToken.create({ data });
      return token;
    },

    async useVerificationToken({ identifier, token }) {
      try {
        const verificationToken = await prisma.verificationToken.delete({
          where: { identifier_token: { identifier, token } },
        });
        return verificationToken;
      } catch {
        return null;
      }
    },
  };
}
