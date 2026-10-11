'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Chip } from '@/components/ui/chip';
import { CharacterImageUpload } from './CharacterImageUpload';
import { CustomFieldsEditor } from './CustomFieldsEditor';
import { RelationshipsList } from './RelationshipsList';
import { getRoleVariant, formatRoleLabel } from './CharacterCard';
import { updateCharacterAction, softDeleteCharacterAction } from '@/app/actions/characters';
import { useToast } from '@/components/ui/toast';
import {
  Check,
  Loader2,
  Trash2,
  X,
  SlidersHorizontal,
  Heart,
  BookOpen,
} from 'lucide-react';
import type { Character, CharacterCustomField, Scene } from '@/db/schema';
import type { EnrichedRelationship } from '@/db/queries/characters';

interface CharacterDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  character: Character | null;
  projectId: string;
  genre?: string | null;
  allCharacters: Character[];
  scenes: Scene[];
  initialFields: CharacterCustomField[];
  initialRelationships: EnrichedRelationship[];
  projectFieldKeys: string[];
  onCharacterUpdated?: (updated: Character) => void;
  onCharacterDeleted?: (id: string) => void;
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

type StudioTab = 'profile' | 'attributes' | 'relationships';

function getInitialFormData(char: Character | null) {
  return {
    name: char?.name ?? '',
    role: char?.role ?? 'supporting',
    roleCustom: char?.roleCustom ?? '',
    imageUrl: char?.imageUrl ?? '',
    description: char?.description ?? '',
    personality: char?.personality ?? '',
    goals: char?.goals ?? '',
    fears: char?.fears ?? '',
    background: char?.background ?? '',
    arc: char?.arc ?? '',
  };
}

