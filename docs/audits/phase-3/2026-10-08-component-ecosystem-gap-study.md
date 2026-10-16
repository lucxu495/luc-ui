# Component ecosystem gap study

**Date:** 2026-10-08
**Status:** **research only.** Nothing in this document was implemented in
Phase 3, and no component listed here should be started without a product
decision to do so.

---

## 1. Method, and how the evidence was obtained

Three kinds of evidence are used, and they are kept separate:

1. **LUC UI's own registries** — `docs/component-catalog.json` (generated),
   `packages/ui/package.json` `exports`, the source tree, `qa/routes.mjs` and
   the Showcase. These are the only source for "what LUC UI has".
2. **Upstream component taxonomies, fetched today (2026-10-08)** — the shadcn/ui
   docs page (`/docs/components`, 67 documented components) and the Radix
   Primitives introduction (`/primitives/docs/overview/introduction`, 30
   primitives). Both were fetched and parsed rather than recalled; the exact
   lists are quoted in §4.
3. **The installed dependency graph** — `node_modules/radix-ui` was inspected
   directly to answer the question that actually decides cost: *is the
   behaviour already in the tree?*

Deliberately **not** done: a crawl of every library in the ecosystem. The
question is "what does a general-purpose product expect that LUC UI cannot
compose today", and two authoritative taxonomies plus a dependency audit answer
it. A P0/P1 item must be re-checked against upstream docs at implementation
time; a list of component *names* is a hypothesis, not a design.

## 2. Current inventory

| Measure | Value |
| --- | --- |
| Public import paths | **34** (`exports` keys; 31 carry symbols, 2 are CSS) |
| Runtime value symbols across those paths | **1,195** |
| Hooks | **84** |
| Chart primitives | 163 exported symbols over one entry, incl. ~30 chart families |
| Motion primitives | **78** symbols after V3.0 |
| Showcase routes | **106** page files, 105 registered in QA |

By layer:

| Layer | Home | Examples |
| --- | --- | --- |
| Primitives (behaviour) | `radix-ui` single package | Dialog, Popover, Select, Menu, Tabs, Switch, Slider, Tooltip |
| Presentational components | `packages/ui/src/components` | Button, Card, Badge, Alert, Input, EmptyState |
| Compound components | `components/*`, `app-shell/*`, `workspace/*` | Sheet, Command, Sidebar, Workspace, InspectorPane |
| Hooks | `packages/ui/src/hooks` | 14 exported hooks, incl. `useControllableState`, `usePersistentState`, `useUrlState` |
| Motion effects | `packages/ui/src/motion` | 30 modules: Reveal, Magnetic, TiltSurface, AuroraSurface, OrbitField, CardStack, SelectionBeam |
| Data / charts | `data/`, `table/`, `charts/` | DataTable, VirtualDataTable, Metric, 30 chart families, inspection + sync |
| Workspace / application | `workspace/`, `app-shell/`, `url-state/` | Workspace + panes, AppShell, navigation model, URL codecs |
| Patterns / recipes | `apps/showcase/app/patterns` | research workspace, chart-table, table filters, settings form |
| Showcase-only experiments | `apps/showcase/app/experiments` | Design Lab (three treatments) |
| Private internals | `*/core/*`, `*/adapters/*` | chart adapters, catalog generator, token resolver |

**Maturity signal, not count:** LUC UI is already *deep* in four areas —
charts, data tables, workspaces and motion — and *thin* in exactly the areas a
marketing site, an e-commerce flow or a creator platform leans on.

## 3. Coverage matrix

`+` shipped · `~` composable from what exists · `-` genuinely missing.

