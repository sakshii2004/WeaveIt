# WeaveIt: Technical PRD for a Scene-Driven Story Planning App

*Product name: **WeaveIt**. Version 1.0. Written to be handed to an AI coding assistant and built in sequential phases.*

---

## 1. Product summary

A visual story-planning workspace for novelists who discover stories through scenes, settings, moods and fragments rather than a linear outline.

**Core creative flow:** Vibes → Ideas → Scenes → Story Map → Chapters → Play → Prose

**One-sentence pitch:** A visual story-building workspace that helps scene-driven writers turn fragments, vibes and ideas into structured novels.

**The principle to protect:** The app never asks the author to know the story before they start. It helps them discover the story from what they already know.

### Target user

Novelists who think in scenes, get sudden ideas for moments, twists and endings, work backwards and sideways, and want to separate *story construction* from *prose writing*. Secondary: fantasy, romance, mystery/thriller authors, screenwriters, plotters who like visual boards.

### Problems solved

1. **Disconnected ideas.** Fragments live in notebooks, screenshots and Pinterest. The app gives them one home.
2. **Scenes to story.** Authors need to see causality, setup/payoff, gaps and arcs.
3. **Linear outlines don't fit.** Authors discover non-linearly but need a coherent linear sequence in the end.
4. **Planning vs. prose.** Working out what happens in a scene (dialogue, realisations, reader information) is a different task from writing prose. The **Play** feature handles this.

---

## 2. How to use this document (instructions for the AI builder)

Build the application **one phase at a time** (Section 11). For every phase:

1. Read Sections 3 to 10 for global rules, then only the phase you are building.
2. Do not build features from later phases or from the "Out of scope" list (Section 12).
3. Keep the codebase runnable at the end of each phase: `pnpm dev` works, typecheck passes, lint passes, migrations apply cleanly.
4. Meet every acceptance criterion in the phase before stopping. Report what was built, what was skipped and any assumptions.
5. Never invent data-model fields that contradict Section 7. If a change is needed, propose it and wait.
6. Do not use placeholder lorem ipsum in the UI. Use realistic example content (e.g. a scene titled "She runs into him at the Jaipur railway station").
7. UI must follow the design direction in Section 4. This is a hard requirement, not a suggestion.

---

## 3. Product principles

- **Scene-first.** The scene is the atomic unit. Everything else (maps, chapters, threads) is a view or grouping over scenes.
- **One source of truth, many views.** The Story Map, Character Map and Thread Map are different visualisations of the same underlying data. Never duplicate story data per view.
- **Start with nothing.** A scene can be a single sentence. Every field except title is optional. Never block a writer with required fields or forced wizards.
- **Non-linear in, linear out.** Free arrangement during discovery; a derived, clean linear sequence for the book.
- **Calm by default.** No gamification, streaks, notification noise or AI chatter.
- **Author owns the words.** No AI story generation in v1. No training on user content.

---

## 4. UI and design direction (mandatory)

The interface must feel **modern, bright, clean and confident**, in the spirit of tools like Reedsy's Studio and Plot: effortless to scan, friendly to first-time users and polished enough for professional authors. It must look like a purpose-built product for writers, **not** a generic AI-generated SaaS template.

### 4.1 Mood

Fresh, airy, organised, encouraging. Lots of white space, crisp type, soft colour used with intent. The product should feel like a well-designed creative studio: calm enough to think in, structured enough to trust with a whole novel.

### 4.2 What to avoid (anti-patterns)

- Purple/blue-to-pink gradients, neon glows, glassmorphism blur cards, aurora backgrounds
- Sparkle (✨) icons, robot imagery, "AI-powered" badges, chatbot-style UI
- The default unstyled shadcn/ui look (always override tokens, radii, shadows, focus states)
- Giant centred hero sections with three identical feature cards
- Dense analytics dashboards, tiny grey 12px text, low-contrast placeholder-only forms
- Emoji as icons, generic stock illustrations, random decorative blobs
- Heavy drop shadows, thick borders on everything, mixed icon styles
- Inter + purple (or default Tailwind indigo-500) as the entire identity

### 4.3 Layout principles

