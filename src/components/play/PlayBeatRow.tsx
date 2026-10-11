'use client';

import * as React from 'react';
import type { PlayBeat, BeatType } from '@/lib/validators/play';
import type { Character } from '@/db/schema';
import { SlashTypeMenu } from './SlashTypeMenu';
import { CharacterMentionMenu } from './CharacterMentionMenu';
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Trash2,
  User,
  MessageSquare,
  Clapperboard,
  FileText,
  Compass,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayBeatRowProps {
  beat: PlayBeat;
  index: number;
  totalBeats: number;
  allCharacters: Character[];
  sceneCharacterIds: string[];
  characterMap: Map<string, Character>;
  onUpdate: (updatedBeat: PlayBeat) => void;
  onDelete: (id: string) => void;
  onAddAfter: (id: string, type?: BeatType) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  onFocusPrevious?: (currentIndex: number) => void;
  onFocusNext?: (currentIndex: number) => void;
  onAssignCharacterToScene?: (characterId: string) => void;
  draggedIndex: number | null;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  autoFocus?: boolean;
}

const TYPE_ICONS: Record<BeatType, React.ElementType> = {
  dialogue: MessageSquare,
  action: Clapperboard,
  narrator_note: FileText,
  direction: Compass,
};

export const PlayBeatRow = React.forwardRef<HTMLDivElement, PlayBeatRowProps>(function PlayBeatRow(
  {
    beat,
    index,
    totalBeats,
    allCharacters,
    sceneCharacterIds,
    characterMap,
    onUpdate,
    onDelete,
    onAddAfter,
    onMove,
    onFocusPrevious,
    onAssignCharacterToScene,
    draggedIndex,
    onDragStart,
    onDragOver,
    onDragEnd,
    autoFocus,
  },
  ref
) {
  const [slashMenuOpen, setSlashMenuOpen] = React.useState(false);
  const [characterMenuOpen, setCharacterMenuOpen] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const speakingCharacter = beat.characterId ? characterMap.get(beat.characterId) : null;
  const TypeIcon = TYPE_ICONS[beat.type] || Clapperboard;

  // Auto-resize textarea
  const adjustHeight = React.useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(38, textareaRef.current.scrollHeight)}px`;
    }
  }, []);

  React.useEffect(() => {
    adjustHeight();
  }, [beat.text, adjustHeight]);

  React.useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
      // Place cursor at end
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 1. Enter without Shift: create next beat
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // If we just finished a dialogue, default next beat to dialogue or action
      const nextType: BeatType = beat.type === 'dialogue' ? 'dialogue' : 'action';
      onAddAfter(beat.id, nextType);
      return;
    }

    // 2. Backspace on empty text: delete this beat
    if (e.key === 'Backspace' && !beat.text) {
      e.preventDefault();
      onDelete(beat.id);
      if (index > 0) {
        onFocusPrevious?.(index);
      }
      return;
    }

    // 3. Tab: switch beat type
    if (e.key === 'Tab') {
      e.preventDefault();
      setSlashMenuOpen((prev) => !prev);
      return;
    }

    // 4. Alt+Up / Alt+Down: reorder beat
    if (e.altKey && e.key === 'ArrowUp') {
      e.preventDefault();
      if (index > 0) onMove(index, index - 1);
      return;
    }
    if (e.altKey && e.key === 'ArrowDown') {
      e.preventDefault();
      if (index < totalBeats - 1) onMove(index, index + 1);
      return;
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;

    // Check if user just typed slash command trigger
    if (val === '/') {
      setSlashMenuOpen(true);
      return;
    }

    // Check if user typed @ for character autocomplete in dialogue
    if (beat.type === 'dialogue' && val.endsWith('@')) {
      setCharacterMenuOpen(true);
      return;
    }

    onUpdate({ ...beat, text: val });
  };

  const handleSelectType = (newType: BeatType) => {
    setSlashMenuOpen(false);
    // If text was just '/', clear it
    const cleanText = beat.text === '/' ? '' : beat.text;
    onUpdate({ ...beat, type: newType, text: cleanText });
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleSelectCharacter = (charId: string | null, shouldAddToScene?: boolean) => {
    setCharacterMenuOpen(false);
    onUpdate({ ...beat, characterId: charId });
    if (charId && shouldAddToScene) {
      onAssignCharacterToScene?.(charId);
    }
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const isDraggingThis = draggedIndex === index;

  return (
    <div
      ref={ref}
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      className={cn(
        'group relative rounded-md border border-transparent transition-all p-2.5 sm:p-3',
        'hover:border-line hover:bg-surface-sunken/40',
        isDraggingThis && 'opacity-40 border-dashed border-brand bg-brand-soft/20',
        beat.type === 'narrator_note' && 'border-l-4 border-l-story-sun-border bg-surface-sunken/30',
        beat.type === 'direction' && 'bg-surface/50'
      )}
    >
      {/* Beat Header Bar: Drag Handle, Type Indicator, Actions */}
      <div className="flex items-center justify-between pb-1.5 text-xs text-ink-soft select-none">
        <div className="flex items-center gap-1.5">
          {/* Drag Handle */}
          <div
            className="cursor-grab active:cursor-grabbing p-0.5 text-ink-soft/40 hover:text-ink transition-colors"
            title="Drag to reorder beat"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </div>

          {/* Type Switcher Trigger Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSlashMenuOpen((prev) => !prev)}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[11px] font-medium bg-surface-sunken border border-line hover:border-brand hover:text-brand transition-colors"
              title="Click or press Tab to switch beat type"
            >
              <TypeIcon className="h-3 w-3" />
              <span className="capitalize">{beat.type.replace('_', ' ')}</span>
            </button>

            {slashMenuOpen && (
              <SlashTypeMenu
                currentType={beat.type}
                onSelect={handleSelectType}
                onClose={() => setSlashMenuOpen(false)}
              />
            )}
          </div>

          {/* Dialogue: Speaker Badge */}
          {beat.type === 'dialogue' && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setCharacterMenuOpen((prev) => !prev)}
                className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-bold tracking-wider uppercase transition-colors',
                  speakingCharacter
                    ? 'bg-brand-soft text-brand-strong border border-brand/30 hover:border-brand'
                    : 'bg-surface-sunken text-ink-soft/70 border border-dashed border-line hover:text-ink'
                )}
                title="Click or type @ to assign character"
              >
                <User className="h-3 w-3" />
                <span>{speakingCharacter ? speakingCharacter.name : 'Assign Speaker (@)'}</span>
              </button>

              {characterMenuOpen && (
                <CharacterMentionMenu
                  sceneCharacterIds={sceneCharacterIds}
                  allCharacters={allCharacters}
                  selectedCharacterId={beat.characterId ?? null}
                  onSelect={handleSelectCharacter}
                  onClose={() => setCharacterMenuOpen(false)}
                />
              )}
            </div>
          )}
        </div>

        {/* Right Action Bar (visible on hover or focus) */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
          {/* Accessible Reorder: Move Up */}
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(index, index - 1)}
            className="p-1 rounded-sm text-ink-soft hover:text-ink hover:bg-surface disabled:opacity-30 disabled:pointer-events-none"
            title="Move beat up (Alt+↑)"
            aria-label="Move beat up"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>

          {/* Accessible Reorder: Move Down */}
          <button
            type="button"
            disabled={index === totalBeats - 1}
            onClick={() => onMove(index, index + 1)}
            className="p-1 rounded-sm text-ink-soft hover:text-ink hover:bg-surface disabled:opacity-30 disabled:pointer-events-none"
            title="Move beat down (Alt+↓)"
            aria-label="Move beat down"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>

          {/* Delete Beat */}
          <button
            type="button"
            onClick={() => onDelete(beat.id)}
            className="p-1 rounded-sm text-ink-soft hover:text-coral hover:bg-surface"
            title="Delete beat (Backspace on empty line)"
            aria-label="Delete beat"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Beat Writing Surface Body (Screenplay Typography & Margins) */}
      <div
        className={cn(
          'w-full',
          beat.type === 'dialogue' && 'max-w-xl mx-auto px-4 sm:px-8 text-center',
          beat.type === 'direction' && 'max-w-md mx-auto italic text-center',
          beat.type === 'narrator_note' && 'pl-2 text-ink-soft'
        )}
      >
        {/* Dialogue Screenplay Header: Character Name in Small Caps */}
        {beat.type === 'dialogue' && speakingCharacter && (
          <div className="text-[12px] font-bold font-mono tracking-widest uppercase text-ink pb-1">
            {speakingCharacter.name}
          </div>
        )}

        {/* Beat Textarea */}
        <textarea
          ref={textareaRef}
          value={beat.text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={
            beat.type === 'dialogue'
              ? 'Dialogue line... (Press Enter for next beat)'
              : beat.type === 'action'
                ? 'Describe physical action, movement, or atmosphere...'
                : beat.type === 'direction'
                  ? '(parenthetical emotion or delivery direction)'
                  : 'Narrator observation or internal realization...'
          }
          rows={1}
          className={cn(
            'w-full resize-none overflow-hidden bg-transparent font-mono text-ink placeholder:text-ink-soft/40 focus:outline-none transition-colors leading-relaxed',
            beat.type === 'dialogue' && 'text-sm text-center font-normal',
            beat.type === 'action' && 'text-sm text-left',
            beat.type === 'direction' && 'text-xs text-center italic text-ink-soft',
            beat.type === 'narrator_note' && 'text-xs text-left italic leading-relaxed'
          )}
        />
      </div>
    </div>
  );
});
