# 02 — Competitive Showcase Research

How leading UI libraries present components, and what LUC UI should and should
not take from them.

## 1. Method, dates and limitations

| Item | Value |
|---|---|
| Research date | 2026-10-11 (UTC) |
| Tooling | Headless Chromium (Playwright 1.63) at 1440×900 and 390×844, plus raw HTML inspection |
| Per site | homepage → one catalog → one component detail → narrow viewport on the detail page |
| Evidence | `luc-ui/artifacts/screenshots/showcase-transformation/competitors/*.png` + `competitors.json` (gitignored, reproducible via `node tools/competitor-probe.mjs`) |

Site URLs studied:

Primary: `https://reactbits.dev`, `https://ui.shadcn.com`,
`https://motion-primitives.com`, `https://magicui.design`,
`https://ui.aceternity.com`.

Additional: `https://mantine.dev`, `https://www.radix-ui.com/themes`,
`https://echarts.apache.org/examples`, `https://21st.dev`.

**Limitations — read before trusting a claim:**

- Only the landing snapshot of each page was examined; content behind tabs,
  accordions or lazy sections may exist and not be counted.
- Link counts include footer/nav/upsell chrome, so they measure *page shape*,
  not catalog size. They are used that way.
- Some sites render their sidebar only after interaction, so "no sidebar found"
  means "not present in the initial DOM", not "does not exist".
- No source code, design asset or imagery was copied. Only observable structure
  and interaction affordances were recorded.
- Two sites returned heavily marketing-driven homepages; conclusions are drawn
  from their detail pages, and marketing copy is not treated as evidence.

## 2. Individual findings

### 2.1 React Bits — `reactbits.dev`

- Home: 109 links, 6 canvases rendering live effects, h1 at y=378, four
  value-oriented h3 blocks (`215+ Components`, `Visual Editors`, `AI-Ready`, …).
- Detail (`/animations/animated-content`): **255 links**, 73 code elements,
  **container tabs including `Preview` and `Code`**, 1 props table, h1 at y=92,
  headings in the order *Customize → Props → Dependencies → Related components*.
- The nav contains a **226-link sidebar** ("Browse all components", Introduction,
  Installation, then every component).
- Mobile: no horizontal overflow (scrollWidth 390 = viewport); sidebar hidden.

**Strength:** the preview/code pair sits directly under the title, so the reader
sees the effect immediately; "Related components" is a genuine next step.
**Weakness:** a 226-item sidebar plus a 255-link page is a directory dump; a
reader cannot tell where they are. **This is the pattern LUC already avoids and
must not adopt.**

### 2.2 shadcn/ui — `ui.shadcn.com`

- Home is deliberately minimal: 24 links, 403 words, one h1.
- Detail (`/docs/components/button`): 174 links, 66 code elements, **20 copy
  affordances**, 1 table, h1 at y=112.
- The page is a **sequence of variant sections** (`Default`, `Outline`,
  `Secondary`, `Ghost`, `Link`, …), each with its own live specimen and its own
  code block, after `Installation` and `Usage`.
- Install offers container tabs `Command / Manual` and package-manager tabs
  `pnpm / npm / yarn / bun`.

**Strength:** variant-per-section with code beside each specimen. The reader
never leaves the page to understand what a variant does, and never has to scroll
to a single remote "API" section to find the prop.
**Weakness:** the props reference is thin; it relies on TypeScript.
**Most transferable single idea for LUC UI.**

### 2.3 Motion Primitives — `motion-primitives.com`

- Home is a pointer, not a pitch: 10 links, 81 words.
- Detail (`/docs/text-effect`): 62 links, 4 code blocks, an **aside with 35 rows**
  (Introduction, Installation, Accordion, Animated Background, …) that sits
  alongside the page, plus **six `Preview / Code` toggle pairs** — one per
  example, not one per page.
- Example headings are *job* descriptions (`Text Effect per character`, `Text
  Effect per word`, `Text Effect with preset`, `Text Effect with custom
  variants`), then a props table.

