'use client';

import * as React from 'react';
import type { Character } from '@/db/schema';
import { Avatar } from '@/components/ui/avatar';
import { Search, UserCheck, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CharacterMentionMenuProps {
  sceneCharacterIds: string[];
  allCharacters: Character[];
  selectedCharacterId: string | null;
  onSelect: (characterId: string | null, shouldAddToScene?: boolean) => void;
  onClose: () => void;
  initialSearch?: string;
}

export function CharacterMentionMenu({
  sceneCharacterIds,
  allCharacters,
  selectedCharacterId,
  onSelect,
  onClose,
  initialSearch = '',
}: CharacterMentionMenuProps) {
  const [search, setSearch] = React.useState(initialSearch);
  const [focusedIndex, setFocusedIndex] = React.useState(0);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Split into scene characters and other project characters
  const sceneCharIdSet = React.useMemo(() => new Set(sceneCharacterIds), [sceneCharacterIds]);

  const { inSceneList, otherList } = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = allCharacters.filter((c) =>
      q ? c.name.toLowerCase().includes(q) : true
    );

    const inScene: Character[] = [];
    const other: Character[] = [];

    for (const c of filtered) {
      if (sceneCharIdSet.has(c.id)) {
        inScene.push(c);
      } else {
        other.push(c);
      }
    }

    return { inSceneList: inScene, otherList: other };
  }, [allCharacters, sceneCharIdSet, search]);

  const flattenedOptions: Array<{ type: 'character'; char: Character; inScene: boolean } | { type: 'unassigned' }> =
    React.useMemo(() => {
      const list: Array<{ type: 'character'; char: Character; inScene: boolean } | { type: 'unassigned' }> = [
        { type: 'unassigned' },
      ];
      for (const char of inSceneList) {
        list.push({ type: 'character', char, inScene: true });
      }
      for (const char of otherList) {
        list.push({ type: 'character', char, inScene: false });
      }
      return list;
    }, [inSceneList, otherList]);

  // Focus input on mount
  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on outside click
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Keyboard navigation
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % flattenedOptions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + flattenedOptions.length) % flattenedOptions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = flattenedOptions[focusedIndex];
        if (selected) {
          if (selected.type === 'unassigned') {
            onSelect(null);
          } else {
            onSelect(selected.char.id, !selected.inScene);
          }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, flattenedOptions, onSelect, onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute z-50 top-full mt-1.5 left-0 w-72 rounded-md border border-line bg-surface p-2 shadow-xl animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Search Input */}
      <div className="relative mb-2">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-ink-soft" />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setFocusedIndex(0);
          }}
          placeholder="Filter characters (@name)..."
          className="w-full rounded-sm border border-line bg-surface-sunken py-1.5 pl-8 pr-7 text-xs text-ink placeholder:text-ink-soft/60 focus:border-brand focus:outline-none"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-2 top-2 text-ink-soft hover:text-ink"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Option List */}
      <div className="max-h-56 overflow-y-auto space-y-1 text-xs">
        {/* Unassigned / Clear */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          onMouseEnter={() => setFocusedIndex(0)}
          className={cn(
            'w-full flex items-center justify-between rounded-sm px-2 py-1.5 text-left transition-colors',
            focusedIndex === 0 ? 'bg-surface-sunken text-ink font-semibold' : 'text-ink-soft hover:bg-surface-sunken'
          )}
        >
          <span className="italic text-[11px] text-ink-soft/80">Unassigned Voice (No Speaker)</span>
          {selectedCharacterId === null && <span className="text-[10px] text-brand font-semibold">Active</span>}
        </button>

        {/* Section 1: In This Scene */}
        {inSceneList.length > 0 && (
          <div>
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-soft/70 flex items-center gap-1 border-t border-line/50 mt-1 pt-1.5">
              <UserCheck className="h-3 w-3 text-brand" /> Characters In Scene
            </div>
            {inSceneList.map((char) => {
              const optionIndex = flattenedOptions.findIndex(
                (o) => o.type === 'character' && o.char.id === char.id
              );
              const isFocused = optionIndex === focusedIndex;
              const isSelected = char.id === selectedCharacterId;

              return (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => onSelect(char.id, false)}
                  onMouseEnter={() => setFocusedIndex(optionIndex)}
                  className={cn(
                    'w-full flex items-center justify-between rounded-sm px-2 py-1.5 text-left transition-colors',
                    isFocused ? 'bg-brand-soft text-brand-strong' : 'text-ink hover:bg-surface-sunken'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar
                      src={char.imageUrl ?? undefined}
                      name={char.name}
                      size="sm"
                      className="h-5 w-5 text-[10px]"
                    />
                    <span className="font-semibold text-xs truncate uppercase tracking-wider">
                      {char.name}
                    </span>
                  </div>
                  {isSelected && <span className="text-[10px] text-brand font-semibold">Active</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* Section 2: Other Project Characters */}
        {otherList.length > 0 && (
          <div>
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-soft/70 flex items-center gap-1 border-t border-line/50 mt-1 pt-1.5">
              <Users className="h-3 w-3 text-ink-soft" /> Other Project Cast
            </div>
            {otherList.map((char) => {
              const optionIndex = flattenedOptions.findIndex(
                (o) => o.type === 'character' && o.char.id === char.id
              );
              const isFocused = optionIndex === focusedIndex;

              return (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => onSelect(char.id, true)}
                  onMouseEnter={() => setFocusedIndex(optionIndex)}
                  className={cn(
                    'w-full flex items-center justify-between rounded-sm px-2 py-1.5 text-left transition-colors',
                    isFocused ? 'bg-brand-soft text-brand-strong' : 'text-ink hover:bg-surface-sunken'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar
                      src={char.imageUrl ?? undefined}
                      name={char.name}
                      size="sm"
                      className="h-5 w-5 text-[10px]"
                    />
                    <span className="font-semibold text-xs truncate uppercase tracking-wider">
                      {char.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-ink-soft/70 border border-line px-1 rounded-xs">
                    + Add to Scene
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {inSceneList.length === 0 && otherList.length === 0 && (
          <div className="p-3 text-center text-[11px] text-ink-soft/70">
            No matching characters found.
          </div>
        )}
      </div>
    </div>
  );
}