| # | Domain | State | What exists | What is missing |
| --- | --- | --- | --- | --- |
| 1 | Actions & buttons | + | Button (6 variants), IconButton, Link | An explicit `ButtonGroup`/`Toolbar` contract; destructive-action confirm pattern |
| 2 | Inputs & forms | + | Input, Textarea, SearchInput, Select, Combobox, Checkbox, Radio, Switch, Slider, OTP, FileInput/DropZone, TagInput, Number/Currency/Percent, Calendar/pickers, `Field` + `Form` | Colour picker, masked input, multi-select combobox, input-group compound, native select for mobile |
| 3 | Navigation | + | AppShell, Sidebar, Breadcrumbs, Tabs, SegmentedControl, `useScrollSpy` | Menubar, NavigationMenu (mega-menu), **Pagination**, Stepper, table of contents |
| 4 | Data display | + | DataTable, VirtualDataTable, Metric, Delta, StatCard, StatusBadge, Timestamp, sparklines | Avatar, timeline, tree view, virtualized tree, diff view |
| 5 | Feedback & status | + | Alert/Callout, Toast (Sonner), Skeleton, Spinner, Progress, EmptyState, StatusBadge | Notification centre / inbox, announcement banner |
| 6 | Overlays | + | Dialog, Sheet, Popover, Tooltip, DropdownMenu, ContextMenu, Command | **AlertDialog** (confirm), HoverCard, dialog-with-form recipe |
| 7 | Layout & app structure | + | AppShell, Workspace, Grid/Stack/Inline/Container, Section, Panel | **ScrollArea**, AspectRatio, Sticky/Pinned helpers |
| 8 | Charts & visualization | ++ | ~30 chart families, sync bus, inspection, export, financial + research engines | Parallel coordinates, contour/surface, network with layout, map/GIS, streaming chart |
| 9 | Motion & spatial | ++ | 78 symbols across three generations of primitives | A timeline/sequence API; scroll-driven scenes; physics beyond presets |
| 10 | Media | - | Nothing beyond the Showcase's images | Avatar, Image/Gallery, Carousel, Video/MediaPlayer, Audio, Lightbox, before/after slider |
| 11 | Rich content & editing | - | Code block (Showcase), typography roles | Rich text/Markdown editor, diff/merge, comment threads |
| 12 | Productivity & workflow | ~ | Workspace, Command, Table, URL state | Kanban, drag & drop sorting, Stepper, Guided tour, Gantt |
| 13 | Commerce patterns | - | Composable: Card + Button + Badge | Product card, price/compare-at, quantity stepper, cart line, checkout summary, reviews |
| 14 | AI application patterns | ~ | Command, Sheet, Toast, `ScrambleText`, `NumberTicker` | Streaming text, message list/scroller, chat bubble, tool-call timeline, prompt input, cost meter |
| 15 | Accessibility utilities | + | Focus management in every primitive, `ChartInspectionArea` + `ChartDataTable`, `FormErrorSummary`, skip link | Public visually-hidden utility, focus-trap primitive for custom overlays, announcement helper |
| 16 | Mobile & responsive | ~ | Sheet-based mobile nav, `touch-action` contracts, coarse-pointer gating | Swipeable row/item, snap points, pull-to-refresh, safe-area helpers |

## 4. What the upstream taxonomies say

Fetched 2026-10-08.

**shadcn/ui (67):** accordion, alert, alert-dialog, aspect-ratio, avatar, badge,
breadcrumb, button, button-group, calendar, card, carousel, chart, checkbox,
collapsible, combobox, command, context-menu, data-table, date-picker, dialog,
drawer, dropdown-menu, empty, field, hover-card, input, input-group, input-otp,
item, kbd, label, marker, menubar, message, message-scroller, native-select,
navigation-menu, pagination, popover, progress, questionnaire, radio-group,
resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider,
sonner, spinner, switch, table, tabs, textarea, toggle, toggle-group, tooltip,
typography.

**Radix Primitives (30):** accordion, alert-dialog, aspect-ratio, avatar,
checkbox, collapsible, context-menu, dialog, dropdown-menu, form, hover-card,
label, menubar, navigation-menu, one-time-password-field, password-toggle-field,
popover, progress, radio-group, scroll-area, select, separator, slider, switch,
tabs, toast, toggle, toggle-group, toolbar, tooltip.

