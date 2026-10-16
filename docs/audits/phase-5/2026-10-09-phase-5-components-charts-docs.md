# Phase 5 — component ecosystem, scientific charts, bilingual closure

Date: 2026-10-09 (Asia/Singapore). Package: `@luc/ui@1.0.0` (unreleased).
Base revision: `main` @ `fce36146`, working tree (nothing committed).

This is the technical record behind the Chinese terminal report. It states what
was implemented, what was verified with which command, and — separately — what
was *not* finished. Definitions used below:

- **Verified**: a command was run against this tree and its output is quoted.
- **Implemented, not fully verified**: the code exists and typechecks, but the
  check that would prove it in a browser was not run.
- **Planned / blocked / deferred**: explicitly not shipped.

---

## 1. Scope delivered

| Workstream | Status |
| --- | --- |
| 5A general components | Delivered: 12 new families in 11 files |
| 5B scientific/financial charts | Delivered: 10 new public chart types in 4 modules |
| 5C spatial design integration | Delivered: `data-space` in the global Appearance control |
| 5D bilingual bodies | **Partial**: mechanism + 10 new bilingual pages; 102 legacy routes still English-body |
| 5E verification + deploy | Delivered (see §6, §7) |

No dependency was added. No public export was removed or re-typed. The public
entry-point count stays at 34 (`pnpm --filter @luc/ui catalog:check`).

---

## 2. Phase 5A — new component families

All are exported from the root barrel **and** reachable from the documented
subpaths (`@luc/ui/forms` for field-shaped controls). Every one has a unit test
and a Showcase page in both languages.

| File | Public API | Notes |
| --- | --- | --- |
| `components/tree-view.tsx` | `TreeView`, `treeBranchIds`, `findTreeNode` | `tree`/`treeitem`, roving tabindex, `aria-level/setsize/posinset`, `*` expands the level |
| `components/file-upload.tsx` | `FileUpload` | Controlled transfer list; browser owns selection, the app owns transfer; rejections are reported, never dropped |
| `components/color-picker.tsx` | `ColorPicker` + `utils/color.ts` (`parseHexColor`, `formatHexColor`, `rgbToHsv`, `hsvToRgb`, `contrastRatio`, `readableInk`) | Pointer square is a shortcut; keyboard path is three sliders + a hex field |
| `components/transfer-list.tsx` | `TransferList` | Two listboxes, one Tab stop each, `aria-activedescendant`, Ctrl/Cmd+A |
| `components/notification-center.tsx` | `NotificationCenter` | Unread badge, mark-all-read, dismiss; panel open state stays local |
| `components/guided-tour.tsx` | `GuidedTour`, `TourStep` | Selector-driven spotlight drawn with one box-shadow; Escape + focus restore |
| `components/sortable-list.tsx` | `SortableList`, `SortableAnnouncer` | Native HTML drag + keyboard pick-up/move/drop with a polite live region |
| `components/kanban-board.tsx` | `KanbanBoard`, `KanbanMove` | Two-axis sortable; controlled (`onMove` reports intent) |
| `components/image-gallery.tsx` | `ImageGallery`, `Lightbox` | Viewer built on the shared `Dialog` (focus trap, Escape, scroll lock) |
| `components/image-compare.tsx` | `ImageCompare` | A real `<input type="range">` over the two images |
| `components/ai.tsx` | `ChatMessage`, `MessageList`, `StreamingText`, `PromptComposer`, `ToolCallTimeline`, `AgentActivity` | Provider-neutral; renders only what the application supplies |

Deliberate API decision: `ChatMessage` takes **`from`**, not `role`. A prop named
`role` on a component that renders a DOM element collides with the ARIA
attribute and makes `eslint-plugin-jsx-a11y` report a false "invalid aria role"
error on every consumer call site. The rule fired on our own test file, which is
how it was found.

### Not implemented from the 5A candidate list

| Candidate | Why |
| --- | --- |
| MegaMenu / advanced NavigationMenu | Requires a new composition contract (hover-intent + portal focus); deferred rather than half-built |
| Rich text editor | A heavyweight dependency in the core graph; belongs behind an optional entry point |
| Media player controls | No demand evidence inside this repo; `<audio>`/`<video>` styling is not the gap |
| Transferable `Dropzone` variants | `DropZone`/`FileInput` (V0.4) already cover the field case; `FileUpload` adds the transfer list |

---

## 3. Phase 5B — new chart types

Four modules under `packages/ui/src/charts/components/`, all re-exported from
`@luc/ui/charts` and the root barrel:

