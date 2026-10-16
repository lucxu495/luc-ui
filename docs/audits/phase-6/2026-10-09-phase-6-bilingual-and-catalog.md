# Phase 6 — bilingual completion, chart-catalogue reconciliation, quality pass

**Date:** 2026-10-09 (Asia/Singapore)
**Revision:** `main` @ `fce3614` plus the working-tree changes described here (nothing committed)
**Scope of writes:** `luc-ui/**`
**Deployed:** `luc-ui/showcase:1.0.0` = `7460118b9f18`, container `luc-ui-showcase`, `127.0.0.1:3000`

---

## 1. What this phase set out to do

Five previous phases each reported progress on the Chinese Showcase while the
number of untranslated pages did not fall. Phase 6 was scoped to end that:
translate the *existing* documentation, reconcile the chart catalogue so its
numbers stop drifting, and verify the result in a browser rather than in a
report.

The headline result, all of it machine-checked:

| Surface | Before | After |
| --- | --- | --- |
| Routes whose page body is fully bilingual | 29 / 131 | **131 / 131** |
| Documentation sentences with a Chinese rendering | 0 measured | **12 180 / 12 180** |
| Showcase chrome strings | 87 / 87 | 88 / 88 |
| Navigation labels / descriptions | 145 / 145 · 132 / 132 | unchanged |
| Symbol-dictionary content keys | 581 / 581 | 581 / 581 |
| Renderer-side check (`/zh…` in a browser) | not run | **130 / 130 routes with zero English prose** |

## 2. How the translation works

### 2.1 Two mechanisms, one dictionary

The Showcase already had two lookup styles before this phase:

* `tc("some.key")` — long-form copy keyed by symbol, used by the 29 pages that
  were translated in earlier phases.
* `tn("English label")` — navigation copy keyed by its English source.

Phase 6 adds the third and applies it everywhere: `tcs("English sentence")`,
prose keyed by the English source sentence itself. The English stays where it
was written — it is the fallback and the readable source — and the Chinese is
looked up by that sentence. Consequences that mattered:

* a translator never has to open a page to find out what a key means;
* identical sentences are translated once, so the same sentence cannot drift
  into two renderings on two pages;
* a page can be re-indented without invalidating a translation, because both
  sides are whitespace-normalised.

### 2.2 The pipeline

| Piece | File | What it does |
| --- | --- | --- |
| Prose contract | `apps/showcase/scripts/i18n-prose.mjs` | The single definition of "translatable": copy attributes on documentation chrome, four-word text nodes, prose keys in module-level data arrays, sentences already inside `tcs`, plus an explicit, reasoned exemption list. |
| Dictionary | `apps/showcase/lib/i18n/prose.zh.ts` | ~2 800 entries keyed by English source. |
| Lookup | `lib/i18n/provider.tsx` (`tcs`), `lib/i18n/server.ts` (`getServerCopy().tcs/.tn`) | Client and server paths read the same table, so a sentence has one rendering regardless of which one rendered the page. |
| Codemod | `apps/showcase/scripts/i18n-codemod.mjs` | Wraps every extracted sentence in `tcs(...)`, injects the hook (or the server helper) into the owning component, and widens a destructure that already existed. |
| Coverage check | `apps/showcase/scripts/i18n-coverage.mjs` | Per sentence and per route; fails on a missing translation, an orphan that exists nowhere, or a duplicate key. |
| Worklist | `apps/showcase/scripts/i18n-pending.mjs` | The translator's queue: unique sentences, deduplicated, grouped. |
| Renderer check | `apps/showcase/qa/i18n-live.mjs` | Loads `/zh<route>` in Chromium and reads the visible text. |

### 2.3 What is deliberately not translated

Component names, prop names, import paths, token names, CSS custom properties,
code samples and identifiers. Six strings sit in a prose position but are not
prose at all — a code sample in the mono face, a token-name list, a fixture
timestamp with a dataset code — and those are listed in `PROSE_EXEMPTS` with a
written reason rather than quietly turned into identity "translations".

### 2.4 Why a renderer-side check exists

The static check proves that every sentence *has* a rendering. It cannot prove
that the rendering arrives: a page can look a key up and print the English
anyway, a library registry can carry its own copy, and a data module can hold
prose the extractor cannot see. `qa/i18n-live.mjs` closes that gap.

It also produced the phase's most useful correction: the first version walked
`document.body` without excluding `<script>`, so it read Next's RSC flight
payload and reported the English *source* of every translated string as a leak.
The detector now skips `pre, code, kbd, samp, .font-mono, script, style,
template, noscript`, ignores segments that already contain Chinese, and carries
a short, reasoned allow-list of library-level English defaults.

## 3. Library widgets and Showcase chrome

Three categories of English text were reachable from Chinese pages but owned
outside the pages:

1. **Showcase chrome** — `PropsTable`, `TokenTable`, `DataTable`, `Demo`,
   `Playground`, `StateGrid`, `CopyButton` and `ChartPanel` are now
   locale-aware. `DataTable` deliberately stays a *server-compatible* module
   (`components/docs/data-table.tsx`) because a page hands it `render` functions
   and a function cannot cross the server/client boundary; the locale-aware
   tables wrap it.
