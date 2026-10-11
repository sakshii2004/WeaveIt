'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { permanentDeleteProjectAction } from '@/app/actions/projects';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { Project } from '@/db/schema';

export interface DeleteProjectDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

interface DeleteProjectFormProps {
  project: Project;
  onClose: () => void;
  onDeleted?: () => void;
}

function DeleteProjectForm({ project, onClose, onDeleted }: DeleteProjectFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [confirmInput, setConfirmInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isMatched = confirmInput.trim().toLowerCase() === project.title.trim().toLowerCase();

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMatched) {
      setError(`Please type "${project.title}" to confirm permanent deletion.`);
      return;
    }

    setLoading(true);
    setError(null);

    const res = await permanentDeleteProjectAction(project.id, confirmInput);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to delete project');
      toast({
        title: 'Deletion failed',
        description: res.error || 'Could not permanently delete this project',
        variant: 'error',
      });
      return;
    }

    toast({
      title: 'Project permanently deleted',
      description: `"${project.title}" and all its scenes and maps have been removed.`,
      variant: 'info',
    });

    onClose();
    onDeleted?.();
    router.refresh();
  };

  return (
    <form onSubmit={handleDelete}>
      <DialogHeader>
        <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-story-coral-bg text-story-coral-text mb-2">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <DialogTitle>Permanently delete novel?</DialogTitle>
        <DialogDescription>
          This action cannot be undone. All scenes, story maps, acts, and draft data for{' '}
          <strong className="text-ink font-semibold">&quot;{project.title}&quot;</strong> will be
          permanently deleted.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {error && (
          <div className="rounded-sm bg-story-coral-bg/50 border border-story-coral-text/20 p-3 text-xs text-story-coral-text">
            {error}
          </div>
        )}

        <div className="rounded-sm bg-surface-sunken p-3 text-xs text-ink-soft space-y-1">
          <p>
            To confirm, type <strong className="text-ink select-all">{project.title}</strong>{' '}
            below:
          </p>
        </div>

        <div className="space-y-1.5">
          <Input
            placeholder={project.title}
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onClose}
          disabled={loading}
        >
          Keep Project
        </Button>
        <Button
          type="submit"
          variant="destructive"
          size="md"
          disabled={!isMatched || loading}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Permanently Delete
        </Button>
      </DialogFooter>
    </form>
  );
}

export function DeleteProjectDialog({
  project,
  open,
  onOpenChange,
  onDeleted,
}: DeleteProjectDialogProps) {
  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <DeleteProjectForm
            project={project}
            onClose={() => onOpenChange(false)}
            onDeleted={onDeleted}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