| Module | Public types |
| --- | --- |
| `diagnostic-charts.tsx` | `AutocorrelationChart`, `SurvivalCurveChart`, `PrecisionRecallChart`, `FeatureImportanceChart` |
| `network-charts.tsx` | `ChordChart`, `DendrogramChart`, plus the pure `chordLayout()` |
| `geo-charts.tsx` | `ChoroplethChart`, `GeoTrajectoryChart`, plus the pure `unwrapLongitudes()` |
| `surface3d-charts.tsx` | `Surface3DChart`, `VolatilitySurfaceChart` |

### Data contracts (what the caller must supply)

| Chart | Contract |
| --- | --- |
| `AutocorrelationChart` | Lag correlations per series **and** the significance band half-width. No band supplied → no band drawn. |
| `SurvivalCurveChart` | Step estimates per arm plus censoring marks. Nothing is interpolated or inferred. |
| `PrecisionRecallChart` | Recall/precision pairs per threshold plus the no-skill prevalence, drawn as a dashed line. |
| `FeatureImportanceChart` | Value per feature plus an optional supplied interval; `signed` switches magnitude colouring for sign colouring. |
| `ChordChart` | A square matrix; negative and non-finite cells are ignored rather than reversed. |
| `DendrogramChart` | Leaf order plus the caller's own merges (`id`, `left`, `right`, `height`). |
| `ChoroplethChart` | A map name already registered with `registerEChartsMap` plus a value per region; `null` renders as no-data. |
| `GeoTrajectoryChart` | Longitude/latitude polylines; `unwrap` shifts a leg that crosses ±180° for display only. |
| `Surface3DChart` | A grid of z values, axis labels, and controlled/uncontrolled azimuth + elevation. Non-finite cells are holes. |
| `VolatilitySurfaceChart` | A **grid** of implied volatilities — interpolating quotes into a grid is modelling and stays outside the library. |

### The 3D decision (documented, not hidden)

`echarts-gl` is **not** installed and was not installed. It would be a second
renderer plus a GPU context in the dependency graph of every
`@luc/ui/charts` consumer, and adding it would have required writing the shared
root lockfile, which is outside this task's write scope. Instead:

`Surface3DChart` implements a real 3D surface with no dependency at all:
azimuth/elevation rotation, orthographic projection, quads sorted by depth and
painted back to front in a single `custom` series `renderItem` (one item, one
group, so the painter's algorithm orders the whole mesh globally rather than by
data index). Rotation is available from the pointer (drag) and the keyboard
(arrows, Shift for elevation) and the view is fully controllable through props.
The measured reason for rejecting the WebGL route is recorded in the component's
header comment and on `/charts/surfaces`.

### Chart catalogue

`/charts/catalog` is the public source of truth and is computed from its own
data, not typed by hand. After Phase 5 it reports **81 documented entries: 78
public, 1 engine, 1 planned, 1 blocked**, naming **78 distinct public
components**. It now also lists a "variants, not types" table (adjacency matrix,
alluvial, 2D volatility heatmap, mirrored ridgelines, rolling risk panel) so the
count cannot be inflated by counting a renderer reuse as a new plot type.

`AutocorrelationChart`'s band, `ChordChart`'s arcs and `Surface3DChart`'s mesh
are all drawn in **pixel** space via `api.coord` / `getWidth` — the class of bug
that produced three blank charts in Phase 4.

---

## 4. Phase 5C — spatial design integration

`data-space="flat|layered|deep"` (V4.0) is now a **global product control** in
the Showcase shell, next to palette, type voice and personality:

- `apps/showcase/lib/appearance.ts` — `SPACES`, `DEFAULT_SPACE`, `isSpace`,
  `SPACE_STORAGE_KEY`, and the pre-paint `appearanceInitScript` now writes
  `root.dataset.space`.
- `apps/showcase/lib/use-appearance.ts` — reads and applies `data-space` through
  the same DOM-as-source-of-truth store, persisted like the other two.
- `apps/showcase/components/shell/appearance-control.tsx` — a fourth section whose
  swatch demonstrates its own level (each swatch carries `data-space`).

Because the attribute rescales the shared lift/press tokens, it affects every
ordinary component that uses the spatial vocabulary rather than one demo page.
The new families use the same vocabulary: wells for selected rows
(`TreeView`, `TransferList`), lift for draggable surfaces (`SortableList`,
`KanbanBoard`), float for the tour card and the composer.

---

## 5. Phase 5D — bilingual status (honest)

`node apps/showcase/scripts/i18n-coverage.mjs` — the script counts what a
Chinese-speaking reader actually receives:

| Surface | Coverage |
| --- | --- |
| Routes on disk | 131 (130 registered in QA) |
| Page headers | 131/131 (100%) |
| **Page bodies (long-form)** | **29/131 (22%)** |
| Navigation labels | 145/145 (100%) |
| Navigation descriptions | 132/132 (100%) |
| Chrome strings | 82/82 (100%) |
| Long-form content keys | 580/580 (100%) |

