# LUC UI — source registry

Every LUC component, and where its design came from. This file is the honest
record of what is **ours**, what is a **dependency**, and what is an
**independent reimplementation of an idea**.

Rule: if a row says `REIMPLEMENT_IDEA`, no upstream source was copied,
translated line-by-line, or vendored. Behaviour was observed from public demos
and documentation, then implemented against LUC tokens.

## Legend

| Usage | Meaning |
| --- | --- |
| `ORIGINAL` | Designed for LUC UI, no upstream counterpart studied. |
| `DEPENDENCY` | Composed directly on an installed package's public API. |
| `REIMPLEMENT` | An upstream idea, implemented independently for LUC. |
| `REFERENCE` | Upstream used only to inform rules or documentation. |

## Components

| LUC component | Inspiration | Upstream repository / pattern | License | Usage | Modifications / notes | Attribution required |
| --- | --- | --- | --- | --- | --- | --- |
| `Button`, `buttonVariants` | shadcn/ui variant recipe pattern | shadcn-ui/ui | MIT | REFERENCE | Variants as cva data; LUC visual language, sizes and press behaviour | no (no code copied) |
| `IconButton` | LUC | — | — | ORIGINAL | Square control scale, required `label` | no |
| `Link` | LUC | — | — | ORIGINAL | Underline-on-hover that never shifts layout | no |
| `Input`, `Textarea`, `SearchInput` | LUC | — | — | ORIGINAL | Shared shell contract so states cannot drift | no |
| `Field` | Mantine, Chakra | mantinedev/mantine, chakra-ui/chakra-ui | MIT | REFERENCE | LUC owns id/ARIA wiring through a context | no |
| `Checkbox` | Radix behaviour + Animate UI motion idea | radix-ui/primitives, imskyleen/animate-ui | MIT / MIT+Commons Clause | DEPENDENCY + REIMPLEMENT | Tick is a `stroke-dashoffset` draw on our own SVG path. No Animate UI source copied | Radix notice via npm |
| `Radio`, `RadioGroup` | Radix behaviour + Motion Primitives motion idea | radix-ui/primitives, ibelick/motion-primitives | MIT / MIT | DEPENDENCY + REIMPLEMENT | CSS scale with `--ease-overshoot`; no upstream code | Radix notice via npm |
| `Switch` | Radix behaviour + LUC press "squish" | radix-ui/primitives | MIT | DEPENDENCY + ORIGINAL | CSS transform only; no spring library | Radix notice via npm |
| `Tabs` | Motion Primitives / Magic UI sliding indicators | ibelick/motion-primitives, magicuidesign/magicui | MIT / MIT | DEPENDENCY + REIMPLEMENT | Radix Tabs for semantics; our own measurement hook slides one indicator (`useSlidingIndicator`) | Radix notice via npm |
| `SegmentedControl` | Park UI / shadcn segmented patterns | chakra-ui/park-ui, shadcn-ui/ui | MIT | DEPENDENCY + REIMPLEMENT | Radix ToggleGroup for single-selection semantics; shared thumb | Radix notice via npm |
| `Badge`, `Tag`, `StatusBadge` | Tremor status pills, LUC vocabulary | tremorlabs/tremor | Apache-2.0 | REFERENCE | LUC tone set and status presets; no Tremor code | no |
| `Card`, `Panel` (+ subcomponents) | shadcn composition pattern | shadcn-ui/ui | MIT | REFERENCE | LUC surface philosophy: luminance steps and hairlines, no baked-in effects | no |
| `Separator` | Radix | radix-ui/primitives | MIT | DEPENDENCY | Adds an `ornament` variant | Radix notice via npm |
| `Tooltip` | Radix + LUC motion | radix-ui/primitives | MIT | DEPENDENCY | Direction-aware CSS keyframes, themed overlay surface, keyboard hint slot | Radix notice via npm |
| `Popover` | Radix + LUC surface | radix-ui/primitives | MIT | DEPENDENCY | Shared overlay entrance/exit keyframes | Radix notice via npm |
| `Dialog` (+ header/body/footer) | Radix + LUC composition | radix-ui/primitives | MIT | DEPENDENCY | One foundation with a top hairline highlight; reduced-motion fade | Radix notice via npm |
| `Skeleton`, `SkeletonText` | Magic UI shimmer idea, Uiverse loaders | magicuidesign/magicui, uiverse-io/galaxy | MIT / MIT | REIMPLEMENT | LUC shimmer band on the standard easing, disabled under reduced motion | no |
| `Spinner` | Uiverse loader pool | uiverse-io/galaxy | MIT | REIMPLEMENT | Single arc; rotates, or pulses under reduced motion | no |
| `Progress` | LUC | — | — | ORIGINAL | Determinate and indeterminate (single sweep) | no |
| `BorderGlow` | React Bits `BorderGlow` behaviour | DavidHDev/react-bits | MIT + Commons Clause v1.0 | REIMPLEMENT | Independent implementation: masked conic-gradient ring + `@property --glow-angle`, rAF pointer variables, reduced-motion fallback. No upstream code read into the repo | no (behaviour only) |
| `SpotlightSurface` | Magic UI spotlight card idea | magicuidesign/magicui, DavidHDev/react-bits | MIT / MIT+Commons Clause | REIMPLEMENT | Light layer sits between surface and content at ≤7% alpha; disabled on touch and under reduced motion | no |
| `Shimmer`, `ShimmerText` | Magic UI shimmer | magicuidesign/magicui | MIT | REIMPLEMENT | One speed, one band; `background-clip: text` for text | no |
| `NumberTicker` | Motion Primitives / Magic UI number ticker; number-flow for ambition | ibelick/motion-primitives, magicuidesign/magicui, barvian/number-flow | MIT | REIMPLEMENT | Own tween on `motion`'s imperative `animate()`; invisible width reservation; guarded formatter | no |
| `Reveal` | Motion Primitives in-view animations | ibelick/motion-primitives | MIT | REIMPLEMENT | Own IntersectionObserver + CSS transition; renders visible by default so content is never trapped | no |
| `Metric`, `MetricValue`, `Delta`, `StatCard` | Tremor KPI layout | tremorlabs/tremor | Apache-2.0 | REFERENCE | Domain-free primitives; guarded formatting; tabular numerals | no |
| `Timestamp`, `FreshnessBadge` | LUC | — | — | ORIGINAL | Injectable clock for deterministic rendering | no |
| `Stack`, `Inline`, `Grid`, `Container`, `Section` | LUC | — | — | ORIGINAL | Deliberately thin; no polymorphic gymnastics | no |
| `Heading`, `Text`, `Code`, `Kbd`, `NumericText` | TypeUI role naming | bergside/awesome-design-skills | MIT | REFERENCE | Role names and scale are LUC's | no |
| `Chart*` chrome | Tremor framing, LUC | tremorlabs/tremor | Apache-2.0 | REFERENCE | Engine-independent frame. No Tremor code | no |
| ECharts adapter (`EChartSurface`, family builders) | LUC thin adapter over the engine's public API | apache/echarts | Apache-2.0 | DEPENDENCY | No engine internals reached into; options are assembled from LUC helpers. NOTICE ships with the package | ECharts NOTICE |
| Lightweight adapter (`LightweightSurface`, `FinancialChart`) | LUC thin adapter over the engine's public API | tradingview/lightweight-charts | Apache-2.0 | DEPENDENCY | `layout.attributionLogo` is kept enabled — the library's documented way to satisfy the notice requirement | **yes — visible attribution logo** |
| `ChartSpec`, `SeriesSpec`, `AnnotationSpec` | Grammar-of-graphics shape | antvis/G2, vega/vega-lite | MIT / BSD-3-Clause | REFERENCE | Encoding-as-data, not components-as-JSX. No code copied | no |
| `ChartSyncGroup` + sync bus | uPlot cursor-synchronisation concept; ECharts `connect` | leeoniya/uPlot, apache/echarts | MIT / Apache-2.0 | REIMPLEMENT | Own normalised event bus (ms cursor + window), origin guards and rAF coalescing | no |
| Tooltip markup + `luc-chart-tooltip` styles | Nivo and Tremor tooltip UX study | plouc/nivo, tremorlabs/tremor | MIT / Apache-2.0 | REIMPLEMENT | Own markup, own token-driven styles. No upstream code | no |
| `Sparkline`, `SparkArea`, `MiniBar` | LUC | — | — | ORIGINAL | Hand-rolled SVG; no engine instance per row | no |
| `FullscreenResearchView` | LUC | — | — | ORIGINAL | Real research workspace, not a stretched div | no |
| `DepthChart`, `TermStructureChart`, `CurveComparisonChart` | research-terminal patterns | react-financial/react-financial-charts (feature study) | MIT | REFERENCE | Generic prepared-value components; no financial analytics inside | no |
| `DataTable`, `VirtualDataTable` | TanStack Table architecture + React Aria table semantics + Glide's DataGrid boundary | TanStack/table, adobe/react-spectrum, glideapps/glide-data-grid | MIT / Apache-2.0 / MIT | DEPENDENCY + REIMPLEMENT | Row models, sorting, filtering, faceting, selection, expansion, visibility, pinning and sizing are TanStack's. Markup, density, alignment contract, sticky/pinned surfaces, states and column helpers are LUC's. No upstream code copied | TanStack MIT via npm |
| `DataTableToolbar`, `FacetFilter`, `ColumnVisibilityMenu`, `DataTablePagination` | shadcn DataTable composition shape | shadcn-ui/ui | MIT | REFERENCE + ORIGINAL | Composition *shape* only (toolbar slot, column menu, pagination strip). Facet filter is a LUC group of checkboxes, not a fake multi-select listbox. No code copied | no |
| Column helpers (`textColumn`, `numericColumn`, `statusColumn`, `sparklineColumn`, …) | Tremor KPI formatting study; TanStack column API | tremorlabs/tremor, TanStack/table | Apache-2.0 / MIT | DEPENDENCY + ORIGINAL | Formatting only, never computation. Em-dash handling, signed tone and tabular figures are LUC rules | no (Tremor) / TanStack MIT via npm |
| `VirtualDataTable` | TanStack Virtual + React Aria's virtualised table guidance | TanStack/virtual, adobe/react-spectrum | MIT / Apache-2.0 | DEPENDENCY + REIMPLEMENT | Real `<tr>` rows with two hidden spacer rows so semantics survive; supported-row-count reporting is ours | TanStack MIT via npm |
| `Select` | Radix Select behaviour + LUC trigger chrome | radix-ui/primitives | MIT | DEPENDENCY | Trigger chrome mirrors `Input`; menu surface is the shared overlay token. Radix notice via npm | Radix notice via npm |
| `Combobox` | Downshift `useCombobox` behaviour + Base UI / Ariakit semantics study | downshift-js/downshift, mui/base-ui, ariakit/ariakit | MIT | DEPENDENCY + REFERENCE | Downshift owns the state machine; LUC owns the field, menu, groups, loading and no-results states. The uncontrolled-DOM-input decision (no dropped keystrokes) is ours | Downshift MIT via npm |
| `Toaster`, `toast` | Sonner behaviour + LUC skin | emilkowalski/sonner | MIT | DEPENDENCY | Behaviour untouched. Skin is `styles/toast.css`: Sonner's documented CSS variables plus a tone rail. No visual identity inherited | Sonner MIT via npm |
| `Sheet` | Radix Dialog behaviour + LUC edge/size vocabulary | radix-ui/primitives; vaul studied only | MIT / MIT | DEPENDENCY + REIMPLEMENT | Explicitly not a gesture drawer. vaul's README declares it unmaintained; only its interaction was studied | Radix notice via npm |
| `Command`, `CommandMenu` | cmdk behaviour + Raycast/Linear density study | dip/cmdk | MIT | DEPENDENCY + REIMPLEMENT | cmdk owns filtering/ranking/active descendant; LUC owns the palette shell, rows, shortcut column and the nested-page hook. `Command.Dialog` (deprecated upstream) is not used | cmdk MIT via npm |
| `useCommandHotkey`, `useCommandPages`, `useControllableState` | LUC | — | — | ORIGINAL | Small hooks, no dependency: a hotkey is 20 lines and page stacks are a `string[]` | no |
| `ChartDataTable`, `ChartDataViewToggle` | LUC accessibility pattern; React Aria's "don't claim canvas is accessible" stance | adobe/react-spectrum (documentation) | Apache-2.0 | ORIGINAL | The chart's own rows and formatters rendered as a semantic table, opt-in behind a segmented control | no |
| `Form`, `FormActions`, `SubmitButton`, `FormErrorSummary` | shadcn/ui form composition shape (studied), LUC lifecycle | shadcn-ui/ui, react-hook-form/react-hook-form | MIT | ORIGINAL + REFERENCE | LUC owns the submit lifecycle, the status vocabulary, the summary and the focus-back action. No upstream code copied | no |
| `FormSection`, `Fieldset`/`FieldGroup`, `FieldArray` | LUC | — | — | ORIGINAL | Sections, real `<fieldset>`/`<legend>` groups, repeating-row chrome with add/remove/reorder. No drag-and-drop | no |
| `Field` states (`validating`, `success`, read-only) | Mantine, Chakra, React Aria field anatomy | mantinedev/mantine, chakra-ui/chakra-ui, adobe/react-spectrum | MIT / Apache-2.0 | REFERENCE + ORIGINAL | One message slot; required marked with a single accent asterisk; validation never dims readable text | no |
| React Hook Form adapter (`RhfForm`, `FormField`) | LUC bridge over React Hook Form's public API | react-hook-form/react-hook-form | MIT | DEPENDENCY (optional peer) | `Controller` + LUC `Field`: one label, one described-by, one error, async validating state, an error summary built from `formState.errors` | RHF MIT via npm |
| `NumberInput`, `CurrencyInput`, `PercentageInput` | React Aria `NumberField` behaviour + LUC unit contracts | adobe/react-spectrum | Apache-2.0 | DEPENDENCY + ORIGINAL | Steps are opt-in (a step *snaps*, so a step is a decision); `scale` is required on percentages; the canonical value is never a formatted string | React Aria NOTICE |
| `PasswordInput` | LUC | — | — | ORIGINAL | Real `type=password` semantics, labelled reveal toggle, no policy, paste never blocked | no |
| `OtpInput` | `input-otp` behaviour + LUC slots | guilhermerodz/input-otp | MIT | DEPENDENCY | One hidden input, visible slots, LUC sizing/groups/invalid state | input-otp MIT via npm |
| `FileInput`, `DropZone` | React Aria `FileTrigger` + `DropZone` + react-dropzone rejection study | adobe/react-spectrum, react-dropzone/react-dropzone | Apache-2.0 / MIT | DEPENDENCY + REIMPLEMENT | Accept/size/count validation with a named, per-file reason. The component never uploads | React Aria NOTICE |
| `TagInput` | LUC, composed from `Input` + `Tag` | — | — | ORIGINAL | Commit keys, paste splitting, duplicate and max-count messages, labelled remove buttons | no |
| `Calendar`, `RangeCalendar` | React Aria Components behaviour + LUC visual language | adobe/react-spectrum | Apache-2.0 | DEPENDENCY + REIMPLEMENT | Day-grid semantics, roving focus, locale and range model come from React Aria; header, cells, range band, today ring and the month/year jump are LUC's | React Aria NOTICE |
| `MonthPicker`, `YearPicker` | React Aria's `CalendarYearPicker`/`CalendarMonthPicker` pattern | adobe/react-spectrum | Apache-2.0 | REIMPLEMENT | Own ARIA grid with roving focus so the same component serves the standalone picker and the calendar header. No upstream code copied | no |
| `DateField`, `DatePicker`, `DateRangePicker` | React Aria date fields + LUC shell, presets and overlay | adobe/react-spectrum | Apache-2.0 | DEPENDENCY + ORIGINAL | Segmented editing, calendar popover, consumer-defined presets, derived preset highlight, Today/Clear actions | React Aria NOTICE |
| `TimePicker` | React Aria `TimeField` + LUC stepped popover | adobe/react-spectrum | Apache-2.0 | DEPENDENCY + REIMPLEMENT | Segments for exact entry, an ARIA listbox column pair for coarse entry with a real `minuteStep`, "Now" action, no timezone implied | React Aria NOTICE |
| `DateTimePicker`, `ZonedDateTimePicker` | React Aria date picker + LUC's explicit value contract | adobe/react-spectrum | Apache-2.0 | DEPENDENCY + ORIGINAL | Two components because "date and time" means two things: a local wall clock, or a zoned value that carries its own identifier. Nothing is converted | React Aria NOTICE |
| `LocaleProvider` | LUC wrapper over React Aria's `I18nProvider` | adobe/react-spectrum | Apache-2.0 | DEPENDENCY | One place to set the locale for date and number controls, and the way to keep server and client output identical | React Aria NOTICE |
| `datetime/format.ts` helpers | LUC + `@internationalized/date` | adobe/react-spectrum | Apache-2.0 | DEPENDENCY + ORIGINAL | Strict `YYYY-MM-DD` parsing, `CalendarDate` round-tripping, one-zone instant conversion, and formatters that avoid `Intl.formatRange` (its whitespace differs between Node and the browser, which broke hydration) | @internationalized/date NOTICE |
| Calendar heatmap, correlation matrix | Nivo / ECharts gallery patterns | plouc/nivo, apache/echarts | MIT / Apache-2.0 | REIMPLEMENT | Own palettes, own label-density rules, own tooltips | no |
| `ThemeProvider`, `lucThemeInitScript`, `LucProvider` | LUC | — | — | ORIGINAL | ~100 lines instead of a framework-bound dependency | no |
| Token layer (`tokens.css`) | LUC | — | — | ORIGINAL | Three-layer model: core → semantic → theme | no |
| `useReducedMotion`, `useSpotlight`, `useSlidingIndicator`, `useMediaQuery` | Mantine hook ergonomics | mantinedev/mantine | MIT | REFERENCE | Implemented for LUC's specific contracts | no |

