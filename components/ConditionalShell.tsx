'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideShell = pathname?.startsWith('/auth');

  return (
    <>
      {!hideShell && <Header />}
      <main className="flex-1">{children}</main>
      {!hideShell && <Footer />}
    </>
  );
}