export function CharacterDetailDrawer({
  open,
  onOpenChange,
  character,
  projectId,
  genre,
  allCharacters,
  scenes,
  initialFields,
  initialRelationships,
  projectFieldKeys,
  onCharacterUpdated,
  onCharacterDeleted,
}: CharacterDetailDrawerProps) {
  const [activeTab, setActiveTab] = React.useState<StudioTab>('profile');
  const [formData, setFormData] = React.useState(() => getInitialFormData(character));

  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isDeleting, setIsDeleting] = React.useState(false);
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const [prevCharacterId, setPrevCharacterId] = React.useState<string | null>(character?.id ?? null);

  if (character && character.id !== prevCharacterId) {
    setPrevCharacterId(character.id);
    setFormData(getInitialFormData(character));
    setSaveStatus('idle');
  }

  // Prevent background scroll and listen to Esc
  React.useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  // Debounced autosave
  const triggerAutosave = React.useCallback(
    (data: typeof formData) => {
      if (!character) return;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      setSaveStatus('saving');
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const res = await updateCharacterAction(character.id, {
            name: data.name.trim() || character.name,
            role: data.role,
            roleCustom: data.role === 'custom' ? data.roleCustom.trim() || null : null,
            imageUrl: data.imageUrl || null,
            description: data.description.trim() || null,
            personality: data.personality.trim() || null,
            goals: data.goals.trim() || null,
            fears: data.fears.trim() || null,
            background: data.background.trim() || null,
            arc: data.arc.trim() || null,
          });

          if (res.success && res.data) {
            setSaveStatus('saved');
            onCharacterUpdated?.(res.data);
            setTimeout(() => setSaveStatus('idle'), 2500);
          } else {
            setSaveStatus('error');
          }
        } catch {
          setSaveStatus('error');
        }
      }, 800);
    },
    [character, onCharacterUpdated]
  );

  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      triggerAutosave(next);
      return next;
    });
  };

  const handleImageUploaded = (url: string) => {
    handleFieldChange('imageUrl', url);
  };

  const handleDelete = async () => {
    if (!character) return;
    setIsDeleting(true);
    try {
      const res = await softDeleteCharacterAction(character.id);
      if (res.success) {
        toast({
          title: 'Character moved to trash',
          description: `${character.name} has been soft-deleted.`,
          variant: 'info',
        });
        onCharacterDeleted?.(character.id);
        onOpenChange(false);
      } else {
        toast({
          title: 'Failed to delete',
          description: res.error || 'Could not delete character.',
          variant: 'error',
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (!open || !character) return null;

  const roleVariant = getRoleVariant(formData.role);
  const roleLabel = formatRoleLabel({ ...character, role: formData.role, roleCustom: formData.roleCustom });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 lg:p-6">
      {/* Grounded Studio Backdrop */}
      <div
        className="fixed inset-0 bg-ink/50 backdrop-blur-xs transition-opacity duration-200"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Centered Permanent Character Workspace */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="character-studio-title"
        className="relative z-10 flex flex-col w-full max-w-5xl h-[90vh] max-h-[920px] rounded-xl bg-surface border border-line shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Studio Header Bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface/95 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-ink-soft uppercase tracking-wider">
                Character Studio
              </span>
              <span className="text-ink-soft/40">/</span>
              <h2 id="character-studio-title" className="text-base font-bold text-ink truncate">
                {formData.name || 'Untitled Character'}
              </h2>
            </div>

            <Chip variant={roleVariant} size="sm">
              {roleLabel}
            </Chip>

            {saveStatus === 'saving' && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-ink-soft ml-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-story-mint-text font-medium ml-2">
                <Check className="h-3.5 w-3.5" />
                Saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="hidden sm:inline text-xs text-coral font-medium ml-2">
                Save failed
              </span>
            )}
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs gap-1.5 font-medium"
            >
              <span>Close</span>
              <kbd className="hidden sm:inline-block rounded bg-surface-sunken border border-line px-1 text-[10px] text-ink-soft">
                Esc
              </kbd>
              <X className="h-3.5 w-3.5 ml-0.5" />
            </Button>
          </div>
        </header>

        {/* Studio Body - 2 Columns */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left Column: Dossier Identity & Section Selector */}
          <aside className="w-full md:w-72 lg:w-80 border-b md:border-b-0 md:border-r border-line bg-surface-sunken/40 p-5 sm:p-6 flex flex-col justify-between overflow-y-auto shrink-0 space-y-6">
            <div className="space-y-6">
              {/* Portrait Uploader */}
              <div className="flex justify-center sm:justify-start">
                <CharacterImageUpload
                  projectId={projectId}
                  characterId={character.id}
                  characterName={formData.name}
                  currentImageUrl={formData.imageUrl}
                  onUploaded={handleImageUploaded}
                />
              </div>

              {/* Core Name & Role Inputs */}
              <div className="space-y-3.5">
                <Input
                  label="Character Name"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="e.g. Evelyn Cross"
                  className="font-semibold text-sm"
                  required
                />

                <Select
                  label="Story Role"
                  value={formData.role}
                  onChange={(e) => handleFieldChange('role', e.target.value)}
                  options={ROLE_OPTIONS}
                />

                {formData.role === 'custom' && (
                  <Input
                    label="Custom Role Title"
                    value={formData.roleCustom}
                    onChange={(e) => handleFieldChange('roleCustom', e.target.value)}
                    placeholder="e.g. Deckhand, Shadow King"
                    required
                  />
                )}
              </div>

              {/* Dossier Navigation Tabs */}
              <div className="space-y-1.5 pt-2 border-t border-line">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft block mb-1">
                  Workspace Sections
                </span>

                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === 'profile'
                      ? 'bg-surface text-brand shadow-xs border border-line font-semibold'
                      : 'text-ink-soft hover:bg-surface-sunken hover:text-ink'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span>Story Profile</span>
                  </div>
                  <span className="text-[10px] text-ink-soft/70">Bio & Arc</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('attributes')}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === 'attributes'
                      ? 'bg-surface text-brand shadow-xs border border-line font-semibold'
                      : 'text-ink-soft hover:bg-surface-sunken hover:text-ink'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span>Attributes</span>
                  </div>
                  <span className="text-[10px] rounded-full bg-surface-sunken px-2 py-0.5 text-ink-soft border border-line">
                    {initialFields.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('relationships')}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === 'relationships'
                      ? 'bg-surface text-brand shadow-xs border border-line font-semibold'
                      : 'text-ink-soft hover:bg-surface-sunken hover:text-ink'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    <span>Relationships</span>
                  </div>
                  <span className="text-[10px] rounded-full bg-surface-sunken px-2 py-0.5 text-ink-soft border border-line">
                    {initialRelationships.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="pt-4 border-t border-line">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full text-xs text-ink-soft hover:text-coral hover:bg-coral-bg/20 justify-start"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Move character to trash
              </Button>
            </div>
          </aside>

          {/* Right Column: Active Canvas */}
          <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-surface space-y-6">
            {activeTab === 'profile' && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h3 className="text-base font-bold text-ink">Story Profile</h3>
                  <p className="text-xs text-ink-soft mt-0.5">
                    Flesh out their motivations, internal wounds, and narrative trajectory.
                  </p>
                </div>

                {/* Appearance / Description */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1.5">
                    Physical Appearance & First Impression
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    placeholder="Physical traits, noticeable mannerisms, clothing, presence upon entering a room..."
                    rows={3}
                    className="font-serif text-sm leading-relaxed"
                  />
                </div>

                {/* Personality & Mannerisms */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1.5">
                    Personality & Voice
                  </label>
                  <Textarea
                    value={formData.personality}
                    onChange={(e) => handleFieldChange('personality', e.target.value)}
                    placeholder="Temperament, speech quirks, defensive mechanisms, moral boundaries..."
                    rows={3}
                    className="font-serif text-sm leading-relaxed"
                  />
                </div>

                {/* Goals vs Fears (Crucial dynamic) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-story-teal-border/50 bg-story-teal-bg/10 p-4 space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-story-teal-text">
                      Core Goal (External & Internal)
                    </label>
                    <Textarea
                      value={formData.goals}
                      onChange={(e) => handleFieldChange('goals', e.target.value)}
                      placeholder="What tangible goal do they chase? What deeper validation do they seek?"
                      rows={4}
                      className="font-serif text-sm leading-relaxed bg-surface"
                    />
                  </div>

                  <div className="rounded-xl border border-story-coral-border/50 bg-story-coral-bg/10 p-4 space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-story-coral-text">
                      Fears & Fatal Flaw
                    </label>
                    <Textarea
                      value={formData.fears}
                      onChange={(e) => handleFieldChange('fears', e.target.value)}
                      placeholder="What terrifying truth do they avoid? What blind spot could ruin them?"
                      rows={4}
                      className="font-serif text-sm leading-relaxed bg-surface"
                    />
                  </div>
                </div>

                {/* Backstory */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1.5">
                    Backstory & Origin
                  </label>
                  <Textarea
                    value={formData.background}
                    onChange={(e) => handleFieldChange('background', e.target.value)}
                    placeholder="Formative past events, mentors, betrayals, and upbringing that shaped their present worldview..."
                    rows={4}
                    className="font-serif text-sm leading-relaxed"
                  />
                </div>

                {/* Character Arc */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1.5">
                    Transformation Arc
                  </label>
                  <Textarea
                    value={formData.arc}
                    onChange={(e) => handleFieldChange('arc', e.target.value)}
                    placeholder="Who are they in Act I versus who they must become (or tragic downfall) by Act III..."
                    rows={4}
                    className="font-serif text-sm leading-relaxed"
                  />
                </div>
              </div>
            )}

            {activeTab === 'attributes' && (
              <div className="max-w-3xl space-y-4">
                <CustomFieldsEditor
                  characterId={character.id}
                  initialFields={initialFields}
                  projectFieldKeys={projectFieldKeys}
                  genre={genre}
                />
              </div>
            )}

            {activeTab === 'relationships' && (
              <div className="max-w-3xl space-y-4">
                <RelationshipsList
                  projectId={projectId}
                  character={character}
                  allCharacters={allCharacters}
                  scenes={scenes}
                  initialRelationships={initialRelationships}
                />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
