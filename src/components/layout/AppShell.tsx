'use client';

import * as React from 'react';
import { TopBar } from './TopBar';
import { CommandPalette } from './CommandPalette';
import { Drawer } from '@/components/ui/drawer';
import { Toaster } from '@/components/ui/toast';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

import { usePathname } from 'next/navigation';

export interface AppShellProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

export function AppShell({ children, fullWidth = false }: AppShellProps) {
  const { inspectorOpen, setInspectorOpen, leftPanelOpen } = useUIStore();
  const pathname = usePathname();

  const isCanvasPage = Boolean(
    pathname?.includes('/story-map') || pathname?.includes('/vibe')
  );
  const isFullBleed = fullWidth || isCanvasPage;

  return (
    <div
      className={cn(
        'flex flex-col bg-bg text-ink',
        isFullBleed ? 'h-screen overflow-hidden' : 'min-h-screen'
      )}
    >
      {/* Top Bar */}
      <TopBar />

      {/* Workspace Three-Zone Layout */}
      <div
        className={cn(
          'flex-1 flex w-full relative',
          isFullBleed ? 'overflow-hidden h-[calc(100vh-3.25rem)]' : 'overflow-x-hidden'
        )}
      >
        {/* Left Panel Zone (Reserved for Chapters, Filters) - hidden on full-bleed canvas */}
        {!isFullBleed && leftPanelOpen && (
          <aside className="w-64 border-r border-line bg-surface p-4 hidden lg:block shrink-0 transition-all duration-[220ms] ease-out animate-in slide-in-from-left">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-soft mb-3">
              Navigator
            </h4>
            <p className="text-xs text-ink-soft">
              Left panel workspace zone (Chapters & Filters will connect in Phase 4 & 5).
            </p>
          </aside>
        )}

        {/* Central Content Area */}
        <main
          className={cn(
            'flex-1 flex flex-col min-w-0',
            isFullBleed
              ? 'w-full h-full p-0 overflow-hidden'
              : 'max-w-[960px] mx-auto px-4 sm:px-6 py-8 w-full'
          )}
        >
          {children}
        </main>
      </div>

      {/* Collapsible Inspector Drawer (Right Side) */}
      <Drawer
        open={inspectorOpen}
        onOpenChange={setInspectorOpen}
        side="right"
        title="Inspector Panel"
        description="Quick view and editing for selected scenes or characters"
      >
        <div className="space-y-4 text-xs text-ink-soft">
          <div className="rounded-md border border-line bg-surface-sunken p-3">
            <p className="font-medium text-ink mb-1">Inspector Active</p>
            <p>
              When an author clicks a scene or character on the Story Map, its complete
              details open here without navigating away from the canvas.
            </p>
          </div>
        </div>
      </Drawer>

      {/* Global Command Palette & Toaster */}
      <CommandPalette />
      <Toaster />
    </div>
  );
}
