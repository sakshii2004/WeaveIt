'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Chip } from '@/components/ui/chip';
import { useToast } from '@/components/ui/toast';
import { createProjectAction } from '@/app/actions/projects';
import { Sparkles, Loader2 } from 'lucide-react';

const GENRE_SUGGESTIONS = [
  'Literary Fiction',
  'Mystery / Thriller',
  'Science Fiction',
  'Fantasy',
  'Historical Fiction',
  'Romance',
  'Memoir',
];

export interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = React.useState('');
  const [genre, setGenre] = React.useState('');
  const [logline, setLogline] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for your story');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await createProjectAction({
      title: title.trim(),
      genre: genre.trim() || undefined,
      logline: logline.trim() || undefined,
    });

    setLoading(false);

    if (!res.success || !res.data) {
      setError(res.error || 'Failed to create project');
      toast({
        title: 'Could not create project',
        description: res.error || 'An unexpected error occurred.',
        variant: 'error',
      });
      return;
    }

    toast({
      title: 'Project created',
      description: `"${res.data.title}" is ready. Default Acts and Story Map initialized.`,
      variant: 'success',
    });

    onOpenChange(false);
    setTitle('');
    setGenre('');
    setLogline('');
    router.push(`/projects/${res.data.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-brand-soft text-brand-strong mb-2">
              <Sparkles className="h-4 w-4" />
            </div>
            <DialogTitle>Start a new novel</DialogTitle>
            <DialogDescription>
              Create a fresh workspace for your story. Default three-act structure and primary story
              map will be prepared for you automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-sm bg-story-coral-bg/50 border border-story-coral-text/20 p-3 text-xs text-story-coral-text">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="project-title" className="text-xs font-semibold text-ink">
                Story Title <span className="text-coral">*</span>
              </label>
              <Input
                id="project-title"
                placeholder="e.g. The Jaipur Connection"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="project-genre" className="text-xs font-semibold text-ink">
                Genre
              </label>
              <Input
                id="project-genre"
                placeholder="e.g. Mystery / Thriller"
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
                    onClick={() => setGenre(g)}
                  >
                    {g}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="project-logline" className="text-xs font-semibold text-ink">
                Logline / Premise{' '}
                <span className="text-[11px] font-normal text-ink-soft">(Optional)</span>
              </label>
              <Textarea
                id="project-logline"
                rows={3}
                placeholder="A one-sentence hook describing the central conflict and stakes..."
                value={logline}
                onChange={(e) => setLogline(e.target.value)}
              />
              <p className="text-[11px] text-ink-soft">
                Don&apos;t worry if you don&apos;t know the full story yet. You can change this at any time.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