### The finding that changes the cost model

`radix-ui@1.6.7` is **already a dependency** of `@luc/ui`. Inspecting the
installed package directly:

```
Accordion ok  AlertDialog ok  AspectRatio ok  Avatar ok  Collapsible ok  HoverCard ok
Label ok  Menubar ok  NavigationMenu ok  ScrollArea ok  Toggle ok  ToggleGroup ok  Toolbar ok
```

**Thirteen components that appear as gaps above need no new dependency at all** —
only LUC's visual language, tests, documentation and a Showcase page. The
remaining expensive items (rich text, video, drag & drop, virtualized tree,
Kanban) are expensive because of *behaviour*, not packaging, so each needs its
own dependency decision.

## 5. Prioritised expansion roadmap

Tiers: **P0** essential foundation · **P1** high-demand general · **P2**
strategic differentiation · **P3** specialised.

| Priority | Component | Why it is worth it | Dependencies | Est. size | a11y risk | Entry | Tier |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P0 | `Accordion` + `Collapsible` | The commonest content pattern on any marketing or documentation page; Radix already in tree | none | < 1 KB | low | Community | Community |
| P0 | `AlertDialog` | A destructive action deserves a known confirm dialog, not a hand-rolled one | none | < 1 KB | medium (focus, default action) | Community | Community |
| P0 | `Pagination` | Every list and table page needs it; `DataTablePagination` is table-bound | none | < 1 KB | low | Community | Community |
| P0 | `ScrollArea` | Themed scrollbars, and the missing piece of several overlays | none | ~1 KB | low | Community | Community |
| P0 | `ToggleGroup` + `Toggle` | SegmentedControl covers single-select only | none | < 1 KB | low | Community | Community |
| P0 | `Avatar` (+ fallback, group) | Identity in lists, comments, tables, headers | none | < 1 KB | low | Community | Community |
| P1 | `AspectRatio`, `Kbd`, `Label` | Trivial, recurring, currently re-written per product | none | < 0.5 KB each | none | Community | Community |
| P1 | `ButtonGroup` / `Toolbar` | Toolbars appear in every dense app; `Toolbar` is in Radix | none | < 1 KB | low | Community | Community |
| P1 | `InputGroup` | The adornment slot exists internally; the compound contract does not | none | < 1 KB | low | Community | Community |
| P1 | `HoverCard` | Profile and preview hover content; distinct from Tooltip in delay and content | none | < 1 KB | low | Community | Community |
| P1 | `Menubar` + `NavigationMenu` | Application menus and marketing mega-menus | none | ~2 KB | medium (roving focus) | Community | Community |
| P1 | `NativeSelect` | The platform picker on small screens | none | < 0.5 KB | none | Community | Community |
| P1 | `Carousel` | Media rails; must not be `Marquee` or `CardStack` | none (or `embla-carousel-react`, ~5 KB) | 1–6 KB | medium (keyboard, autoplay) | Community | Community |
| P1 | `Timeline` | Changelogs, activity, step history, agent traces | none | < 1 KB | low | Community | Community |
| P1 | `Stepper` | Checkout, onboarding, wizards | none | < 1 KB | low | Community | Community |
| P2 | `StreamingText` + `Message` + `MessageScroller` | The AI surface: token-by-token text in a list that keeps scroll position | none (motion already present) | ~2 KB | medium (live regions) | Community | Community |
| P2 | `ToolExecutionTimeline` | Agent traces: steps, states, durations, nested calls | none | ~2 KB | low | Community | Community |
| P2 | `TreeView` (+ virtualized) | Settings trees, file explorers, JSON inspectors | none | 2–4 KB | medium (tree semantics) | Community | Strategic |
| P2 | `DragSortList` | The single most requested missing interaction; the base for Kanban | `@dnd-kit/core` (~10–12 KB gz) or hand-rolled pointer logic | 10+ KB | high (keyboard equivalent) | `@luc/ui/dnd` | Strategic |
| P2 | `GuidedTour` | Onboarding anchored to real elements — `SelectionBeam` already measures anchors | none | ~2 KB | medium (focus return) | Community | Strategic |
| P2 | `NotificationCenter` | Inbox pattern built on Sheet + list + Toast primitives | none | ~2 KB | low | Community | Strategic |
| P3 | `ColorPicker` | Needs colour-space work to be accessible, not just a hex field | OKLCH maths or a colour library | 4–8 KB | medium | Community | Specialised |
| P3 | `MediaPlayer` + `ImageGallery` | Real media components | browser primitives; gallery is LUC-only | 2–6 KB | medium | `@luc/ui/media` | Specialised |
| P3 | `RichTextEditor` | A category, not a component: schema, serialisation, history, IME | Tiptap/Lexical (60–120 KB) | large | very high | optional adapter | Possible Pro |
| P3 | `Kanban` | Depends on `DragSortList`; genuinely useful for workflow products | dnd layer | 12+ KB | high | optional | Possible Pro |
| P3 | `Gantt` / planner | Timeline scheduling with virtualized bars | table + virtual layers | 10+ KB | medium | optional | Possible Pro |
| P3 | Advanced chart families (parallel coordinates, contour, network, map) | Deepens an existing strength; each is weeks of work | ECharts registrations | +8–20 KB each | low | `@luc/ui/charts` | Strategic / Pro |

