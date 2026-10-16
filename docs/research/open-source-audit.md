# LUC UI — open-source audit

Researched **2026-09-26**. Star counts and last-push dates are from the GitHub
API on that date; license rows were verified against the repositories' own
license files (see `license-matrix.md`).

The point of this audit is not to collect libraries. It is to answer one
question per project: *what should LUC UI learn from this, and what (if
anything) should it depend on?*

## A. Design intelligence / AI design systems

### TypeUI — `bergside/typeui` (MIT, ~2.0k★, pushed 2026-07-04)

- **Primary value**: demonstrates a machine-readable design-system format that
  an AI agent can consume: a `DESIGN.md` (the rules) paired with a `SKILL.md`
  (how to apply them), wrapped in front-matter metadata.
- **Architecture lessons**: separate *what the system is* from *how to work in
  it*; keep rules short, opinionated and testable.
- **Visual lessons**: the public style skills are deliberately one-dimensional
  (a personality each) rather than a single "make it beautiful" prompt.
- **Weaknesses**: individual style skills are thin on interaction detail — they
  say "use subtle transitions" without naming a duration or an easing.
- **LUC usage**: `REFERENCE_ONLY` for the repos; the *structure* of our
  `DESIGN_SYSTEM.md` + `AI_DESIGN_GUIDE.md` + `skills/luc-ui/SKILL.md` trio is
  modelled on it.

### awesome-design-skills — `bergside/awesome-design-skills` (MIT, ~2.9k★)

- 69 public design skills (`skills/<name>/SKILL.md` + `DESIGN.md`), including
  `refined`, `sleek`, `professional`, `futuristic`, `premium`, `enterprise`.
- **What we took**: the required output structure (tokens → component anatomy →
  states → accessibility acceptance criteria → anti-patterns → QA checklist) and
  the habit of naming required states explicitly.
- **What we deliberately rejected**: the `Do / Don't` lists are generic
  ("avoid inconsistent spacing rhythm"). LUC UI rules are written as
  falsifiable statements with numbers.
- **LUC usage**: `ADAPT_SOURCE` (structural pattern, attribution recorded in the
  source registry).

### design-md-chrome — `bergside/design-md-chrome` (MIT, ~2.9k★)

- A browser extension that extracts a design system from a live page into
  `DESIGN.md`.
- **Lesson**: a design system must be *extractable* — computed tokens, not
  vibes. Our tokens are all CSS custom properties for exactly this reason.
- **LUC usage**: `REFERENCE_ONLY`.

## B. Open-code / component architecture

### shadcn/ui — `shadcn-ui/ui` (MIT, ~124.6k★)

- **Primary value**: the open-code philosophy — components are copied into the
  consumer's repo, so the consumer owns and can modify them. Also the registry
  idea: a machine-readable manifest of components.
- **Architecture lessons**: compound components with a small prop surface; a
  `cn()` helper for class merging; variants as data (cva) rather than branches.
- **What we adopted**: the `cn()` + variants pattern, the compound-component
  API shape (`<Card><CardHeader>…`), and the registry *idea* (our
  `ChartRegistry` and the future component registry).
- **What we rejected**: the default visual language. LUC UI must not read as
  shadcn — different surface philosophy (luminance-stepped, hairline-first),
  different radius scale, dark-first, and motion that is part of the system.
- **LUC usage**: `REFERENCE_ONLY`; no shadcn code is vendored.

### Radix Primitives — `radix-ui/primitives` (MIT, ~19.3k★)

- **Primary value**: accessibility, keyboard semantics, focus management,
  collision-aware overlays, and controlled/uncontrolled state — solved once.
- **Architecture lessons**: `asChild` composition, `data-state` attributes as
  the styling contract, portals per overlay, `forceMount` for exit animation.
- **Weaknesses**: unstyled by definition; without a token system you get a
  functional but anonymous UI. Also a large dependency surface if imported
  per-primitive, which is why we use the single `radix-ui` package.