- **Top navigation, studio style:** a slim top bar with the project switcher and project tabs (**Plan**, **Story Map**, **Characters**, **Vibe Board**), user menu on the right.
- **Three-zone workspace:** content in the centre, a collapsible **inspector panel** on the right (scene or character details open here without leaving the page), and a collapsible left panel only where needed (chapters list, filters).
- **Card-based dashboard:** projects shown as large, clean cards with cover, title, scene counts and progress; a prominent "New project" card.
- **Whitespace and rhythm:** 8px spacing grid, content max-width 960px for list/form pages, full-bleed for canvases. Clear visual hierarchy: one primary action per screen.
- **Friendly onboarding:** a short, dismissible getting-started checklist (Create a scene → Add a character → Connect scenes → Try Play) and empty states with simple line illustrations in brand colours and one clear call to action.
- **Command palette** (⌘K) for fast navigation and creation.
- Responsive from mobile web up; the canvas is optimised for 1024px and wider with a list-based fallback below that.

### 4.4 Design tokens

Define as CSS variables and Tailwind theme extensions. Ship a **Light** theme (default) and a fully designed **Dark** theme, not an auto-inverted one.

**Light**

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#F7F8FA` | App background (very light cool grey) |
| `--surface` | `#FFFFFF` | Cards, panels, canvas nodes |
| `--surface-sunken` | `#EFF1F5` | Wells, inputs, tray backgrounds |
| `--ink` | `#1B2430` | Primary text (soft near-black) |
| `--ink-soft` | `#5B6676` | Secondary text |
| `--line` | `#E3E7EE` | 1px borders and dividers |
| `--brand` | `#0F7C8A` | Primary actions, links, focus (confident teal) |
| `--brand-strong` | `#0B5F6B` | Hover/pressed |
| `--brand-soft` | `#DDF1F3` | Selected states, subtle fills |
| `--coral` | `#F2674F` | Highlights, notifications, destructive-adjacent accents |
| `--sun` | `#F5B93E` | Warnings, bookmarks |
| `--success` | `#2E9E6B` | Success states |

**Dark**

| Token | Value |
| --- | --- |
| `--bg` | `#0F141A` |
| `--surface` | `#171E26` |
| `--surface-sunken` | `#1E2731` |
| `--ink` | `#E9EEF5` |
| `--ink-soft` | `#9AA7B8` |
| `--line` | `#2B3541` |
| `--brand` | `#3CC2D0` |