### Sequence and dependencies

```
P0 wave (zero new dependencies, all small)
  Accordion + Collapsible | AlertDialog | Pagination | ScrollArea
  Toggle + ToggleGroup | Avatar
        |
        +--> P1 wave
        |      AspectRatio / Kbd / Label | ButtonGroup / Toolbar | InputGroup
        |      HoverCard | Menubar / NavigationMenu | NativeSelect | Timeline | Stepper
        |            |
        |            +--> Carousel (independent)
        |            +--> P2 AI wave: StreamingText, Message list, ToolExecutionTimeline
        |            |        +--> GuidedTour, NotificationCenter
        |            +--> dnd layer --> DragSortList --> Kanban
        |            +--> TreeView (independent, virtualized)
```

Nothing in the P0 wave blocks anything else. It is the cheapest visible
improvement available to the library, and it is where a Phase 4 should start.

## 6. Community vs optional vs future Pro

The rule applied here: **a component belongs in the Community Edition if a
competent alternative is free today**, because withholding it does not sell
anything — it only makes the free library look incomplete.

| Tier | Rule | Examples from this study |
| --- | --- | --- |
| **Community, main entry** | Small, general, expected in any product; behaviour already in the dependency graph | Accordion, Collapsible, AlertDialog, Pagination, ScrollArea, ToggleGroup, Avatar, Timeline, Stepper, AspectRatio, Kbd, Label |
| **Community, own entry point** | Large or dependency-heavy, so a consumer must opt in | `@luc/ui/dnd`, `@luc/ui/media`, streaming/AI helpers |
| **Optional** | Needs a heavyweight or opinionated dependency, or a domain commitment | Rich text adapter, Kanban, Gantt |
| **Possible future Pro** | Substantial engineering that saves real time *on top of* a complete free product | advanced workspace compositions, advanced chart families, scheduling, agent-evaluation dashboards |

Explicitly rejected: paywalling Avatar, Pagination, Accordion, AlertDialog,
ToggleGroup, ScrollArea or HoverCard. They are table stakes.

## 7. API and composition recommendations

These follow the composition guidance the project already applies: compound
components over boolean props, explicit variants over modes, composable slots
over `renderX` props.

1. **Confirm is a variant, not a new visual language.** `AlertDialog` reuses
   `Dialog`'s surface and adds only `confirmLabel` / `cancelLabel` / `tone`,
   plus focus-on-cancel so a destructive default is never the first focus
   target.
2. **`ToggleGroup` must not be `SegmentedControl` with a `multiple` prop.**
   Segmented control is a single choice with a sliding indicator; a toggle group
   is independent switches. Two contracts, two components.
