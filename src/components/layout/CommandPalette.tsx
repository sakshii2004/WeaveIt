'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Compass, Plus, FileText, User, LayoutDashboard } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const [query, setQuery] = React.useState('');

  const isProjectPage = pathname?.startsWith('/projects/');
  const projectId = isProjectPage ? pathname.split('/')[2] : null;

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const quickActions = [
    {
      icon: <Plus className="h-4 w-4 text-brand" strokeWidth={1.75} />,
      label: 'Story Scenes & Outline',
      href: projectId ? `/projects/${projectId}` : '/dashboard',
      hint: projectId ? 'Plan' : 'Dashboard',
    },
    {
      icon: <User className="h-4 w-4 text-sun" strokeWidth={1.75} />,
      label: 'Characters & Cast',
      href: projectId ? `/projects/${projectId}/characters` : '/dashboard',
      hint: projectId ? 'Characters' : 'Dashboard',
    },
    {
      icon: <Compass className="h-4 w-4 text-sky-500" strokeWidth={1.75} />,
      label: 'Open Story Map',
      href: projectId ? `/projects/${projectId}/story-map` : '/dashboard',
      hint: projectId ? 'Canvas' : 'Dashboard',
    },
    {
      icon: <LayoutDashboard className="h-4 w-4 text-emerald-500" strokeWidth={1.75} />,
      label: 'Go to Dashboard',
      href: '/dashboard',
      hint: 'Home',
    },
    {
      icon: <FileText className="h-4 w-4 text-lavender-500" strokeWidth={1.75} />,
      label: 'Go to Styleguide',
      href: '/styleguide',
      hint: 'Design System',
    },
  ];

  return (
    <Dialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-lg">
        {/* Search Input */}
        <div className="flex items-center border-b border-line px-4 py-3">
          <Search className="h-4 w-4 text-ink-soft shrink-0 mr-3" strokeWidth={1.75} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search scenes, characters, or actions..."
            className="w-full bg-transparent text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none"
            autoFocus
          />
          <kbd className="rounded bg-surface-sunken border border-line px-1.5 py-0.5 text-[10px] font-semibold text-ink-soft ml-2">
            ESC
          </kbd>
        </div>

        {/* Suggestions list */}
        <div className="p-2 space-y-1 max-h-72 overflow-y-auto">
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
            Quick Actions
          </div>
          {quickActions.map((action, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (action.href) {
                  router.push(action.href);
                }
                setCommandPaletteOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-sm px-3 py-2 text-xs font-medium text-ink hover:bg-surface-sunken transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                {action.icon}
                <span>{action.label}</span>
              </div>
              {action.hint && (
                <span className="text-[10px] text-ink-soft bg-surface-sunken px-1.5 py-0.5 rounded border border-line">
                  {action.hint}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="border-t border-line bg-surface-sunken px-4 py-2 text-[11px] text-ink-soft flex justify-between">
          <span>Tip: Navigation and full search will be active in subsequent phases</span>
          <span>WeaveIt v1.0</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