**Strength:** the best model observed for motion documentation — a small number
of named examples, each independently preview/code toggled, with the props table
last. Directly applicable to LUC's 35 motion entries.
**Weakness:** no variant index at the top, so a long page has no map beyond the
aside.

### 2.4 Magic UI — `magicui.design`

- Home: 300 links, 1 138 words, 0 code blocks — a visual catalog.
- Detail (`/docs/components/marquee`): 119 links, 31 code elements, 7 copy
  affordances, 1 breadcrumb, headings `Installation → Examples (Vertical, 3D) →
  Usage → Props`, with **`Preview/Code`, `CLI/Manual`, `pnpm/npm/yarn/bun`
  container tabs**.

**Strength:** the tightest information architecture of the five primary sites:
breadcrumb, install, examples-with-code, usage, props. Nothing else.
**Weakness:** the visual catalog cards carry little technical information.

### 2.5 Aceternity UI — `ui.aceternity.com`

- Home: 217 links, 2 604 words, an embedded iframe preview.
- Detail (`/components/animated-testimonials`): 278 links, 17 code elements, 2
  tables, **`CLI / Manual` install tabs**, breadcrumb, headings `Installation →
  Props → Testimonial Object Shape → (marketing block)`.
- The aside is a **163-link list dominated by templates and upsell**, and the page
  ends in a "Build websites faster and 10x better than…" marketing section.
- Mobile: the nav is visible at 390 px and the document does not overflow.

**Strength:** strong visual discovery; data-shape documentation
(`Testimonial Object Shape`) is a nice touch for composite props.
**Weakness:** commerce and templates colonize the navigation; the product page
carries promotional weight.

### 2.6 Mantine — `mantine.dev`

- Home: 83 links, 2 301 words, 18 code blocks (the homepage is a docs page).
- Detail (`/core/button/`): 222 links, **146 code elements**, 24 copy
  affordances, **container tabs `Documentation / Props / Styles API`**, a
  **122-row component sidebar**, and a heading sequence that is a list of use
  cases (`Usage`, `Full width`, `Left and right sections`, `Sections position`,
  `Compact size`, `Gradient variant`, `Disabled state`, …).

**Strength:** the three-way tab (`Documentation / Props / Styles API`) separates
"how do I use it" from "what are the props" from "how do I restyle it" — exactly
the split LUC needs between *demo*, *API*, and *tokens*.
**Weakness:** 146 code blocks on one page is exhaustive documentation, not a
showcase. Too dense for LUC's stage.

### 2.7 Radix Themes — `radix-ui.com/themes`

- Detail (`/themes/docs/components/button`): 110 links, 46 code elements, 10 copy
  affordances, **no container tabs**, 1 table.
- The aside has **9 rows and they are page sections** (`API Reference`, `Examples`,
  `Size`, `Variant`, `Color`, `High-contrast`, `Radius`, `With icons`,
  `Loading`).

**Strength:** the right-hand rail is a *page-local* outline, not a catalog
re-listing. Sections are capability axes (size/variant/color/radius), which is
how a reader actually thinks about a button.
**This is the corrective reference for LUC's CS-02 outline defect** — the rail
should describe the page, never the specimen's own content.

### 2.8 ECharts Examples — `echarts.apache.org/examples`

- Home: 446 links, 1 345 words, chart families as `h3` groups (Line, Bar, Pie,
  Scatter, GEO/Map, Candlestick, Radar, Boxplot, …).
- Detail is an **editor**: container tabs `Edit Code / Full Code / Option
  Preview` around an iframe canvas; headings absent; the URL carries the example
  id (`?c=line-simple`).
- Mobile: the nav stays visible.

**Strength:** every chart is an addressable example with a canonical id, and the
code is available without leaving the demo.
**Weakness:** an embedded editor is heavy (iframes, engine size) and is not what
LUC needs; LUC's charts are documented API surfaces, not paste-and-run snippets.