- **LUC usage**: `DIRECT_DEPENDENCY` (single `radix-ui` package).

### Chakra UI — `chakra-ui/chakra-ui` (MIT, ~40.7k★)

- **Primary value**: a complete design-system organisation — tokens, recipes,
  semantic tokens, and a component API that stays consistent across ~60
  components.
- **Architecture lessons**: semantic tokens that resolve differently per theme;
  "recipes" (our cva variants) as first-class artefacts.
- **Weakness for us**: its styling runtime is opinionated and heavy; LUC UI
  wants utilities plus plain CSS variables.
- **LUC usage**: `REFERENCE_ONLY`.

### Mantine — `mantinedev/mantine` (MIT, ~31.8k★)

- **Primary value**: component completeness and genuinely useful hooks
  (`useMediaQuery`, `useDisclosure`, `useLocalStorage`).
- **Architecture lessons**: hooks are part of the design system, not an
  afterthought; forms get first-class primitives.
- **LUC usage**: `REFERENCE_ONLY`; our hooks were written against our own
  reduced-motion and spotlight needs.

### Headless UI — `tailwindlabs/headlessui` (MIT, ~28.8k★)

- **Primary value**: minimal, Tailwind-native headless components.
- **Why not chosen**: narrower coverage than Radix (no tooltip/popover
  positioning, fewer complex widgets) and its transition API would compete with
  our motion tokens.
- **LUC usage**: `REFERENCE_ONLY`.

### Ark UI — `chakra-ui/ark` (MIT, ~5.4k★)

- **Primary value**: state machines as the component model (XState), which makes
  complex widgets predictable across frameworks.
- **Lesson**: an explicit state chart is a good way to *describe* a component,
  even when the implementation is simpler.
- **LUC usage**: `REFERENCE_ONLY`.

### Park UI — `chakra-ui/park-ui` (MIT, ~2.4k★)

- **Primary value**: an example of a design system built *entirely* on headless
  primitives (Ark) with a theme layer on top.
- **Lesson**: the headless layer and the visual layer must be separable; that is
  why every LUC component keeps behaviour (Radix) and appearance (tokens)
  apart.
- **LUC usage**: `REFERENCE_ONLY`.

### Floating UI — `floating-ui/floating-ui` (MIT, ~32.8k★)

- **Primary value**: the positioning engine, including collision handling.
- **LUC usage**: `DIRECT_DEPENDENCY` transitively via Radix; consumed through
  Radix's popper wrapper.

### React Spectrum / React Aria — `adobe/react-spectrum` (Apache-2.0, ~15.9k★)

- **Primary value**: the most rigorous public reference for interaction
  semantics: keyboard models, i18n, and accessibility test suites.
- **Lesson**: write accessibility as *acceptance criteria*, not as a checklist.
  Our docs/ACCESSIBILITY.md follows that shape.
- **Why not chosen**: Apache-2.0 obligations are fine, but React Aria's API and
  styling model would replace our own composition approach.
- **LUC usage**: `REFERENCE_ONLY`.

## C. Motion / creative UI

### Magic UI — `magicuidesign/magicui` (MIT, ~22.4k★)

- **Primary value**: a large catalogue of composable animated components
  (marquee, border beam, animated gradient, number ticker) that are written as
  ordinary React + Tailwind rather than as a black-box dependency.
- **Visual lessons**: effects become tasteful when they are *slow* and *low
  contrast*; the popular ones are the ones that respect the content around them.
- **Weaknesses**: styles vary between components; several default to permanent
  motion.
- **LUC usage**: `REIMPLEMENT_IDEA`. Our `Shimmer`, `ShimmerText`, `Reveal` and
  `SpotlightSurface` solve the same problems in one motion grammar.

### Motion Primitives — `ibelick/motion-primitives` (MIT, ~6.4k★)