The ten Phase 5 pages were written bilingual at creation, so bodies moved
29 → 29 from a base of 19 (the 10 new routes are the delta). **102 legacy routes
still render their long-form body in English.** They are enumerated by
`node apps/showcase/scripts/i18n-coverage.mjs --missing`. This is reported as
unfinished work, not as coverage.

What *is* complete: page headers, navigation (labels and descriptions), shell
chrome, and every long-form key that exists — the dictionary has **zero**
missing keys and **zero** orphans (an orphan is a translation with no English
source, which would render as a raw key).

---

## 6. Verification (commands and results)

Run from `luc-ui/`:

| Command | Result |
| --- | --- |
| `pnpm typecheck` | exit 0 — `packages/ui`, `apps/showcase`, `luc-web` |
| `pnpm lint` | exit 0 — `eslint --max-warnings 0` in all three |
| `pnpm verify` | exit 0 — typecheck + lint + unit tests + `catalog:check` + `build:package` + `verify:package` (publint) + `test:consumer` + `verify:types` (attw) |
| `node apps/showcase/scripts/i18n-coverage.mjs` | exit 0 — the table above |
| `pnpm qa:full` | see §7 |

### Consumer bundle measurements (from `pnpm verify` → `test:consumer`)

| Scenario | Raw | Gzip |
| --- | --- | --- |
| `button-only` | 10.9 KB | 3.6 KB |
| `menus` | 2.9 KB | 1.2 KB |
| `surfaces` | 4.5 KB | 1.6 KB |
| `motion-spatial` | 6.1 KB | 2.2 KB |
| `forms-core` | 14.2 KB | 4.2 KB |
| `components-v4` | 17.6 KB | 5.4 KB |
| `data-table-only` | 21.2 KB | 6.5 KB |
| `charts-statistical` | 44.2 KB | 13.3 KB |
| `charts-financial` | 42.5 KB | 13.0 KB |
| `financial-engine` | 33.8 KB | 10.7 KB |
| `barrel` (root import) | 14.5 KB | 4.6 KB |

No budget was raised. The `barrel` scenario grows with the root barrel — that is
inherent to importing the whole barrel, and it is why the subpath scenarios
exist. `button-only` is unchanged, and the isolation assertion ("subpath imports
stay isolated") still passes, which is the check that would have caught a new
component leaking a chart engine into the base entry.

---

## 7. Deployment

| Item | Value |
| --- | --- |
| Compose project / service | `luc-ui` / `showcase` |
| Container | `luc-ui-showcase` |
| Endpoint | `127.0.0.1:3000` (loopback only) |
| Previous image | `luc-ui/showcase:1.0.0` = `sha256:ddd6cb73c344…` |
| Rollback tag | `luc-ui/showcase:rollback-20261009-pre-phase-5` (same digest, tagged before the rebuild) |
| Build | `docker compose up -d --build` from the working tree, triggered by `pnpm qa:full` |

Earlier rollback tags are preserved: `rollback-20261008-pre-phase-4`,
`-pre-visual-transform`, `-pre-phase-2`. No prune, no broad process kill, and no
other service was restarted.

The live QA tier, route counts, screenshots, axe results and console findings
produced by `pnpm qa:full` against the rebuilt container are recorded in
`docs/audits/phase-5/2026-10-09-verification-log.md`.

---

## 8. Compatibility

Classification for Luc Web: **COMPATIBLE** at the source level.

- Nothing was removed or re-typed. All Phase 5 additions are new exports.
- The only visual change that reaches existing consumers is the V4.0 spatial
  vocabulary (`data-space` is opt-in; the default `layered` equals the V4.0
  behaviour) and the new `data-space` control in the Showcase shell, which is
  Showcase-only.
- Luc Web was **not** built, opened or visually tested in this cycle. Its
  `typecheck` and `lint` ran as part of the workspace gate and pass. A visual
  regression pass against this revision is the remaining consumer task.

---

## 9. Remaining backlog (explicit)

1. **102 English-only long-form page bodies** — enumerated by
   `i18n-coverage.mjs --missing`.
2. **Drag-and-drop across lists** beyond `KanbanBoard` (a virtualised
   `SortableList` for 1,000+ rows).
3. **Rich text / code editor** entry point — needs an optional dependency
   boundary before it can exist at all.
4. **Parallel sets / alluvial** chart (categorical flows) — planned, listed in
   the catalogue.
5. **3D geographic (globe, extruded map)** — blocked: requires `echarts-gl`.
6. **A visual regression pass on Luc Web** against this revision.