### 2.9 21st.dev

- Home: 115 links; detail/catalog view: 384 links of community components in a
  grid with category headings (`Marketing Blocks`, `UI Components`, `Newest`).
- Almost no code in the initial DOM.

**Strength:** discovery is purely visual and card-based; a strong model for a
future LUC "gallery" surface.
**Weakness:** the page is a marketplace index — attribution, installers and
community metadata dominate. Not a documentation model.

## 3. Comparative matrix

Descriptive, not scored. "Evidence" column points at the observed fact.

| Dimension | Strongest example | Evidence | Weakest example | Evidence | LUC UI today |
|---|---|---|---|---|---|
| Navigation complexity | Magic UI (3 top links + breadcrumb) | 3 nav links on the detail page | React Bits (226-row sidebar) | nav with 226 links | Header 3 primary + More; sidebar 4–41 rows per area; **but** a 55-row right rail on `/visuals/elements` |
| Discovery speed (name → component) | shadcn (flat `/docs/components/*` + list) | 174-link page, immediate h1 at y=112 | Aceternity (163-row upsell aside) | aside dominated by templates | ⌘K palette + `/explore/browse` (~200 links) + families |
| Catalog visual quality | Magic UI / Aceternity / 21st (thumbnail grids) | live canvases on cards | shadcn (text list) | 24-link homepage | `/visuals/elements` renders 45/45 live previews — **already strong** |
| Live-demo priority | shadcn, Motion Primitives | demo directly under the h1 | LUC Charts pages | plot at y=1 570/1 852 | Components good (y≈410–435); **Charts poor** |
| Workbench usability | shadcn (per-variant controls + code), Mantine (Documentation/Props/Styles API tabs) | tabs + copy counts | LUC (controls below the fold on charts; no reset; no viewport toggle) | measured | partial |
| Documentation density | Magic UI (usage → examples → props) | 1 302 words / 31 code | Mantine (146 code blocks) | 2 201 words / 146 code | LUC chart pages 1 100–1 425 words with the demo below them |
| Component-to-code workflow | shadcn & Magic UI (copy beside every specimen) | 20 and 7 copy affordances | LUC (one usage snippet, code below the fold on charts) | sweep | improvable |
| Mobile browsing | All primary sites: no horizontal overflow; nav collapses | scrollWidth == viewport on all 9 | Aceternity (nav takes the screen) | nav visible at 390 px | good (380 ≤ 390) |
| Design consistency | Radix Themes (one token system, capability-axis sections) | aside = size/variant/color/radius | Aceternity (template promos inside docs) | mixed page purpose | good: single token system |
| Suitability as a model for LUC UI | **shadcn** (variant sections + per-specimen code), **Motion Primitives** (per-example preview/code), **Radix** (page-local rail) | — | React Bits sidebar, Mantine density, ECharts editor iframe | — | — |

## 4. Transferable patterns

Each pattern states which competitor demonstrates it, what it fixes, how it maps
onto LUC UI, what must not be copied, complexity, and which LUC areas it serves.

