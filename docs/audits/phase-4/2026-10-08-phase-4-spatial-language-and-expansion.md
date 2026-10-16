# Phase 4 — spatial design language, component expansion and chart packs

**Date:** 2026-10-08
**Scope:** `luc-ui/**` only.
**Status:** implemented, verified, deployed.

---

## 1. What the user asked for, and what changed

Phase 3 shipped spatial *effects* in the Motion Gallery. The correction for
Phase 4 was blunt and correct: those effects were isolated. Spatial had to
become an **identifiable, configurable design language across the whole
library**, the component catalogue had to grow toward a general-purpose set, and
the chart system had to grow toward a scientific/financial breadth target — all
three in one verified cycle.

## 2. One depth scale for the library (§4A)

Before V4.0 an interactive surface answered the pointer with Tailwind's own grey
shadow and a fixed one-pixel lift. Both were outside the theme: a palette, a
personality or `prefers-reduced-motion` could not move them.

| Token | Meaning |
| --- | --- |
| `--spatial-depth` | The scale. `1` by default; `data-space="flat"` → `0`, `data-space="deep"` → `1.6` |
| `--spatial-lift-unit` / `--spatial-sink-unit` | The resting distance unit a **personality** owns |
| `--spatial-lift` / `--spatial-lift-sm` / `--spatial-sink` / `--spatial-press-scale` | `calc(unit × depth)` — the only travel any component uses |
| `--elevation-rest` / `-hover` / `-active` / `-float` | Four rungs replacing ad-hoc `shadow-sm`/`shadow-md` |
| `--layer-2-shadow` / `--layer-3-shadow` | Two stacked depth steps: a floating menu, then a modal |
| `--well-shadow` | The sunken surface: fields, tracks, pressed toggles |

New public attribute — **`data-space="flat" | "layered" | "deep"`** — scales a
subtree's travel without touching a component. It is deliberately orthogonal to
`data-palette`, `data-typeface` and `data-personality`, because an instrument
product may still want a deep hero and a dense table may want flat rows.

New public utilities, so a consumer can build its own surface in the same
language: `luc-rest`, `luc-hover`, `luc-float`, `luc-float-high`, `luc-well`,
`luc-settle`. `luc-press` and `luc-lift` were re-pointed at the tokens (they
were hard-coded to `1px` and `0.986`).

**Personality wiring:** `instrument` 2px, `editorial` 3px, `dense` 1px,
`expressive` 4px lift units — so the four personalities now differ in *depth* as
well as geometry, density, proportion and physics.

### 2.1 Where it was applied

Not a wrapper: the recipe itself changed, family by family.

| Family | Change |
| --- | --- |
| Button / IconButton | `shadow-rest` at rest, `shadow-hover` on hover, `shadow-active` pressed, `shadow-none` disabled; accent gains a resting rung |
| Card | `default` → `shadow-rest`, `raised` → `shadow-layer-2`, `featured` → layer 2 → layer 3 with accent glow on hover; travel via `--spatial-lift` |
| Input / Select / Combobox / InputGroup | The field is a **well** (`shadow-well`) that steps *up* to `shadow-rest` on hover — which is what separates a field from a button at a glance |
| Dialog / Sheet / Command | `luc-float-high` (layer 3) |
| Popover / Tooltip / Menus / Combobox list / Select content / Slider tooltip | `luc-float` (layer 2); Popover additionally settles in |
| Menu rows | Highlight takes the surface step **and** the next shadow rung; press sinks |
| Tabs / SegmentedControl | Track is a well; the sliding indicator is `shadow-layer-2` |
| Progress / Slider | Track is a well; the thumb rises on hover |
| DataTable rows | The smallest possible gesture — a surface step plus one rung, **no travel**, because a row that moves breaks column alignment for the whole row |
| Toast | `--layer-3-shadow` |
| Calendar / DatePicker / Sheet / AppShell | Every overlay moved to the shared float rungs |

