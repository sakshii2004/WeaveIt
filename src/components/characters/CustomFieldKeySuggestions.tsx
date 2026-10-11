'use client';

import * as React from 'react';
import { Sparkles } from 'lucide-react';

interface CustomFieldKeySuggestionsProps {
  genre?: string | null;
  existingKeys: string[];
  onSelectKey: (key: string) => void;
}

const FANTASY_SUGGESTIONS = ['Clan', 'Species', 'Powers', 'Rank', 'Weapon', 'Bloodline'];
const CONTEMPORARY_SUGGESTIONS = ['Occupation', 'Family', 'Education', 'Hobbies', 'Hometown'];
const GENERAL_SUGGESTIONS = ['Occupation', 'Secret', 'Quirk', 'Flaw', 'Affiliation', 'Motivation'];

export function CustomFieldKeySuggestions({
  genre,
  existingKeys,
  onSelectKey,
}: CustomFieldKeySuggestionsProps) {
  const suggestions = React.useMemo(() => {
    const g = (genre || '').toLowerCase();
    let baseList = GENERAL_SUGGESTIONS;

    if (g.includes('fantasy') || g.includes('sci-fi') || g.includes('science fiction') || g.includes('magic')) {
      baseList = FANTASY_SUGGESTIONS;
    } else if (
      g.includes('contemporary') ||
      g.includes('romance') ||
      g.includes('drama') ||
      g.includes('thriller') ||
      g.includes('mystery') ||
      g.includes('literary')
    ) {
      baseList = CONTEMPORARY_SUGGESTIONS;
    }

    const lowerExisting = new Set(existingKeys.map((k) => k.toLowerCase()));
    return baseList.filter((item) => !lowerExisting.has(item.toLowerCase()));
  }, [genre, existingKeys]);

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-ink-soft">
        <Sparkles className="h-3 w-3 text-story-sun-text" />
        <span>Suggestions</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelectKey(key)}
            className="text-xs inline-flex items-center rounded-full px-2 py-0.5 border border-line bg-surface-sunken hover:bg-surface-elevated hover:border-brand/40 text-ink-soft hover:text-ink transition-colors cursor-pointer"
          >
            + {key}
          </button>
        ))}
      </div>
    </div>
  );
}