- **Primary value**: the most disciplined of the motion libraries — small,
  composable primitives with a consistent Motion-based API.
- **Visual lessons**: transitions between multiple states (not just
  enter/exit), animated `layoutId` indicators, and text effects that keep
  typography intact.
- **LUC usage**: `REIMPLEMENT_IDEA`; our sliding tab indicator and reveal are
  independent implementations.

### Animate UI — `imskyleen/animate-ui` (MIT + Commons Clause, ~4.3k★)

- **Primary value**: animated versions of otherwise plain primitives (tabs,
  switch, radio, dialog) that stay accessible.
- **License finding (important)**: the Commons Clause restricts redistribution
  and selling, so **no source may be copied**.
- **LUC usage**: `REIMPLEMENT_IDEA` only. Our checkbox tick, radio dot and
  switch thumb were written from scratch against the same behavioural goals.

### Kokonut UI — `kokonut-labs/kokonutui` (MIT, ~2.1k★)

- **Primary value**: composition taste — cards, toolbars and headers that feel
  designed rather than assembled; useful reference for our `patterns` page.
- **Weaknesses**: Tailwind v3 idioms and a fairly wide radius/shadow variety.
- **LUC usage**: `REFERENCE_ONLY`.

### Uiverse (Galaxy) — `uiverse-io/galaxy` (MIT, ~13.2k★, last push 2024-09)

- **Primary value**: a very large pool of micro-interactions (loaders, buttons,
  checkboxes, switches) for *idea mining*.
- **Weaknesses**: inconsistent quality, no shared design language, many entries
  are purely decorative. The repository is largely dormant.
- **LUC usage**: `REIMPLEMENT_IDEA`. We adopted one lesson — a loader must show
  *shape*, not just activity — and built `Skeleton`/`Shimmer` instead of
  collecting spinners.

### React Bits — `DavidHDev/react-bits` (MIT + Commons Clause v1.0, ~48.1k★)

- **Primary value**: genuinely excellent effect ideas, especially perimeter
  lighting (`BorderGlow`), spotlight cards, star/electric borders, and text
  effects.
- **License finding (important)**: Commons Clause v1.0 — commercial use inside
  a product is fine, but redistribution/selling of the software is restricted.
  Copying an implementation into a reusable UI library is therefore not
  acceptable.
- **LUC usage**: `REIMPLEMENT_IDEA`. LUC `BorderGlow` was designed from the
  behaviour description (quiet at rest → accent light on interaction) and
  implemented with a masked conic gradient, rAF-throttled pointer variables and
  a reduced-motion fallback. No React Bits code was read into the repository.

## D. Data UI / dashboards

### Tremor — `tremorlabs/tremor` (Apache-2.0, ~3.6k★)

- **Primary value**: metrics, KPI cards and chart framing for dashboards.
- **Visual lessons**: data hierarchy (label → value → delta → context), and
  legends treated as controls.
- **Weaknesses**: opinionated Tailwind v3 styling and an increasingly
  product-oriented upstream.
- **LUC usage**: `REFERENCE_ONLY`; our `StatCard`/`Metric`/`Delta` were written
  as generic primitives with no domain assumptions.

### TanStack Table — `TanStack/table` (MIT, ~28.5k★)

- **Primary value**: headless sorting/filtering/grouping/pagination/virtualisation.
- **LUC usage**: `DIRECT_DEPENDENCY` planned for V0.2; architecture notes only
  in V0.1.

### react-resizable-panels — `bvaughn/react-resizable-panels` (MIT, ~5.4k★)

- **Primary value**: persisted, keyboard-accessible split layouts — the
  foundation of a research terminal.
- **LUC usage**: `DIRECT_DEPENDENCY` planned.

### Sonner — `emilkowalski/sonner` (MIT, ~13.0k★)

- **Primary value**: the reference implementation of toast stacking, swipe
  dismissal and expansion on hover.
