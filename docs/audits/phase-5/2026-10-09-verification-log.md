# Phase 5 — verification log

Every command below was run from `luc-ui/` on 2026-10-09 (Asia/Singapore) against
the working tree, with the Showcase container `luc-ui-showcase` serving
`127.0.0.1:3000`.

## Gates

| Command | Exit | Evidence |
| --- | --- | --- |
| `pnpm typecheck` | 0 | `packages/ui`, `apps/showcase`, `luc-web` all `Done` |
| `pnpm lint` | 0 | `eslint src --max-warnings 0` in all three |
| `pnpm test` (inside `pnpm verify`) | 0 | **814 tests / 83 files** (Phase 4: 763 / 81) |
| `pnpm verify` | 0 | typecheck + lint + tests + `catalog:check` + `build:package` + publint + consumer tests + attw |
| `node apps/showcase/scripts/i18n-coverage.mjs` | 0 | headers 131/131, nav 145/145 + 132/132, chrome 82/82, long-form keys 580/580, **bodies 29/131** |
| `pnpm qa:full` | see below | 130 routes, 384+ screenshots, 81/81 behaviour, 0 axe violations |

## Consumer bundles (from `pnpm verify` → `test:consumer`)

`button-only` **10.9 KB raw / 3.6 KB gzip** — unchanged from Phase 4, which is
the isolation claim that matters most. Others: `menus` 2.9/1.2, `surfaces`
4.5/1.6, `motion-spatial` 6.1/2.2, `barrel` 14.5/4.6, `components-v4`
17.6/5.4, `forms-core` 14.2/4.2, `data-table-only` 21.2/6.5,
`charts-statistical` 44.2/13.3, `charts-financial` 42.5/13.0,
`financial-engine` 33.8/10.7, `charts` 59.2/18.1, `slider` 6.5/2.5,
`date-picker` 28.6/8.4, `app-shell` 29.7/8.7, `tradingview` 52.1/13.8.
No budget was raised; `✓ subpath imports stay isolated` still passes.

## Defects found by live browser QA in this cycle

These were found **after** the unit tests were green, which is the point of
running the browser tier.

### 1. `GeoTrajectoryChart` rendered blank *and* raised a page error

Symptom: `/charts/geospatial` produced an empty plot box (no axes, no lines)
and one intermittent `pageerror`, `Cannot read properties of null (reading
'0')`.

Root cause, in three parts:

1. The series was ECharts' `lines` type with `polyline: true` and a single data
   item shaped `{ coords: [...] }`. The engine's polyline layout threw on that
   payload; the throw happened inside the effect that calls `setOption`, so it
   surfaced as an uncaught page error.
2. Even when it did not throw, a `custom`-style payload leaves the axes with no
   data extent, so the grid had nothing to draw.
3. `renderItem` read the route out of `params.dataIndex` — but each route is one
   series with a single placeholder item, so every series drew **route one** and
   the highlighted route was never painted.

Fix: the path is projected in `renderItem` through `api.coord` (the pattern the
rest of the library already uses for geometry the engine does not own); the
route is bound to its own series in the closure; and the axis domain is computed
from the supplied coordinates as an explicit display mapping. The regression is
asserted in `chart-packs-v5.test.tsx` by calling `renderItem` directly and
checking that series 1 does not repaint series 0's path.

Verified after the fix: `/charts/geospatial` dark capture shows both routes, the
second one continuous across the antimeridian, with `problems: none`.

### 2. The QA harness could not attribute a page error to a route

`attachDiagnostics(page, () => current, recorder)` passed a *getter* where a
string was expected, so every recorded diagnostic was prefixed `() => current:`
instead of the route slug. Fixed in `qa/diagnostics.mjs` (accept a string or a
function). Without it the geospatial defect above was unattributable.

## Screenshots reviewed by hand (not only asserted)

| Route | What was checked |
| --- | --- |
| `/charts/geospatial` | Both routes drawn; the dateline leg continuous; the no-data region distinctly coloured; legend range readable |
| `/charts/surfaces` | Mesh painted back-to-front, no see-through faces, sliders move the view |
| `/charts/catalog` | Status counts and the "variants, not types" table |
| `/components/tree-view` | Selection well, indentation, aria levels |
| `/components/ai` | Streaming caret, tool-call disclosure, agent steps |
| `/components/media` | Gallery, lightbox, before/after |

## Not verified (disclosed)

- **Luc Web was not built, opened or visually tested.** Its `typecheck` and
  `lint` ran in the workspace gate; every compatibility statement in the Phase 5
  report is a source-level judgement.
- **Real-device touch input** was not exercised; only pointer contracts and the
  390px screenshots.
- **The live provider tier** (`pnpm qa:providers`) was not re-run in this cycle.
  The provider routes are covered by `qa:full` against the deterministic stub.
