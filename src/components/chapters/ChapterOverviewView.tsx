'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SceneDetailDrawer } from '@/components/scenes/SceneDetailDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Chip } from '@/components/ui/chip';
import { useToast } from '@/components/ui/toast';
import {
  createChapterAction,
  updateChapterAction,
  deleteChapterAction,
} from '@/app/actions/structure';
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Layers,
  AlertCircle,
  FileText,
} from 'lucide-react';
import type { Project, Act, Chapter, Location, Thread, Character } from '@/db/schema';
import type { SceneWithDetails } from '@/db/queries/scenes';

// Status colors for badges
const STATUS_STYLE: Record<string, string> = {
  seed: 'bg-story-sun-bg text-story-sun-text border-story-sun-border',
  sketched: 'bg-story-sky-bg text-story-sky-text border-story-sky-border',
  planned: 'bg-story-lavender-bg text-story-lavender-text border-story-lavender-border',
  played: 'bg-story-teal-bg text-story-teal-text border-story-teal-border',
  drafted: 'bg-story-mint-bg text-story-mint-text border-story-mint-border',
};

interface ChapterOverviewViewProps {
  project: Project;
  acts: Act[];
  chapters: Chapter[];
  locations: Location[];
  threads: Thread[];
  characters: Character[];
  scenes: SceneWithDetails[];
}

