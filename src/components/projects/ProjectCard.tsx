'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Chip } from '@/components/ui/chip';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { EditProjectDialog } from './EditProjectDialog';
import { softDeleteProjectAction } from '@/app/actions/projects';
import { useToast } from '@/components/ui/toast';
import { timeAgo } from '@/lib/utils';
import { MoreVertical, Clock, Layers, Trash2, Edit3, ArrowRight } from 'lucide-react';
import type { Project } from '@/db/schema';

// Deterministic story palette accent selector based on title/genre
const PALETTE_BARS: Record<string, string> = {
  teal: 'bg-story-teal-text',
  coral: 'bg-story-coral-text',
  sun: 'bg-story-sun-text',
  sky: 'bg-story-sky-text',
  lavender: 'bg-story-lavender-text',
  mint: 'bg-story-mint-text',
  rose: 'bg-story-rose-text',
  slate: 'bg-story-slate-text',
};

const PALETTE_KEYS = Object.keys(PALETTE_BARS);

function getAccentColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const key = PALETTE_KEYS[Math.abs(hash) % PALETTE_KEYS.length];
  return PALETTE_BARS[key];
}

export interface ProjectCardProps {
  project: Project & { sceneCount?: number };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = React.useState(false);

  const accentBarClass = getAccentColor(project.genre || project.title);
  const sceneCount = project.sceneCount ?? 0;

  const handleSoftDelete = async () => {
    const res = await softDeleteProjectAction(project.id);

    if (!res.success) {
      toast({
        title: 'Delete failed',
        description: res.error || 'Could not move project to trash',
        variant: 'error',
      });
      return;
    }

    toast({
      title: 'Moved to trash',
      description: `"${project.title}" has been moved to Recently Deleted.`,
      variant: 'info',
    });
    router.refresh();
  };

  return (
    <>
      <div className="group relative flex flex-col rounded-md border border-line bg-surface overflow-hidden shadow-xs transition-all duration-[180ms] hover:border-ink-soft/40 hover:shadow-sm hover:-translate-y-0.5">
        {/* Top Accent Story Color Bar */}
        <div className={`h-1.5 w-full ${accentBarClass}`} />

        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          {/* Card Header & Title */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <Link
                href={`/projects/${project.id}`}
                className="font-bold text-base tracking-tight text-ink hover:text-brand transition-colors line-clamp-1 group-hover:text-brand"
              >
                {project.title}
              </Link>

              <DropdownMenu
                align="right"
                trigger={
                  <button
                    type="button"
                    className="p-1 rounded-sm text-ink-soft hover:text-ink hover:bg-surface-sunken transition-colors"
                    aria-label="Project actions"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                }
                items={[
                  {
                    label: 'Open Project',
                    icon: <ArrowRight className="h-3.5 w-3.5" />,
                    onClick: () => router.push(`/projects/${project.id}`),
                  },
                  {
                    label: 'Edit Details',
                    icon: <Edit3 className="h-3.5 w-3.5" />,
                    onClick: () => setEditOpen(true),
                  },
                  'separator',
                  {
                    label: 'Move to Trash',
                    icon: <Trash2 className="h-3.5 w-3.5" />,
                    destructive: true,
                    onClick: handleSoftDelete,
                  },
                ]}
              />
            </div>

            {/* Genre Badge */}
            {project.genre && (
              <div>
                <Chip variant="teal" size="sm">
                  {project.genre}
                </Chip>
              </div>
            )}

            {/* Logline or calm prompt */}
            <p className="text-xs text-ink-soft line-clamp-2 leading-relaxed min-h-[2.5rem]">
              {project.logline || (
                <span className="italic text-ink-soft/60">
                  No logline set yet — add one anytime.
                </span>
              )}
            </p>
          </div>

          {/* Footer Metadata */}
          <div className="flex items-center justify-between pt-3 border-t border-line text-xs text-ink-soft">
            <span className="inline-flex items-center gap-1.5 font-medium text-ink">
              <Layers className="h-3.5 w-3.5 text-brand" strokeWidth={1.75} />
              {sceneCount} {sceneCount === 1 ? 'scene' : 'scenes'}
            </span>

            <span className="inline-flex items-center gap-1 text-[11px] text-ink-soft/80">
              <Clock className="h-3 w-3" strokeWidth={1.75} />
              Updated {timeAgo(project.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      <EditProjectDialog
        project={project}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