| ID | Pattern | Demonstrated by | LUC problem it addresses | Applies to | Do **not** copy | Complexity |
|---|---|---|---|---|---|---|
| CP-01 | **Per-specimen `Preview / Code` toggle** — code lives beside the thing it describes | shadcn, Magic UI, Motion Primitives, ECharts | CS-04, CS-06: code far from the specimen; long pages | all | A global "Code" tab that hides the specimen | S |
| CP-02 | **Variant-per-section** (`Default`, `Outline`, `Size`, …) each with its own specimen | shadcn, Radix, Mantine | Chart/component pages that front-load essay prose | Components, Charts, Motion | Thirty sections with no index | M |
| CP-03 | **`Documentation / Props / Styles API` split** | Mantine | LUC mixes API tables, tokens and prose into one scroll | Components, Charts, Visuals | Three tabs with duplicated content | M |
| CP-04 | **Right rail = page-local sections only** | Radix Themes (9 rows) | **CS-02**: LUC's rail lists demo content and the whole catalog | all doc pages | A rail that mirrors the catalog | S |
| CP-05 | **Install container tabs** (`CLI / Manual`, `pnpm/npm/yarn/bun`) | shadcn, Magic UI, Aceternity | LUC repeats one install snippet per page | Docs, all detail pages | Four duplicated install blocks on every page (LUC already centralises install in `/docs/installation` — keep that) | S |
| CP-06 | **Props table last, usage first** | shadcn, Magic UI, Motion Primitives | LUC's API block competes with the demo | Components, Charts | Dropping the props table entirely | S |
| CP-07 | **Small named examples instead of one big demo** (motion) | Motion Primitives (6 examples) | Motion pages with a single specimen and a long essay | Motion | Repeating near-identical examples to inflate the page | M |
| CP-08 | **Addressable chart examples with canonical ids** | ECharts (`?c=line-simple`) | LUC has canonical ids but no example-level deep links | Charts | An embedded code editor/iframe | S |
| CP-09 | **Visual catalog cards as the primary discovery surface** | Magic UI, 21st | Catalog density; LUC's own `/visuals/elements` already does this well | Visuals, Charts | Marketplace chrome (attribution, sellers) | M |
| CP-10 | **Breadcrumb + one-line purpose + demo + code, nothing else, in the first viewport** | Magic UI | CS-04, information density | all | Marketing sections inside docs | S |
| CP-11 | **Data-shape documentation for composite props** | Aceternity (`Testimonial Object Shape`) | LUC's composite components (`CardStack`, blocks) lack shape docs | Components, Blocks | — | S |
| CP-12 | **Stability: no horizontal overflow at 390 px** | all nine sites | mobile QA | all | — | already met |

## 5. Anti-patterns observed (and rejected for LUC UI)

| Anti-pattern | Site | Why it would hurt LUC |
|---|---|---|
| A 200+ row sidebar listing every component | React Bits (226), Mantine (122), Aceternity (163) | LUC already derives families from the registry; a flat list would grow with 223 entries and destroy "where am I" |
| Commerce/promos inside the documentation body | Aceternity | LUC UI is an internal system with no store; upsell would be filler |
| 140+ code blocks per component page | Mantine | LUC's components have fewer props; the density would read as padding |
| Embedded editor/iframe as the demo | ECharts | Engine weight and isolation rules (ADR-017/035) forbid a second engine per page; LUC's `qa:isolation` gate exists precisely to keep pages cheap |
| Placeholder-heavy homepage with no route into the catalog | (none of the nine — LUC's `/` is closer to this) | LUC's home already routes well; keep it |

## 6. Implications for LUC UI, mapped to this audit's problems

1. **CS-02 (outline harvests demo content)** — Radix shows the correct
   alternative: the rail is a declared list of page sections (CP-04). LUC already
   has the machinery (`data-anchor-id`, `#preview`, `#usage`, `#api` anchors
   exist on chart pages); the fix is scoping, not invention.
2. **CS-04 (chart demo below the fold)** — shadcn/Magic UI's order
   (purpose → demo+code → usage → props) is the target; LUC chart pages already
   have a `#preview` anchor, it simply sits behind install/config prose.
3. **Component-to-code workflow** — CP-01/CP-02 are cheap wins and directly
   serve the user's stated preference ("make it easy to try… keep technical
   explanation secondary").
4. **Motion pages** — CP-07 is the clearest single upgrade for the Motion area
   and costs no new components.
5. **Visuals** — LUC's live catalog (45/45 rendered) already beats most
   competitors; the work here is hierarchy (fewer words, a real rail), not a new
   catalog.
6. **What not to become** — a giant sidebar, a marketplace, or a 146-code-block
   reference. LUC's differentiator is the *live specimen at real component
   fidelity*; prose length is not the product.