- **LUC usage**: `REFERENCE_ONLY` in V0.1; a LUC toast should reuse this
  component rather than re-implement stacking.

## E. Charts

| Project | License | Stars | Why it matters | LUC plan |
| --- | --- | --- | --- | --- |
| [apache/echarts](https://github.com/apache/echarts) | Apache-2.0 | ~67.4k | Breadth (line → heatmap → surface), large-data behaviour, mature. | General analytical engine (V0.2) |
| [tradingview/lightweight-charts](https://github.com/tradingview/lightweight-charts) | Apache-2.0 | ~17.4k | Candles, volume, crosshair, overlays are native. Attribution notice required. | Financial engine (V0.2) |
| [airbnb/visx](https://github.com/airbnb/visx) | MIT | ~21.1k | Escape hatch for bespoke visualisations built on D3 scales. | Escape hatch (V0.2+) |
| [plouc/nivo](https://github.com/plouc/nivo) | MIT | ~14.1k | Beautiful legend/tooltip defaults. | Reference only |
| [f5/unovis](https://github.com/f5/unovis) | Apache-2.0 | ~2.9k | Strong visual defaults, smaller ecosystem. | Reference only |

## F. Icons and type

### Remix Icon — `Remix-Design/RemixIcon` (Remix Icon License v1.0, ~8.4k★)

- One family, two styles: line by default, fill for emphasis. Sizes 16/18/20/24.
- Tree-shakeable React package. The license permits commercial use,
  modification and distribution inside a larger product; the only restriction is
  not selling the icons as the product itself.
- **LUC usage**: `DIRECT_DEPENDENCY` — canonical LUC icon family in V0.1.

### Fonts — Inter, Inter Tight, JetBrains Mono (SIL OFL 1.1)

- Self-hosted through `@fontsource-variable/*` so there is no third-party font
  CDN request at runtime, and the Showcase renders identically offline.

## NEW TREASURE PROJECTS FOUND

Found while searching beyond the original list. Each one earns its place.

| Project | What it adds | License | Why it matters for LUC |
| --- | --- | --- | --- |
| [barvian/number-flow](https://github.com/barvian/number-flow) | Per-digit rolling numbers with a focus on typographic stability | MIT | Sets the bar our `NumberTicker` is measured against. If per-digit motion is ever needed, this is the dependency to adopt rather than reimplement. |
| [mui/base-ui](https://github.com/mui/base-ui) | A second-generation headless primitive layer | MIT | A credible alternative to Radix with a smaller surface. Worth re-evaluating at V1.0 — knowing there is an exit keeps Radix honest. |
| [pacocoursey/cmdk](https://github.com/pacocoursey/cmdk) | Accessible command palette with fuzzy filtering | MIT | The obvious base for a future LUC command menu (⌘K) — a pattern every analytical product eventually needs. |
| [glideapps/glide-data-grid](https://github.com/glideapps/glide-data-grid) | Canvas-rendered data grid, smooth at hundreds of thousands of rows | MIT | If Luc Quant needs a true research grid, this is the only category-proven option reviewed here. |
| [clauderic/dnd-kit](https://github.com/clauderic/dnd-kit) | Accessible drag and drop with keyboard sensors | MIT | Needed for reordering series, watchlists and workspace panels without breaking accessibility. |
| [downshift-js/downshift](https://github.com/downshift-js/downshift) | Battle-tested combobox/select primitives | MIT | The missing primitive between `Input` and a full `Select`; a candidate for the next component round. |
| [emilkowalski/vaul](https://github.com/emilkowalski/vaul) | Drawer/sheet with correct gesture handling | MIT | Mobile and tablet patterns are under-served by Radix Dialog; this fills the gap. |
| [f5/unovis](https://github.com/f5/unovis) | Cohesive chart + graph library with strong visual defaults | Apache-2.0 | Worth a look if ECharts proves too heavy for small charts. |
