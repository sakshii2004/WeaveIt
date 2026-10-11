'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Chip } from '@/components/ui/chip';
import { Avatar } from '@/components/ui/avatar';
import { Plus, Trash2, ArrowRight, ArrowLeftRight, Heart, Loader2 } from 'lucide-react';
import { createRelationshipAction, deleteRelationshipAction } from '@/app/actions/characters';
import { useToast } from '@/components/ui/toast';
import type { Character, Scene } from '@/db/schema';
import type { EnrichedRelationship } from '@/db/queries/characters';

interface RelationshipsListProps {
  projectId: string;
  character: Character;
  allCharacters: Character[];
  scenes: Scene[];
  initialRelationships: EnrichedRelationship[];
}

export function RelationshipsList({
  projectId,
  character,
  allCharacters,
  scenes,
  initialRelationships,
}: RelationshipsListProps) {
  const [relationships, setRelationships] = React.useState<EnrichedRelationship[]>(initialRelationships);
  const [isAdding, setIsAdding] = React.useState(false);
  const [targetId, setTargetId] = React.useState('');
  const [relType, setRelType] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [isDirected, setIsDirected] = React.useState(true);
  const [startSceneId, setStartSceneId] = React.useState('');
  const [endSceneId, setEndSceneId] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

  const [prevInitialRels, setPrevInitialRels] = React.useState(initialRelationships);

  if (initialRelationships !== prevInitialRels) {
    setPrevInitialRels(initialRelationships);
    setRelationships(initialRelationships);
  }

  // Candidates for target (exclude current character)
  const candidateCharacters = allCharacters.filter((c) => c.id !== character.id);

  const handleAddRelationship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId || !relType.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please select a character and specify a relationship type.',
        variant: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createRelationshipAction(projectId, {
        sourceCharacterId: character.id,
        targetCharacterId: targetId,
        type: relType.trim(),
        description: description.trim() || null,
        isDirected,
        startSceneId: startSceneId || null,
        endSceneId: endSceneId || null,
      });

      if (!res.success || !res.data) {
        toast({
          title: 'Could not add relationship',
          description: res.error || 'Please check your inputs.',
          variant: 'error',
        });
        return;
      }

      const target = candidateCharacters.find((c) => c.id === targetId);
      const enriched: EnrichedRelationship = {
        ...res.data,
        sourceCharacter: {
          id: character.id,
          name: character.name,
          role: character.role,
          imageUrl: character.imageUrl,
        },
        targetCharacter: {
          id: targetId,
          name: target?.name ?? 'Unknown',
          role: target?.role ?? 'supporting',
          imageUrl: target?.imageUrl ?? null,
        },
      };

      setRelationships((prev) => [enriched, ...prev]);
      setIsAdding(false);
      setTargetId('');
      setRelType('');
      setDescription('');
      setIsDirected(true);
      setStartSceneId('');
      setEndSceneId('');

      toast({
        title: 'Relationship added',
        description: `Connection with ${target?.name} created.`,
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while creating relationship.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRelationship = async (relId: string) => {
    try {
      const res = await deleteRelationshipAction(relId);
      if (!res.success) {
        toast({
          title: 'Failed to delete',
          description: res.error || 'Could not remove relationship.',
          variant: 'error',
        });
        return;
      }

      setRelationships((prev) => prev.filter((r) => r.id !== relId));
      toast({
        title: 'Relationship removed',
        variant: 'info',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Could not remove relationship.',
        variant: 'error',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
            Relationships
          </h4>
          <p className="text-[11px] text-ink-soft">
            Connections, dynamics, and loyalties with other characters.
          </p>
        </div>

        {!isAdding && candidateCharacters.length > 0 && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="text-xs"
          >
            <Plus className="mr-1.5 h-3 w-3" />
            Add relationship
          </Button>
        )}
      </div>

      {/* Add Relationship Form */}
      {isAdding && (
        <form
          onSubmit={handleAddRelationship}
          className="rounded-lg border border-brand/30 bg-surface-elevated p-3.5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink">New Relationship</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAdding(false)}
              className="text-xs text-ink-soft h-6 px-2"
            >
              Cancel
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Connected Character"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              required
            >
              <option value="">Select character...</option>
              {candidateCharacters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.roleCustom || c.role})
                </option>
              ))}
            </Select>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1.5">
                Relationship Type
              </label>
              <Input
                value={relType}
                onChange={(e) => setRelType(e.target.value)}
                placeholder="e.g. Rival, Mentor, Sister, Secret Ally"
                className="h-10 text-sm"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-ink font-medium flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!isDirected}
                onChange={(e) => setIsDirected(!e.target.checked)}
                className="rounded border-line text-brand focus:ring-brand h-4 w-4"
              />
              <span>Mutual / Two-way relationship (undirected)</span>
            </label>
          </div>

          {scenes.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Starts in Scene (Optional)"
                value={startSceneId}
                onChange={(e) => setStartSceneId(e.target.value)}
              >
                <option value="">None / Backstory</option>
                {scenes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </Select>

              <Select
                label="Ends in Scene (Optional)"
                value={endSceneId}
                onChange={(e) => setEndSceneId(e.target.value)}
              >
                <option value="">None / Ongoing</option>
                {scenes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1.5">
              Description / Dynamics (Optional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="How do they perceive each other? What tension exists?"
              rows={2}
              className="text-xs font-serif"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsAdding(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="text-xs">
              {isSubmitting ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : null}
              Save relationship
            </Button>
          </div>
        </form>
      )}

      {/* Relationships list */}
      {relationships.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line p-4 text-center">
          <Heart className="h-6 w-6 text-ink-soft/40 mx-auto mb-1.5" />
          <p className="text-xs text-ink-soft mb-1">No relationships recorded yet.</p>
          {candidateCharacters.length === 0 ? (
            <p className="text-[11px] text-ink-soft">Create more characters to connect them together.</p>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAdding(true)}
              className="text-xs mt-1"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add first relationship
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {relationships.map((rel) => {
            const isSource = rel.sourceCharacterId === character.id;
            const otherChar = isSource ? rel.targetCharacter : rel.sourceCharacter;

            return (
              <div
                key={rel.id}
                className="flex items-start justify-between rounded-md border border-line bg-surface p-2.5 transition-colors hover:border-ink-soft/30"
              >
                <div className="flex items-start gap-2.5">
                  <Avatar
                    src={otherChar.imageUrl}
                    name={otherChar.name}
                    className="h-7 w-7 text-[10px] shrink-0 mt-0.5"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-ink">{otherChar.name}</span>
                      {rel.isDirected ? (
                        <span className="inline-flex items-center text-[10px] text-ink-soft">
                          <ArrowRight className="h-3 w-3 mx-0.5" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] text-ink-soft">
                          <ArrowLeftRight className="h-3 w-3 mx-0.5" />
                        </span>
                      )}
                      <Chip variant="brand" size="sm">
                        {rel.type}
                      </Chip>
                    </div>

                    {rel.description && (
                      <p className="text-xs font-serif text-ink-soft line-clamp-2">
                        {rel.description}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteRelationship(rel.id)}
                  className="rounded p-1 text-ink-soft hover:text-coral transition-colors cursor-pointer shrink-0 ml-2"
                  aria-label="Remove relationship"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