Every rung is a token, so light/dark, all seven palettes, all four personalities
and `data-space` move together. Reduced motion keeps the end state: the clamp in
`base.css` collapses the travel, and `luc-lift` is gated behind
`prefers-reduced-motion: no-preference` so there is no lift at all.

## 3. Component expansion (§4B)

### 3.1 P0 wave — zero new dependencies

All six come from the already-installed `radix-ui@1.6.7`, exactly as the Phase 3
gap study predicted.

| Component | Public symbols | Notes |
| --- | --- | --- |
| Accordion / Collapsible | `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`, `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`, `CollapsibleTriggerRow` | `card` / `flush` variants; Radix-height animation with new `luc-accordion-*` and `luc-collapsible-*` keyframes |
| AlertDialog | `AlertDialog`, `…Trigger/Content/Title/Description/Footer`, `AlertDialogAction`, `AlertDialogCancel` | Not a Dialog with a flag: `tone` defaults to `danger`, cancel is first in the footer, outside-click dismissal is removed by Radix's own contract |
| Pagination | `Pagination`, `PaginationSummary`, `paginationWindow` | Table-free; the window is a pure exported function with four unit tests; `compact` mode; locale-fixed grouping so SSR and the browser agree |
| ScrollArea | `ScrollArea`, `ScrollAreaRoot` | Two themed scrollbars plus a corner; the piece missing under several overlays |
| Toggle / ToggleGroup | `Toggle`, `ToggleGroup`, `ToggleGroupItem`, `toggleVariants` | Pressed state is *depth* (well + accent ink), not a colour flip |
| Avatar | `Avatar`, `AvatarGroup`, `AvatarRoot`, `initialsOf` | Deterministic tint hashed from the name into six semantic surfaces; CJK-aware initials; `role="img"` with one accessible name |

### 3.2 P1 wave — also zero dependencies

| Component | Public symbols |
| --- | --- |
| AspectRatio | `AspectRatio` (plus `square/video/photo/wide/portrait/ultrawide` presets) |
| Kbd | `Kbd` (extended with `variant`/`size`), `KbdGroup`, `KbdProps` |
| Label | `Label` (the required asterisk is `aria-hidden`) |
| ButtonGroup / Toolbar | `ButtonGroup`, `ButtonGroupSeparator`, `Toolbar`, `ToolbarButton`, `ToolbarSeparator`, `ToolbarLink`, `ToolbarToggleGroup`, `ToolbarToggleItem` |
| InputGroup | `InputGroup`, `InputGroupAddon`, `InputGroupInput`, `InputGroupSeparator` |
| HoverCard | `HoverCard`, `HoverCardTrigger`, `HoverCardPortal`, `HoverCardContent` |
| NativeSelect | `NativeSelect` |
| Timeline | `Timeline`, `TimelineItem` (ordered list; the rail stops at the last item) |
| Stepper | `Stepper`, `StepperStep` (`aria-current="step"`, future steps not reachable) |
| Carousel | `Carousel`, `CarouselTrack`, `CarouselItem`, `CarouselControls`, `useCarousel` |
| Rating | `Rating` (radiogroup, half steps, read-only as `role="img"`) |

Two decisions worth stating:

- **Carousel is dependency-free.** It is built on the platform's own
  `scroll-snap`, so momentum, touch, trackpad gestures and RTL come free; LUC
  adds the two things the platform lacks — controls and a keyboard contract
  (`tabindex="0"`, `role="region"`, and a polite live region that announces only
  on change). Autoplay is opt-in and never starts under reduced motion.
- **Avatar's tint is hashed, not random.** A random colour moves when a list is
  re-sorted; a hash does not. That is the difference between decoration and an
  identity cue.

**No new import paths.** All seventeen families are light and dependency-free,
so they belong on the root barrel (and `@luc/ui/charts` for the charts). The
package still exposes **34 public paths** and the catalog check is unchanged —
which is itself evidence that the P0 wave cost the consumer nothing structural.