## Documentation provenance

| LUC document | Informed by | Usage | Notes |
| --- | --- | --- | --- |
| `DESIGN_SYSTEM.md`, `AI_DESIGN_GUIDE.md` | TypeUI `DESIGN.md` + `awesome-design-skills` `SKILL.md` structure | REFERENCE / ADAPT (structure) | The *structure* (tokens → component rules → states → acceptance criteria → anti-patterns → QA checklist) follows the public skills. All LUC rules, values and wording are ours |
| `docs/ACCESSIBILITY.md` | React Aria / React Spectrum documentation practice | REFERENCE | The "write accessibility as acceptance criteria" habit |
| `docs/MOTION_GUIDE.md` | Motion Primitives, Animate UI, Sonner | REFERENCE | Duration/easing vocabulary is LUC's |
| `docs/CHART_GUIDE.md` | ECharts, Lightweight Charts, Tremor docs | REFERENCE | Architecture is LUC's; engines deferred |
| `docs/research/*` | GitHub API + raw license files | VERIFIED DATA | Fetched 2026-09-26; commands recorded in the license matrix |
| `skills/luc-ui/SKILL.md` | TypeUI agent-skill format | REFERENCE (structure) | Procedures and guardrails are LUC's |

## Third-party notices that must ship with LUC UI

