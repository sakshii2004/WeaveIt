'use client';

import * as React from 'react';
import { useStoryMapStore } from '@/stores/story-map-store';
import { createChapterAction } from '@/app/actions/structure';
import { BookOpen, Plus, X, ChevronRight, ChevronDown, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ChaptersPanel() {
  const {
    projectId,
    mapId,
    chapters,
    nodes,
    chaptersPanelOpen,
    setChaptersPanelOpen,
    setInspectedScene,
    allScenes,
  } = useStoryMapStore();

  const [newTitle, setNewTitle] = React.useState('');
  const [isAdding, setIsAdding] = React.useState(false);
  const [expandedChapters, setExpandedChapters] = React.useState<Record<string, boolean>>({});

  const toggleExpand = (chapId: string) => {
    setExpandedChapters((prev) => ({ ...prev, [chapId]: !prev[chapId] }));
  };

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await createChapterAction(projectId, {
      title: newTitle.trim(),
      mapId,
    });
    setNewTitle('');
    setIsAdding(false);
  };

  if (!chaptersPanelOpen) return null;

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
    <div className="fixed top-14 left-4 z-30 flex h-[calc(100vh-5rem)] w-72 flex-col rounded-md border border-line bg-surface/95 shadow-md backdrop-blur-md">
      {/* Panel Header */}
      <div className="flex h-11 items-center justify-between border-b border-line px-3.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-ink">
          <BookOpen className="h-4 w-4 text-brand" />
          Chapters & Scenes
        </div>

        <button
          type="button"
          onClick={() => setChaptersPanelOpen(false)}
          className="p-1 rounded-sm text-ink-soft hover:text-ink hover:bg-surface-sunken"
          title="Close panel"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Chapters Tree */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
        {chapters.length === 0 ? (
          <div className="p-3 text-center text-ink-soft">
            No chapters yet. Add chapters to organize your book structure.
          </div>
        ) : (
          chapters.map((ch) => {
            const scenesInChap = chapterSceneMap.get(ch.id) || [];
            const isExpanded = expandedChapters[ch.id] !== false; // expanded by default

            return (
              <div key={ch.id} className="rounded-sm border border-line bg-surface-sunken/40">
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

                  <span className="text-[11px] text-ink-soft px-1.5 py-0.2 bg-surface rounded-full border border-line">
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
          <div className="rounded-sm border border-line bg-surface-sunken/40 mt-3">
            <div className="flex items-center justify-between px-2.5 py-2">
              <span className="font-semibold text-ink-soft text-[11px]">No Chapter Assigned</span>
              <span className="text-[11px] text-ink-soft px-1.5 py-0.2 bg-surface rounded-full border border-line">
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
        {isAdding ? (
          <form onSubmit={handleAddChapter} className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="Chapter title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
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
              onClick={() => setIsAdding(false)}
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
            onClick={() => setIsAdding(true)}
            className="w-full justify-start gap-1.5 text-xs text-ink-soft hover:text-ink"
          >
            <Plus className="h-3.5 w-3.5" /> Add Chapter
          </Button>
        )}
      </div>
    </div>
  );
}
