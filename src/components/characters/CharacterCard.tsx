'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Chip } from '@/components/ui/chip';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { MoreVertical, User, Trash2, ArrowUpRight } from 'lucide-react';
import type { Character } from '@/db/schema';

interface CharacterCardProps {
  character: Character;
  onOpenDetails: (character: Character) => void;
  onDelete: (character: Character) => void;
}

export function getRoleVariant(role: string): 'teal' | 'coral' | 'sun' | 'sky' | 'lavender' | 'mint' | 'rose' | 'slate' | 'brand' {
  switch (role) {
    case 'protagonist':
      return 'brand';
    case 'love_interest':
      return 'rose';
    case 'antagonist':
    case 'villain':
      return 'coral';
    case 'mentor':
      return 'sun';
    case 'supporting':
      return 'slate';
    case 'custom':
      return 'lavender';
    default:
      return 'slate';
  }
}

export function formatRoleLabel(character: Character): string {
  if (character.role === 'custom' && character.roleCustom) {
    return character.roleCustom;
  }
  switch (character.role) {
    case 'protagonist':
      return 'Protagonist';
    case 'love_interest':
      return 'Love Interest';
    case 'antagonist':
      return 'Antagonist';
    case 'villain':
      return 'Villain';
    case 'mentor':
      return 'Mentor';
    case 'supporting':
      return 'Supporting';
    case 'custom':
      return 'Custom';
    default:
      return character.role;
  }
}

export function CharacterCard({
  character,
  onOpenDetails,
  onDelete,
}: CharacterCardProps) {
  const roleVariant = getRoleVariant(character.role);
  const roleLabel = formatRoleLabel(character);

  return (
    <Card
      className="group relative flex flex-col justify-between overflow-hidden p-5 transition-all duration-[180ms] hover:border-brand/40 hover:shadow-md cursor-pointer text-left"
      onClick={() => onOpenDetails(character)}
    >
      <div className="space-y-3.5">
        {/* Top bar with Avatar, Role Chip, and Actions Menu */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar
              src={character.imageUrl}
              name={character.name}
              className="h-12 w-12 rounded-xl text-base shadow-xs border border-line shrink-0 object-cover"
            />
            <div className="min-w-0">
              <h3 className="font-semibold text-base text-ink group-hover:text-brand transition-colors truncate">
                {character.name}
              </h3>
              <div className="mt-1">
                <Chip variant={roleVariant} size="sm">
                  {roleLabel}
                </Chip>
              </div>
            </div>
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 -mr-1 -mt-1"
          >
            <DropdownMenu
              trigger={
                <button
                  type="button"
                  aria-label="Character options"
                  className="rounded-sm p-1.5 text-ink-soft hover:bg-surface-sunken hover:text-ink transition-colors cursor-pointer"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              }
              items={[
                {
                  label: 'View & Edit Profile',
                  icon: <User className="h-4 w-4" />,
                  onClick: () => onOpenDetails(character),
                },
                'separator',
                {
                  label: 'Move to Trash',
                  icon: <Trash2 className="h-4 w-4" />,
                  destructive: true,
                  onClick: () => onDelete(character),
                },
              ]}
            />
          </div>
        </div>

        {/* Short Bio / Description preview */}
        {character.description ? (
          <p className="text-xs font-serif text-ink-soft line-clamp-3 leading-relaxed">
            {character.description}
          </p>
        ) : (
          <p className="text-xs text-ink-soft/60 italic">
            No description yet. Click to flesh out goals, arc, and background.
          </p>
        )}
      </div>

      {/* Card Footer: Quick glance indicator */}
      <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-[11px] text-ink-soft">
        <span className="truncate">
          {character.goals ? `Goal: ${character.goals.substring(0, 32)}...` : 'Ready to develop'}
        </span>
        <span className="inline-flex items-center gap-0.5 text-brand group-hover:translate-x-0.5 transition-transform font-medium">
          Details <ArrowUpRight className="h-3 w-3" />
        </span>
      </div>
    </Card>
  );
}
