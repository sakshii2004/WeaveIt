'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Drawer } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { restoreProjectAction } from '@/app/actions/projects';
import { DeleteProjectDialog } from './DeleteProjectDialog';
import { RotateCcw, Trash2, Archive, Loader2 } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import type { Project } from '@/db/schema';

export interface RecentlyDeletedDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deletedProjects: Project[];
}

export function RecentlyDeletedDrawer({
  open,
  onOpenChange,
  deletedProjects,
}: RecentlyDeletedDrawerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [restoringId, setRestoringId] = React.useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = React.useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const handleRestore = async (project: Project) => {
    setRestoringId(project.id);
    const res = await restoreProjectAction(project.id);
    setRestoringId(null);

    if (!res.success) {
      toast({
        title: 'Restore failed',
        description: res.error || 'Could not restore project',
        variant: 'error',
      });
      return;
    }

    toast({
      title: 'Project restored',
      description: `"${project.title}" has been restored to your dashboard.`,
      variant: 'success',
    });

    router.refresh();
  };

  const openPermanentDelete = (project: Project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
        side="right"
        title="Recently Deleted"
        description="Soft-deleted novels. Restore them to your dashboard or delete them permanently."
      >
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {deletedProjects.length === 0 ? (
            <div className="py-12">
              <EmptyState
                title="Trash is empty"
                description="No projects have been deleted. Deleted novels will be kept here until you choose to remove them permanently."
                icon={<Archive className="h-6 w-6 text-ink-soft" />}
              />
            </div>
          ) : (
            deletedProjects.map((p) => (
              <div
                key={p.id}
                className="rounded-md border border-line bg-surface-sunken p-4 space-y-3 transition-colors hover:border-ink-soft/40"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-ink truncate">{p.title}</h4>
                    {p.genre && (
                      <Chip variant="default" size="sm">
                        {p.genre}
                      </Chip>
                    )}
                  </div>
                  {p.logline && (
                    <p className="text-xs text-ink-soft line-clamp-2">{p.logline}</p>
                  )}
                  <p className="text-[11px] text-ink-soft/70">
                    Deleted {p.deletedAt ? timeAgo(p.deletedAt) : 'recently'}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-line/60">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleRestore(p)}
                    disabled={restoringId === p.id}
                    className="gap-1.5 text-xs"
                  >
                    {restoringId === p.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5 text-brand" />
                    )}
                    Restore
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openPermanentDelete(p)}
                    className="gap-1.5 text-xs text-story-coral-text hover:bg-story-coral-bg/60"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete Forever
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Drawer>

      <DeleteProjectDialog
        project={projectToDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onDeleted={() => {
          setProjectToDelete(null);
          router.refresh();
        }}
      />
    </>
  );
}
