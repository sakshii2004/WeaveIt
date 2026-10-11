'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Button,
  Input,
  Textarea,
  Select,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Drawer,
  Chip,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Tooltip,
  useToast,
  EmptyState,
  Toggle,
  DropdownMenu,
  Avatar,
} from '@/components/ui';
import { AppShell } from '@/components/layout/AppShell';
import { useTheme } from '@/lib/theme';
import {
  Plus,
  Trash2,
  MoreVertical,
  ArrowLeft,
} from 'lucide-react';

export default function StyleguidePage() {
  const { theme, setTheme } = useTheme();
  const { success, warning, error, info } = useToast();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [toggleChecked, setToggleChecked] = React.useState(true);
  const [chipsList, setChipsList] = React.useState([
    'Act I: Setup',
    'Arjun Character Arc',
    'Jaipur Railway Station',
    'Main Thread',
  ]);

  const removeChip = (index: number) => {
    setChipsList((prev) => prev.filter((_, i) => i !== index));
  };

  const coreColors = [
    { name: '--bg', token: 'bg-bg', border: true, label: 'App Background' },
    { name: '--surface', token: 'bg-surface', border: true, label: 'Surface Cards / Panels' },
    { name: '--surface-sunken', token: 'bg-surface-sunken', border: true, label: 'Sunken Wells / Inputs' },
    { name: '--ink', token: 'bg-ink', text: 'text-white', label: 'Primary Ink Text' },
    { name: '--ink-soft', token: 'bg-ink-soft', text: 'text-white', label: 'Secondary Ink Text' },
    { name: '--line', token: 'bg-line', label: '1px Dividers & Borders' },
    { name: '--brand', token: 'bg-brand', text: 'text-white', label: 'Primary Brand Teal' },
    { name: '--brand-strong', token: 'bg-brand-strong', text: 'text-white', label: 'Hover / Pressed Teal' },
    { name: '--brand-soft', token: 'bg-brand-soft', label: 'Selected Fills' },
    { name: '--coral', token: 'bg-coral', text: 'text-white', label: 'Highlights & Destructive' },
    { name: '--sun', token: 'bg-sun', text: 'text-black', label: 'Warnings & Bookmarks' },
    { name: '--success', token: 'bg-success', text: 'text-white', label: 'Success States' },
  ];

  const storyColors = [
    { name: 'Teal', variant: 'teal' as const },
    { name: 'Coral', variant: 'coral' as const },
    { name: 'Sun', variant: 'sun' as const },
    { name: 'Sky', variant: 'sky' as const },
    { name: 'Lavender', variant: 'lavender' as const },
    { name: 'Mint', variant: 'mint' as const },
    { name: 'Rose', variant: 'rose' as const },
    { name: 'Slate', variant: 'slate' as const },
  ];

  return (
    <AppShell>
      <div className="space-y-16 pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Workspace
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
              Design System &amp; Component Styleguide
            </h1>
            <p className="text-sm text-ink-soft mt-1">
              Living catalog of WeaveIt design tokens, typography, layout rules, and restyled
              primitives.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-sm border border-line bg-surface-sunken p-1">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${
                  theme === 'light'
                    ? 'bg-surface text-ink shadow-sm'
                    : 'text-ink-soft hover:text-ink'
                }`}
              >
                Light
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${
                  theme === 'dark'
                    ? 'bg-surface text-ink shadow-sm'
                    : 'text-ink-soft hover:text-ink'
                }`}
              >
                Dark
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${
                  theme === 'system'
                    ? 'bg-surface text-ink shadow-sm'
                    : 'text-ink-soft hover:text-ink'
                }`}
              >
                System
              </button>
            </div>
          </div>
        </div>

        {/* 1. Core Color Tokens */}
        <section className="space-y-6">
          <div className="border-b border-line pb-3 mb-6">
            <h2 className="text-xl font-semibold text-ink">1. Core Design Tokens</h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Strictly non-inverted light and dark theme palettes meeting WCAG AA contrast.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {coreColors.map((color) => (
              <div
                key={color.name}
                className="flex flex-col rounded-md border border-line overflow-hidden bg-surface shadow-sm"
              >
                <div
                  className={`h-16 w-full ${color.token} flex items-end p-2 ${
                    color.border ? 'border-b border-line' : ''
                  }`}
                >
                  <span
                    className={`text-[11px] font-mono font-medium ${
                      color.text || 'text-ink'
                    }`}
                  >
                    {color.name}
                  </span>
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-ink truncate">{color.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Story Palette */}
        <section className="space-y-6">
          <div className="border-b border-line pb-3 mb-6">
            <h2 className="text-xl font-semibold text-ink">2. Story Colour Palette</h2>
            <p className="text-xs text-ink-soft mt-0.5">
              8 medium-saturation pastels paired with high-contrast text for acts, threads, and
              scene tags.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {storyColors.map((sc) => (
              <div
                key={sc.name}
                className="flex items-center justify-between p-3 rounded-md bg-surface border border-line shadow-sm"
              >
                <span className="text-xs font-medium text-ink">{sc.name}</span>
                <Chip variant={sc.variant}>{sc.name} Accent</Chip>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Typography */}
        <section className="space-y-6">
          <div className="border-b border-line pb-3 mb-6">
            <h2 className="text-xl font-semibold text-ink">3. Typography Scale &amp; Typefaces</h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Three purposeful typefaces: Plus Jakarta Sans (UI), Source Serif 4 (Writing), Courier
              Prime (Play).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <span className="text-[11px] font-mono text-ink-soft uppercase tracking-wider">
                  UI &amp; Headings
                </span>
                <CardTitle className="font-sans text-lg">Plus Jakarta Sans</CardTitle>
                <CardDescription>
                  Modern humanist sans with clean personality. Used across headers, navigation,
                  cards, and buttons.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 font-sans">
                <p className="text-2xl font-bold text-ink">Headline 32px</p>
                <p className="text-lg font-semibold text-ink">Section Title 18px</p>
                <p className="text-sm font-medium text-ink">Body Medium 14px</p>
                <p className="text-xs text-ink-soft">Caption &amp; Metadata 13px</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <span className="text-[11px] font-mono text-ink-soft uppercase tracking-wider">
                  Writing Surfaces
                </span>
                <CardTitle className="font-serif text-lg">Source Serif 4</CardTitle>
                <CardDescription>
                  Refined, literary serif designed for readability so scene drafting feels like
                  genuine creative writing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 font-serif">
                <p className="text-lg italic text-ink">
                  &ldquo;She runs into him at the Jaipur railway station, luggage scattered under
                  the midday sun.&rdquo;
                </p>
                <p className="text-sm text-ink-soft leading-relaxed">
                  Scene descriptions, purpose reflections, and character background notes.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <span className="text-[11px] font-mono text-ink-soft uppercase tracking-wider">
                  Play Editor
                </span>
                <CardTitle className="font-mono text-lg">Courier Prime</CardTitle>
                <CardDescription>
                  Monospaced typewriter font for scene scripting, dialogue beats, and direction.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 font-mono text-xs">
                <p className="font-bold text-ink tracking-widest uppercase">ARJUN</p>
                <p className="text-ink pl-4">Did you know she was arriving today?</p>
                <p className="text-ink-soft italic pl-4">[Turns away, watching the train vanish]</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 4. Shape, Depth & Radii */}
        <section className="space-y-6">
          <div className="border-b border-line pb-3 mb-6">
            <h2 className="text-xl font-semibold text-ink">4. Shape, Depth &amp; Radii</h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Deliberate geometry: 8px for controls, 12px for cards, 16px for modals.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-sm border border-line bg-surface p-4 shadow-sm text-center">
              <span className="text-xs font-semibold text-ink">8px Radius</span>
              <p className="text-xs text-ink-soft mt-1">Inputs, Buttons, Tooltips</p>
            </div>
            <div className="rounded-md border border-line bg-surface p-4 shadow-md text-center">
              <span className="text-xs font-semibold text-ink">12px Radius</span>
              <p className="text-xs text-ink-soft mt-1">Cards, Drawers, Canvas Nodes</p>
            </div>
            <div className="rounded-lg border border-line bg-surface p-4 shadow-lg text-center">
              <span className="text-xs font-semibold text-ink">16px Radius</span>
              <p className="text-xs text-ink-soft mt-1">Dialogs &amp; Modals</p>
            </div>
          </div>
        </section>

        {/* 5. Buttons */}
        <section className="space-y-6">
          <div className="border-b border-line pb-3 mb-6">
            <h2 className="text-xl font-semibold text-ink">5. Buttons</h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Brand teal primary, outlined secondary, subtle, destructive, and icon variants.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" size="md">
              <Plus className="h-4 w-4" /> Primary Action
            </Button>
            <Button variant="secondary" size="md">
              Secondary Button
            </Button>
            <Button variant="subtle" size="md">
              Subtle Action
            </Button>
            <Button variant="ghost" size="md">
              Ghost Button
            </Button>
            <Button variant="destructive" size="md">
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
            <Button variant="primary" size="icon" aria-label="Add">
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="icon" aria-label="More">
              <MoreVertical className="h-4 w-4" />
            </Button>
            <Button variant="primary" size="md" disabled>
              Disabled State
            </Button>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <span className="text-xs font-medium text-ink-soft">Sizes:</span>
            <Button variant="secondary" size="sm">
              Small (32px)
            </Button>
            <Button variant="secondary" size="md">
              Medium (36px)
            </Button>
            <Button variant="secondary" size="lg">
              Large (44px)
            </Button>
          </div>
        </section>

        {/* 6. Form Inputs */}
        <section className="space-y-6">
          <div className="border-b border-line pb-3 mb-6">
            <h2 className="text-xl font-semibold text-ink">6. Form Controls</h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Sunken wells, crisp 1px borders, and 2px brand focus rings.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Scene Title"
              placeholder="e.g. She runs into him at Jaipur"
              defaultValue="Confrontation in the Courtyard"
              hint="Only the title is mandatory to save a scene."
            />

            <Input
              label="Scene with Error"
              defaultValue="Invalid scene timing"
              error="A scene with this title already exists in Act I."
            />

            <Select
              label="Scene Type"
              options={[
                { label: 'Setup', value: 'setup' },
                { label: 'Inciting Incident', value: 'inciting' },
                { label: 'Escalation', value: 'escalation' },
                { label: 'Midpoint', value: 'midpoint' },
                { label: 'Climax', value: 'climax' },
              ]}
              defaultValue="inciting"
              hint="Helps map narrative pacing."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Textarea
              label="Scene Notes (Standard Sans)"
              rows={3}
              placeholder="Jot down quick thoughts..."
              defaultValue="Arjun notices the unbroken seal on the envelope before Maya can hide it."
            />

            <Textarea
              label="Scene Description (Writing Surface Serif)"
              isWritingSurface
              rows={3}
              placeholder="Write the scene description..."
              defaultValue="Dust motes drift across the sunlight. Rain begins pattering gently on the corrugated tin roof."
              hint="Uses Source Serif 4 at 17px for a distraction-free writing feel."
            />
          </div>
        </section>

        {/* 7. Chips & Tags */}
        <section className="space-y-6">
          <div className="border-b border-line pb-3 mb-6">
            <h2 className="text-xl font-semibold text-ink">7. Chips &amp; Interactive Tags</h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Pill-shaped story elements, closable tags, and status markers.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {chipsList.map((chip, idx) => (
              <Chip
                key={chip}
                variant={idx === 0 ? 'teal' : idx === 1 ? 'sun' : idx === 2 ? 'lavender' : 'coral'}
                onRemove={() => removeChip(idx)}
              >
                {chip}
              </Chip>
            ))}
            {chipsList.length === 0 && (
              <span className="text-xs text-ink-soft italic">
                All chips removed. Click reset to restore.
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setChipsList([
                  'Act I: Setup',
                  'Arjun Character Arc',
                  'Jaipur Railway Station',
                  'Main Thread',
                ])
              }
            >
              Reset Chips
            </Button>
          </div>
        </section>

        {/* 8. Cards */}
        <section className="space-y-6">
          <div className="border-b border-line pb-3 mb-6">
            <h2 className="text-xl font-semibold text-ink">8. Cards (Standard &amp; Interactive)</h2>
            <p className="text-xs text-ink-soft mt-0.5">
              12px radii with smooth hover lift micro-animations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 mb-3">
                  <Chip variant="teal" size="sm">Act I</Chip>
                  <Chip variant="default" size="sm" className="font-mono">Scene 01</Chip>
                </div>
                <CardTitle>She runs into him at the Jaipur railway station</CardTitle>
                <CardDescription>
                  Arjun is catching the night train to Delhi when he spots Maya speaking urgently
                  to a ticket inspector.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Avatar name="Arjun V" size="sm" />
                  <Avatar name="Maya R" size="sm" />
                  <span className="text-xs text-ink-soft ml-1">2 characters attached</span>
                </div>
              </CardContent>
              <CardFooter className="justify-between text-xs text-ink-soft">
                <span>Status: Sketched</span>
                <span className="text-brand font-medium">Open in Play →</span>
              </CardFooter>
            </Card>

            <Card interactive onClick={() => success('Interactive card clicked!')}>
              <CardHeader>
                <div className="flex items-center gap-2 mb-3">
                  <Chip variant="sun" size="sm">Interactive Hover</Chip>
                </div>
                <CardTitle>Clickable Card Lift State</CardTitle>
                <CardDescription>
                  Interactive cards elevate smoothly with a subtle lift (-2px translateY) and
                  enhanced shadow on hover.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-ink-soft">
                  Used for project cards on the dashboard and canvas node selectors.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="primary" size="sm">
                  Trigger Action
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* 9. Feedback & Toasts */}
        <section className="space-y-6">
          <div className="border-b border-line pb-3 mb-6">
            <h2 className="text-xl font-semibold text-ink">9. Feedback Notifications (Toasts)</h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Calm, persistent system feedback with purposeful color borders.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={() => info('Scene saved to cloud', 'Autosave synced 3 seconds ago.')}
            >
              Info Toast
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() =>
                success('Scene sequence updated', 'Main path recomputed successfully.')
              }
            >
              Success Toast
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() =>
                warning('Cycle detected in timeline', 'Sequence paths must remain strictly acyclic.')
              }
            >
              Warning Toast
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() =>
                error('Connection interrupted', 'Retrying in 5 seconds. Your edits are cached.')
              }
            >
              Error Toast
            </Button>
          </div>
        </section>

        {/* 10. Modals & Drawers */}
        <section className="space-y-6">
          <div className="border-b border-line pb-3 mb-6">
            <h2 className="text-xl font-semibold text-ink">10. Overlays &amp; Inspector Drawer</h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Accessible modals with keyboard Escape dismissal and slide-in panels.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => setDialogOpen(true)}>
              Open Dialog Modal
            </Button>
            <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
              Open Inspector Drawer
            </Button>
            <DropdownMenu
              trigger={
                <Button variant="ghost" size="md">
                  Action Menu <MoreVertical className="h-4 w-4" />
                </Button>
              }
              items={[
                { label: 'Duplicate scene', onClick: () => info('Duplicated') },
                { label: 'Move to Chapter 2', onClick: () => info('Moved') },
                'separator',
                {
                  label: 'Delete scene',
                  destructive: true,
                  onClick: () => error('Deleted'),
                },
              ]}
            />
          </div>

          {/* Dialog Modal */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent onClose={() => setDialogOpen(false)}>
              <DialogHeader>
                <DialogTitle>Confirm Scene Split</DialogTitle>
                <DialogDescription>
                  This action will split &ldquo;The Jaipur Railway Station&rdquo; into two
                  sequential beats and rewire your Story Map edges.
                </DialogDescription>
              </DialogHeader>
              <div className="py-2 space-y-2">
                <Input
                  label="New Scene Title"
                  defaultValue="Part 2: The Departure"
                  placeholder="Enter title..."
                />
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setDialogOpen(false);
                    success('Scene split successfully');
                  }}
                >
                  Confirm Split
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Drawer */}
          <Drawer
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            side="right"
            title="Scene Inspector"
            description="Edit scene properties without leaving the canvas"
          >
            <div className="space-y-4">
              <Input label="Title" defaultValue="Arrival at Delhi" />
              <Select
                label="Act"
                options={[
                  { label: 'Act I', value: '1' },
                  { label: 'Act II', value: '2' },
                  { label: 'Act III', value: '3' },
                ]}
                defaultValue="1"
              />
              <Textarea
                label="Beat Summary"
                rows={4}
                defaultValue="Arjun meets his contact near the red sandstone arch."
              />
              <Toggle
                checked={toggleChecked}
                onChange={setToggleChecked}
                label="Include in main path sequence"
                description="Derives scene number automatically."
              />
              <div className="pt-4 flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setDrawerOpen(false)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setDrawerOpen(false);
                    success('Inspector changes saved');
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </Drawer>
        </section>

        {/* 11. Tooltips, Avatars, Toggles */}
        <section className="space-y-6">
          <div className="border-b border-line pb-3 mb-6">
            <h2 className="text-xl font-semibold text-ink">11. Micro-Components &amp; States</h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Tooltips, Avatars, and Toggle switches.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Tooltip content="Arjun (Protagonist)" position="top">
                <Avatar name="Arjun V" size="lg" className="cursor-pointer" />
              </Tooltip>
              <Tooltip content="Maya (Love Interest)" position="top">
                <Avatar name="Maya R" size="md" className="cursor-pointer" />
              </Tooltip>
              <Tooltip content="Inspector Khan" position="top">
                <Avatar name="K" size="sm" className="cursor-pointer" />
              </Tooltip>
            </div>

            <div className="h-6 w-px bg-line" />

            <Toggle
              checked={toggleChecked}
              onChange={setToggleChecked}
              label="Snap to grid on canvas"
              description="Automatically align story nodes"
            />
          </div>
        </section>

        {/* 12. Empty State */}
        <section className="space-y-6">
          <div className="border-b border-line pb-3 mb-6">
            <h2 className="text-xl font-semibold text-ink">12. Encouraging Empty State</h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Clean line illustration with plain, motivating author microcopy.
            </p>
          </div>

          <EmptyState
            title="Start with what you know"
            description="Every novel begins with a fragment. Add your first scene, even if it's just a single sentence."
            actionLabel="Add your first scene"
            onAction={() => success('Seed scene created')}
          />
        </section>
      </div>
    </AppShell>
  );
}
