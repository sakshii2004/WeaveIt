'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useStoryMapStore } from '@/stores/story-map-store';
import {
  createMapAction,
  duplicateMapAction,
  updateMapAction,
  deleteMapAction,
} from '@/app/actions/maps';
import {
  Map,
  ChevronDown,
  Plus,
  Copy,
  Edit2,
  Trash2,
  Undo2,
  Redo2,
  Grid,
  LayoutGrid,
  Filter,
  BookOpen,
  Film,
} from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { GapHintsPopover } from './GapHintsPopover';
import type { StoryMap } from '@/db/schema';
import { cn } from '@/lib/utils';

export interface MapHeaderBarProps {
  allMaps: StoryMap[];
  onOpenCreateScene: () => void;
}

export function MapHeaderBar({ allMaps, onOpenCreateScene }: MapHeaderBarProps) {
  const router = useRouter();
  const {
    mapId,
    projectId,
    map,
    snapToGrid,
    toggleSnapToGrid,
    autoArrange,
    undo,
    redo,
    past,
    future,
    filter,
    setFilter,
    resetFilter,
    chaptersPanelOpen,
    setChaptersPanelOpen,
    scenesDrawerOpen,
    setScenesDrawerOpen,
    saveStatus,
    acts,
    chapters,
    allCharacters,
    allThreads,
  } = useStoryMapStore();

  const { fitView } = useReactFlow();

  const handleAutoArrange = () => {
    autoArrange();
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 450 });
    }, 60);
  };

  const [mapDropdownOpen, setMapDropdownOpen] = React.useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = React.useState(false);
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState('');
  const [newMapDialogOpen, setNewMapDialogOpen] = React.useState(false);
  const [newMapName, setNewMapName] = React.useState('');

  const mapDropdownRef = React.useRef<HTMLDivElement>(null);
  const filterDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (mapDropdownRef.current && !mapDropdownRef.current.contains(e.target as Node)) {
        setMapDropdownOpen(false);
      }
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setFilterDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  const hasActiveFilter =
    filter.actId !== 'all' ||
    filter.chapterId !== 'all' ||
    filter.threadId !== 'all' ||
    filter.characterId !== 'all';

  const handleSelectMap = (targetMapId: string) => {
    setMapDropdownOpen(false);
    if (targetMapId !== mapId) {
      router.push(`/projects/${projectId}/story-map?mapId=${targetMapId}`);
    }
  };

  const handleCreateNewMap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMapName.trim()) return;

    const res = await createMapAction(projectId, {
      name: newMapName.trim(),
      kind: 'story',
    });

    if (res.success && res.data) {
      setNewMapDialogOpen(false);
      setNewMapName('');
      setMapDropdownOpen(false);
      router.push(`/projects/${projectId}/story-map?mapId=${res.data.id}`);
    }
  };

  const handleDuplicate = async () => {
    setMapDropdownOpen(false);
    const res = await duplicateMapAction(mapId, {
      name: `${map?.name || 'Map'} (Copy)`,
    });
    if (res.success && res.data) {
      router.push(`/projects/${projectId}/story-map?mapId=${res.data.id}`);
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameValue.trim()) return;
    await updateMapAction(mapId, { name: renameValue.trim() });
    setIsRenaming(false);
    router.refresh();
  };

  const handleDeleteMap = async () => {
    if (!map || map.isDefault) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete map "${map.name}"? Scenes will NOT be deleted, only this map layout.`
    );
    if (!confirmed) return;

    const res = await deleteMapAction(mapId);
    if (res.success) {
      const remaining = allMaps.filter((m) => m.id !== mapId);
      const nextMap = remaining[0];
      router.push(`/projects/${projectId}/story-map${nextMap ? `?mapId=${nextMap.id}` : ''}`);
    }
  };

  return (
    <div className="relative z-30 flex h-12 w-full shrink-0 items-center justify-between border-b border-line bg-surface/90 px-4 backdrop-blur-md">
      {/* Left: Map Switcher & Map Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <div ref={mapDropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setMapDropdownOpen(!mapDropdownOpen)}
            className="flex items-center gap-2 rounded-sm border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-ink shadow-2xs hover:bg-surface-sunken transition-colors"
          >
            <Map className="h-3.5 w-3.5 text-brand" />
            <span className="truncate max-w-[160px]">{map?.name || 'Story Map'}</span>
            <ChevronDown className="h-3.5 w-3.5 text-ink-soft" />
          </button>

          {/* Map Switcher Dropdown */}
          {mapDropdownOpen && (
            <div className="absolute left-0 top-full mt-1.5 z-50 w-64 rounded-md border border-line bg-surface p-1.5 shadow-xl">
              <div className="px-2 py-1 text-[11px] font-semibold text-ink-soft uppercase tracking-wider">
                Story Maps
              </div>
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {allMaps.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => handleSelectMap(m.id)}
                    className={cn(
                      'flex items-center justify-between px-2.5 py-1.5 rounded-xs text-xs cursor-pointer transition-colors',
                      m.id === mapId
                        ? 'bg-brand-soft text-brand-strong font-semibold'
                        : 'text-ink hover:bg-surface-sunken'
                    )}
                  >
                    <span className="truncate">{m.name}</span>
                    {m.isDefault && (
                      <span className="text-[10px] px-1 bg-surface rounded-xs text-ink-soft border border-line">
                        Default
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-line/60 pt-1 mt-1 space-y-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setNewMapDialogOpen(true);
                    setMapDropdownOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-2.5 py-1.5 rounded-xs text-ink hover:bg-surface-sunken transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 text-brand" /> New Story Map
                </button>
                <button
                  type="button"
                  onClick={handleDuplicate}
                  className="flex w-full items-center gap-2 px-2.5 py-1.5 rounded-xs text-ink hover:bg-surface-sunken transition-colors"
                >
                  <Copy className="h-3.5 w-3.5 text-ink-soft" /> Duplicate Map
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRenameValue(map?.name || '');
                    setIsRenaming(true);
                    setMapDropdownOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-2.5 py-1.5 rounded-xs text-ink hover:bg-surface-sunken transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5 text-ink-soft" /> Rename Map
                </button>
                {!map?.isDefault && (
                  <button
                    type="button"
                    onClick={handleDeleteMap}
                    className="flex w-full items-center gap-2 px-2.5 py-1.5 rounded-xs text-coral hover:bg-story-coral-bg transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete Map
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Rename Modal / Form */}
        {isRenaming && (
          <form onSubmit={handleRenameSubmit} className="flex items-center gap-1.5">
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="rounded-sm border border-brand bg-surface px-2 py-0.5 text-xs text-ink outline-none"
              autoFocus
            />
            <Button size="sm" variant="primary" type="submit" className="h-6 px-2 text-xs">
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={() => setIsRenaming(false)}
              className="h-6 px-2 text-xs"
            >
              Cancel
            </Button>
          </form>
        )}

        <span className="h-4 w-px bg-line mx-1" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            disabled={past.length === 0}
            onClick={undo}
            className="p-1.5 rounded-sm text-ink-soft hover:text-ink disabled:opacity-30 hover:bg-surface-sunken transition-colors"
            title="Undo (⌘Z)"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={future.length === 0}
            onClick={redo}
            className="p-1.5 rounded-sm text-ink-soft hover:text-ink disabled:opacity-30 hover:bg-surface-sunken transition-colors"
            title="Redo (⇧⌘Z)"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Auto Arrange */}
        <Button
          size="sm"
          variant="secondary"
          onClick={handleAutoArrange}
          className="h-7 px-2.5 text-xs gap-1"
          title="Auto-arrange scenes into sequence order from left to right (undoable)"
        >
          <LayoutGrid className="h-3.5 w-3.5 text-brand" /> Auto-Arrange
        </Button>

        {/* Snap to Grid Toggle */}
        <button
          type="button"
          onClick={() => {
            toggleSnapToGrid();
            toast({
              title: !snapToGrid ? 'Grid enabled' : 'Grid disabled',
              description: !snapToGrid ? 'Canvas grid lines visible.' : 'Canvas grid lines hidden.',
            });
          }}
          className={cn(
            'flex items-center gap-1 rounded-sm border px-2 py-1 text-xs transition-colors',
            snapToGrid
              ? 'border-brand bg-brand-soft text-brand-strong font-semibold'
              : 'border-line text-ink-soft hover:text-ink hover:bg-surface-sunken'
          )}
          title="Toggle canvas grid lines and snap-to-grid"
        >
          <Grid className="h-3 w-3" /> Grid
        </button>

        {/* Filter Popover */}
        <div ref={filterDropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
            className={cn(
              'flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs transition-colors',
              hasActiveFilter
                ? 'border-brand bg-brand-soft text-brand-strong font-semibold'
                : 'border-line text-ink-soft hover:text-ink hover:bg-surface-sunken'
            )}
            title="Filter and highlight scenes (dims non-matching nodes)"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Highlight</span>
            {hasActiveFilter && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
          </button>

          {filterDropdownOpen && (
            <div className="absolute left-0 top-full mt-1.5 z-50 w-64 rounded-md border border-line bg-surface p-3 shadow-xl space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-line">
                <span className="font-semibold text-ink">Highlight Filter</span>
                {hasActiveFilter && (
                  <button
                    type="button"
                    onClick={resetFilter}
                    className="text-[11px] text-brand hover:underline"
                  >
                    Reset all
                  </button>
                )}
              </div>

              {/* By Act */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-ink-soft">By Act</label>
                <select
                  value={filter.actId}
                  onChange={(e) => setFilter({ actId: e.target.value })}
                  className="w-full rounded-sm border border-line bg-surface-sunken px-2 py-1 text-xs text-ink outline-none"
                >
                  <option value="all">All Acts</option>
                  {acts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* By Chapter */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-ink-soft">By Chapter</label>
                <select
                  value={filter.chapterId}
                  onChange={(e) => setFilter({ chapterId: e.target.value })}
                  className="w-full rounded-sm border border-line bg-surface-sunken px-2 py-1 text-xs text-ink outline-none"
                >
                  <option value="all">All Chapters</option>
                  {chapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* By Character */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-ink-soft">By Character</label>
                <select
                  value={filter.characterId}
                  onChange={(e) => setFilter({ characterId: e.target.value })}
                  className="w-full rounded-sm border border-line bg-surface-sunken px-2 py-1 text-xs text-ink outline-none"
                >
                  <option value="all">All Characters</option>
                  {allCharacters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* By Story Thread */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-ink-soft">By Thread</label>
                <select
                  value={filter.threadId}
                  onChange={(e) => setFilter({ threadId: e.target.value })}
                  className="w-full rounded-sm border border-line bg-surface-sunken px-2 py-1 text-xs text-ink outline-none"
                >
                  <option value="all">All Threads</option>
                  {allThreads.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Quiet Gap Hints Popover */}
        <GapHintsPopover />
      </div>

      {/* Right: Drawer Toggles, Quick Add Scene, Autosave Status */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Save Status Indicator */}
        <span className="text-[11px] font-medium text-ink-soft select-none mr-1">
          {saveStatus === 'saving' && <span className="text-brand">Saving...</span>}
          {saveStatus === 'saved' && <span className="text-success">Saved</span>}
          {saveStatus === 'error' && <span className="text-coral">Save error</span>}
        </span>

        {/* Chapters Drawer Toggle */}
        <button
          type="button"
          onClick={() => {
            if (chaptersPanelOpen) {
              setChaptersPanelOpen(false);
            } else {
              setChaptersPanelOpen(true);
              setScenesDrawerOpen(false);
            }
          }}
          className={cn(
            'flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs transition-colors',
            chaptersPanelOpen
              ? 'border-brand bg-brand-soft text-brand-strong font-semibold'
              : 'border-line text-ink-soft hover:text-ink hover:bg-surface-sunken'
          )}
          title="Chapters & Scenes Panel"
        >
          <BookOpen className="h-3.5 w-3.5" /> Chapters
        </button>

        {/* Unplaced Scenes Drawer Toggle */}
        <button
          type="button"
          onClick={() => {
            if (scenesDrawerOpen) {
              setScenesDrawerOpen(false);
            } else {
              setScenesDrawerOpen(true);
              setChaptersPanelOpen(false);
            }
          }}
          className={cn(
            'flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs transition-colors',
            scenesDrawerOpen
              ? 'border-brand bg-brand-soft text-brand-strong font-semibold'
              : 'border-line text-ink-soft hover:text-ink hover:bg-surface-sunken'
          )}
          title="Project Scenes Drawer (Add existing scenes to map)"
        >
          <Film className="h-3.5 w-3.5" /> Scenes
        </button>

        {/* + New Scene Button */}
        <Button
          size="sm"
          variant="primary"
          onClick={onOpenCreateScene}
          className="h-7 px-3 text-xs gap-1 font-semibold"
          title="Capture new scene (N)"
        >
          <Plus className="h-3.5 w-3.5" /> New Scene
        </Button>
      </div>

      {/* New Map Dialog */}
      {newMapDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="w-80 rounded-md border border-line bg-surface p-4 shadow-lg space-y-3">
            <h3 className="text-sm font-semibold text-ink">Create New Story Map</h3>
            <form onSubmit={handleCreateNewMap} className="space-y-3">
              <input
                type="text"
                placeholder="Map name (e.g. Act II Focus, Draft 2)..."
                value={newMapName}
                onChange={(e) => setNewMapName(e.target.value)}
                autoFocus
                className="w-full rounded-sm border border-line bg-surface-sunken px-2.5 py-1.5 text-xs text-ink outline-none"
              />
              <div className="flex justify-end gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  onClick={() => setNewMapDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" variant="primary" type="submit">
                  Create
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
