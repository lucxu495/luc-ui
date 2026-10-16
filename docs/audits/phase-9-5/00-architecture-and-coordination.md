# Phase 9.5 — Layout, overlays and interaction stability

Scope: `luc-ui/**`. No sibling project, root lockfile or shared configuration was
touched. Nothing was committed, published or pushed.

This phase started from a person looking at the deployed Showcase and saying it
still felt unfinished. Four concrete symptoms were reported, and each one turned
out to have a different root cause — one of them a real defect in the public
`Sheet` component rather than in the Showcase.

## 1. What was measured before anything changed

`qa/probe-95.mjs` was written first, as a read-only measuring tool. It reports
numbers rather than opinions, and the same numbers are re-runnable after the
fix. The baseline, against the image that was live at the time:

| Route | Viewport | Content column | Demo | Empty space |
| --- | --- | --- | --- | --- |
| `/charts/line-chart` | 1920 | 1216 px | 1144 px | 438 px (26 %) |
| `/charts/line-chart` | 2560 | 1216 px | 1144 px | 1078 px (47 %) |
| `/components/buttons` | 1920 | 1216 px | 1144 px | 438 px |
| `/experiences/personal/career` | 1920 | 704 px | — | 950 px (57 %) |
| `/experiences/personal/academic` | 1920 | 704 px | — | 950 px |

Three separate caps produced those numbers, and all three had to go:

1. `DocsSection` (the route-group layout for `/components`, `/charts`,
   `/motion`) capped the whole section at `96rem` and reserved a `15rem` grid
   track for the "on this page" rail **whether or not the rail rendered**.
   `PageOutline` returns `null` when a page has fewer than two headings, so a
   short page paid 280 px for nothing.
2. `DocPage` used the library's `Container` default, `--container-content`
   (76 rem / 1216 px).
3. The experience pages wrapped their whole preview in
   `AppShellContent width="prose"` — 44 rem / 704 px — a *narrower* cap than
   the simulated website's own container. The product being previewed was being
   judged in a room two thirds the size of the one it was designed for.

The fourth cap was not a number at all: `Sheet` re-anchored mid-dismissal. That
is section 2 of `01-defects-and-fixes.md`.

## 2. The layout system

### Intents

A documentation site is not one width. Five intents are now the whole width
vocabulary, defined in `app/globals.css` as tokens and applied by `DocPage`:

| Intent | Token | Value | Used by |
| --- | --- | --- | --- |
| `reading` | `--layout-reading-max` | 44 rem | linear guides (`/docs/installation`) |
| `docs` | `--layout-docs-max` | 104 rem | every component page, family page, index |
| `wide` | `--layout-wide-max` | 120 rem | chart and motion entries, all four Studios |
| `canvas` | — | none | the 16 reference experiences |
| `compact` | `--layout-compact-max` | 56 rem | pages whose whole subject is a small control |

The tokens are the Showcase's own, deliberately not `@luc/ui`'s: a consumer of
the library picks its own measure, and the library's `Container` still offers
exactly the `content` / `prose` / `full` it always did. Nothing about the
public package's layout API changed.

### Where the measure now lives, and why it moved

`DocPage` owns the measure, the trail and the outline rail. The route-group
layout no longer owns any of them.

A route-group layout has to choose one width *before* the router knows which
page is inside it, so it must choose the narrowest one — which is how fifty
chart and component pages ended up on a prose measure. The page is the only
component that knows both its own content and the viewport, so the page is
where the decision belongs. `DocsSection` is now a four-line wrapper that
documents itself as the group's own boundary.

The rail followed the same reasoning: it is a flex child now, so `PageOutline`
returning `null` genuinely returns 176 px to the page instead of leaving a grid
track reserved for an outline that never rendered. On a laptop the rail also
tightens from 14 rem to 11 rem: at 1280 px a fixed 224 px rail plus its gutter
is a fifth of the column, and 48 px of plot is worth more than 48 px of rail.

### Result

Measured on the rebuilt image, `qa/probe-95.mjs width`:

| Route | Viewport | Before | After |
| --- | --- | --- | --- |
| `/charts/line-chart` | 1440 | 822 px demo | **902 px demo** |
| `/charts/line-chart` | 1920 | 1216 px container | **1654 px container** (full column) |
| `/charts/line-chart` | 2560 | 1216 px container | **1920 px container** |
| `/components/badges` | 1920 | 1216 px container | **896 px** (composed, not stretched) |
| `/experiences/personal/career` | 1920 | 704 px outer cap | **1588 px host**, 1408 px site |

The 1920-px numbers are the headline: the chart page now uses the whole content
column the shell can give it, and the component pages use the same column while
their paragraphs keep their own 68 ch measure.

## 3. Files

### Showcase — layout

| File | Change |
| --- | --- |
| `app/globals.css` | `--layout-*` and `--experience-max` tokens; `scrollbar-gutter: stable` on `html` |
| `components/docs/doc-page.tsx` | owns the measure (intent), the trail and the rail |
| `components/docs/page-outline.tsx` | renders its own `<aside>`; `null` collapses it; narrower on laptops |
| `components/doc-pages/docs-section.tsx` | reduced to the group boundary; no max-width, no grid |
| `components/doc-pages/docs-breadcrumbs.tsx` | a trail of one is not a trail |
| `components/doc-pages/entry-page.tsx` | charts and motion ask for `wide` |
| `app/studios/*`, `app/docs/installation`, `app/components/{badges,avatar,toggle,tags}` | explicit intents |

### Showcase — experience stage

| File | Change |
| --- | --- |
| `components/doc-pages/full-preview.tsx` | new: the stage, plus the full-viewport preview |
| `app/experiences/frame.tsx` | the stage replaces the framed `div` |
| `app/experiences/**/page.tsx` | all 16 use `AppShellContent width="bleed"` |
| `app/experiences/**/site.tsx` | the simulated site's measure is `var(--experience-max)` |
| `app/experiences/personal/career/site.tsx` | hero, then a chronology/credentials split, then the work |

### Library (public API reviewed)

| File | Change |
| --- | --- |
| `packages/ui/src/components/sheet.tsx` | `SheetRoot` mirrors open state and **latches the edge**; `SheetRootProps` is the one new public name |
| `packages/ui/src/components/typography.tsx` | `Code block` scrolls instead of wrapping, and is focusable |
| `packages/ui/src/components/sheet.test.tsx` | the edge latch's two observable halves |
| `eslint.config.mjs` | `pre`/`code` named in `no-noninteractive-tabindex` |

### QA

| File | Change |
| --- | --- |
| `qa/geometry.mjs` | new group: six measurements over the viewport matrix and the reported defects |
| `qa/behaviour.mjs`, `qa/constants.mjs` | register `geometry` |
| `qa/probe-95.mjs` | the diagnostic tool (`width`, `overflow`, `navclip`, `sheet`, `stable`, `shots`) |

## 4. Ownership and concurrency

Everything in this phase was done by one writer. The repository's worktree is
shared with other LUC agents and other uncommitted work; the only paths written
were under `luc-ui/`, and no Git command beyond `status`/`diff`/`log` was run.

Heavy validation is serialised on purpose. The host runs other LUC services and
several other agents, and its swap is fully committed; the Docker build and the
full browser QA were run one at a time, with no concurrent browser suites.