export function ChapterOverviewView({
  project,
  acts,
  chapters: initialChapters,
  locations,
  threads,
  characters,
  scenes: initialScenes,
}: ChapterOverviewViewProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Track server state freshness
  const [chapters, setChapters] = React.useState(initialChapters);
  const [scenes, setScenes] = React.useState(initialScenes);
  const [prevChapters, setPrevChapters] = React.useState(initialChapters);
  const [prevScenes, setPrevScenes] = React.useState(initialScenes);

  if (initialChapters !== prevChapters) {
    setPrevChapters(initialChapters);
    setChapters(initialChapters);
  }
  if (initialScenes !== prevScenes) {
    setPrevScenes(initialScenes);
    setScenes(initialScenes);
  }

  // Expandable state (all expanded by default)
  const [expandedChapters, setExpandedChapters] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = { __unassigned: true };
    initialChapters.forEach((ch) => { initial[ch.id] = true; });
    return initial;
  });

  // Scene detail drawer
  const [selectedScene, setSelectedScene] = React.useState<SceneWithDetails | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // Inline add chapter
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newChapterTitle, setNewChapterTitle] = React.useState('');
  const [isAdding, setIsAdding] = React.useState(false);

  // Inline edit chapter
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState('');

  const toggleExpand = (key: string) => {
    setExpandedChapters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Group scenes by chapter
  const chapterSceneMap = React.useMemo(() => {
    const map = new Map<string | null, SceneWithDetails[]>();
    for (const ch of chapters) {
      map.set(ch.id, []);
    }
    map.set(null, []); // unassigned
    for (const scene of scenes) {
      const key = scene.chapterId && map.has(scene.chapterId) ? scene.chapterId : null;
      map.get(key)!.push(scene);
    }
    return map;
  }, [chapters, scenes]);

  const unassignedScenes = chapterSceneMap.get(null) || [];

  // Handlers
  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitle.trim() || isAdding) return;
    setIsAdding(true);
    const res = await createChapterAction(project.id, { title: newChapterTitle.trim() });
    setIsAdding(false);
    if (res.success && res.data) {
      setNewChapterTitle('');
      setShowAddForm(false);
      setExpandedChapters((prev) => ({ ...prev, [res.data!.id]: true }));
      toast({ title: 'Chapter created', description: `"${res.data.title}" added to your outline.` });
      router.refresh();
    } else {
      toast({ title: 'Error', description: res.error || 'Failed to create chapter.', variant: 'error' });
    }
  };

  const handleUpdateChapter = async (chapterId: string) => {
    if (!editTitle.trim()) return;
    const res = await updateChapterAction(chapterId, { title: editTitle.trim() });
    if (res.success) {
      setEditingId(null);
      toast({ title: 'Chapter renamed' });
      router.refresh();
    } else {
      toast({ title: 'Error', description: res.error, variant: 'error' });
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    const res = await deleteChapterAction(chapterId);
    if (res.success) {
      toast({ title: 'Chapter deleted' });
      router.refresh();
    } else {
      toast({ title: 'Error', description: res.error, variant: 'error' });
    }
  };

  const handleSceneClick = (scene: SceneWithDetails) => {
    setSelectedScene(scene);
    setDrawerOpen(true);
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

  const totalSceneCount = scenes.length;
  const assignedCount = totalSceneCount - unassignedScenes.length;

  return (
    <div className="space-y-6 py-2">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft hover:text-brand transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to {project.title}
        </Link>
      </div>

      {/* Page Header */}
      <div className="rounded-md border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-ink">Chapter Overview</h1>
                <p className="text-xs text-ink-soft">
                  {chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'} · {assignedCount} of {totalSceneCount} scenes assigned
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="gap-1.5 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" /> New Chapter
          </Button>
        </div>

        {/* Inline Add Chapter Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddChapter}
            className="mt-4 flex items-center gap-2 p-3 rounded-md border border-line bg-surface-sunken/40"
          >
            <Input
              type="text"
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              placeholder="Chapter title (e.g. Chapter 1: Departure)"
              className="text-sm h-9 flex-1"
              autoFocus
            />
            <Button type="submit" size="sm" disabled={!newChapterTitle.trim() || isAdding} className="h-9 text-xs gap-1">
              {isAdding ? <span className="animate-spin">⏳</span> : <Plus className="h-3.5 w-3.5" />}
              Add
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setShowAddForm(false); setNewChapterTitle(''); }}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
          </form>
        )}
      </div>

      {/* Chapters List */}
      <div className="space-y-3">
        {chapters.length === 0 && unassignedScenes.length === 0 ? (
          <div className="rounded-md border border-dashed border-line bg-surface p-12 text-center space-y-3">
            <div className="flex items-center justify-center">
              <div className="h-14 w-14 rounded-xl bg-surface-sunken border border-line flex items-center justify-center">
                <BookOpen className="h-7 w-7 text-ink-soft" strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-sm font-semibold text-ink">No chapters yet</p>
            <p className="text-xs text-ink-soft max-w-md mx-auto leading-relaxed">
              Chapters help organize your scenes into a book structure. Create your first chapter to start building your novel outline.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddForm(true)}
              className="text-xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Create First Chapter
            </Button>
          </div>
        ) : (
          <>
            {chapters.map((ch) => {
              const scenesInChapter = chapterSceneMap.get(ch.id) || [];
              const isExpanded = expandedChapters[ch.id] !== false;
              const isEditing = editingId === ch.id;

              return (
                <div
                  key={ch.id}
                  className="rounded-lg border border-line bg-surface overflow-hidden transition-shadow hover:shadow-xs"
                >
                  {/* Chapter Header */}
                  <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 bg-surface">
                    <div
                      className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                      onClick={() => toggleExpand(ch.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-ink-soft shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-ink-soft shrink-0" />
                      )}

                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                          <Input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="text-sm h-8 flex-1"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUpdateChapter(ch.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                          />
                          <Button size="icon-sm" onClick={() => handleUpdateChapter(ch.id)} className="h-7 w-7">
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => setEditingId(null)} className="h-7 w-7">
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <span className="font-semibold text-ink truncate">{ch.title}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="text-[11px] text-ink-soft font-medium bg-surface-sunken px-2 py-0.5 rounded-full border border-line">
                        {scenesInChapter.length} {scenesInChapter.length === 1 ? 'scene' : 'scenes'}
                      </span>

                      {!isEditing && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(ch.id);
                              setEditTitle(ch.title);
                            }}
                            className="p-1 rounded-sm text-ink-soft hover:text-ink hover:bg-surface-sunken transition-colors"
                            title="Rename chapter"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChapter(ch.id);
                            }}
                            className="p-1 rounded-sm text-ink-soft hover:text-coral hover:bg-coral/10 transition-colors"
                            title="Delete chapter"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Scenes List */}
                  {isExpanded && (
                    <div className="border-t border-line bg-surface-sunken/20">
                      {scenesInChapter.length === 0 ? (
                        <div className="flex items-center gap-2 px-5 py-4 text-xs text-ink-soft italic">
                          <AlertCircle className="h-3.5 w-3.5 text-sun" />
                          No scenes assigned to this chapter yet. Open a scene and set its chapter to see it here.
                        </div>
                      ) : (
                        <div className="divide-y divide-line/50">
                          {scenesInChapter.map((scene) => (
                            <div
                              key={scene.id}
                              onClick={() => handleSceneClick(scene)}
                              className="group flex items-center justify-between gap-3 px-5 py-3 cursor-pointer hover:bg-surface transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-surface border border-line shrink-0">
                                  <FileText className="h-3.5 w-3.5 text-ink-soft group-hover:text-brand transition-colors" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-ink truncate group-hover:text-brand transition-colors">
                                    {scene.title}
                                  </p>
                                  {scene.description && (
                                    <p className="text-[11px] text-ink-soft truncate max-w-lg mt-0.5">
                                      {scene.description.slice(0, 120)}
                                      {scene.description.length > 120 ? '…' : ''}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {scene.act && (
                                  <span className="hidden sm:inline text-[11px] text-ink-soft font-medium">
                                    {scene.act.name}
                                  </span>
                                )}
                                <Chip
                                  variant={
                                    (scene.status === 'seed' ? 'sun' :
                                      scene.status === 'sketched' ? 'sky' :
                                      scene.status === 'planned' ? 'lavender' :
                                      scene.status === 'played' ? 'teal' :
                                      scene.status === 'drafted' ? 'mint' : 'default') as 'sun' | 'sky' | 'lavender' | 'teal' | 'mint' | 'default'
                                  }
                                  size="sm"
                                >
                                  {scene.status}
                                </Chip>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Unassigned Scenes Section */}
            {unassignedScenes.length > 0 && (
              <div className="rounded-lg border border-dashed border-line bg-surface overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 sm:px-5 py-3.5 cursor-pointer"
                  onClick={() => toggleExpand('__unassigned')}
                >
                  <div className="flex items-center gap-2.5">
                    {expandedChapters['__unassigned'] !== false ? (
                      <ChevronDown className="h-4 w-4 text-ink-soft" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-ink-soft" />
                    )}
                    <Layers className="h-4 w-4 text-ink-soft" />
                    <span className="font-semibold text-ink-soft text-sm">Unassigned Scenes</span>
                  </div>
                  <span className="text-[11px] text-ink-soft font-medium bg-surface-sunken px-2 py-0.5 rounded-full border border-line">
                    {unassignedScenes.length}
                  </span>
                </div>

                {expandedChapters['__unassigned'] !== false && (
                  <div className="border-t border-line/60 bg-surface-sunken/10 divide-y divide-line/40">
                    {unassignedScenes.map((scene) => (
                      <div
                        key={scene.id}
                        onClick={() => handleSceneClick(scene)}
                        className="group flex items-center justify-between gap-3 px-5 py-3 cursor-pointer hover:bg-surface transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-surface border border-line shrink-0">
                            <FileText className="h-3.5 w-3.5 text-ink-soft group-hover:text-brand transition-colors" />
                          </div>
                          <p className="text-sm font-medium text-ink truncate group-hover:text-brand transition-colors">
                            {scene.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {scene.act && (
                            <span className="hidden sm:inline text-[11px] text-ink-soft font-medium">
                              {scene.act.name}
                            </span>
                          )}
                          <Chip
                            variant={
                              (scene.status === 'seed' ? 'sun' :
                                scene.status === 'sketched' ? 'sky' :
                                scene.status === 'planned' ? 'lavender' :
                                scene.status === 'played' ? 'teal' :
                                scene.status === 'drafted' ? 'mint' : 'default') as 'sun' | 'sky' | 'lavender' | 'teal' | 'mint' | 'default'
                            }
                            size="sm"
                          >
                            {scene.status}
                          </Chip>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Scene Detail Drawer */}
      <SceneDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        scene={selectedScene}
        projectId={project.id}
        acts={acts}
        chapters={chapters}
        locations={locations}
        allCharacters={characters}
        allThreads={threads}
        onSceneUpdated={handleSceneUpdated}
        onSceneDeleted={handleSceneDeleted}
        onStructureRefreshed={() => router.refresh()}
      />
    </div>
  );
}
