'use client';

import * as React from 'react';
import { useStoryMapStore } from '@/stores/story-map-store';
import { createChapterAction } from '@/app/actions/structure';
import { addSceneToMapAction } from '@/app/actions/maps';
import {
  BookOpen,
  Film,
  Plus,
  X,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Search,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { STATUS_VARIANTS } from '@/components/scenes/SceneCard';
import { cn } from '@/lib/utils';

export function StoryMapRightPanel() {
  const {
    projectId,
    mapId,
    chapters,
    nodes,
    allScenes,
    chaptersPanelOpen,
    setChaptersPanelOpen,
    scenesDrawerOpen,
    setScenesDrawerOpen,
    addPlacedNode,
    setInspectedScene,
  } = useStoryMapStore();

  const isOpen = chaptersPanelOpen || scenesDrawerOpen;
  const activeTab: 'chapters' | 'scenes' = scenesDrawerOpen && !chaptersPanelOpen ? 'scenes' : 'chapters';

  // Chapters tab local state
  const [newChapterTitle, setNewChapterTitle] = React.useState('');
  const [isAddingChapter, setIsAddingChapter] = React.useState(false);
  const [expandedChapters, setExpandedChapters] = React.useState<Record<string, boolean>>({});

  // Scenes tab local state
  const [search, setSearch] = React.useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setChaptersPanelOpen(false);
    setScenesDrawerOpen(false);
  };

  const handleSelectTab = (tab: 'chapters' | 'scenes') => {
    if (tab === 'chapters') {
      setChaptersPanelOpen(true);
      setScenesDrawerOpen(false);
    } else {
      setChaptersPanelOpen(false);
      setScenesDrawerOpen(true);
    }
  };

  const toggleExpand = (chapId: string) => {
    setExpandedChapters((prev) => ({ ...prev, [chapId]: !prev[chapId] }));
  };

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitle.trim()) return;

    await createChapterAction(projectId, {
      title: newChapterTitle.trim(),
      mapId,
    });
    setNewChapterTitle('');
    setIsAddingChapter(false);
  };

  const placedSceneIds = new Set(nodes.map((n) => n.data.sceneId));

  const filteredScenes = allScenes.filter((s) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return s.title.toLowerCase().includes(term) || (s.description && s.description.toLowerCase().includes(term));
  });

  const handlePlaceScene = async (sceneId: string) => {
    const scene = allScenes.find((s) => s.id === sceneId);
    if (!scene) return;

    // Calculate a good offset on canvas
    const count = nodes.length;
    const col = count % 4;
    const row = Math.floor(count / 4);
    const x = 120 + col * 320;
    const y = 140 + row * 220;

    const res = await addSceneToMapAction(mapId, { sceneId, x, y });
    if (res.success && res.data) {
      addPlacedNode({
        id: res.data.id,
        type: 'sceneNode',
        position: { x: res.data.x, y: res.data.y },
        data: {
          nodeId: res.data.id,
          sceneId: scene.id,
          sequenceIndex: res.data.sequenceIndex,
          title: scene.title,
          description: scene.description,
          status: scene.status,
          sceneType: scene.sceneType,
          actId: scene.actId,
          act: scene.act,
          chapterId: scene.chapterId,
          chapter: scene.chapter,
          characters: scene.characters,
          threads: scene.threads,
          location: scene.location,
          timeLabel: scene.timeLabel,
          color: scene.color,
          isDimmed: false,
        },
      });
    }
  };

  // Group nodes by chapter
  const chapterSceneMap = new Map<string, typeof nodes>();
  const unassignedNodes: typeof nodes = [];

  for (const ch of chapters) {
    chapterSceneMap.set(ch.id, []);
  }

  for (const node of nodes) {
    if (node.data.chapterId && chapterSceneMap.has(node.data.chapterId)) {
      chapterSceneMap.get(node.data.chapterId)!.push(node);
    } else {
      unassignedNodes.push(node);
    }
  }

  return (
    <div className="absolute top-0 right-0 bottom-0 z-30 flex h-full w-84 flex-col border-l border-line bg-surface/95 shadow-xl backdrop-blur-md animate-in slide-in-from-right duration-200">
      {/* Cohesive Right Panel Header with Tabs */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-line px-3">
        <div className="flex items-center gap-1 rounded-sm bg-surface-sunken p-1">
          <button
            type="button"
            onClick={() => handleSelectTab('chapters')}
            className={cn(
              'flex items-center gap-1.5 rounded-xs px-2.5 py-1 text-xs font-semibold transition-colors',
              activeTab === 'chapters'
                ? 'bg-surface text-ink shadow-2xs'
                : 'text-ink-soft hover:text-ink'
            )}
          >
            <BookOpen className="h-3.5 w-3.5 text-brand" />
            <span>Chapters</span>
            <span className="text-[10px] text-ink-soft bg-surface-sunken/60 px-1 rounded-xs">
              {chapters.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('scenes')}
            className={cn(
              'flex items-center gap-1.5 rounded-xs px-2.5 py-1 text-xs font-semibold transition-colors',
              activeTab === 'scenes'
                ? 'bg-surface text-ink shadow-2xs'
                : 'text-ink-soft hover:text-ink'
            )}
          >
            <Film className="h-3.5 w-3.5 text-brand" />
            <span>Scenes</span>
            <span className="text-[10px] text-ink-soft bg-surface-sunken/60 px-1 rounded-xs">
              {allScenes.length}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="p-1 rounded-sm text-ink-soft hover:text-ink hover:bg-surface-sunken transition-colors"
          title="Close panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Chapters Tab Content */}
      {activeTab === 'chapters' && (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
            {chapters.length === 0 ? (
              <div className="p-4 text-center text-ink-soft">
                No chapters created yet. Add chapters to structure your narrative path.
              </div>
            ) : (
              chapters.map((ch) => {
                const scenesInChap = chapterSceneMap.get(ch.id) || [];
                const isExpanded = expandedChapters[ch.id] !== false;

                return (
                  <div key={ch.id} className="rounded-md border border-line bg-surface-sunken/40">
                    <div
                      onClick={() => toggleExpand(ch.id)}
                      className="flex items-center justify-between px-2.5 py-2 cursor-pointer hover:bg-surface-sunken transition-colors"
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-ink truncate">
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 text-ink-soft" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-ink-soft" />
                        )}
                        <span className="truncate">{ch.title}</span>
                      </div>

                      <span className="text-[10px] text-ink-soft px-1.5 py-0.5 bg-surface rounded-full border border-line">
                        {scenesInChap.length}
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-line/40 p-1.5 space-y-1">
                        {scenesInChap.length === 0 ? (
                          <div className="px-2 py-1 text-[11px] text-ink-soft italic flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 text-sun" />
                            Empty chapter
                          </div>
                        ) : (
                          scenesInChap.map((node) => (
                            <div
                              key={node.id}
                              onClick={() => {
                                const scene = allScenes.find((s) => s.id === node.data.sceneId);
                                if (scene) setInspectedScene(scene);
                              }}
                              className="flex items-center justify-between px-2 py-1.5 rounded-xs bg-surface border border-line/60 hover:border-brand cursor-pointer transition-colors"
                            >
                              <span className="text-[11px] font-medium text-ink truncate">
                                {node.data.title}
                              </span>
                              {node.data.sequenceIndex !== null && (
                                <span className="font-mono text-[10px] text-brand">
                                  #{String(node.data.sequenceIndex + 1).padStart(2, '0')}
                                </span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Unassigned Scenes Section */}
            {unassignedNodes.length > 0 && (
              <div className="rounded-md border border-line bg-surface-sunken/40 mt-3">
                <div className="flex items-center justify-between px-2.5 py-2">
                  <span className="font-semibold text-ink-soft text-[11px]">No Chapter Assigned</span>
                  <span className="text-[10px] text-ink-soft px-1.5 py-0.5 bg-surface rounded-full border border-line">
                    {unassignedNodes.length}
                  </span>
                </div>
                <div className="border-t border-line/40 p-1.5 space-y-1">
                  {unassignedNodes.map((node) => (
                    <div
                      key={node.id}
                      onClick={() => {
                        const scene = allScenes.find((s) => s.id === node.data.sceneId);
                        if (scene) setInspectedScene(scene);
                      }}
                      className="flex items-center justify-between px-2 py-1.5 rounded-xs bg-surface border border-line/60 hover:border-brand cursor-pointer transition-colors"
                    >
                      <span className="text-[11px] font-medium text-ink truncate">{node.data.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Inline Add Chapter Form */}
          <div className="border-t border-line p-2.5">
            {isAddingChapter ? (
              <form onSubmit={handleAddChapter} className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Chapter title..."
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  autoFocus
                  className="flex-1 rounded-sm border border-line bg-surface-sunken px-2 py-1 text-xs text-ink outline-none"
                />
                <Button type="submit" size="sm" variant="primary" className="h-7 px-2">
                  Add
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsAddingChapter(false)}
                  className="h-7 px-2"
                >
                  Cancel
                </Button>
              </form>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingChapter(true)}
                className="w-full justify-start gap-1.5 text-xs text-ink-soft hover:text-ink"
              >
                <Plus className="h-3.5 w-3.5" /> Add Chapter
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Scenes Tab Content */}
      {activeTab === 'scenes' && (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-line/60">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-soft" />
              <input
                type="text"
                placeholder="Filter project scenes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-sm border border-line bg-surface-sunken pl-8 pr-3 py-1.5 text-xs text-ink outline-none"
              />
            </div>
          </div>

          {/* Scenes List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
            {filteredScenes.length === 0 ? (
              <div className="p-4 text-center text-ink-soft">No matching scenes found.</div>
            ) : (
              filteredScenes.map((scene) => {
                const isPlaced = placedSceneIds.has(scene.id);
                const statusVariant = STATUS_VARIANTS[scene.status] || 'teal';

                return (
                  <div
                    key={scene.id}
                    className={cn(
                      'flex flex-col justify-between rounded-md border border-line bg-surface p-2.5 shadow-2xs transition-colors',
                      isPlaced && 'bg-surface-sunken/30 border-line/70'
                    )}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <Chip variant={statusVariant} size="sm">
                          {scene.status}
                        </Chip>

                        {isPlaced ? (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-brand">
                            <Check className="h-3 w-3" /> On Map
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handlePlaceScene(scene.id)}
                            className="h-6 px-2 text-[11px] gap-1"
                          >
                            <Plus className="h-3 w-3" /> Place on Map
                          </Button>
                        )}
                      </div>

                      <h5
                        onClick={() => setInspectedScene(scene)}
                        className="font-semibold text-ink line-clamp-1 hover:underline cursor-pointer"
                      >
                        {scene.title}
                      </h5>

                      <p className="text-[11px] text-ink-soft line-clamp-2 leading-relaxed">
                        {scene.description || <span className="italic text-ink-soft/60">No description.</span>}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
