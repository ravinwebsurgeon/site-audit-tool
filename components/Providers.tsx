'use client';

import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import { ToastProvider } from '@/components/Toast';

export default function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider session={session} refetchInterval={5 * 60}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </SessionProvider>
  );
}
