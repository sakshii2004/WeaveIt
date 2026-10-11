'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal, X, Plus, LayoutGrid, List } from 'lucide-react';
import type { Act, Chapter, Character, Thread } from '@/db/schema';

export interface SceneFilterState {
  search: string;
  status: string;
  actId: string;
  chapterId: string;
  characterId: string;
  threadId: string;
}

interface SceneFilterBarProps {
  filters: SceneFilterState;
  onFilterChange: (filters: SceneFilterState) => void;
  acts: Act[];
  chapters: Chapter[];
  characters: Character[];
  threads: Thread[];
  totalCount: number;
  filteredCount: number;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onOpenStructureModal: () => void;
  onOpenCreateDialog: () => void;
}

export function SceneFilterBar({
  filters,
  onFilterChange,
  acts,
  chapters,
  characters,
  threads,
  totalCount,
  filteredCount,
  viewMode,
  onViewModeChange,
  onOpenStructureModal,
  onOpenCreateDialog,
}: SceneFilterBarProps) {
  const hasActiveFilters =
    filters.search !== '' ||
    filters.status !== 'all' ||
    filters.actId !== 'all' ||
    filters.chapterId !== 'all' ||
    filters.characterId !== 'all' ||
    filters.threadId !== 'all';

  const resetFilters = () => {
    onFilterChange({
      search: '',
      status: 'all',
      actId: 'all',
      chapterId: 'all',
      characterId: 'all',
      threadId: 'all',
    });
  };

  return (
    <div className="space-y-3">
      {/* Top Controls: Search, Structure Manager, View Switcher, New Scene */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-soft" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            placeholder="Search scenes by title, description, or time..."
            className="w-full rounded-md border border-line bg-surface py-2 pl-9 pr-8 text-xs text-ink placeholder:text-ink-soft/70 focus:border-brand focus:outline-none shadow-2xs"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, search: '' })}
              className="absolute right-2.5 top-2.5 text-ink-soft hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-md border border-line bg-surface p-0.5">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-sm text-xs transition-colors ${
                viewMode === 'grid' ? 'bg-surface-sunken text-brand font-semibold shadow-2xs' : 'text-ink-soft hover:text-ink'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded-sm text-xs transition-colors ${
                viewMode === 'list' ? 'bg-surface-sunken text-brand font-semibold shadow-2xs' : 'text-ink-soft hover:text-ink'
              }`}
              title="Compact Rows View"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Manage Structure Modal Trigger */}
          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenStructureModal}
            className="text-xs h-9 gap-1.5 shrink-0"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Manage</span> Structure
          </Button>

          {/* New Scene Trigger */}
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenCreateDialog}
            className="text-xs h-9 gap-1.5 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>New Scene</span>
          </Button>
        </div>
      </div>

      {/* Filter Row: Combined Dropdowns & Active Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* Status Dropdown */}
        <select
          value={filters.status}
          onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
          className="rounded-md border border-line bg-surface px-2.5 py-1 text-xs text-ink focus:border-brand focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="seed">Seed</option>
          <option value="sketched">Sketched</option>
          <option value="planned">Planned</option>
          <option value="played">Played</option>
          <option value="drafted">Drafted</option>
        </select>

        {/* Act Dropdown */}
        <select
          value={filters.actId}
          onChange={(e) => onFilterChange({ ...filters, actId: e.target.value })}
          className="rounded-md border border-line bg-surface px-2.5 py-1 text-xs text-ink focus:border-brand focus:outline-none"
        >
          <option value="all">All Acts</option>
          {acts.map((act) => (
            <option key={act.id} value={act.id}>
              {act.name}
            </option>
          ))}
        </select>

        {/* Chapter Dropdown */}
        <select
          value={filters.chapterId}
          onChange={(e) => onFilterChange({ ...filters, chapterId: e.target.value })}
          className="rounded-md border border-line bg-surface px-2.5 py-1 text-xs text-ink focus:border-brand focus:outline-none"
        >
          <option value="all">All Chapters</option>
          {chapters.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {ch.title}
            </option>
          ))}
        </select>

        {/* Character Dropdown */}
        <select
          value={filters.characterId}
          onChange={(e) => onFilterChange({ ...filters, characterId: e.target.value })}
          className="rounded-md border border-line bg-surface px-2.5 py-1 text-xs text-ink focus:border-brand focus:outline-none"
        >
          <option value="all">All Characters</option>
          {characters.map((char) => (
            <option key={char.id} value={char.id}>
              {char.name}
            </option>
          ))}
        </select>

        {/* Thread Dropdown */}
        <select
          value={filters.threadId}
          onChange={(e) => onFilterChange({ ...filters, threadId: e.target.value })}
          className="rounded-md border border-line bg-surface px-2.5 py-1 text-xs text-ink focus:border-brand focus:outline-none"
        >
          <option value="all">All Threads</option>
          {threads.map((thread) => (
            <option key={thread.id} value={thread.id}>
              {thread.name}
            </option>
          ))}
        </select>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-1 rounded-md bg-surface-sunken border border-line px-2 py-1 text-xs text-ink-soft hover:text-ink transition-colors"
          >
            <X className="h-3 w-3" /> Clear filters
          </button>
        )}

        {/* Count summary */}
        <span className="text-[11px] text-ink-soft ml-auto">
          {hasActiveFilters ? (
            <>Showing <strong className="text-ink">{filteredCount}</strong> of {totalCount} scenes</>
          ) : (
            <><strong className="text-ink">{totalCount}</strong> {totalCount === 1 ? 'scene' : 'scenes'}</>
          )}
        </span>
      </div>
    </div>
  );
}
