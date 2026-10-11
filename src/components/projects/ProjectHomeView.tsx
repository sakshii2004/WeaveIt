'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QuickAddSceneInput } from './QuickAddSceneInput';
import { SceneListView } from '@/components/scenes/SceneListView';
import { StructureManagementModal } from '@/components/structure/StructureManagementModal';
import { EditProjectDialog } from './EditProjectDialog';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Edit3, ArrowLeft, Map, Users, Layers, Sparkles, BookOpen } from 'lucide-react';
import type { Project, Act, Chapter, Location, Thread, Character, StoryMap } from '@/db/schema';
import type { SceneWithDetails } from '@/db/queries/scenes';

// Color map for act dots
const ACT_COLORS: Record<string, string> = {
  teal: 'bg-story-teal-text border-story-teal-bg',
  sun: 'bg-story-sun-text border-story-sun-bg',
  lavender: 'bg-story-lavender-text border-story-lavender-bg',
  coral: 'bg-story-coral-text border-story-coral-bg',
  mint: 'bg-story-mint-text border-story-mint-bg',
  sky: 'bg-story-sky-text border-story-sky-bg',
};

export interface ProjectHomeViewProps {
  project: Project;
  acts: Act[];
  chapters: Chapter[];
  locations: Location[];
  threads: Thread[];
  characters: Character[];
  storyMap: StoryMap | null;
  initialScenes: SceneWithDetails[];
}

export function ProjectHomeView({
  project: initialProject,
  acts,
  chapters,
  locations,
  threads,
  characters,
  storyMap,
  initialScenes,
}: ProjectHomeViewProps) {
  const router = useRouter();
  const [project, setProject] = React.useState<Project>(initialProject);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [structureModalOpen, setStructureModalOpen] = React.useState(false);

  const handleSceneQuickCreated = () => {
    // Router refresh will reload server state with full details
    router.refresh();
  };

  return (
    <div className="space-y-8 py-2">
      {/* Back to dashboard breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft hover:text-brand transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>
      </div>

      {/* Project Overview Banner */}
      <div className="rounded-md border border-line bg-surface p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
                {project.title}
              </h1>
              {project.genre && (
                <Chip variant="teal" size="sm">
                  {project.genre}
                </Chip>
              )}
            </div>

            <p className="text-sm text-ink-soft max-w-2xl leading-relaxed">
              {project.logline || (
                <span className="italic text-ink-soft/70">
                  No logline set. Add a one-sentence story hook to guide your scenes.
                </span>
              )}
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditDialogOpen(true)}
            className="gap-1.5 shrink-0"
          >
            <Edit3 className="h-3.5 w-3.5" /> Edit Details
          </Button>
        </div>
      </div>

      {/* Quick-Add Scene Input Section */}
      <div className="rounded-md border border-line bg-surface-sunken p-5 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand" /> Quick-Capture Scene
          </h2>
          <span className="text-xs text-ink-soft">
            {initialScenes.length} {initialScenes.length === 1 ? 'scene captured' : 'scenes captured'}
          </span>
        </div>

        <QuickAddSceneInput
          projectId={project.id}
          onSceneCreated={handleSceneQuickCreated}
        />
      </div>

      {/* Workspace Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Story Map Shortcut Card */}
        <Link href={`/projects/${project.id}/story-map`} className="block">
          <Card className="hover:border-brand/60 transition-all hover:shadow-xs cursor-pointer h-full">
            <CardHeader>
              <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-brand-soft text-brand-strong mb-1">
                <Map className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <CardTitle>Story Map</CardTitle>
              <CardDescription>
                {storyMap ? storyMap.name : 'Default Story Map'} initialized and ready for visual scene
                mapping.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-xs font-semibold text-brand inline-flex items-center gap-1 hover:underline">
                Open Story Map Canvas &rarr;
              </span>
            </CardContent>
          </Card>
        </Link>

        {/* Acts & Structure Card */}
        <Card
          onClick={() => setStructureModalOpen(true)}
          className="hover:border-ink-soft/40 transition-colors cursor-pointer group"
        >
          <CardHeader>
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-story-sun-bg text-story-sun-text mb-1 group-hover:scale-105 transition-transform">
              <BookOpen className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <CardTitle className="group-hover:text-brand transition-colors">Story Structure</CardTitle>
            <CardDescription>
              {acts.length} acts · {chapters.length} chapters · {threads.length} threads · {locations.length} locations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              {acts.map((act) => (
                <div key={act.id} className="flex items-center gap-1 text-[11px] text-ink font-medium bg-surface-sunken px-2 py-0.5 rounded border border-line">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      ACT_COLORS[act.color] || 'bg-brand'
                    }`}
                  />
                  <span>{act.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Characters Card */}
        <Link href={`/projects/${project.id}/characters`} className="block group">
          <Card className="hover:border-brand/50 hover:shadow-sm transition-all h-full flex flex-col justify-between">
            <CardHeader>
              <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-story-teal-bg text-story-teal-text mb-1 group-hover:scale-105 transition-transform">
                <Users className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <CardTitle className="group-hover:text-brand transition-colors">Characters ({characters.length})</CardTitle>
              <CardDescription>
                Cast profiles, custom traits, and relationship maps.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-xs font-semibold text-brand inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Open Characters &rarr;
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Scenes Workspace (SceneListView) */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold tracking-tight text-ink flex items-center gap-2">
            <Layers className="h-4 w-4 text-brand" /> Story Scenes &amp; Outline
          </h3>
        </div>

        <SceneListView
          projectId={project.id}
          initialScenes={initialScenes}
          acts={acts}
          chapters={chapters}
          locations={locations}
          characters={characters}
          threads={threads}
        />
      </div>

      <EditProjectDialog
        project={project}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onUpdated={setProject}
      />

      <StructureManagementModal
        open={structureModalOpen}
        onOpenChange={setStructureModalOpen}
        projectId={project.id}
        acts={acts}
        chapters={chapters}
        locations={locations}
        threads={threads}
        onStructureChanged={() => router.refresh()}
      />
    </div>
  );
}
