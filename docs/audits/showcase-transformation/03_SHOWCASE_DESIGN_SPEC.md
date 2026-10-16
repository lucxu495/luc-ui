# 03 — Target Showcase Design Spec

The desired LUC UI Showcase experience, derived from the verified current state
(`01_CURRENT_STATE.md`) and the competitor study (`02_COMPETITOR_RESEARCH.md`).
This is a specification, not an implementation. It preserves LUC UI's own
identity: a **live specimen at real component fidelity**, not a marketplace, a
marketing site, or an encyclopedia.

---

## 1. Product UX principles

**P1 — Show the component first.** On any detail page the live specimen must be
visible within the first viewport (≤ 900 px at 1440×900). Prose that must precede
it is capped at ~40 words: a one-line purpose and, where needed, one constraint.

**P2 — Make it easy to try.** Every interactive capability exposes its real props
through a control surface adjacent to the specimen, not below the fold.

**P3 — Make its options discoverable.** Variants are *sections with specimens*,
not paragraphs. A reader learns the API by scrolling past examples, not by
reading an essay.

**P4 — Keep explanation secondary.** API tables, token mappings, SSR notes and
accessibility contracts move below the specimen and code, or into disclosures.
Nothing useful is deleted; it is *ordered*.

**P5 — Three navigation jobs, three owners.** (see §3)

**P6 — One catalog, many projections.** Component/chart/motion/visual identity
comes from the registries already in the tree (`lib/docs/generated/*`,
`@luc/visuals` `ELEMENT_LIST`). No page may hand-maintain a second list of
capabilities.

**P7 — Never invent a claim.** Counts, statuses and availability stated in the
product must be derived at build time from the registry (as `/charts/catalog`
and `/visuals/elements` already do). A number typed into a page is a bug.

**P8 — Depth is a property of the page, not of the specimen.** Any element that
*reads* the document to describe the page must be scoped to document-authored
content.

---

## 2. Proposed information architecture

### 2.1 Roles

| Area | Recommendation | Evidence |
|---|---|---|
| **Components** | Keep as primary destination | 103 registry entries; the largest catalog; already primary in the header |
| **Charts** | Keep as primary destination | 81 entries / 78 public components; the only surface with a verified count program |
| **Visuals** | Keep as primary destination, but reduce to the 4 destinations it declares | `/visuals` sidebar is already correct; its *resource* pages are the problem (CS-06) |
| **Motion** | Promote to primary **or** keep secondary with an explicit landing — decide once, then make the header say it | 35 entries, 8 gallery links, currently under "More" while its count rivals Visuals |
| **Blocks** | Keep as secondary, but stop mixing four things under one area | `/blocks` + `/templates` + `/experiences` (16) + `/patterns` (11) are four products sharing one prefix set |
| **Studios** | Keep as secondary destination; merge *Template Composer* into Blocks if it duplicates `/blocks` composition | 4 studios, 113–281 words each, no cross-links |
| **Explore** | Keep, but demote from a destination to a **tool**: "Explore" is search/browse, not a product area | `/explore` is 460 words + a link to `/explore/browse`; the value is the browse index |
| **Docs** | Keep as the technical layer, and make it the *only* home for installation, foundations, guides and per-page API essays | `/docs` sidebar already groups 6 families |
| **Experiments** | Decide: internal tooling or product. It is currently in the Docs area sidebar and in no primary surface | 4 routes, 0–4 inbound links |

### 2.2 Preferred structure

```
Primary (always visible)      Components · Charts · Visuals · Motion
Secondary (one disclosure)    Explore · Blocks · Studios · Docs
Home                          /            (front door + site map)
```

Rationale: four capability families is the number the product actually has
(103 / 81 / 45 / 35 entries). Visuals and Motion are peers; Motion being hidden
behind "More" while Visuals is primary is an accident of phase order, not a
product decision.

### 2.3 Alternative (with trade-offs)

```
Primary    Components · Charts
Secondary  Visuals · Motion · Blocks · Studios · Explore · Docs
```