**Story colour palette** for acts, threads and scene colour-coding: 8 friendly, medium-saturation pastels paired with deeper text-safe variants (teal, coral, sun, sky, lavender, mint, rose, slate), each defined for both themes with AA-contrast text on top. Colours are used as small accents (a card's top bar, a dot, a chip), never as large flat fills.

### 4.5 Typography

- **UI and headings:** a modern geometric/humanist sans with personality, e.g. *Plus Jakarta Sans*, *Manrope* or *DM Sans* (via `next/font`). Not Inter.
- **Writing surfaces** (scene description, purpose notes): a refined, readable serif such as *Source Serif 4* or *Newsreader* at 17 to 18px (with user-selectable font scales: 14px, 16px, 17.5px, 20px, 24px), so writing feels like writing.
- **Play editor:** a screenplay-style monospace such as *Courier Prime*.
- Scale: 13 / 14 / 16 / 18 / 24 / 32 / 40px; headings semibold with tight tracking; body line-height 1.6; minimum text size 13px.

### 4.6 Shape, depth and motion

- Radii: 8px for inputs and buttons, 12px for cards, 16px for modals. Deliberate and consistent.
- Depth: 1px borders first, then soft shadows with a cool tint (e.g. `0 1px 2px rgba(16,24,40,.06), 0 6px 16px rgba(16,24,40,.06)`). Elevated only on hover, drag and overlays.
- Motion: quick, crisp and smooth (140 to 220ms, ease-out); subtle hover lifts, animated drag-and-drop, smooth canvas zoom. Respect `prefers-reduced-motion`.
- Icons: one consistent set, Lucide at 1.75px stroke. Buttons: solid brand for primary, outlined for secondary, ghost for tertiary.

### 4.7 Component character

- **Scene nodes on the Story Map** are clean white cards with a coloured top bar (act colour), scene number chip, title, two-line description, character avatars and thread dots; a clear selected state with a brand-coloured ring.
- **Chips and tags** are pill-shaped, soft-tinted, with readable text.
- **Forms** use floating or top-aligned labels, inline validation and helpful hint text.
- **Microcopy** is encouraging and plain: "Add your first scene", "Nothing connected yet. Drag from one scene to another." Never robotic or jargon-heavy.
- **Accessibility:** WCAG AA contrast, full keyboard support, visible 2px brand focus rings, screen-reader labels on all controls.

### 4.8 Creative Dignity: Expansive Creation Surfaces ("Not a Page, Not a Popup")

Story planning is fundamentally an act of authorial creation, not an administrative transaction. When a writer sits down to capture a scene, explore a character's psyche, or weave narrative threads, they are dumping fragile, associative thoughts: dialogue snippets, sensory atmosphere, internal conflict, and narrative stakes.

Standard web patterns reflexively compress creation into cramped, 400px modal popups. This introduces acute psychological and practical friction:
- **Imperilment and Anxiety:** Generic popups feel ephemeral and easily dismissed (e.g. an accidental backdrop click destroying uncommitted ideas).
- **Physical Claustrophobia:** A 3-line input box throttles narrative flow. Writers cannot read their own preceding sentences as they type.
- **Premature Confinement:** Forcing rich narrative concepts into tiny textboxes encourages terse summaries rather than evocative, living story fragments.

Conversely, navigating away to an entirely separate full page breaks spatial orientation, detaches the author from their story canvas or outline, and incurs disruptive route transition overhead.

#### Core Tenets of the Creation Studio Pattern:

1. **The "Not a Page, Not a Popup" Principle:**
   Creation surfaces must feel grounded, spacious, and permanent without tearing the author away from their workspace. They occupy an expansive, centered **Widescreen Creation Studio** (`max-w-6xl` / 1152px wide, up to 92vh height with responsive containment) or an expansive slide-over canvas.
2. **True Manuscript Writing Typography & Font Size Control:**
   Per §4.5, every creative input surface deploys manuscript writing typography (*Source Serif 4* at 17.5px default) with an interactive **Font Size Switcher** (14px Compact, 16px Standard, 17.5px Default Serif, 20px Large, 24px Expansive), remembered across sessions via local persistence. Writing feels like real writing tailored to the author's visual ergonomics.
3. **Dual-Zone Architecture (Story Stream vs. Architecture Rail):**
   - **Primary Creative Stream (65–70% width, ~760px):** Large, distraction-free scene headline (`text-xl sm:text-2xl font-bold` with intelligent auto-titling), expansive narrative synopsis canvas (min 300px height), and a dedicated Scene Purpose & Conflict card ("What shifts? Why does this scene exist?").
   - **Story Architecture Rail (30–35% width, ~390px):** Instant access to structural anchors: Act, Chapter, Location (with inline creation), Scene Type (inciting incident, twist, climax, etc.), Status, Cast tagging, and Plot Thread connections. Authors can dump raw prose without being distracted by dropdowns, yet can anchor the scene before saving.
4. **Draft Resilience & Anti-Accidental Dismissal:**
   Creative work must never be lost. Accidental backdrop clicks are intercepted; if uncommitted input exists, the user is protected with dirty-state preservation or confirmation before dismissal.
5. **Flow Continuations & Brainstorming Speed:**
   Support distinct completion triggers:
   - **Create Scene** (<kbd>⌘ Enter</kbd> / <kbd>Ctrl Enter</kbd>)
   - **Create & Open Inspector** (transitions directly into the deep editing drawer / Play mode)
   - **Create & Add Another** (lets brainstorming writers capture consecutive scenes in rapid succession without leaving the creation zone).

---

## 5. Tech stack (fixed)

| Layer | Choice |
| --- | --- |
| Framework | Next.js (App Router) + React + TypeScript (strict) |
| Styling | Tailwind CSS with custom theme tokens; shadcn/ui primitives, fully restyled |
| Story canvas | React Flow (`@xyflow/react`) with custom node/edge components |
| Client state | Zustand (canvas/editor state), TanStack Query (server state) |
| Backend | Next.js Route Handlers / Server Actions, Zod validation on every input |
| Database | PostgreSQL |
| ORM | Drizzle ORM + drizzle-kit migrations |
| Auth | Auth.js (NextAuth) with the Drizzle adapter: Google OAuth, email + password (Credentials provider), and a custom 6-digit email OTP verification flow (see 7.1 and 8.1) |
| File storage | Cloudflare R2 through its S3-compatible API; presigned PUT uploads, a bucket CORS policy for the app domain, images served via a custom R2 domain or signed GET URLs |
| Email | Resend (or equivalent) for OTP and transactional mail |
| Testing | Vitest (unit), Playwright (key e2e flows) |
| Tooling | pnpm, ESLint, Prettier, Husky pre-commit |
| Future | Tiptap for manuscript editor (not in MVP) |
| Hosting and database | Vercel for the Next.js app; Neon serverless Postgres via the @neondatabase/serverless driver with Drizzle. Use the pooled connection string at runtime and the direct connection for migrations. Preview deployments use Neon database branches. |

**Repo structure**

```text
/src
  /app            routes (auth, dashboard, project/[id]/...)
  /components     ui/, canvas/, scene/, character/, vibe/
  /db             schema.ts, migrations/, queries/
  /lib            auth, storage, validators (zod), utils
  /stores         zustand stores
  /styles         tokens.css, globals.css
/tests
```

---

## 6. Architecture notes

- **Monolith first.** Frontend and API in one Next.js app.
- **Authorisation:** every query is scoped by `project.owner_id` (and later by membership). Never trust client-supplied IDs without ownership checks. Write a single `requireProjectAccess(projectId, userId)` helper and use it everywhere.
- **Autosave:** scene editing and canvas changes autosave (debounced 800ms) with a visible, quiet "Saved" indicator. Optimistic updates with rollback on failure.
- **Canvas persistence:** node positions are stored per map; position updates are batched and debounced (1s) to avoid chatty writes.
- **Sequence derivation:** the linear order of scenes is derived from the main-path edges (see 7.4) and cached in `map_nodes.sequence_index (per map)`, recomputed server-side on edge changes.
- **IDs:** UUIDv7 primary keys. Human-friendly scene numbers (`Scene 01`) are display-only, derived from sequence order, and distinct from `scenes.id`.
- **Soft delete** (`deleted_at`) for projects, scenes and characters in MVP to prevent accidental loss; provide a simple "Recently deleted" view.

---

## 7. Data model

All tables have `id`, `created_at`, `updated_at`. `project_id` FKs cascade on hard delete.

### 7.1 Core tables

**users**: `id, name, email (unique), email_verified_at, password_hash (nullable), image, theme_pref`

**Auth tables** (Auth.js Drizzle adapter): `accounts`, `sessions`, `verification_tokens`, with the standard Auth.js columns.

**email\_otps**: `id, user_id, code_hash, purpose (verify_email | reset_password), expires_at, attempts, consumed_at`. Codes are stored hashed, never in plain text.

**projects**: `id, owner_id → users, title, logline, genre, cover_image_url, deleted_at`

**acts**: `id, project_id, name, order_index, color`  (default seed: Act I, II, III; user-editable)

**chapters**: `id, project_id, map_id, title, order_index`

**locations**: `id, project_id, name, description, image_url`

**threads** (story threads): `id, project_id, name, description, color`

### 7.2 Characters

**characters**: `id, project_id, name, image_url, role (enum), role_custom, description, personality, goals, fears, background, arc, deleted_at`

`role` enum: `protagonist, love_interest, antagonist, villain, supporting, mentor, custom`

**character\_custom\_fields**: `id, character_id, key, value` (user-defined attributes such as Clan, Powers, Occupation). Field *keys* are free text; offer autocomplete from keys already used in the project.

**character\_relationships**: `id, project_id, source_character_id, target_character_id, type (text, e.g. love, distrust, friendship, betrayal), description, is_directed (bool), start_scene_id (nullable), end_scene_id (nullable)`

### 7.3 Scenes

**scenes**: `id, project_id, title, status (enum), description, location_id (nullable), time_label (text), scene_type (enum), purpose, act_id (nullable), color (nullable), deleted_at`

- `status`: `seed, sketched, planned, played, drafted` (a scene can be a one-line `seed`)
- `scene_type`: `setup, inciting, escalation, reveal, twist, turning_point, midpoint, climax, resolution, connective, other`
- Only `title` is required. Auto-title from first words of description if empty.

**scene\_characters** (join): `scene_id, character_id, role_in_scene (nullable text)`

**scene\_threads** (join): `scene_id, thread_id`

**scene\_plays**: `id, scene_id (unique), content (jsonb array of beats), purpose_note`

`content` beat shape:

```json
{ "id": "uuid", "type": "dialogue | action | narrator_note | direction",
  "character_id": "uuid | null", "text": "You knew?" }
```

### 7.4 Story maps

**story\_maps**: `id, project_id, name, kind (enum: story | character | thread), is_default (bool), viewport (jsonb)`. A project supports multiple maps (alternate timelines, drafts or structures); the first `story` map is created automatically with the project and flagged is\_default. Users can add, duplicate, rename, reorder and delete maps.

**map\_nodes**: `id, map_id, scene_id (nullable), character_id (nullable), x, y, width (nullable), group_id (nullable)`, chapter\_id (nullable), sequence\_index (nullable int). Unique per `(map_id, scene_id)` and `(map_id, character_id)`.

**map\_edges**: `id, map_id, source_node_id, target_node_id, edge_type (enum: sequence | branch | cause | setup_payoff), label`

- `sequence` edges form the **main path**: the order in which scenes occur and are written in the book. Validate it is a single acyclic chain (no node with two outgoing or two incoming `sequence` edges).
- `branch`, `cause`, `setup_payoff` are annotation edges and do not affect sequence order.
- Scenes not on the main path are "unplaced": they appear on the canvas and in a side tray, with `sequence_index = null`.

**map\_groups**: `id, map_id, label, color` (visual grouping boxes on the canvas)

**Multiple-map rules (MVP):**

- Scenes, characters, locations, threads and acts are shared project data. Editing a scene updates it in every map.
- Each map owns its own positions, edges, groups, chapters, chapter assignments and `sequence_index`. All of these live on `map_nodes`, `map_edges`, `map_groups` and `chapters` (via `map_id`).
- A scene can appear in several maps (one node per map). Removing a node removes the scene from that map only; deleting the scene itself removes it everywhere.
- Duplicating a map copies its nodes, edges, groups and chapters but not the scenes.
- The main-path validation, sequence derivation, chapters panel and gap hints always operate on the active map.
- Only a `kind = story` map may have a main path. Character and thread maps are post-MVP.

### 7.5 Vibe board

**vibe\_items**: `id, project_id, type (image | note | color | quote | link | keyword), content (text), image_url, color_hex, tags (text[]), x, y, width, height`

### 7.6 Derived views (no extra story tables)

- **Thread view** = scenes filtered/ordered by `scene_threads`.
- **Character view** = `character_relationships` rendered as a graph.
- **Chapter view** = scenes grouped by `chapter_id`, ordered by `sequence_index`.

---

## 8. Feature specifications

### 8.1 Authentication

- Google OAuth sign-in/sign-up.
- Email + password sign-up with **6-digit email OTP verification** (expires in 10 minutes, max 5 attempts, resend with 60s cooldown).
- Password rules: min 10 chars; hashed with argon2id; rate-limited login.
- Password reset via emailed OTP/link.
- Protected routes via middleware; unverified email accounts cannot access the app.
- Log-out, and session expiry of 30 days rolling.

### 8.2 Projects and dashboard

- Dashboard lists projects as cards (cover, title, logline, scene count, last edited). Create, rename, edit details, delete (soft, with confirmation naming the project).
- Project home shows: logline, quick-add "New scene" input (type one line, press Enter to create a seed scene), recent scenes, link to Story Map, Characters, Vibe board.

### 8.3 Characters

- Grid/list of characters with portrait, name, role chip.
- Character detail drawer/page with all fields in 7.2, image upload, custom fields (add/remove/reorder) and a relationships section (add relationship to another character with type and note).
- Seed role-appropriate suggestions for custom field keys (fantasy: Clan, Species, Powers, Rank, Weapon, Bloodline; contemporary: Occupation, Family, Education, Hobbies) as optional one-click chips.

### 8.4 Scenes

- **Expansive Scene Creation Studio:** Embodies the Creative Dignity principle (§4.8). Opened from "+ New Scene" or quick-add expansions:
  - Generous workspace dialog (`max-w-4xl`, 880px wide, min 75vh comfortable proportion) with distinct drafting header, protected against accidental outside-click dismissal.
  - Large headline title input with auto-derivation fallback.
  - True writing surface with *Source Serif 4* (17.5px, 1.7 line-height, roomy multiline textarea) for raw narrative capture, prose fragments, and sensory beats.
  - Dedicated "Scene Purpose / Conflict" card to pin down value shifts and dramatic motivation.
  - Story Architecture Rail: Immediate one-click assignment of Act, Chapter (with inline add), Location (with inline add), Scene Type, Status, Cast tagging, and Thread tagging.
  - Creation actions: "Create Scene" (<kbd>⌘ Enter</kbd>), "Create & Open Inspector", and "Create & Add Another" for rapid brainstorming.
- Scene list view (filter by status, act, chapter, thread, character) and scene detail editor.
- Detail editor fields: title, status, description (plain multi-line, light markdown), characters (multi-select), location (select or create inline), time label, scene type, purpose, act, chapter, threads, colour.
- A **Play** tab on every scene (8.6).
- "Open scene" from any map node opens the detail in a side panel without leaving the canvas.

### 8.5 Story Map (central feature)

A React Flow canvas with:

- Custom **SceneNode** styled as a clean white card (see 4.7): scene number badge, title, 2-line description preview, character avatars, thread dots, thin act-colour edge, status marker.
- Drag nodes freely; snap-to-grid optional (toggle).
- Create edges by dragging between handles; choose edge type (default `sequence`). Edge labels editable.
- **Auto-arrange main path** action (left-to-right layout of the sequence chain) that the user can undo.
- Reorder: dragging a scene into a different position in the **Sequence tray** (a horizontal/vertical list synced with the canvas) rewires `sequence` edges.
- Group nodes into labelled boxes; colour-code scenes; filter/highlight by act, chapter, thread or character (non-matching nodes dim to 25%).
- Act and Chapter tagging via node context menu and bulk selection.
- Zoom, pan, minimap, fit-view, keyboard shortcuts (N new scene, Del delete, ⌘Z/⇧⌘Z undo/redo, ⌘K palette).
- **Chapters panel:** collapsible list showing Chapter → ordered scenes; drag scenes between chapters; shows scenes with no chapter.
- **Gap hints (non-AI, rule-based, quiet):** flag scenes with no incoming/outgoing sequence edge, unplaced scenes, and chapters with zero scenes. Shown as small unobtrusive markers.
- Performance target: smooth interaction with 300 nodes (memoised nodes, virtualised off-screen rendering via React Flow `onlyRenderVisibleElements`).

* **Multiple maps (MVP):** a map switcher in the top bar of the canvas lists all maps in the project, with create, duplicate, rename, reorder and delete. Adding existing scenes to another map is done from a "Scenes" drawer (drag scenes onto the canvas). Deleting a map asks for confirmation and never deletes scenes.

### 8.6 Play (scene scripting)

A lightweight beat-based editor inside the scene.

- Beat types: **dialogue** (character + line), **action**, **narrator note**, **direction**.
- Add beat by Enter; switch type via `/` command or Tab; assign a speaking character via `@name` autocomplete from characters in the scene (or project).
- Reorder beats by drag; delete; autosave.
- Separate **Purpose** field: "What does the reader learn / what changes here?"
- Rendered in screenplay-like formatting using the Play typeface; character names in small caps.
- Export a play to plain text/markdown (copy to clipboard).
- Setting scene status to `played` is manual, never automatic.

### 8.7 Basic Vibe Board

- Free-form board (pan/zoom) where users add: images (upload), notes, colour swatches, quotes, keywords.
- Tags per item; filter by tag.
- Drag/resize items, positions persisted.
- Images: max 10 MB, JPEG/PNG/WebP, server-side type verification, thumbnails generated.
- Pinterest import is **out of MVP**; design `vibe_items` so imported items can be added later (`source` field reserved).

### 8.8 Settings

- Theme: Light / Dark / follow system.
- Account: name, email, password change, delete account (hard delete of all data after confirmation).

---

## 9. API surface (REST-style Route Handlers or Server Actions)

All endpoints require an authenticated session, Zod-validate input and use `requireProjectAccess`.

```text
POST   /api/projects                    GET /api/projects
GET    /api/projects/:id                PATCH/DELETE /api/projects/:id

/api/projects/:id/scenes                GET, POST
/api/scenes/:sceneId                    GET, PATCH, DELETE
/api/scenes/:sceneId/play               GET, PUT

/api/projects/:id/characters            GET, POST
/api/characters/:cid                    GET, PATCH, DELETE
/api/characters/:cid/fields             PUT (replace set)
/api/projects/:id/relationships         GET, POST;  PATCH/DELETE /:rid

/api/projects/:id/acts | chapters | locations | threads    CRUD

/api/maps/:mapId                        GET (nodes, edges, groups)
/api/maps/:mapId/nodes/batch            PATCH (positions)
/api/maps/:mapId/edges                  POST;  PATCH/DELETE /:edgeId
/api/maps/:mapId/sequence               PUT (reorder main path)

/api/projects/:id/vibe                  GET, POST;  PATCH/DELETE /:itemId
/api/uploads/presign                    POST (type, size → presigned URL)
```

Additional map endpoints: `GET/POST /api/projects/:id/maps`, `PATCH/DELETE /api/maps/:mapId`, `POST /api/maps/:mapId/duplicate`, `POST /api/maps/:mapId/scenes` (add an existing scene to a map).

Conventions: JSON; errors as `{ error: { code, message } }`; pagination via cursor for list endpoints; idempotent PUT/PATCH.

---

## 10. Non-functional requirements

- **Security:** OWASP basics, CSRF protection, secure/HttpOnly cookies, rate limiting on auth and upload endpoints, sanitise rendered text, no secrets in client bundles.
- **Privacy:** user content is private by default; never used for model training; account deletion removes all data and stored files.
- **Performance:** initial route LCP < 2.5s on broadband; canvas interactions at 60fps up to 300 nodes; API p95 < 300ms for standard reads.
- **Reliability:** autosave never silently fails; failed saves surface a calm, persistent message and retry; offline edits are not supported in MVP but data must never be lost on refresh mid-save.
- **Accessibility:** WCAG 2.1 AA; the canvas must offer a keyboard-accessible alternative (the Sequence tray and scene list).
- **Observability:** structured logs, error tracking (Sentry or equivalent), basic product analytics respecting privacy (opt-out).
- **Quality:** TypeScript strict, ≥70% unit coverage on `/lib` and sequence logic, Playwright e2e for: sign-up/OTP, create project, create scene, build and reorder map, write a Play, upload vibe image.

---

## 11. Build phases (give these to the AI one at a time)

Each phase lists scope, deliverables and acceptance criteria. A ready-to-paste prompt follows each.

### Phase 0: Foundation and design system

**Scope:** Next.js + TS + Tailwind scaffold, Postgres + Drizzle setup, env handling, design tokens (Section 4), Light/Dark themes, fonts, base components (Button, Input, Select, Dialog, Drawer, Chip, Card, Tooltip, Toast, EmptyState), app shell (left rail, top bar, command palette stub). **Acceptance:**

- Light/Dark toggle works; both themes pass AA contrast.
- A `/styleguide` route displays every token and component.
- No default shadcn look: tokens, radii, shadows and typography match Section 4.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` pass.

> **Prompt:** "Using the PRD Sections 4, 5 and 6, build Phase 0. Create the project scaffold, design tokens for the Light and Dark themes, the base component library restyled to the design direction (modern, bright, Reedsy-inspired, not generic SaaS) and a /styleguide page. Do not build any feature screens."

### Phase 1: Authentication

**Scope:** Google OAuth, email/password sign-up, OTP verification, login, logout, password reset, protected routes, `users` table and sessions. **Acceptance:** all rules in 8.1 implemented; OTP expiry/attempt limits enforced; unverified users blocked; e2e test of sign-up → OTP → dashboard passes; auth screens follow Section 4 (clean centred card on a soft neutral background, no marketing hero).

> **Prompt:** "Build Phase 1 (Authentication) per PRD 8.1 and 7.1. Use the design system from Phase 0."

### Phase 2: Projects and dashboard

**Scope:** projects CRUD (soft delete, recently deleted), dashboard, project home with quick-add scene input (creates a seed scene stub for Phase 3), default acts seeded, primary `story` map auto-created as the default. **Acceptance:** user can only see own projects; deleting requires typing/confirming the project name; empty states use friendly, encouraging microcopy; `requireProjectAccess` helper exists with tests.

> **Prompt:** "Build Phase 2 (Projects and dashboard) per PRD 8.2, 6 and 7. Include migrations and ownership tests."

### Phase 3: Characters

**Scope:** characters CRUD, roles, custom fields with key autocomplete, image upload (presigned S3), relationships CRUD (list-based UI in the character detail). **Acceptance:** per 8.3; custom fields persist and reorder; relationship can be directed/undirected; uploads validated by type and size; soft delete with undo toast.

> **Prompt:** "Build Phase 3 (Characters) per PRD 8.3, 7.2 and 9. Include the upload presign flow."

### Phase 4: Scenes

**Scope:** scenes CRUD, scene list with filters, scene detail editor, acts/chapters/locations/threads CRUD, scene–character and scene–thread joins, autosave with "Saved" indicator. **Acceptance:** a scene can be created from a single sentence; every field except title optional; filters combine; autosave debounced and resilient; keyboard-friendly editor.

> **Prompt:** "Build Phase 4 (Scenes) per PRD 8.4, 7.3 and 9. Do not build the map or Play yet."

### Phase 5: Story Map

**Scope:** React Flow canvas, SceneNode (index-card style), edges with types, main-path validation, `sequence_index` derivation, Sequence tray, grouping, colour coding, act/chapter tagging, highlight filters, Chapters panel, gap hints, undo/redo, minimap, side-panel scene editing, multiple maps per project (switcher; create, duplicate, rename, delete). **Acceptance:**

- Creating/removing `sequence` edges updates `sequence_index` correctly and rejects branching/cyclic main paths with a clear message.
- Reordering in the tray rewires edges and reflows the canvas.
- Positions persist across reload; 300-node performance target met.
- Keyboard alternative to canvas exists.
- Unit tests cover sequence derivation and validation.

* A project can hold several story maps; each keeps independent positions, edges, chapters and sequence. Duplicating a map copies structure, not scenes, and deleting a map never deletes scenes.
* The same scene can appear in two maps; editing it in one updates the other.

> **Prompt:** "Build Phase 5 (Story Map) per PRD 8.5, 7.4 and 6. Implement sequence derivation as a pure, well-tested function. SceneNodes must follow the card design in Section 4.7."

### Phase 6: Play

**Scope:** beat-based Play editor in the scene detail, `@` character mention, `/` type switching, drag reorder, purpose field, export as text. **Acceptance:** per 8.6; autosave; rendering uses the Play typeface; beats persist in `scene_plays.content` with the defined schema.

> **Prompt:** "Build Phase 6 (Play) per PRD 8.6 and 7.3."

### Phase 7: Basic Vibe Board

**Scope:** pannable/zoomable board, image/note/colour/quote/keyword items, tags and filter, drag/resize, persisted positions, thumbnails. **Acceptance:** per 8.7; upload limits enforced; the board feels like a pinboard/mood table, not a file manager.

> **Prompt:** "Build Phase 7 (Vibe Board) per PRD 8.7 and 7.5."

### Phase 8: Polish, hardening and release

**Scope:** settings screen, recently deleted view, error/empty/loading states audit, accessibility audit, performance pass, security review, e2e suite, seed demo project (a short mystery set at the Jaipur railway station, with characters Arjun, Aanya, Maya, scenes and a mapped sequence), onboarding hints (quiet, dismissible). **Acceptance:** all Section 10 targets verified; Lighthouse accessibility ≥ 95; all e2e tests green; design review against Section 4 anti-patterns checklist passes.

> **Prompt:** "Build Phase 8 per PRD Sections 8.8, 10 and 11. Audit every screen against the Section 4 anti-patterns list and fix violations."

### Post-MVP stretch (do not build until requested)

- Character Map: graph view of `character_relationships` using a `character` map
- Thread Map: scenes filtered and plotted per thread
- Idea Inbox before scenes

---

## 12. Out of scope for MVP

Full manuscript/prose editor (Tiptap), AI story generation or suggestions, collaboration and comments, publishing, native mobile app, advanced analytics, Pinterest automation/import, complex timeline functionality, version history, exporting to many formats (only Play-as-text in MVP).

---

## 13. Definition of done (MVP)

A new user can sign up with Google or email + OTP, create a project, capture scenes as one-line seeds, define characters and relationships, arrange scenes on a story map, connect them into a main-path sequence, tag acts and chapters, script a scene in Play, collect a vibe board, and trust that nothing is lost, all inside an interface that feels modern, clean and effortless to use.

---

## 14. Decisions and open questions

**Resolved**

- Product name: **WeaveIt** (domain, trademark and logo still to do).
- Auth: **Auth.js** with the Drizzle adapter; email OTP is a custom flow on top.
- File storage: **Cloudflare R2**.
- Hosting and database: **Vercel + Neon Postgres**.
- Story maps: **multiple per project in the MVP** (see 7.4 and 8.5).
- Pinterest import: deferred until after the MVP.

**Still open**

1. Email provider for OTP and password reset (Resend assumed).
2. Should chapters stay per map (as specified) or be shared across all maps of a project?
3. Do alternate maps need a simple "compare two maps" view after the MVP?
