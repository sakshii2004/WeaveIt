import * as React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { listProjectsByUser, listRecentlyDeletedProjects } from '@/db/queries/projects';
import { DashboardView } from '@/components/projects/DashboardView';

export const instant = false;

export const metadata: Metadata = {
  title: 'Dashboard | WeaveIt',
  description: 'Manage your novel workspaces, scenes, and visual story maps.',
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;
  const userName = session.user.name || session.user.email?.split('@')[0] || 'Writer';

  const [projectsList, deletedProjectsList] = await Promise.all([
    listProjectsByUser(userId),
    listRecentlyDeletedProjects(userId),
  ]);

  return (
    <DashboardView
      projects={projectsList}
      deletedProjects={deletedProjectsList}
      userName={userName}
    />
  );
}