This groups by *engine ownership* (component system vs visual system) and keeps
the header to two entries. Trade-off: `Visuals` loses the visibility its 45
capabilities and 12.6k-pixel catalog have earned, and the header stops matching
the three-way split the docs already teach (`/docs` describes Components,
Charts and Visuals as the three families). **Recommendation: preferred
structure.**

---

## 3. Canonical routing and navigation ownership

### 3.1 The rule

> **The sidebar navigates destinations. Catalog controls filter content.
> Page-local navigation moves within the page. Search crosses everything.**

This principle is currently *mostly* honoured: no catalog filter is nested in
the sidebar, and the Visuals family chips live in the page. It is violated by
the right-hand rail, which is page-local in intent but document-wide in
implementation (CS-02).

### 3.2 Exceptions, evaluated

| Candidate exception | Verdict |
|---|---|
| One sidebar row per component (223 rows) | **Reject.** Families are the right unit; competitors with flat 120–226-row sidebars are the anti-pattern. |
| Family anchors nested in the sidebar for Visuals | **Reject.** They are a filter; the catalog owns them. |
| A section anchor for a *destination-like* page (e.g. `/visuals/docs#contracts`) | **Allowed only when the anchor is declared in source** (`data-anchor-id`), never harvested from rendered content. |
| ⌘K palette searching the whole tree | **Keep.** Search is explicitly a global act. |
| Area-scoped sidebar (only the current area's groups) | **Keep.** This is the single best IA decision in the current tree; do not regress it. |

### 3.3 Ownership model

| Concern | Owner | File |
|---|---|---|
| Destinations & their order | Showcase navigation tree | `lib/navigation.ts` |
| Which groups an area shows | Area declaration | `lib/discovery/areas.ts` |
| Which components exist, their canonical route & family | Generated docs registry | `lib/docs/generated/{registry,nav}.ts` + `scripts/docs-registry.mjs` |
| Which visual capabilities exist | `@luc/visuals` registry | `packages/visuals/src/registry/elements.ts` |
| Which charts exist & their status | Chart registry | `components/charts/chart-catalog-data.ts` |
| Page-local sections | The page itself, via declared anchors | page files + `data-anchor-id` |
| Search index | Derived from the registry | `lib/docs/nav.ts` |

### 3.4 Canonical URL rules

1. One canonical URL per capability. A registry entry's `route` is canonical;
   aliases 308-redirect to it (current behaviour: `/components/button` → 308 →
   `/components/buttons`). **Keep.**
2. No two routes render the same capability. `/components/buttons` (hand-written)
   and `/components/button` (registry) already satisfy this via the redirect.
3. An unreachable page is either linked from a declared destination or retired.
   Orphans are not navigation (CS-03).
4. Detail deep links (`#preview`, `#usage`, `#api`) are stable and declared.

---

## 4. Catalog design (shared pattern)

The four catalogs (Components, Charts, Motion, Visuals) should share one layout
language with per-family adaptations.

```
┌──────────────────────────────────────────────────────────────────────┐
│ Breadcrumb:  LUC UI / Components / Forms                            │
├──────────────────────────────────────────────────────────────────────┤
│ H1  Inputs                                              [ 24 items ] │
│ One-line purpose (≤ 25 words).                                       │
├──────────────────────────────────────────────────────────────────────┤
│ [ All ] [ Forms ] [ Actions ] [ Overlays ] …   ← FILTER (not nav)    │
│ ⌘K / name search                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ ┌────────────┐ ┌────────────┐ ┌────────────┐                        │
│ │ live       │ │ live       │ │ live       │  ← card = specimen,    │
│ │ preview    │ │ preview    │ │ preview    │    name, ≤12-word line │
│ │ Name       │ │ Name       │ │ Name       │                        │
│ │ purpose    │ │ purpose    │ │ purpose    │                        │
│ └────────────┘ └────────────┘ └────────────┘                        │
│ …                                                                    │
└──────────────────────────────────────────────────────────────────────┘
```

Rules:

- The card's primary content is a **rendered specimen**, not an icon or a
  description. (LUC already does this for Visuals: 45/45 rendered.)
- Counts are derived (P7).
- Filters are client-side chips with URL state (`?family=`, `?use=`), never
  sidebar rows.
- Cards link to canonical detail routes only.

---

## 5. Page templates

A small set of reusable patterns; the difference between families is *what fills
the preview zone*, not a different page system.

### T1 — Showcase homepage

```
H1: one sentence about the system        [ Search ⌘K ]
3–4 primary cards: Components · Charts · Visuals · Motion  (live thumbnails)
Secondary row: Explore · Blocks · Studios · Docs
"What is inside" derived counts (components / charts / visuals / motion)
Footer: version, install command
```
Primary task: choose an area. Cap prose at ~250 words.

### T2 — Product landing (Components, Charts, Visuals, Motion)

```
Breadcrumb
H1 + ≤25-word purpose
[ optional: 3–6 live hero specimens ]
Family grid (derived from the registry)   ← each cell: name + count + preview
"Where to start" (3 links: browse, docs, install)
```
Primary task: understand scope and pick a family.

### T3 — Catalog (per family)

The shared pattern in §4. No prose beyond the purpose line.

### T4 — Interactive component detail (the flagship template)

```
┌ Breadcrumb ──────────────────────────────────────────────────────────┐
│ H1 Name                                             [ Copy import ]  │
│ one-line purpose                             ← ≤ 25 words           │
├───────────────────────────────┬──────────────────────────────────────┤
│  PREVIEW  (dominant, live)    │  CONTROLS (compact, grouped)         │
│  fills the column             │  ▸ Essential props                   │
│  [ Preview | Code ]           │  ▸ Variants (preset chips)           │
│                               │  ▸ Advanced (collapsed)              │
│                               │  [ Reset ]  [ width: S M L ]         │
├───────────────────────────────┴──────────────────────────────────────┤
│ Variants as sections — each: specimen + copyable snippet             │
│  • Primary  • Outline  • Ghost …                                     │
├──────────────────────────────────────────────────────────────────────┤
│ Usage (short)                                                        │
│ API reference (table)              ← below the fold is fine          │
│ Accessibility & constraints                                           │
│ ▸ Advanced notes (disclosure)                                        │
└──────────────────────────────────────────────────────────────────────┘
```

Right rail: **declared page sections only** (Radix model, CP-04), typically 5–9
rows. Never specimen content, never the catalog.

### T5 — Static Visual element detail

Adaptation of T4: no controls column (Visuals has no runtime props to vary
beyond size/style, which become two small chips under the specimen).

```
Breadcrumb · H1 Name · purpose (≤25 w)
[ big specimen, centred, at its declared size ]
[ size: S M L ] [ style: six skins ]     ← two chip rows, not a panel
Variants: the same element at each supported size, each with its contract note
Usage snippet (import + props) — copyable
▸ Technical reference (capacities, min box, overflow behaviour)  ← disclosure
```

### T6 — Chart detail

Adaptation of T4 with the **preview above installation**:

```
Breadcrumb · H1 · purpose (≤25 w)
[ PREVIEW — the plot, full width, ≥420 px tall ]
   [ Preview | Code ]   [ height ] [ state ] [ accessible name ]
   [ scale: linear | log ]  [ annotations on/off ]   ← family-specific
"What this draws" — 2–3 sentences, including the caller-prepares-values rule
Usage snippet (copyable)
● Caller-prepared values rule (one quiet sentence; no engine internals)
API reference table
Accessibility & SSR notes
```
Installation instructions belong on `/docs/installation` and may be linked, not
repeated per chart.

### T7 — Motion detail

Motion Primitives' model (CP-07):

```
Breadcrumb · H1 · purpose (≤25 w)
Example 1: [ Preview | Code ]   ← smallest useful specimen
Example 2: [ Preview | Code ]   ← a distinct behaviour, not a colour variant
Example 3: [ Preview | Code ]
Props table
Reduced-motion behaviour (explicit, one paragraph)
Replay / pause control where the effect is timed
```

### T8 — Documentation page

```
Breadcrumb · H1 · lead (≤ 40 w)
Body prose (the only place long-form prose is expected)
Code / tables inline where they help
Right rail: page sections (declared)
Footer: related pages (2–4 links), not a catalogue dump
```

### T9 — Explore / search results

```
H1 Explore           [ search field ]        [ use case ▾ ] [ art direction ▾ ]
Result list: name · type badge (component/chart/visual/motion/block/guide)
             · one-line purpose · canonical link
"0 results" state must name what was searched and offer the two filter axes
```
Explore stops being a landing page with 460 words and becomes the filter UI over
the registry.

### T10 — Workbench / studio

```
┌ Title · one-line purpose ────────────────────────────────────────────┐
│ [ LIVE SPECIMEN — dominant region, ≥ 60% of the viewport height ]    │
│                                                                      │
├───────────────────────────┬──────────────────────────────────────────┤
│ Controls (grouped, compact)│ Output: copyable code / config / tokens │
│ [ Reset ] [ size S M L ]  │                                          │
└───────────────────────────┴──────────────────────────────────────────┘
```
Workbench = specimen + config + output. Not a page of prose with a panel at the
bottom.

### Desktop / mobile differences

| Template | Desktop | Mobile (≤ 640 px) |
|---|---|---|
| T4/T6/T7 | two columns: preview + controls | preview full width, controls below as a collapsible sheet, sticky "Controls" button |
| T3 catalog | 2–3 columns | 1 column |
| T9 explore | filter row visible | filters in a sheet, one button showing active filter count |
| T10 workbench | specimen + side panel | specimen first, then controls, then code |
| Right rail | visible ≥ xl | hidden; available via the outline drawer (`/application/outline-drawer` already documents this pattern) |

---

## 6. Workbench model

**One engine, four configurations** — not one giant universal panel, and not four
unrelated tools. Controls are grouped by importance and every group's contents
are derived from the component's real public props.

### 6.1 Control classification

| Class | Contents | Present on |
|---|---|---|
| **Essential (all workbenches)** | Reset to default · Copy code · Current prop values as code | every T4/T6/T7/T10 |
| **Family-specific** | Components: variant, size, state, disabled, icon slots, label/title text · Charts: height, empty/loading/error state, accessible name, scale mode, annotations · Motion: duration, spring/easing, depth, intensity, reduced-motion preview, replay · Visuals: size (capacity), skin, content fixture · Blocks: slot content, density | the family's pages |
| **Advanced / optional** | Anything that only a maintainer needs (engine selection, raw option object, token override) | behind a disclosure, off by default |

### 6.2 Rules

1. **Controls alter the specimen immediately** — no apply button. (Already true
   for `Playground`.)
2. **Code is generated from the same values the specimen uses.** (Already true;
   keep the single `values` object.)
3. **Reset exists on every workbench.** Today only `/motion/spatial` has one.
4. **A responsive-width toggle exists on every workbench** (Small / Medium /
   Large = 390 / 768 / 1440 internal widths) — a shared control, not per-page.
5. **Appearance toggle (light/dark) where the specimen is theme-sensitive.**
6. **Presets:** each family exposes 3–5 named presets derived from the existing
   variant list (not hand-typed).
7. **Invalid combinations are prevented or explained:** a control that cannot
   combine (e.g. log scale on non-positive data) is disabled with a one-line
   reason, never silently ignored. (`resolveAxisBounds` already implements the
   underlying rule: log falls back to linear.)
8. **State is stable while navigating** between specimens of the same family
   (URL-backed where the value is shareable, per ADR-011/URL-state policy).
9. **The panel never exceeds ~30% of the width** on desktop; on mobile it
   collapses.
10. **No implementation diagnostics in the panel.** Engine ids, internal prop
    names and QA attributes belong in tools, not in the product.

### 6.3 What each family needs (explicitly *not* one panel for all)

| Family | Preview zone | Controls | Output |
|---|---|---|---|
| Static components | specimen on a neutral stage | variant/size/state/disabled/text | JSX snippet |
| Interactive components | specimen + interaction affordances visible | as above + controlled/uncontrolled note | JSX snippet |
| Motion | specimen + replay | duration/spring/depth/intensity/reduced-motion | JSX snippet |
| Charts | plot ≥420 px, annotations visible | height/state/scale/annotations/accessible name | spec + JSX snippet |
| Visuals | the element at its declared size | size/skin/fixture | import + `<Visual …/>` snippet |
| Blocks | full-width composition | slot content/density | block composition snippet |

---

## 7. Motion demo requirements

Derived from the verified behaviour of the six spatial families and the
competitor study.

1. Every motion demo is **one public export** and states which one.
2. Every demo has **replay** and, when time-based, **pause**.
3. Every demo honours `prefers-reduced-motion` **visibly** — a switch in the
   page, not only an OS setting.
4. Controls must be reachable **without leaving the page** and must not be
   covered by the specimen (the Phase 3 regression where Card Stack controls sat
   under the card layer must not return).
5. Keyboard contract is stated on the page for interactive specimens
   (Card Stack: ←/→/Home/End; drag ≥48 px on touch).
6. Live regions announce state changes ("2 / 5"), and the *initial* index must
   be 0 so the first announcement matches the first thing a reader sees.
   (Today `/motion/card-stack` starts at index 1 and announces "2 / 3".)
7. A motion page must not exceed ~800 words of prose; the remaining explanation
   goes into the props table and the reduced-motion paragraph.

---

## 8. Chart and Visuals adaptations

| Concern | Charts | Visuals |
|---|---|---|
| Preview priority | plot first, ≥ 420 px tall | element first, at declared size |
| Controls | scale mode, annotations, height, state, accessible name | size (capacity), skin, fixture |
| Documentation | caller-prepares-values rule, SSR note, accessibility, props table | contract, capacity limits, overflow rules, static-render facts |
| Counts | from `chart-catalog-data.ts` | from `ELEMENT_LIST` |
| Forbidden | repeating install instructions per chart; engine internals in the product copy | a chart engine; a workbench that implies runtime props |
| Catalogue | status column (public/planned/blocked) stays | 7 families as filters, counts derived |

Both families must drop their *resource* pages from the product surface:
`/visuals/art`, `/visuals/artifacts`, `/visuals/compositions`, `/visuals/themes`,
`/visuals/skins` are implementation resources. They should either collapse into
one "Resources" page with disclosures or move under `/visuals/docs`.

---

## 9. Copy policy

### 9.1 Belongs on a public page

Component name · one clear purpose statement (≤ 25 words) · real demo · useful
variants · configurable props · copyable example · short usage instruction ·
relevant API reference · accessibility notes and necessary constraints.

### 9.2 Moves to technical documentation / internal tools

Phase labels · research narratives · implementation self-praise · test counts ·
internal rules shown before the demo · contract language that only a maintainer
needs · QA assertions presented as copy.

### 9.3 Before / after (all "before" text is quoted verbatim from the running Showcase)

| # | Page | Before (real) | After (proposed) | Why |
|---|---|---|---|---|
| 1 | `/motion/spatial` eyebrow | `MOTION · V3.0` | `MOTION` | Phase labels are history, not wayfinding (P4) |
| 2 | `/motion/spatial` lead | "Depth as a coordinate system, not a decoration. Six capability families, each one a public @luc/ui export, all driven by the control board below — change the depth, switch the material, freeze the orbit, and watch the page answer." | "One control board drives six spatial primitives. Change depth, material or orbit speed and the page answers." | Keeps the promise, cuts 60% and the self-description |
| 3 | `/visuals/elements` intro | "45 capabilities across 7 families, each one a distinct information encoding rather than a colour variant of another. A size is a capacity rather than a zoom: an element that cannot hold what you give it refuses and says why, in the diagnostics on its own page." | "45 elements across 7 families. Size is capacity, not zoom: an element that cannot hold your data refuses and explains why." | Two facts, no editorial defence of the catalog's honesty |
| 4 | `/visuals/elements` banner | "45 OF 45 CAPABILITIES HAVE A RENDERED PREVIEW ON THIS PAGE." | *(remove; the previews are visible)* | This is a QA assertion in product copy |
| 5 | `/charts/line-chart` summary | "LineChart draws line on the ECharts engine; the values, including any statistic, are prepared by the caller." | "Draws a line from values you supply. Statistics are the caller's." | Engine-naming first is implementation-first, and the sentence names the engine before the job |
| 6 | Sidebar row `/visuals/docs` | "Entry points, capacity rules, diagnostics, isolation." | "How to render elements, and what they refuse." | Internal vocabulary ("diagnostics", "isolation") is not user language |
| 7 | `/docs/reference` | 1 180 words + 27 h3 in one scroll | Split: index (names + routes) with per-family pages | A 12 787 px page is a data dump, not a reference |
| 8 | `/components/buttons` lead | "Six variants, three sizes, one press behaviour. The button is the component users touch most, so it gets the most careful interaction design in the system." | "Six variants, three sizes, one press behaviour." | The second sentence is self-praise, not information |

### 9.4 Documentation hierarchy

```
Level 1  Showcase home            what the system is, where to start
Level 2  Area landing             what is in this family
Level 3  Catalog                  filter + browse
Level 4  Capability detail        specimen → variants → usage → API → a11y
Level 5  Guides (/docs/**)        installation, theming, foundations, frame
Level 6  Internal (not linked)    QA reports, phase audits, harnesses
```

Nothing essential may live only at Level 6. Conversely, Level 4 does not restate
Level 5.

---

## 10. Responsive behaviour

| Breakpoint | Behaviour |
|---|---|
| ≥ 1440 | preview + controls side by side; right rail visible |
| 1024–1439 | preview + controls; rail visible ≥ xl only |
| 768–1023 | controls collapse to a sheet; rail hidden, outline drawer available |
| ≤ 640 | one column: specimen, then controls sheet, then code; catalog 1-up; filters in a sheet |
| Body | never scrolls horizontally (verified today: 380 ≤ 390 at 390 px) |

---

## 11. Accessibility and consistency

**Accessibility**

- Every interactive specimen has a real keyboard path; the contract is stated on
  the page for non-obvious ones.
- Every preview is labelled with what it is (`aria-label` or a visible caption),
  so a screen-reader user knows a demo exists and what it demonstrates.
- Code blocks are copyable via a labelled button, and the copy target is
  announced (`aria-live`).
- One `h1` per page; declared section headings only.
- The outline rail is a `<nav aria-label="On this page">` whose links target
  declared section ids and whose ids are unique (§5 of `01_CURRENT_STATE.md`
  records the duplicate-id defect to fix).
- Colour is never the only carrier of state.

**Consistency**

- One typography scale, one spacing rhythm, one radius set — from `@luc/ui`
  tokens; no page-local `max-w-[…]` (the existing `LayoutIntent` vocabulary
  already enforces this).
- Preview stages use one shared canvas treatment so a Button, a LineChart and a
  MiniLine do not look like three products.
- Active navigation state: header (`aria-current` on the area), sidebar
  (`aria-current="page"` on the item), outline (`aria-current="location"`).
- Empty / loading / error states use the same components everywhere
  (`ChartEmptyState` etc.) and never present freshness/availability vocabulary on
  a public page.

---

## 12. What must not change

- The registry-generated identity of components, charts, motion and visuals.
- The area-scoped sidebar.
- Mobile behaviour (no overflow, collapsible nav).
- The engine-isolation rules (a Button page must not load ECharts).
- LUC's design identity: restrained surfaces, token-driven depth, live specimens
  at real fidelity. **Do not import another library's visual style.**
