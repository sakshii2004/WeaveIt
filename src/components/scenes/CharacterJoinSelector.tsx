'use client';

import * as React from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Users, Search, Check } from 'lucide-react';
import type { Character } from '@/db/schema';

export interface CharacterJoinItem {
  characterId: string;
  roleInScene: string | null;
}

interface CharacterJoinSelectorProps {
  allCharacters: Character[];
  selectedCharacters: CharacterJoinItem[];
  onChange: (updated: CharacterJoinItem[]) => void;
}

export function CharacterJoinSelector({
  allCharacters,
  selectedCharacters,
  onChange,
}: CharacterJoinSelectorProps) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedMap = new Map(selectedCharacters.map((c) => [c.characterId, c]));

  const filteredCharacters = allCharacters.filter((char) =>
    char.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = (charId: string) => {
    if (selectedMap.has(charId)) {
      onChange(selectedCharacters.filter((c) => c.characterId !== charId));
    } else {
      onChange([...selectedCharacters, { characterId: charId, roleInScene: '' }]);
    }
  };

  const handleRoleChange = (charId: string, role: string) => {
    onChange(
      selectedCharacters.map((c) =>
        c.characterId === charId ? { ...c, roleInScene: role } : c
      )
    );
  };

  const handleRemove = (charId: string) => {
    onChange(selectedCharacters.filter((c) => c.characterId !== charId));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-brand" /> Characters in Scene
        </label>

        <div className="relative" ref={dropdownRef}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="h-7 text-xs gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> Add Cast
          </Button>

          {dropdownOpen && (
            <div className="absolute right-0 top-8 z-50 w-64 rounded-md border border-line bg-surface p-2 shadow-md animate-in fade-in zoom-in-95 duration-150">
              <div className="relative mb-2">
                <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-ink-soft" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter cast..."
                  className="w-full rounded-sm border border-line bg-surface-sunken py-1 pl-7 pr-2 text-xs text-ink placeholder:text-ink-soft focus:border-brand focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredCharacters.length === 0 ? (
                  <p className="p-2 text-center text-xs text-ink-soft">
                    {allCharacters.length === 0 ? 'No characters in project yet' : 'No matching characters'}
                  </p>
                ) : (
                  filteredCharacters.map((char) => {
                    const isSelected = selectedMap.has(char.id);
                    return (
                      <button
                        key={char.id}
                        type="button"
                        onClick={() => handleToggle(char.id)}
                        className={`flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-xs text-left transition-colors ${
                          isSelected
                            ? 'bg-brand-soft text-brand-strong font-medium'
                            : 'hover:bg-surface-sunken text-ink'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar name={char.name} src={char.imageUrl ?? undefined} size="sm" className="h-5 w-5 text-[10px]" />
                          <span className="truncate">{char.name}</span>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-brand" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Cast List */}
      {selectedCharacters.length === 0 ? (
        <div className="rounded-sm border border-dashed border-line bg-surface-sunken/50 p-3 text-center">
          <p className="text-xs text-ink-soft">No characters linked to this scene yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {selectedCharacters.map((sc) => {
            const char = allCharacters.find((c) => c.id === sc.characterId);
            const name = char ? char.name : 'Unknown Character';
            return (
              <div
                key={sc.characterId}
                className="flex items-center gap-2 rounded-sm border border-line bg-surface p-2 text-xs"
              >
                <Avatar name={name} src={char?.imageUrl ?? undefined} size="sm" className="h-6 w-6 text-[10px] shrink-0" />
                <span className="font-medium text-ink w-28 shrink-0 truncate">{name}</span>

                <Input
                  type="text"
                  value={sc.roleInScene || ''}
                  onChange={(e) => handleRoleChange(sc.characterId, e.target.value)}
                  placeholder="Role in scene (e.g. Confronts Arjun)"
                  className="h-7 text-xs flex-1 bg-surface-sunken"
                />

                <button
                  type="button"
                  onClick={() => handleRemove(sc.characterId)}
                  className="text-ink-soft hover:text-coral transition-colors p-1"
                  title="Remove character from scene"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
