'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { SceneFilterBar, type SceneFilterState } from './SceneFilterBar';
import { SceneCard } from './SceneCard';
import { SceneDetailDrawer } from './SceneDetailDrawer';
import { CreateSceneDialog } from './CreateSceneDialog';
import { StructureManagementModal } from '@/components/structure/StructureManagementModal';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Layers } from 'lucide-react';
import type { SceneWithDetails } from '@/db/queries/scenes';
import type { Act, Chapter, Character, Location, Thread } from '@/db/schema';

export interface SceneListViewProps {
  projectId: string;
  initialScenes: SceneWithDetails[];
  acts: Act[];
  chapters: Chapter[];
  locations: Location[];
  characters: Character[];
  threads: Thread[];
}

export function SceneListView({
  projectId,
  initialScenes,
  acts,
  chapters,
  locations,
  characters,
  threads,
}: SceneListViewProps) {
  const router = useRouter();

  // Local state for scenes (allows optimistic updates and additions)
  const [scenes, setScenes] = React.useState<SceneWithDetails[]>(initialScenes);
  const [prevInitial, setPrevInitial] = React.useState<SceneWithDetails[]>(initialScenes);

  if (initialScenes !== prevInitial) {
    setPrevInitial(initialScenes);
    setScenes(initialScenes);
  }

  // Dialog & Drawer states
  const [selectedScene, setSelectedScene] = React.useState<SceneWithDetails | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [structureModalOpen, setStructureModalOpen] = React.useState(false);

  // View mode: 'grid' cards vs 'list' rows
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');

  // Filter state
  const [filters, setFilters] = React.useState<SceneFilterState>({
    search: '',
    status: 'all',
    actId: 'all',
    chapterId: 'all',
    characterId: 'all',
    threadId: 'all',
  });

  // Filter computation
  const filteredScenes = React.useMemo(() => {
    return scenes.filter((scene) => {
      // 1. Search term (title, description, timeLabel, purpose)
      if (filters.search.trim()) {
        const q = filters.search.trim().toLowerCase();
        const matchesTitle = scene.title.toLowerCase().includes(q);
        const matchesDesc = scene.description ? scene.description.toLowerCase().includes(q) : false;
        const matchesTime = scene.timeLabel ? scene.timeLabel.toLowerCase().includes(q) : false;
        const matchesPurpose = scene.purpose ? scene.purpose.toLowerCase().includes(q) : false;
        if (!matchesTitle && !matchesDesc && !matchesTime && !matchesPurpose) {
          return false;
        }
      }

      // 2. Status filter
      if (filters.status !== 'all' && scene.status !== filters.status) {
        return false;
      }

      // 3. Act filter
      if (filters.actId !== 'all' && scene.actId !== filters.actId) {
        return false;
      }

      // 4. Chapter filter
      if (filters.chapterId !== 'all' && scene.chapterId !== filters.chapterId) {
        return false;
      }

      // 5. Character filter
      if (filters.characterId !== 'all') {
        const hasChar = scene.characters.some((c) => c.character.id === filters.characterId);
        if (!hasChar) return false;
      }

      // 6. Thread filter
      if (filters.threadId !== 'all') {
        const hasThread = scene.threads.some((t) => t.id === filters.threadId);
        if (!hasThread) return false;
      }

      return true;
    });
  }, [scenes, filters]);

  // Handlers
  const handleSceneClick = (scene: SceneWithDetails) => {
    setSelectedScene(scene);
    setDrawerOpen(true);
  };

  const handleSceneCreated = (newScene: SceneWithDetails) => {
    setScenes((prev) => [newScene, ...prev]);
    router.refresh();
  };

  const handleSceneUpdated = (updated: SceneWithDetails) => {
    setScenes((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setSelectedScene(updated);
    router.refresh();
  };

  const handleSceneDeleted = (deletedId: string) => {
    setScenes((prev) => prev.filter((s) => s.id !== deletedId));
    router.refresh();
  };

  const handleStructureChanged = () => {
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <SceneFilterBar
        filters={filters}
        onFilterChange={setFilters}
        acts={acts}
        chapters={chapters}
        characters={characters}
        threads={threads}
        totalCount={scenes.length}
        filteredCount={filteredScenes.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenStructureModal={() => setStructureModalOpen(true)}
        onOpenCreateDialog={() => setCreateDialogOpen(true)}
      />

      {/* Scene Content Area */}
      {scenes.length === 0 ? (
        <div className="rounded-md border border-line bg-surface p-12 text-center">
          <EmptyState
            title="No scenes captured yet"
            description="Every novel begins with a fragment. Capture your first scene to begin shaping your story's arc."
            icon={<Layers className="h-8 w-8 text-brand" strokeWidth={1.75} />}
            actionLabel="Add your first scene"
            onAction={() => setCreateDialogOpen(true)}
          />
        </div>
      ) : filteredScenes.length === 0 ? (
        <div className="rounded-md border border-dashed border-line bg-surface p-10 text-center space-y-3">
          <p className="text-sm font-semibold text-ink">No scenes match your active filters</p>
          <p className="text-xs text-ink-soft">
            Try broadening your search term or clearing one of the act/status dropdowns.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              setFilters({
                search: '',
                status: 'all',
                actId: 'all',
                chapterId: 'all',
                characterId: 'all',
                threadId: 'all',
              })
            }
            className="text-xs"
          >
            Clear all filters
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Rich Cards Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredScenes.map((scene, idx) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              index={idx}
              acts={acts}
              onClick={() => handleSceneClick(scene)}
            />
          ))}
        </div>
      ) : (
        /* Compact Rows List View */
        <div className="space-y-1.5">
          {filteredScenes.map((scene, idx) => (
            <div
              key={scene.id}
              onClick={() => handleSceneClick(scene)}
              className="group flex items-center justify-between gap-3 rounded-md border border-line bg-surface p-3 transition-all hover:border-ink-soft/40 hover:shadow-2xs cursor-pointer text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-xs font-semibold text-ink-soft/70 w-7 shrink-0 text-center">
                  #{String(idx + 1).padStart(2, '0')}
                </span>
                <span className="font-semibold text-ink group-hover:text-brand transition-colors truncate">
                  {scene.title}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {scene.act && (
                  <span className="text-[11px] text-ink-soft hidden sm:inline">{scene.act.name}</span>
                )}
                <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-[10px] font-medium text-ink-soft border border-line capitalize">
                  {scene.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inspector Drawer */}
      <SceneDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        scene={selectedScene}
        projectId={projectId}
        acts={acts}
        chapters={chapters}
        locations={locations}
        allCharacters={characters}
        allThreads={threads}
        onSceneUpdated={handleSceneUpdated}
        onSceneDeleted={handleSceneDeleted}
        onStructureRefreshed={handleStructureChanged}
      />

      {/* Create Scene Studio */}
      <CreateSceneDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projectId={projectId}
        acts={acts}
        chapters={chapters}
        locations={locations}
        characters={characters}
        threads={threads}
        onSceneCreated={(scene, openInspector) => {
          handleSceneCreated(scene);
          if (openInspector) {
            setSelectedScene(scene);
            setDrawerOpen(true);
          }
        }}
        onStructureRefreshed={handleStructureChanged}
      />

      {/* Structure Management Modal */}
      <StructureManagementModal
        open={structureModalOpen}
        onOpenChange={setStructureModalOpen}
        projectId={projectId}
        acts={acts}
        chapters={chapters}
        locations={locations}
        threads={threads}
        onStructureChanged={handleStructureChanged}
      />
    </div>
  );
}