1. **Radix UI** (MIT, WorkOS) — preserved via the installed `radix-ui` package.
2. **Remix Icon** (Remix Icon License v1.0) — keep the license file with any
   distributed icon assets.
3. **Inter, Inter Tight, JetBrains Mono** (SIL OFL 1.1) — keep the license files
   shipped inside the `@fontsource-variable/*` packages.
4. **Motion** (MIT), **tailwind-merge**, **clsx**, **class-variance-authority** —
   preserved via installed packages.
5. **TradingView Lightweight Charts** (Apache-2.0) — the attribution notice is
   satisfied by the library's own `attributionLogo`, which `LightweightSurface`
   keeps enabled on every financial chart. Do not disable it; that would breach
   the licence.
6. **Apache ECharts** (Apache-2.0) — `LICENSE`, `NOTICE` and `licenses/` ship
   inside the installed package.
7. **React Aria Components** and **`@internationalized/date`** (Apache-2.0,
   Adobe) — the `LICENSE`/`NOTICE` files ship inside the installed packages.
   LUC consumes them through their public APIs only.
8. **React Hook Form** (MIT) — an optional peer dependency, reached only through
   `@luc/ui/forms/react-hook-form`.
9. **input-otp** (MIT) — behaviour only; the slots are LUC's markup.

