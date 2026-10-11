'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { CharacterCard } from './CharacterCard';
import { CreateCharacterDialog } from './CreateCharacterDialog';
import { CharacterDetailDrawer } from './CharacterDetailDrawer';
import { Plus, Users, Search, Undo2 } from 'lucide-react';
import { softDeleteCharacterAction, restoreCharacterAction } from '@/app/actions/characters';
import { useToast } from '@/components/ui/toast';
import type { Character, CharacterCustomField, Scene } from '@/db/schema';
import type { EnrichedRelationship } from '@/db/queries/characters';

interface CharacterGridProps {
  projectId: string;
  genre?: string | null;
  initialCharacters: Character[];
  scenes: Scene[];
  allFieldsMap: Record<string, CharacterCustomField[]>;
  allRelationshipsMap: Record<string, EnrichedRelationship[]>;
  projectFieldKeys: string[];
}

export function CharacterGrid({
  projectId,
  genre,
  initialCharacters,
  scenes,
  allFieldsMap,
  allRelationshipsMap,
  projectFieldKeys,
}: CharacterGridProps) {
  const [characters, setCharacters] = React.useState<Character[]>(initialCharacters);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = React.useState<string>('all');

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [activeCharacterId, setActiveCharacterId] = React.useState<string | null>(null);

  const { toast } = useToast();

  const [prevInitial, setPrevInitial] = React.useState<Character[]>(initialCharacters);

  if (initialCharacters !== prevInitial) {
    setPrevInitial(initialCharacters);
    setCharacters(initialCharacters);
  }

  const activeCharacter = React.useMemo(() => {
    if (!activeCharacterId) return null;
    return characters.find((c) => c.id === activeCharacterId) ?? null;
  }, [activeCharacterId, characters]);

  // Filtering
  const filteredCharacters = React.useMemo(() => {
    return characters.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.roleCustom && c.roleCustom.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRole =
        selectedRoleFilter === 'all' ||
        c.role === selectedRoleFilter ||
        (selectedRoleFilter === 'antagonist_villain' && (c.role === 'antagonist' || c.role === 'villain'));

      return matchesSearch && matchesRole;
    });
  }, [characters, searchQuery, selectedRoleFilter]);

  const handleCharacterCreated = (newChar: Character) => {
    setCharacters((prev) => [newChar, ...prev]);
    setActiveCharacterId(newChar.id);
  };

  const handleCharacterUpdated = (updated: Character) => {
    setCharacters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleDeleteCharacter = async (char: Character) => {
    // Optimistically remove from view
    setCharacters((prev) => prev.filter((c) => c.id !== char.id));
    if (activeCharacterId === char.id) {
      setActiveCharacterId(null);
    }

    try {
      const res = await softDeleteCharacterAction(char.id);
      if (!res.success) {
        setCharacters((prev) => [char, ...prev]);
        toast({
          title: 'Could not delete character',
          description: res.error || 'Please try again.',
          variant: 'error',
        });
        return;
      }

      // Show Undo Toast
      toast({
        title: 'Character deleted',
        description: `${char.name} moved to trash.`,
        action: (
          <Button
            size="sm"
            variant="secondary"
            onClick={async () => {
              const restoreRes = await restoreCharacterAction(char.id);
              if (restoreRes.success && restoreRes.data) {
                setCharacters((prev) => [...prev, restoreRes.data!]);
                toast({
                  title: 'Character restored',
                  description: `${char.name} has been recovered.`,
                  variant: 'success',
                });
              }
            }}
            className="h-7 text-xs"
          >
            <Undo2 className="mr-1 h-3 w-3" />
            Undo
          </Button>
        ),
      });
    } catch {
      setCharacters((prev) => [char, ...prev]);
      toast({
        title: 'Error',
        description: 'Failed to delete character.',
        variant: 'error',
      });
    }
  };

  const rolePillOptions = [
    { id: 'all', label: 'All Roles' },
    { id: 'protagonist', label: 'Protagonists' },
    { id: 'antagonist_villain', label: 'Antagonists / Villains' },
    { id: 'love_interest', label: 'Love Interests' },
    { id: 'mentor', label: 'Mentors' },
    { id: 'supporting', label: 'Supporting' },
  ];

  return (
    <div className="space-y-6">
      {/* Top action bar: Search, Role filter, Add character button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft pointer-events-none" />
            <Input
              placeholder="Search cast by name, role, or bio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="shrink-0 h-9 text-xs"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add character
        </Button>
      </div>

      {/* Role filter chips */}
      {characters.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {rolePillOptions.map((opt) => {
            const isSelected = selectedRoleFilter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedRoleFilter(opt.id)}
                className={`text-xs px-3 py-1 rounded-full border transition-all whitespace-nowrap cursor-pointer select-none ${
                  isSelected
                    ? 'bg-brand text-white border-brand font-medium shadow-xs'
                    : 'bg-surface-sunken text-ink-soft border-line hover:text-ink hover:border-ink-soft/40'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Grid or Empty State */}
      {characters.length === 0 ? (
        <EmptyState
          icon={<Users className="h-10 w-10 text-brand" />}
          title="Your cast is waiting"
          description="Create your first character — even a name and a role is enough to start shaping your world."
          actionLabel="Add your first character"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : filteredCharacters.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-10 text-center space-y-2">
          <p className="text-sm text-ink-soft">No characters match your search or filter.</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedRoleFilter('all');
            }}
            className="text-xs"
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCharacters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              onOpenDetails={(char) => setActiveCharacterId(char.id)}
              onDelete={handleDeleteCharacter}
            />
          ))}
        </div>
      )}

      {/* Modals & Drawers */}
      <CreateCharacterDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        projectId={projectId}
        onCharacterCreated={handleCharacterCreated}
      />

      {activeCharacter && (
        <CharacterDetailDrawer
          key={activeCharacter.id}
          open={Boolean(activeCharacterId)}
          onOpenChange={(open) => {
            if (!open) setActiveCharacterId(null);
          }}
          character={activeCharacter}
          projectId={projectId}
          genre={genre}
          allCharacters={characters}
          scenes={scenes}
          initialFields={allFieldsMap[activeCharacter.id] ?? []}
          initialRelationships={allRelationshipsMap[activeCharacter.id] ?? []}
          projectFieldKeys={projectFieldKeys}
          onCharacterUpdated={handleCharacterUpdated}
          onCharacterDeleted={(id) => {
            setCharacters((prev) => prev.filter((c) => c.id !== id));
            setActiveCharacterId(null);
          }}
        />
      )}
    </div>
  );
}
