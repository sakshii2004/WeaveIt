'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { Chip } from '@/components/ui/chip';
import { updateProjectAction } from '@/app/actions/projects';
import { Loader2 } from 'lucide-react';
import type { Project } from '@/db/schema';
import { GENRE_SUGGESTIONS } from './CreateProjectDialog';

export interface EditProjectDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: (updated: Project) => void;
}

interface EditProjectFormProps {
  project: Project;
  onClose: () => void;
  onUpdated?: (updated: Project) => void;
}

function EditProjectForm({ project, onClose, onUpdated }: EditProjectFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = React.useState(project.title);
  const [genre, setGenre] = React.useState(project.genre || '');
  const [logline, setLogline] = React.useState(project.logline || '');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Project title cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await updateProjectAction(project.id, {
      title: title.trim(),
      genre: genre.trim() || undefined,
      logline: logline.trim() || undefined,
    });

    setLoading(false);

    if (!res.success || !res.data) {
      setError(res.error || 'Failed to update project');
      toast({
        title: 'Update failed',
        description: res.error || 'Could not save project details',
        variant: 'error',
      });
      return;
    }

    toast({
      title: 'Project updated',
      description: 'Your changes have been saved.',
      variant: 'success',
    });

    onUpdated?.(res.data);
    onClose();
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Edit story details</DialogTitle>
        <DialogDescription>
          Update title, logline, or genre for &quot;{project.title}&quot;.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {error && (
          <div className="rounded-sm bg-story-coral-bg/50 border border-story-coral-text/20 p-3 text-xs text-story-coral-text">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="edit-title" className="text-xs font-semibold text-ink">
            Story Title <span className="text-coral">*</span>
          </label>
          <Input
            id="edit-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="edit-genre" className="text-xs font-semibold text-ink">
            Genre
          </label>
          <Input
            id="edit-genre"
            placeholder="e.g. Thriller, Drama..."
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {GENRE_SUGGESTIONS.map((g) => (
              <Chip
                key={g}
                variant={genre === g ? 'teal' : 'default'}
                size="sm"
                className="cursor-pointer transition-colors"
                onClick={() => setGenre(genre === g ? '' : g)}
              >
                {g}
              </Chip>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="edit-logline" className="text-xs font-semibold text-ink">
            Logline
          </label>
          <Textarea
            id="edit-logline"
            rows={3}
            value={logline}
            onChange={(e) => setLogline(e.target.value)}
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
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="md" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </DialogFooter>
    </form>
  );
}

export function EditProjectDialog({
  project,
  open,
  onOpenChange,
  onUpdated,
}: EditProjectDialogProps) {
  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <EditProjectForm
            project={project}
            onClose={() => onOpenChange(false)}
            onUpdated={onUpdated}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
