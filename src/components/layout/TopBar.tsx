'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Sun, Moon, Search, PanelRight, BookOpen, LogOut, LayoutDashboard, ChevronRight } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useUIStore } from '@/stores/ui-store';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { Avatar } from '@/components/ui/avatar';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { useSession, signOut } from '@/lib/auth-client';
import { useStoryMapStore } from '@/stores/story-map-store';

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { toggleInspector, setCommandPaletteOpen } = useUIStore();
  const { data: session } = useSession();

  const isProjectPage = pathname.startsWith('/projects/');
  const projectId = isProjectPage ? pathname.split('/')[2] : null;

  const isCharactersPage = pathname.includes('/characters');
  const isChaptersPage = pathname.includes('/chapters');
  const isStoryMapPage = pathname.includes('/story-map') || pathname.includes('/map');
  const isPlanPage = isProjectPage && !isCharactersPage && !isChaptersPage && !pathname.includes('/vibe') && !isStoryMapPage;

  const projectTabs = [
    {
      label: 'Plan',
      href: projectId ? `/projects/${projectId}` : '#',
      active: true,
      current: isPlanPage,
      title: 'Story Plan & Quick Scenes',
    },
    {
      label: 'Story Map',
      href: projectId ? `/projects/${projectId}/story-map` : '#',
      active: true,
      current: isStoryMapPage,
      title: 'Visual Story Map canvas',
    },
    {
      label: 'Chapters',
      href: projectId ? `/projects/${projectId}/chapters` : '#',
      active: true,
      current: isChaptersPage,
      title: 'Chapter outline and scene breakdown',
    },
    {
      label: 'Characters',
      href: projectId ? `/projects/${projectId}/characters` : '#',
      active: true,
      current: isCharactersPage,
      title: 'Manage story characters and relationships',
    },
    {
      label: 'Vibe Board',
      href: '#',
      active: false,
      current: false,
      title: 'Vibe Board unlocks in Phase 7',
    },
  ];

  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Guest';

  const handleToggleInspector = () => {
    if (isStoryMapPage) {
      const { chaptersPanelOpen, scenesDrawerOpen, setChaptersPanelOpen, setScenesDrawerOpen } =
        useStoryMapStore.getState();
      if (chaptersPanelOpen || scenesDrawerOpen) {
        setChaptersPanelOpen(false);
        setScenesDrawerOpen(false);
      } else {
        setChaptersPanelOpen(true);
      }
    } else {
      toggleInspector();
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-13 w-full items-center justify-between border-b border-line bg-surface/90 px-4 backdrop-blur-md">
      {/* Left: Brand & Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href={session?.user ? '/dashboard' : '/login'}
          className="flex items-center gap-2 group outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm p-1"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-brand text-white shadow-sm transition-transform duration-[140ms] group-hover:scale-105">
            <BookOpen className="h-4 w-4" strokeWidth={2} />
          </div>
          <span className="font-sans text-base font-bold tracking-tight text-ink">
            Weave<span className="text-brand">It</span>
          </span>
        </Link>

        {isProjectPage && (
          <div className="flex items-center gap-1.5 text-xs text-ink-soft">
            <ChevronRight className="h-3.5 w-3.5 text-ink-soft/60" />
            <Link
              href="/dashboard"
              className="hover:text-ink transition-colors font-medium hover:underline"
            >
              Dashboard
            </Link>
          </div>
        )}

        <span className="h-4 w-px bg-line mx-1 hidden sm:block" />

        <Link
          href="/styleguide"
          className="text-xs font-medium text-ink-soft hover:text-ink transition-colors hidden sm:inline-block px-2 py-1 rounded-sm hover:bg-surface-sunken"
        >
          Styleguide
        </Link>
      </div>

      {/* Center: Project Tabs (Studio Style) */}
      {isProjectPage ? (
        <nav className="hidden md:flex items-center gap-1 rounded-sm bg-surface-sunken p-1 border border-line">
          {projectTabs.map((tab) =>
            tab.active ? (
              <Link
                key={tab.label}
                href={tab.href}
                className={`px-3 py-1 text-xs font-medium rounded-[6px] transition-colors select-none ${
                  tab.current
                    ? 'bg-surface text-ink shadow-2xs font-semibold'
                    : 'text-ink-soft hover:text-ink hover:bg-surface/50'
                }`}
                title={tab.title}
              >
                {tab.label}
              </Link>
            ) : (
              <button
                key={tab.label}
                type="button"
                disabled
                className="px-3 py-1 text-xs font-medium rounded-[6px] text-ink-soft/50 cursor-not-allowed select-none"
                title={tab.title}
              >
                {tab.label}
              </button>
            )
          )}
        </nav>
      ) : (
        <div className="hidden md:flex items-center gap-1 text-xs text-ink-soft">
          <span className="font-medium">Studio Workspace</span>
        </div>
      )}

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Command palette trigger */}
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 rounded-sm border border-line bg-surface-sunken px-2.5 py-1.5 text-xs text-ink-soft hover:border-ink-soft/40 hover:text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-brand"
        >
          <Search className="h-3.5 w-3.5" strokeWidth={1.75} />
          <span className="hidden sm:inline">Search or jump to...</span>
          <kbd className="hidden sm:inline-block rounded bg-surface border border-line px-1.5 py-0.2 text-[10px] font-semibold text-ink-soft">
            ⌘K
          </kbd>
        </button>

        {/* Theme toggle */}
        <Tooltip
          content={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
          position="bottom"
        >
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleTheme}
            aria-label="Toggle color theme"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="h-4 w-4 text-sun" strokeWidth={1.75} />
            ) : (
              <Moon className="h-4 w-4 text-ink-soft" strokeWidth={1.75} />
            )}
          </Button>
        </Tooltip>

        {/* Inspector panel trigger */}
        <Tooltip content="Toggle Inspector panel" position="bottom">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleToggleInspector}
            aria-label="Toggle inspector"
          >
            <PanelRight className="h-4 w-4" strokeWidth={1.75} />
          </Button>
        </Tooltip>

        {/* User avatar / profile dropdown */}
        {session?.user ? (
          <DropdownMenu
            align="right"
            trigger={
              <button
                type="button"
                className="outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-full ml-1"
                aria-label="User menu"
              >
                <Avatar
                  name={userName}
                  src={session.user.image ?? undefined}
                  size="sm"
                  className="cursor-pointer hover:ring-2 hover:ring-brand/30 transition-all"
                />
              </button>
            }
            items={[
              {
                label: userName,
                disabled: true,
                onClick: () => {},
              },
              'separator',
              {
                label: 'Dashboard',
                icon: <LayoutDashboard className="h-4 w-4" />,
                onClick: () => router.push('/dashboard'),
              },
              'separator',
              {
                label: 'Sign out',
                icon: <LogOut className="h-4 w-4" />,
                destructive: true,
                onClick: () => signOut({ callbackUrl: '/login' }),
              },
            ]}
          />
        ) : (
          <Link href="/login">
            <Button variant="primary" size="sm" className="ml-1 text-xs">
              Sign In
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