Nothing in this registry was copied from a repository marked
`MIT + Commons Clause` (Animate UI, React Bits) or from paid content.

## V0.5 additions

| LUC surface | Design origin | Upstream | License | Usage | What we took |
| --- | --- | --- | --- | --- | --- |
| `AppShell`, `AppShellSidebar`, `AppShellTopbar`, `AppShellStatusBar` | LUC composition | — | — | ORIGINAL | The frame, the tokenised geometry, the scroll model and the landmarks are LUC's. shadcn's dashboard shell was read as an architectural reference (`DESIGN_REFERENCE`): slots, a provider for sidebar state, a sticky topbar. No markup or class string was copied. |
| `Sidebar`, `SidebarItem`, `SidebarSubmenu`, `SidebarRail` | LUC composition over Radix | radix-ui/primitives (MIT) | MIT | DEPENDENCY (Collapsible) | The disclosure is Radix `Collapsible`, so `aria-expanded`/`aria-controls` are the library's. The rail, the active edge, the group rhythm, the tooltip-in-rail behaviour and the "expand before you open a submenu" rule are LUC's. |
| `AppShellMobileNav` | reuse | LUC `Sheet` (Radix Dialog) | MIT | DEPENDENCY | The drawer is the existing Sheet. No second drawer implementation exists. |
| `Breadcrumbs` | WAI-ARIA APG breadcrumb pattern | — | — | REIMPLEMENT_IDEA | `nav` + `ol` + `li`, decorative separators, `aria-current="page"`, and an ellipsis that reveals the hidden crumbs in a `Popover`. |
| `PageHeader` | LUC composition | — | — | ORIGINAL | Slots (eyebrow, title, description, meta, actions, controls, tabs) instead of a config object. |
| `Workspace`, `WorkspaceGroup`, `WorkspacePane` | engine composition | bvaughn/react-resizable-panels 4 (MIT) | MIT | DIRECT_DEPENDENCY | Panes, separators, constraints, keyboard resize, collapsible panels, imperative handles. The stacked/focus mode switch, the persistence policy and the pane chrome are LUC's. |
| `WorkspaceResizeHandle` | LUC skin over an engine separator | bvaughn/react-resizable-panels 4 (MIT) | MIT | DIRECT_DEPENDENCY | The hairline-in-a-wide-hit-area treatment, and styling from the engine's own `data-separator` state rather than a JS drag state. |
| `InspectorPane` | LUC composition | — | — | ORIGINAL | A pane that collapses to zero without unmounting; open state is controlled or uncontrolled. |
| `usePersistentState`, `utils/storage` | LUC | — | — | ORIGINAL | A versioned envelope, a total read, and `useSyncExternalStore` so restore cannot cause a hydration mismatch. |
| `url-state` codecs and parameter sets | LUC | — | — | ORIGINAL | Pure functions. `nuqs` is the Showcase's adapter only. |
| `ChartInspectionProvider`, `ChartPinButton` | LUC continuation of the V0.2 sync bus | — | — | ORIGINAL | The pin lives on the sync bus as a cursor, so both engines draw it and no adapter grows a second crosshair concept. |
| Design-contract lint rules | LUC | shadcn-ui/lint (MIT) | MIT | REFERENCE_ONLY | The idea of enforceable design contracts. The two rules are LUC code. |

