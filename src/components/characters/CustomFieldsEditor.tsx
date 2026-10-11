'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, ArrowUp, ArrowDown, Check, Loader2 } from 'lucide-react';
import { CustomFieldKeySuggestions } from './CustomFieldKeySuggestions';
import { replaceCustomFieldsAction } from '@/app/actions/characters';
import { useToast } from '@/components/ui/toast';
import type { CharacterCustomField } from '@/db/schema';

interface CustomFieldsEditorProps {
  characterId: string;
  initialFields: CharacterCustomField[];
  projectFieldKeys: string[];
  genre?: string | null;
  onFieldsUpdated?: (fields: CharacterCustomField[]) => void;
}

export function CustomFieldsEditor({
  characterId,
  initialFields,
  projectFieldKeys,
  genre,
  onFieldsUpdated,
}: CustomFieldsEditorProps) {
  const [fields, setFields] = React.useState<
    Array<{ id?: string; key: string; value: string; orderIndex: number }>
  >(
    initialFields.map((f, i) => ({
      id: f.id,
      key: f.key,
      value: f.value,
      orderIndex: f.orderIndex ?? i,
    }))
  );

  const [isSaving, setIsSaving] = React.useState(false);
  const [isSaved, setIsSaved] = React.useState(false);
  const { toast } = useToast();

  const [prevInitialFields, setPrevInitialFields] = React.useState(initialFields);

  if (initialFields !== prevInitialFields) {
    setPrevInitialFields(initialFields);
    setFields(
      initialFields.map((f, i) => ({
        id: f.id,
        key: f.key,
        value: f.value,
        orderIndex: f.orderIndex ?? i,
      }))
    );
  }

  const handleAddField = (suggestedKey = '') => {
    setFields((prev) => [
      ...prev,
      {
        key: suggestedKey,
        value: '',
        orderIndex: prev.length,
      },
    ]);
    setIsSaved(false);
  };

  const handleRemoveField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index).map((f, i) => ({ ...f, orderIndex: i })));
    setIsSaved(false);
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === fields.length - 1)) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    setFields((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy.map((f, i) => ({ ...f, orderIndex: i }));
    });
    setIsSaved(false);
  };

  const handleFieldChange = (index: number, keyOrValue: 'key' | 'value', text: string) => {
    setFields((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [keyOrValue]: text };
      return copy;
    });
    setIsSaved(false);
  };

  const handleSaveFields = async () => {
    // Validate empty keys
    const invalid = fields.some((f) => !f.key.trim());
    if (invalid) {
      toast({
        title: 'Missing field names',
        description: 'All custom attributes must have a name before saving.',
        variant: 'error',
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await replaceCustomFieldsAction(
        characterId,
        fields.map((f, i) => ({
          key: f.key.trim(),
          value: f.value,
          orderIndex: i,
        }))
      );

      if (!res.success) {
        toast({
          title: 'Failed to save attributes',
          description: res.error || 'Please check the values and try again.',
          variant: 'error',
        });
        return;
      }

      setIsSaved(true);
      if (res.data) {
        onFieldsUpdated?.(res.data);
      }
      setTimeout(() => setIsSaved(false), 2500);
    } catch {
      toast({
        title: 'Error saving fields',
        description: 'An unexpected error occurred.',
        variant: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const existingKeys = fields.map((f) => f.key);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
            Custom Attributes
          </h4>
          <p className="text-[11px] text-ink-soft">
            User-defined fields such as Clan, Powers, Occupation, etc.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSaved && (
            <span className="flex items-center gap-1 text-xs text-story-mint-text font-medium">
              <Check className="h-3.5 w-3.5" />
              Saved
            </span>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleSaveFields}
            disabled={isSaving || fields.length === 0}
            className="text-xs"
          >
            {isSaving ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : null}
            Save attributes
          </Button>
        </div>
      </div>

      {/* Field key autocomplete suggestions */}
      <CustomFieldKeySuggestions
        genre={genre}
        existingKeys={existingKeys}
        onSelectKey={(key) => handleAddField(key)}
      />

      {/* Datalist for autocomplete on field key inputs */}
      <datalist id={`project-keys-${characterId}`}>
        {projectFieldKeys.map((k) => (
          <option key={k} value={k} />
        ))}
      </datalist>

      {/* Field rows */}
      {fields.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line p-4 text-center">
          <p className="text-xs text-ink-soft mb-2">No custom attributes yet.</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleAddField()}
            className="text-xs"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add first attribute
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div
              key={field.id || `field-${index}`}
              className="flex items-center gap-2 rounded-md border border-line bg-surface p-2"
            >
              {/* Reorder buttons */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleMoveField(index, 'up')}
                  disabled={index === 0}
                  className="rounded p-0.5 text-ink-soft hover:text-ink disabled:opacity-20 cursor-pointer"
                  aria-label="Move up"
                >
                  <ArrowUp className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveField(index, 'down')}
                  disabled={index === fields.length - 1}
                  className="rounded p-0.5 text-ink-soft hover:text-ink disabled:opacity-20 cursor-pointer"
                  aria-label="Move down"
                >
                  <ArrowDown className="h-3 w-3" />
                </button>
              </div>

              {/* Attribute Key with Autocomplete */}
              <div className="w-1/3 min-w-[120px]">
                <Input
                  list={`project-keys-${characterId}`}
                  value={field.key}
                  onChange={(e) => handleFieldChange(index, 'key', e.target.value)}
                  placeholder="Attribute name"
                  className="h-8 text-xs font-medium"
                />
              </div>

              {/* Attribute Value */}
              <div className="flex-1">
                <Input
                  value={field.value}
                  onChange={(e) => handleFieldChange(index, 'value', e.target.value)}
                  placeholder="Value"
                  className="h-8 text-xs font-serif"
                />
              </div>

              {/* Remove */}
              <button
                type="button"
                onClick={() => handleRemoveField(index)}
                className="rounded p-1 text-ink-soft hover:text-coral hover:bg-coral-bg/20 transition-colors cursor-pointer shrink-0"
                aria-label="Remove attribute"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleAddField()}
            className="text-xs text-ink-soft hover:text-ink w-full justify-start mt-1"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add another attribute
          </Button>
        </div>
      )}
    </div>
  );
}
