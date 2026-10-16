# Phase 7 — coverage ledger

Generated from the public exports (`docs/component-catalog.json`), the canonical
chart registry (`apps/showcase/components/charts/chart-catalog-data.ts`), the QA
route registry (`apps/showcase/qa/routes.mjs`) and the behaviour registry
(`apps/showcase/qa/behaviour.mjs`). Numbers are the state after the Phase 7
changes.

## 1. Public surface

| Surface | Count | Source of truth |
| --- | --- | --- |
| Public entry paths | **34** | `packages/ui/package.json` `exports`, resolved by `catalog:check` |
| Root barrel value exports | 720 | `docs/component-catalog.json` → `.` |
| …of which capitalised components under `src/components/` | 194 | ibid. |
| `@luc/ui/charts` value exports | 214 | ibid. → `./charts` |
| …of which chart components | 91 | ibid. |
| Type exports (all paths) | 1 256 | ibid. |
| Motion export paths' value exports | 60 | ibid. → `./motion` |

## 2. Coverage by family

Legend: **audited** = looked at in a browser with the structural probe and a
demo-level capture; **interaction** = driven by a behaviour check; **a11y** =
inside the axe sweep; **bilingual** = inside the i18n coverage run.

| Family | Public components (approx.) | audited | interaction | a11y | bilingual |
| --- | --- | --- | --- | --- | --- |
| Actions (Button, IconButton, ButtonGroup, Toggle, Toolbar) | 8 | ✔ | ✔ | ✔ | ✔ |
| Forms (Input, Textarea, SearchInput, InputGroup, NativeSelect, Select, Combobox, Checkbox, Radio, Switch, Slider, Number, Password, OTP, TagInput, FileUpload, ColorPicker, TransferList, date/time) | 34 | ✔ | ✔ | ✔ | ✔ |
| Navigation (Tabs, SegmentedControl, Pagination, Breadcrumbs, TreeView, Stepper, Command, Sidebar) | 12 | ✔ | ✔ | ✔ | ✔ |
| Surfaces & content (Card, Avatar, Badge, Tag, HoverCard, Accordion, Collapsible, Timeline, Carousel, ImageGallery, Lightbox, ImageCompare) | 20 | ✔ | ✔ | ✔ | ✔ |
| Overlays & feedback (Dialog, AlertDialog, Sheet, Popover, Tooltip, Menu, ContextMenu, Toast, NotificationCenter, GuidedTour, Skeleton, Progress, EmptyState) | 21 | ✔ | ✔ | ✔ | ✔ |
| Productivity (SortableList, KanbanBoard, Workspace, Inspector, DataTable, VirtualDataTable) | 10 | ✔ | ✔ | ✔ | ✔ |
| AI (ChatMessage, MessageList, StreamingText, PromptComposer, ToolCallTimeline, AgentActivity) | 6 | ✔ | ✔ | ✔ | ✔ |
| Motion (PressRipple, AuroraSurface, BeamFlow, MagnifyDock, Marquee, ParallaxScene, OrbitField, ExpandableSurface, KineticHeadline, CardStack, SelectionBeam, +) | 60 exports | ✔ | ✔ | ✔ | ✔ |
| Charts | 91 components | ✔ | ✔ | ✔ | ✔ |

Non-visual public surface — hooks (`use-controllable-state`, `use-media-query`,
`use-persistent-state`, `use-reduced-motion`, `use-scroll-spy`, `use-spotlight`,
`use-flash-target`, `use-isomorphic-layout-effect`), providers, `url-state`,
formatters and pure utilities — is covered by unit tests rather than by the
visual probe, which is the right contract for a hook: it has no box to measure.

## 3. Charts

Canonical registry reconciliation (unchanged from Phase 6, re-verified):
**81 documentation entries = 79 public rows = 76 distinct plot types + 2
variants + 1 composition**, drawn by **78 distinct public components** across
**3 renderers** (ECharts, Lightweight Charts, canvas projection), plus 5 further
variants, 1 planned (`parallel-sets-alluvial`) and 1 blocked
(`3d-globe-extruded-map`).

| Verification | Coverage |
| --- | --- |
| Rendered-output (pixel) probe | **126 plots / 126 paint** — 0 blank |
| Data-fidelity assertions | **10 / 10** |
| Unit contracts (data ⇄ axis format) | **11 / 11** |
| Registry integrity (`catalog:charts`) | every symbol resolves against `@luc/ui/charts`; duplicate ids rejected |

## 4. Routes

| Metric | Value |
| --- | --- |
| Showcase routes on disk | 131 |
| Registered for browser QA | **131** (was 130; `/charts/uncertainty` added) |
| Route sweeps run in Phase 7 | 131 (desktop dark; light/mobile where the route declares them) |
| Screenshots captured in the final `qa:full` | 389 |
| axe scans (Chromium) | 204 |
| axe scans (Firefox cross-browser pass) | 29 |
| Chinese rendering check (live container) | 131 / 131 routes with no English prose leak |

## 5. Behaviour

Eleven groups run in a fixed order — `html`, `primitives`, `data`, `forms`,
`charts`, `application`, `navigation`, `motion`, `spatial`, `providers` and
`components` (new in Phase 7) — for **93 asserted checks, all passing** on the
deployed container. The `components` group is 12 checks over the Phase 4/5
families the earlier sweeps only screenshotted: accordion, tree view, image
gallery → lightbox → focus return, image compare, carousel, sortable list and
kanban reorder, notification centre, colour picker, transfer list, the AI stream
and composer, rating, and pagination.

## 6. Classification of everything above

| Status | Meaning |
| --- | --- |
| PASS / FIXED_AND_VERIFIED | measured, with the measurement named in the verification log |
| NOT_YET_REVIEWED | listed in the audit's "what remains open" |
| BLOCKED | WebKit (host libraries); three chart assertions until the measurement fix landed |

Nothing in this ledger is marked verified because a parent route had a
screenshot. A route screenshot is a route-level fact; a component-level claim is
evidenced by a demo-level capture, a behaviour check, or both.