3. **`Pagination` should be table-free.** `DataTablePagination` stays as the
   table's binding; the generic `Pagination` takes
   `page`, `pageCount`, `siblings`, `onPageChange` and exposes a
   `PaginationSummary` slot.
4. **`Carousel` needs a contract, not a track.** Required accessible name,
   autoplay pauses on hover and focus, `Carousel` / `CarouselItem` /
   `CarouselControls` as composable pieces (the `CardStackControls` shape).
5. **AI components are data contracts.** `StreamingText` takes a
   `ReadableStream` or async iterable plus a `renderChunk` policy; the live
   region is `polite` and throttled, because announcing every token is hostile.
   `ToolExecutionTimeline` takes a plain `steps[]` of
   `{ id, label, status, startedAt?, durationMs?, detail? }` with no provider
   assumptions.
6. **The dnd layer must be keyboard-complete.** A drag-and-drop component that
   cannot be operated from the keyboard is not a component: the P2 item includes
   move-up/move-down affordances and a polite announcement, shipped in the same
   release as the pointer behaviour.

## 8. Dependency and import-cost analysis

Measurements live in
[`2026-10-08-package-modularity-audit.md`](./2026-10-08-package-modularity-audit.md).
The conclusions that bear on this roadmap:

1. **The P0 wave adds no dependency and no new entry point** — all of it comes
   from the already-installed `radix-ui`, at well under 1 KB each after
   tree-shaking.
2. **New heavy capabilities get their own entry points**, following the existing
   pattern (`@luc/ui/tradingview`, `@luc/ui/charts`, `@luc/ui/financial-chart`).
   The dnd layer, media and an editor adapter must not be reachable from the
   barrel; the consumer harness already forbids that shape.
3. **The barrel is a convenience, not a delivery mechanism.** It is 14.4 KB raw
   today; a product that imports three families from the root pays for what those
   families reach, and the consumer harness proves the subpaths stay isolated.
4. **CSS stays side-effectful and explicitly opt-in.** One `styles.css` import,
   CSS variables for tokens, and no component ships a `<style>` tag — so a new
   component costs CSS bytes, not JavaScript bytes.

## 9. Agent- and MCP-ready metadata

The catalog already carries `import`, `source`, `packed`, `status`,
`recommended` and per-symbol `name`/`kind`/`signature`/`source`. The next step is
additive and needs no new generator:

| Field | Why an agent needs it | Source available today |
| --- | --- | --- |
| `category` | "Is there a component for X?" is the first agent question | the Markdown catalog's category column |
| `intent` (one sentence) | Distinguishes Card from Panel, Alert from Callout | component JSDoc, already written |
| `variants` / `states` | Prevents inventing props | prop types + CVA maps |
| `motion` | Whether the component joins the intensity profile | `useMotionProfile` call sites |
| `a11y` | Roles, keyboard contract, required label props | partly in `ACCESSIBILITY.md` |
| `runtime` | `client` / `server` / `browser-only` | `"use client"` markers |
| `peer` / `optional` | What a consumer must install | `package.json` + entry |
| `weight` | Small / medium / heavy | `bundle-baseline.json` |
| `recipes` | How to compose it | Showcase pattern pages |
| `example` | A copyable snippet | Showcase pages |

Recommendation: extend `generate-catalog.mjs` to emit these fields (JSDoc tags
plus the two generated sources), and let both the documentation site and any
future MCP server read that single file. **Do not build an MCP server now** —
the metadata is the prerequisite, and it is useful on its own.

## 10. What this study deliberately did not do

- No new component was implemented, and no entry point was created.
- No licence decision was made about Tiptap / Lexical / dnd-kit; each gets its
  own review (`docs/research/license-matrix.md`) before it enters the tree.
- No claim is made that a fetched component *name* implies a fetched *API*:
  every P0/P1 item must be re-checked against the upstream contract at
  implementation time.
- The finance and analytics strengths were not pushed further. This study exists
  because the library has to generalise beyond them.
