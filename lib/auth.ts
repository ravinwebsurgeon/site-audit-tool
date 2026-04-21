import type { NextAuthOptions, DefaultSession } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import { buildPrismaAdapter } from '@/lib/adapter';
import { sendMagicLink } from '@/lib/mail';
import { prisma } from '@/lib/prisma';

// ── Extend session type to include id + subscriptionTier ─────────────────────
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      subscriptionTier: 'FREE' | 'PRO' | 'ENTERPRISE';
      onboardingDone: boolean;
    } & DefaultSession['user'];
  }
  interface User {
    subscriptionTier?: 'FREE' | 'PRO' | 'ENTERPRISE';
    onboardingDone?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    subscriptionTier: 'FREE' | 'PRO' | 'ENTERPRISE';
    onboardingDone: boolean;
  }
}

// ── Auth configuration ────────────────────────────────────────────────────────
export const authOptions: NextAuthOptions = {
  adapter: buildPrismaAdapter(),

  providers: [
    // Google OAuth
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                prompt: 'consent',
                access_type: 'offline',
                response_type: 'code',
              },
            },
          }),
        ]
      : []),

    // GitHub OAuth
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          }),
        ]
      : []),

    // Magic Link (email)
    EmailProvider({
      // server is ignored — we use custom sendVerificationRequest
      server: '',
      from: process.env.EMAIL_FROM ?? 'SiteAudit <noreply@siteaudit.app>',
      maxAge: 24 * 60 * 60, // token valid 24 hours
      async sendVerificationRequest({ identifier, url }) {
        await sendMagicLink({ to: identifier, url });
      },
    }),
  ],

  // JWT strategy: sessions in signed cookie, readable at edge (no DB per request)
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,   // re-issue JWT every 24h
  },

  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
    error: '/auth/error',
    newUser: '/onboarding',
  },

  callbacks: {
    // Enrich JWT token with user data from DB
    async jwt({ token, user, trigger, session: sessionUpdate }) {
      // On sign-in, `user` is populated — fetch fresh DB data
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { subscriptionTier: true, onboardingDone: true },
        });
        token.id = user.id;
        token.subscriptionTier = dbUser?.subscriptionTier ?? 'FREE';
        token.onboardingDone = dbUser?.onboardingDone ?? false;
      }

      // Support client-side session update (e.g. after onboarding completes)
      if (trigger === 'update' && sessionUpdate) {
        if (sessionUpdate.onboardingDone !== undefined) {
          token.onboardingDone = sessionUpdate.onboardingDone;
        }
        if (sessionUpdate.subscriptionTier !== undefined) {
          token.subscriptionTier = sessionUpdate.subscriptionTier;
        }
      }

      return token;
    },

    // Expose enriched token to session object
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.subscriptionTier = token.subscriptionTier;
        session.user.onboardingDone = token.onboardingDone;
      }
      return session;
    },

    // Allow all sign-ins by default
    async signIn() {
      return true;
    },
  },

  events: {
    // Create default subscription record on first sign-in
    async createUser({ user }) {
      if (!user.id) return;
      await prisma.subscription.upsert({
        where: { userId: user.id },
        create: { userId: user.id, tier: 'FREE', auditsPerDay: 5 },
        update: {},
      });
    },
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === 'development',
};