2. **Library labels** with no override — `FullscreenButton`, `SearchInput`,
   `Combobox` and `CarouselControls` gained optional label props. The defaults
   stay English (a component library ships no copy), and a consumer in another
   language passes its own strings. Tests: `src/components/label-overrides.test.tsx`.
3. **Data owned by a registry** — the chart catalogue and the library's
   TradingView widget catalogue hold their own prose. The Showcase looks each
   sentence up by its English source (`tcs(definition.summary)`), and
   `scripts/chart-catalog-strings.mjs` reads both registries so the coverage
   check sees them.

## 4. Chart-catalogue reconciliation (Phase 6C)

### 4.1 The registry

`apps/showcase/components/charts/chart-catalog-data.ts` is now the single
machine-readable source. Each entry carries:

| Field | Meaning |
| --- | --- |
| `id` | stable slug; a link, a test and an agent refer to a chart by this |
| `symbol` | the public component(s); `·` = two renderers of one plot, `+` = a composition of existing components |
| `kind` | `plot` (a distinct mark), `variant` (a different reading of another plot), `composite` |
| `status` | `public` · `engine` · `planned` · `blocked` |
| `engine` | `echarts` · `lightweight-charts` · `canvas-projection` |

`/charts/catalog` renders from it, and `scripts/chart-catalog.mjs` verifies it:
every symbol must exist as an export of `@luc/ui/charts`, every id must be
unique, a planned or blocked row must not name a component, and a composite must
name two. `pnpm verify` runs it.

### 4.2 The numbers, and where the old ones came from

```
Phase 4 report headline "public types"                     62
Phase 4 report's own per-domain table, summed             69   ← already disagreed with its headline
Phase 5 implemented (diagnostic, network, geo, surface)  +10   → 79
Phase 5 catalogue headline                                78   ← counted "Spatial density" as engine-only
Phase 6 registry (verified)                               79   public rows, of which
                                                             76 distinct plot types
                                                             +2 variants (Segmented bars, Rolling measure)
                                                             +1 composition (Spatial density)
   drawn by 78 distinct public components across 3 renderers
   plus 5 further variants in the variants table (7 in total)
   1 planned (Parallel sets / alluvial) · 1 blocked (3D globe) · 0 engine claims
```

The `62 → 78` discrepancy is not a Phase 5 invention: the Phase 4 audit's own
domain table summed to 69, so its headline was already 7 below its own
inventory. The Phase 6 registry is the first count that is *checked* rather than
asserted, and the difference between "79 rows", "76 plot types" and "78
components" is now explicit instead of being one marketing number.

## 5. Verification

See `2026-10-09-verification-log.md` for the exact commands. Summary:

| Gate | Result |
| --- | --- |
| `npx tsc --noEmit` (showcase) | 0 errors |
| `npx eslint . --max-warnings 0` (showcase) | 0 problems |
| `npx next build` (showcase) | all routes built |
| `npx vitest run` (package) | **820 passed / 84 files** (Phase 5: 815 / 83) |
| `node scripts/i18n-coverage.mjs` | exit 0 · 12 180 / 12 180 sentences · 131 / 131 bodies |
| `node scripts/chart-catalog.mjs` | exit 0 · reconciliation printed |
| `pnpm verify` | exit 0 (typecheck, lint, tests, i18n, charts, package build, export verification, consumer tests, types) |
| `pnpm qa:full` | 130 routes · 384 screenshots · behaviour 81/81 · 203 axe scans, 0 violations · `problems: none` |
| `node qa/i18n-live.mjs` (deployed) | **130 / 130 routes with no English prose leak** |

## 6. Honest limitations

1. **20–34 sentences are "ahead of the extractor".** A sentence that sits beside
   an inline element (`… a hairline (` `<Code/>` `) when two levels …`) is split
   into fragments the extractor does not reassemble. Those fragments are
   translated and used; the checker reports them as a gap in *extraction*, not
   as missing coverage. The live check is what proves they render.
2. **Library-level English defaults remain** where a consumer overrides them by
   prop (`Previous slide`, `Next slide`, `Search…`, `No matches`, the chart
   shells' internal `ariaDescription` fallbacks). The override contract is
   documented and tested; the Showcase passes Chinese wherever it renders them.
3. **The `i18n-live` sweep is heuristic.** It flags five-or-more-word,
   mostly-ASCII segments in prose elements. It cannot see text inside a canvas,
   and its allow-list is a judgement call, recorded in the file.
4. **Luc Web was not built, opened or visually checked.** Only its typecheck and
   lint ran; every compatibility statement in this phase is source-level.
5. **Real-device touch is untested** — pointer contracts and 390px screenshots
   stand in for it.

## 7. Deferred

* Reassembling sentences split around inline JSX in the extractor (would remove
  the "ahead of the extractor" bucket).
* Translating the library's own `ariaDescription` defaults in place — the
  correct fix is a locale provider inside the library, which is a product
  decision rather than a Showcase one.
