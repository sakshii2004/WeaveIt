import * as React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { SessionProvider } from '@/lib/auth-client';
import { AppShell } from '@/components/layout/AppShell';

export const instant = false;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <SessionProvider session={session}>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
