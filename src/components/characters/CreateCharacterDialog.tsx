'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { createCharacterAction } from '@/app/actions/characters';
import { useToast } from '@/components/ui/toast';
import { Loader2 } from 'lucide-react';
import type { Character } from '@/db/schema';

interface CreateCharacterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onCharacterCreated?: (character: Character) => void;
}

const ROLE_OPTIONS = [
  { value: 'protagonist', label: 'Protagonist' },
  { value: 'love_interest', label: 'Love Interest' },
  { value: 'antagonist', label: 'Antagonist' },
  { value: 'villain', label: 'Villain' },
  { value: 'supporting', label: 'Supporting' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'custom', label: 'Custom Role...' },
];

export function CreateCharacterDialog({
  open,
  onOpenChange,
  projectId,
  onCharacterCreated,
}: CreateCharacterDialogProps) {
  const [name, setName] = React.useState('');
  const [role, setRole] = React.useState('protagonist');
  const [roleCustom, setRoleCustom] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  const { toast } = useToast();

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setName('');
      setRole('protagonist');
      setRoleCustom('');
      setDescription('');
      setFieldErrors({});
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    if (!name.trim()) {
      setFieldErrors({ name: ['Character name is required'] });
      return;
    }

    if (role === 'custom' && !roleCustom.trim()) {
      setFieldErrors({ roleCustom: ['Please specify a custom role title'] });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createCharacterAction(projectId, {
        name: name.trim(),
        role,
        roleCustom: role === 'custom' ? roleCustom.trim() : null,
        description: description.trim() || null,
      });

      if (!res.success || !res.data) {
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
        toast({
          title: 'Could not create character',
          description: res.error || 'Please check the form and try again.',
          variant: 'error',
        });
        return;
      }

      toast({
        title: 'Character created',
        description: `${res.data.name} has been added to your cast.`,
        variant: 'success',
      });

      onCharacterCreated?.(res.data);
      handleOpenChange(false);
    } catch {
      toast({
        title: 'Unexpected error',
        description: 'Failed to create character. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      maxWidth="2xl"
      preventOutsideClick={Boolean(name.trim() || description.trim())}
    >
      <DialogContent onClose={() => handleOpenChange(false)} className="max-w-2xl p-6 sm:p-7">
        <DialogHeader className="mb-5 pb-3 border-b border-line">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-xl font-bold text-ink">Add Character</DialogTitle>
            <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-[11px] font-semibold text-ink-soft border border-line">
              Cast Studio
            </span>
          </div>
          <DialogDescription className="text-xs text-ink-soft">
            Introduce a living figure into your story universe. Define their identity, core archetype, and initial background lore.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Character Name"
              placeholder="e.g. Luke Castellan, Jane Eyre, Detective Miller"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={fieldErrors.name?.[0]}
              required
              autoFocus
              className="text-sm font-semibold"
            />

            <Select
              label="Role in Story"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={ROLE_OPTIONS}
            />
          </div>

          {role === 'custom' && (
            <Input
              label="Custom Role Label"
              placeholder="e.g. Reluctant Companion, Spymaster, Enigmatic Guide"
              value={roleCustom}
              onChange={(e) => setRoleCustom(e.target.value)}
              error={fieldErrors.roleCustom?.[0]}
              required
            />
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Character Background, Voice &amp; Physical Presence
              </label>
              <span className="text-[11px] font-mono text-ink-soft/70">
                Source Serif 4 · {description.trim().length > 0 ? `${description.trim().split(/\s+/).length} words` : '0 words'}
              </span>
            </div>
            <Textarea
              placeholder="A disgraced navigator seeking redemption in the uncharted outer rim. Speaks in low, measured cadences, guarding a ledger of coordinates that could ignite a war..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="font-serif text-[16px] leading-relaxed bg-surface-sunken/40 focus:bg-surface border-line min-h-[140px] resize-y p-3.5"
            />
            <p className="text-[11px] text-ink-soft/70">
              Feel free to note personality traits, speech patterns, physical marks, or internal conflicts.
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-line">
            <span className="text-[11px] text-ink-soft hidden sm:inline-block">
              Press <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-surface-sunken rounded border border-line">Enter</kbd> to submit
            </span>

            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="text-xs">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Character'
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