## 4. Chart packs (§4C)

Thirty-five new public chart components in five new modules, all behind
`@luc/ui/charts`, all taking **prepared** data.

| Module | New components |
| --- | --- |
| `components/statistical-charts.tsx` | `EcdfChart`, `QqPlotChart`, `ViolinChart`, `RocCurveChart`, `CalibrationChart`, `ConfusionMatrixChart`, `ErrorBarChart`, `ResidualChart` |
| `components/scientific-charts.tsx` | `ParallelCoordinatesChart`, `PolarRoseChart`, `WindRoseChart`, `TernaryChart`, `VectorFieldChart`, `ContourChart`, `SpectrogramChart`, `ThemeRiverChart`, `RidgelineChart`, `HexbinChart` |
| `components/workflow-charts.tsx` | `GanttChart`, `DumbbellChart`, `SlopeChart`, `LollipopChart`, `BulletChart`, `BumpChart`, `MekkoChart` |
| `components/quantitative-charts.tsx` | `CandlestickChart`, `DrawdownChart`, `VolatilitySmileChart`, `EfficientFrontierChart`, `FactorExposureChart`, `PnlAttributionChart` |
| `components/multidimensional-charts.tsx` | `ScatterMatrixChart`, `HierarchyTreeChart`, `GeoScatterChart` |

Supporting changes:

- New ECharts registrations: `ThemeRiverChart`, `ParallelChart`, `MapChart`,
  `ParallelComponent`, `SingleAxisComponent`, `GeoComponent`. Each was added
  because the alternative is the classic silent no-op — an option accepted and
  never drawn.
- New public engine escape hatch `registerEChartsMap(name, geoJson)`, plus the
  `formatRatio` / `ratioAxis` / `ratioOrFormatAxis` display-mapping helpers
  exported through `chart-common`.
- **The library still computes nothing.** `formatRatio` is the one place a
  transform happens, and it is a *display* mapping at the rendering boundary —
  the same category as the V1.3 log-axis rule, where the axis maps a value and
  the tooltip keeps reporting the original. A chart never bins, smooths, fits,
  differences, integrates an AUC or solves an optimisation.
- `GeoScatterChart` scatters onto a caller-registered map; **LUC ships no map
  data** — a boundary file is large, licensed, and a political statement. The
  Showcase registers a synthetic grid to prove the mechanism.

The full type inventory, with a status for every candidate and the reason for
each non-public entry, is the public `/charts/catalog` page and
[`2026-10-08-chart-coverage-and-status.md`](./2026-10-08-chart-coverage-and-status.md).

## 5. Verification

| Check | Result |
| --- | --- |
| `pnpm verify` | **exit 0** — typecheck, lint, unit tests, catalog check, package build, publint/attw, consumer tree-shaking and bundle baseline |
| Package unit tests | **763 passed / 81 files** (was 674 / 72) |
| New tests | 54 component assertions across 8 new files, plus 35 chart assertions in one file |
| Bilingual coverage | routes 121 · headers **121/121** · nav labels **135/135** · nav descriptions **122/122** · chrome **82/82** · long-form keys **380/380** · page bodies **19/121** |
| Public paths | 34 (unchanged) |

## 6. Rejected alternatives

1. **A `SpatialCard` wrapper.** Rejected on the gap study's own rule: a Card that
   already carries the recipe needs no wrapper, and a wrapper would have created
   a second way to make a card.
2. **A `SpatialProvider` React context.** Rejected: an attribute on a subtree
   (`data-space`) is cheaper, works in server components, needs no re-render and
   composes with `data-personality`. A provider would have been React state for a
   pure CSS decision.
3. **3D transforms on every primitive.** Rejected: a data table is read, not
   browsed. Rows take the surface step and the next rung, and no travel.
