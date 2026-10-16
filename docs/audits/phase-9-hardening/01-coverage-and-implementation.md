# Phase 9 Hardening — coverage inventory and implementation record

Owner: Lead. Date: 2026-10-09. Deployed Showcase image:
`luc-ui/showcase:1.0.0` = `ecd3d78618c6`, container `7529498fc159`, healthy at
`127.0.0.1:3000` since 19:21 UTC.

## 1. The three levels, and what was measured

| Level | Definition | How it is checked |
| --- | --- | --- |
| Live Demo | the real component, on its own page, with a deterministic fixture and the JSX that reproduces it | `tests/audit/demo-coverage.test.ts`; browser check in `qa/behaviour.mjs` (`docs` group) |
| Interactive Playground | the same component with the reader driving props, code and preview from one state | `tests/unit/playground-{engine,adapters,wiring}.test.ts`; a browser check that a control moves both the code and the drawing |
| Professional Studio | domain editing beyond props | `/studios/{charts,motion,themes,composer}` (Phase 9), unchanged here |

A page is not a Live Demo because it has a shell, a screenshot or a CSS mock.
The coverage test fails if a generated page has no demo, if a demo renders a
component the page does not document, if a structured snippet sets an attribute
the compiler does not list, or if a snippet is nondeterministic.

## 2. What the phase changed

Before: 223 documented entries, of which **157 are generated pages** (52
components, 76 charts, 29 motion). Fifteen had a hand-written specimen
(`components/doc-pages/examples.tsx`) and eight had a Playground, so **134
generated pages showed an API table and nothing else**. No chart page rendered a
chart.

After:

| Surface | Entries | Live Demo | Interactive Playground |
| --- | --- | --- | --- |
| Components (generated) | 52 | **52** | 4 (`Input`, `Card`, `ChatMessage`, `ProfileHero`) |
| Charts (generated) | 76 | **76** | **72** |
| Motion (generated) | 29 | **29** | 1 (`KineticHeadline`) |
| Components (curated, pre-existing) | 51 | own hand-written pages | 1 (`Button`) |
| Integrations (curated) | 9 | provider widgets (pre-existing) | 0 |
| Reference entries | 4 | documented on their family page | 0 |

* **157/157 generated pages now render a real specimen**, enforced by test.
* 93 demos print their snippet from the same props object the specimen was
  rendered from (`origin: "structured"`); 64 are compositions with a snippet
  written by hand (`origin: "composition"`), which the audit reports as such.
* Four curated pages that declared a Playground in the registry and could not
  render one now do: `/components/inputs`, `/components/cards`,
  `/components/ai`, `/motion/kinetic`. The fix is a generated client-safe entry
  projection (`generated/playgrounds.ts`) instead of the server registry.
* 78 entries declare a Playground; all 78 render (verified over HTTP against the
  deployed container).

### Justified exceptions

| Entry | Level reached | Why not more |
| --- | --- | --- |
| `choropleth-chart`, `geo-scatter-chart`, `geo-trajectory-chart` | Live Demo | all three need a base map registered with `registerEChartsMap` before they render, so a panel over "height, state, accessible name" would control a demo the reader cannot re-fixture |
| `small-multiples` | Live Demo | the fixture is a grid of child panels; a control panel over the container would control nothing visible |
| `locale-provider`, `luc-provider`, `navigation`, `theme-provider` | documented on family pages | `reference` status: they have no page of their own by design |

### Flagged, not covered

A proxy check over the 39 curated routes matched by the registry scan found
**five pages that render real components but no framed specimen**:
`/application/outline-drawer` and four TradingView pages
(`heatmaps`, `patterns`, `symbol-details`, `tickers`). They are not counted as
covered. The proxy is presence of a demo frame, which is not proof — the pages do
render live components — so this is a review flag rather than a defect list.

## 3. How a demo is written (and why it is data)

```
demo<EcdfChartProps>({ id, component, props, render, note? })   // snippet printed from `props`
composition({ id, node, code, note? })                          // snippet written by hand
```

* One demo per `DocEntry.id`. A duplicate id throws at module load.
* Three registries, one per route tree (`registry.ts`, `registry.charts.ts`,
  `registry.motion.ts`), so a Button page never loads the charting surface.
* Interactive demos are client islands under `components/demo/islands/`; a demo
  that needs state is a `composition` and says so.

## 4. Verification (commands and results)

| Command | Result |
| --- | --- |
| `pnpm verify` (luc-ui) | exit 0 — typecheck, lint, library + showcase tests, i18n, chart catalogue, docs registry, package registry, package build/consumer/types |
| `pnpm --filter @luc/ui test` | **898 passed / 89 files** |
| `pnpm --filter @luc/ui test:showcase` | **85 passed / 11 files** (was 79; the audit file adds 6) |
| `node apps/showcase/scripts/i18n-coverage.mjs` | prose **56169/56169 (100%)**, navigation descriptions **51/51**, chrome 88/88, content keys 581/581, headers 161/161 |
| `node apps/showcase/scripts/docs-registry.mjs --check` | up to date, 223 entries, 78 with a Playground |
| `pnpm qa:full` (deployed container, 3 workers) | **167 routes, 475 screenshots, 144/144 behaviour checks, 0 axe violations across 257 scans, no console or page errors** |
| `pnpm qa:behaviour --group=docs` | 35/35 |

Bundle sizes are unchanged in kind because `packages/ui/src` was not modified in
this phase: the published subpath costs printed by `verify:package` are the Phase
9 numbers (button-only consumer unaffected; `charts` 59.6 KB raw / 18.2 KB gzip).
All demo code lives in the Showcase.

## 5. Defects found and fixed while writing the demos

1. **Double chart Playground attributes** — the Button adapter emitted
   `leadingIcon` twice; illegal JSX for anyone who pasted it. Fixed, and the
   adapter registry is now guarded against duplicates.
2. **Chart map registration raced a live choropleth** — the geospatial family
   page and the geographic chart pages each registered the same fixture map on
   mount, and a long sweep produced
   `pageerror: Cannot read properties of null (reading '0')`. Registration is now
   memoised per realm (`lib/geo-map.ts`) and the full sweep is clean.
3. **A QA selector measured the wrong element** — after `/components/ai` gained a
   Playground above the thread, the streaming check's unscoped `.first()` matched
   the playground's static `ChatMessage` (frozen at 67 characters). Scoped to
   `[data-slot="message-list"]`.
4. **A missing `required` contract in the serializer** — `aria-label`, the
   headline text and a message's sender disappeared from the generated code at
   their defaults, producing snippets that compiled and were unusable. A
   `required` flag now writes them, and the engine test expects them.

## 6. Open items

1. Nothing in the library's public API changed; the artifacts are Showcase-side.
2. WebKit is still unavailable on this host (system dependencies); Chromium is
   the only engine the sweep runs.
3. The five curated pages in §2 are flagged, not fixed.
4. Chart panels offer the family-common controls (height, state, accessible
   name) plus, for `LineChart` and `ViolinChart`, the richer hand-written
   adapters. Per-chart series/domain controls are not implemented.
5. The load-bearing Pro/Community boundary and repository split remain
   pre-publication decisions, unchanged by this phase.