Two reference checks were repeated this round: `vaul` is still unmaintained (the
Sheet remains on Radix Dialog), and **Ariakit** still has no license file
detectable by the GitHub API (npm declares MIT), so nothing was copied from it.

## V0.6 additions

| LUC surface | Design origin | Upstream | License | Usage | What we took |
| --- | --- | --- | --- | --- | --- |
| TradingView widget wrappers (`TradingView*`, 27 components) | LUC composition over the provider's public widget API | TradingView widget docs + the provider's own wizard modules | provider-served, proprietary | `DESIGN_REFERENCE` | Attribute names, encodings (upper/lower/list/JSON), defaults, minimum sizes and the attribution markup were read from the provider's public documentation and wizard schema so the typed props serialise exactly like a pasted provider snippet. **No provider source is copied, vendored or self-hosted**; the widgets load from `s3.tradingview.com`, `widgets.tradingview-widget.com` and `www.tradingview-widget.com` at runtime. |
| `TradingViewWebComponent` adapter | LUC | — | — | ORIGINAL | The loader dedupe (per module URL), `customElements.whenDefined` handling, the timeout→error→late-recovery state machine, the placeholder-as-child progressive enhancement (the provider's own documented pattern) and the symbol-link event bridge. |
| `TradingViewIframe` adapter | LUC | — | — | ORIGINAL | The imperative host: React owns one empty box, the provider's container, `__widget`, copyright block and config-carrying script are built and destroyed inside it, because the provider *replaces* the node it is given and would otherwise desynchronise React's tree. |
| `TRADINGVIEW_TOKEN_BRIDGE` | LUC | TradingView "Set styles and themes" tutorial | provider-served | `DESIGN_REFERENCE` | The published `--tv-widget-*` custom properties and the `theme` attribute. No selector targets internal markup, and no closed shadow root is inspected. |
| `TRADINGVIEW_CATALOG` registry | LUC | TradingView widget directory | provider-served | `DESIGN_REFERENCE` | One entry per current widget, with its official URL, format, size floor and legacy relationships. |
| Correlation-matrix label policy (`shouldShowMatrixValues`, `readableInk`) | LUC | — | — | ORIGINAL | The policy is a pure function over the rendered cell size; the ink is chosen per cell by WCAG contrast against the composited mark colour. |
| Combobox adornment slot (`inputAdornmentClass`) | LUC | — | — | ORIGINAL | The V0.6 fix: the slot owns the icon geometry so a provider glyph's own `width`/`height` cannot overflow the field. |

Reference checks repeated this round: `react-ts-tradingview-widgets` (MIT, 224★)
and `react-tradingview-widget` (MIT, 292★) were read and rejected — both are
iframe-only, both set `script.src` from a prop, and neither has a loader, a
theme bridge or a registry (see `docs/research/v0.6-tradingview-policy-audit.md`
§7).

## V1.0 additions

| LUC surface | Design origin | Upstream | License | Usage | What we took |
| --- | --- | --- | --- | --- | --- |
| `Slider`, `RangeSlider` | LUC skin over a primitive | radix-ui 1.6.7 → `@radix-ui/react-slider` 1.4.7 | MIT | DIRECT_DEPENDENCY | Pointer maths, `role="slider"` per thumb, arrow/Home/End/PageUp stepping, `minStepsBetweenThumbs`, RTL, and the hidden form input. The groove, the filled range, the small-but-large-hit-area thumb, the value bubble, marks and the size scale are LUC's. The single-value and range APIs are LUC's: Radix's `number[]` never reaches a consumer. |
| `DropdownMenu`, `ContextMenu` | LUC skin over a primitive | radix-ui 1.6.7 → `@radix-ui/react-dropdown-menu` 2.1.24, `@radix-ui/react-context-menu` 2.3.7 | MIT | DIRECT_DEPENDENCY | The menubar/menu/menuitem ARIA model, roving focus, typeahead, submenu open-intent, collision handling and focus restore. The surface, the row rhythm, the checkbox/radio indicators, the shortcut slot, the `inset` alignment and the destructive *tone* are LUC's. |
| `components/menu-shared.tsx` | LUC | — | — | ORIGINAL | One visual language for two triggers, so a dropdown and a context menu can never drift; kept internal so the public surface stays two families rather than three. |
| `Alert`, `Callout` | LUC | — | — | ORIGINAL | Semantic edge + semantic icon on a quiet surface instead of a flooded panel; one implementation with two documented intents and opt-in live roles rather than `role="alert"` on every block. Compared against Chakra's Alert and Mantine's Alert for inventory, nothing copied. |
| `EmptyState` | LUC | — | — | ORIGINAL | A calm two-size composition with a controlled heading level and no invented live region. Compared against Mantine's `EmptyState`/`shadcn` recipes for inventory, nothing copied. |
| `ChartInspectionArea` | LUC | — | — | ORIGINAL | The keyboard path over the V0.2 sync bus: step the prepared x values, announce each step, and keep `ChartDataTable` as the complete semantic fallback. |
| Elevation bridge (`--elevation-*` → `--shadow-*`) | LUC | — | — | ORIGINAL | The fix for a real defect: Tailwind's `--shadow-*` namespace owned the same names, so the semantic values were unreachable and `shadow-overlay` was not a utility. |

Reference checks for this round were read-only and offline: the GitHub API is not
reachable from the build sandbox, so no new upstream repository was added to this
registry. The libraries consulted for inventory (Radix, React Aria, Base UI,
Ariakit, shadcn/ui, Mantine, Chakra UI, Ark UI) are the ones already recorded,
with the licences listed in `docs/research/license-matrix.md`.
