'use client';

import * as React from 'react';
import { ProjectCard } from './ProjectCard';
import { CreateProjectDialog } from './CreateProjectDialog';
import { RecentlyDeletedDrawer } from './RecentlyDeletedDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, Search, Trash2, BookOpen } from 'lucide-react';
import type { Project } from '@/db/schema';

export interface DashboardViewProps {
  projects: (Project & { sceneCount: number })[];
  deletedProjects: Project[];
  userName: string;
}

export function DashboardView({
  projects,
  deletedProjects,
  userName,
}: DashboardViewProps) {
  const [search, setSearch] = React.useState('');
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [trashDrawerOpen, setTrashDrawerOpen] = React.useState(false);

  const filteredProjects = React.useMemo(() => {
    if (!search.trim()) return projects;
    const term = search.toLowerCase().trim();
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        (p.logline && p.logline.toLowerCase().includes(term)) ||
        (p.genre && p.genre.toLowerCase().includes(term))
    );
  }, [projects, search]);

  return (
    <div className="space-y-8 py-2">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            My Novels &amp; Stories
          </h1>
          <p className="text-sm text-ink-soft mt-1">
            Welcome back, <span className="font-medium text-ink">{userName}</span>. You have{' '}
            {projects.length} {projects.length === 1 ? 'novel workspace' : 'novel workspaces'}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {deletedProjects.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setTrashDrawerOpen(true)}
              className="gap-1.5 text-xs text-ink-soft hover:text-ink"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Trash ({deletedProjects.length})
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateDialogOpen(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" /> New Novel
          </Button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      {projects.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-soft" />
            <Input
              type="search"
              placeholder="Filter by title, genre, or premise..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <span className="text-xs text-ink-soft">
            Showing {filteredProjects.length} of {projects.length} projects
          </span>
        </div>
      )}

      {/* Projects Grid or Empty State */}
      {projects.length === 0 ? (
        <div className="rounded-md border border-line bg-surface p-8 sm:p-14 text-center">
          <EmptyState
            title="Start with what you know"
            description="Every novel begins with a fragment, a moment, or a character. Create your first project to begin shaping scenes, story maps, and arcs."
            icon={<BookOpen className="h-8 w-8 text-brand" strokeWidth={1.75} />}
          />
          <div className="flex justify-center pt-5">
            <Button
              variant="primary"
              size="md"
              onClick={() => setCreateDialogOpen(true)}
              className="gap-2 shadow-sm"
            >
              <Plus className="h-4 w-4" /> Create your first project
            </Button>
          </div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-md border border-line bg-surface p-10 text-center">
          <EmptyState
            title="No matching stories found"
            description={`No projects matched "${search}". Try searching for another keyword.`}
          />
          <div className="flex justify-center pt-3">
            <Button variant="secondary" size="sm" onClick={() => setSearch('')}>
              Clear search
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Create New Project Tile */}
          <button
            type="button"
            onClick={() => setCreateDialogOpen(true)}
            className="flex flex-col items-center justify-center p-8 rounded-md border-2 border-dashed border-line bg-surface/50 text-ink-soft hover:border-brand hover:text-brand hover:bg-brand-soft/20 transition-all duration-[160ms] group min-h-[220px]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface border border-line shadow-2xs group-hover:border-brand/40 group-hover:scale-105 transition-all mb-3 text-brand">
              <Plus className="h-5 w-5" strokeWidth={2} />
            </div>
            <span className="text-sm font-semibold text-ink group-hover:text-brand">
              Create New Story
            </span>
            <span className="text-xs text-ink-soft/80 mt-1 max-w-[200px] text-center">
              New canvas with 3-act structure &amp; story map
            </span>
          </button>

          {/* Project Cards */}
          {filteredProjects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      {/* Modals and Drawers */}
      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <RecentlyDeletedDrawer
        open={trashDrawerOpen}
        onOpenChange={setTrashDrawerOpen}
        deletedProjects={deletedProjects}
      />
    </div>
  );
}