4. **Carousel on `embla-carousel-react`.** Rejected: a new dependency for
   behaviour the platform already ships. The contract LUC owed was controls and
   keyboard access, not inertia.
5. **`toLocaleString()` in `PaginationSummary`.** Rejected after the V0.4
   hydration lesson: Node's default locale and the browser's differ, so the
   summary uses the locale-fixed `formatNumber`.
6. **Bullet and lollipop as “a bar with a different name”.** Rejected: each got
   its own data contract (`ranges`/`target`, stem-plus-head) so the catalogue
   count is honest rather than inflated.
7. **Shipping map data or `echarts-gl` in the base entry.** Rejected and
   recorded as *blocked*, with the reason on the public catalogue page rather
   than in a private note.

## 7. Known limitations

1. Page-body bilingual coverage is **19/121**. Navigation, chrome, page headers
   and every long-form key are complete; the remaining English-only pages are
   the older component and chart pages, whose bodies were never translated. The
   in-product language switcher states this.
2. Luc Web was **not** opened, built or tested. Every compatibility statement is
   a source-level judgement and is labelled as such in the delivery report.
3. Real-device touch was not exercised; the contracts are `touch-action`, pointer
   events, and mobile screenshots at 390px.
4. `data-space` is demonstrated on `/foundations/spatial` with a live switch but
   is not yet wired into the Showcase-wide appearance panel. That wiring is a
   Phase 5 candidate.
5. The catalogue's `engine`, `planned` and `blocked` entries are research, not
   work in progress: a choropleth `MapChart`, a chord diagram, a 3D surface and a
   route/trajectory wrapper are all still open.

## 8. Visual evidence

Screenshots live in [`screenshots/`](./screenshots). They are demonstrations, not
proof: the machine-readable evidence is `artifacts/qa-report.json` (120 routes,
358 screenshots, 185 axe scans) and `artifacts/baselines/**` (15 pixel
baselines).

| File | What it shows |
| --- | --- |
| `probe.before-components-buttons.png` · `probe.after-components-buttons.png` | The Buttons page on the Phase 3 image against the Phase 4 image. |
| `probe.before-components-cards.png` · `probe.after-components-cards.png` | The same for Cards and panels. |
| `probe.light-*` | The same pair captured after clicking the shell's light control. |
| `probe.after-foundations-spatial.png` | `/foundations/spatial`: the pre-V4 recipe beside the current one, plus the five rungs. |
| `buttons-light-desktop.png`, `charts-catalog-light-desktop.png` | Light-mode captures from the QA sweep. |
| `components-accordion-dark-desktop.png`, `components-carousel-dark-desktop.png` | Two of the new component pages, as the sweep captured them. |
| `charts-scientific-fullpage-dark.png` | The whole scientific pack on one page: parallel coordinates, ternary, polar rose, wind rose, vector field, contour, hexbin, spectrogram, theme river, ridgeline. |

**Being honest about the before/after:** in **dark** mode at rest the Buttons and
Cards pages look almost identical, and that is the design, not a failure of the
change. Dark reads depth as a luminance step plus a hairline rather than as a
drop shadow, so `shadow-rest` and the old `shadow-sm` are close by construction.
The differences that a reader actually meets are:

1. **Hover and press** — a token-driven lift and sink instead of a hard-coded
   `translateY(-1px)`, scaled by the personality and switchable to nothing with
   `data-space="flat"`.
2. **Fields** — a text field is now a *well* that steps up on hover, which is what
   separates a form row from a row of buttons.
3. **Overlays** — Dialog, Sheet, Command, Popover, Tooltip, Menus, Select and
   Combobox content all consolidate onto two shared float rungs, so two overlays
   from different families can no longer disagree about how far above the page
   they are.
4. **The new pages themselves** — `/foundations/spatial` and the fifteen new
   routes are the visible product of the cycle.

The clearest single artifact is `probe.after-foundations-spatial.png`, which puts
the pre-V4 recipe and the current one side by side on the same surface.
