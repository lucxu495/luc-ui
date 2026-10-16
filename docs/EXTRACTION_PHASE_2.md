# Phase 2 — the Visuals extraction

On **2026-10-16** the LUC Visuals product left this repository for its own,
private one (`luc-visuals`). This is the record of what moved, what stayed, and
what the two repositories now owe each other.

Phase 1 (see [`EXTRACTION_PHASE_1.md`](./EXTRACTION_PHASE_1.md)) lifted the whole
combined project out of the `luc-quant` monorepo. Phase 2 is the split that was
deferred then: one repository for the open UI system, one for the closed visual
product.

## The dependency, and why it points one way

```
luc-visuals  ──►  @luc/ui   (a packed tarball, through the public exports)
luc-ui       ──►  nothing
```

Nothing in this repository imports `@luc/visuals` any more, and nothing in
`luc-visuals` reaches into `packages/ui/src`. The consuming side is a real
install: `vendor/luc-ui-1.0.0.tgz` is `pnpm pack` output, its `exports` map
resolves to `dist/`, and the Showcase compiles against it with no
`transpilePackages` entry for it. The local path is a stand-in for a version —
see "Distribution" below.

## What moved out

| Moved to `luc-visuals` | What it is |
| --- | --- |
| `packages/visuals/**` (245 files) | The `@luc/visuals` package: 137 capabilities across 12 families, skins, art, compositions, contracts, fixtures, and its 713-test suite. |
| Eleven routes under `apps/showcase/app/visuals/**` | Overview, Elements (+ per-element detail), Styles, Skins, Themes, Compositions, Artifacts, Works, Art, Documentation. |
| `components/visuals/**` (5 files) | The catalogue grid, the element detail, the specimen frame, the asset gallery, the artifact preview. |
| `lib/visuals/**` | The catalogue model, the family vocabulary, the workbench, the generated geometry table. |
| `scripts/visuals-*.mjs`, `qa/visuals-v2.mjs`, `qa/i18n-chrome-pin-visuals.mjs` | The visuals-specific verification tools. |
| The Visuals half of `lib/i18n/**` | 1,860 of the 7,895 prose sentences, the `/visuals/**` route copy, and the navigation labels for its own menu. |
| `tests/unit/visuals-catalog.test.tsx`, `visuals-package-i18n.test.ts`, `i18n-prose.test.ts` | The Showcase-level tests for the catalogue and for the translation pipeline. |

Three files moved with deliberate edits, and each is the only file under
`apps/showcase` that is not byte-identical to what left:

* `lib/visuals/families.ts` gained `familyIdOf` (moved out of `catalog.ts`), so the
  breadcrumb can resolve a contract family to a catalogue family **in the
  browser** without importing the catalogue's fixture set. `catalog.ts`
  re-exports it, so no page changed.
* `lib/visuals/catalog.ts` re-exports instead of defining.
* `lib/visuals/element-geometry.generated.ts` was **regenerated**. Six of its 410
  measured pairs no longer matched what the code draws (heights off by 9–16 px on
  `bump-chart`, `error-propagation`, `state-transition`); two consecutive
  regenerations were byte-identical, so this was stale data, not noise. The
  `visuals:geometry:check` gate was not in this repository's `verify` chain, which
  is why it had gone unnoticed.

## What stayed, and what was removed with it

**Stayed**: every UI surface — components, charts, motion, data, forms, date and
time, application shell, patterns, experiences, studios, blocks, the docs
registry, the TradingPview integration — plus the whole `@luc/ui` package and its
gates.

**Removed with Visuals**: the `/visuals` QA capture policy, the four
`/visuals/**` entries in the discovery catalogue, the `visual` discovery kind,
the Visuals navigation group, the Visuals area (a header destination), 2,054
prose sentences and 294 long-form content keys that only Visuals rendered, and
the home page's "See the visual system" call to action — which now points at
`/charts`, because a link to a route that no longer exists is a 404 the QA sweep
reports as a console error. It did: 2 findings on `/` until the call to action
was retargeted.

Two tests changed meaning rather than passing by accident:
`discovery-areas.test.ts` asserted the Visuals area's tier, its sidebar and its
prefix precedence, and now asserts the same properties on the areas that remain
(`/patterns/**` for nested-prefix precedence).

## Distribution

`luc-visuals` consumes `@luc/ui` from a **packed tarball** today. A Git
dependency (`github:lucxu495/luc-ui#<ref>`) is the intended next step and is
**not verified**: it needs a reviewed commit pushed to the public repository
first, and this phase was explicitly forbidden from pushing anything. The
package is ready for it — `pnpm pack` produces a 1,102-file tarball whose
`publishConfig.exports` resolve to `dist/`, and `pnpm verify:package` (publint,
`attw`, a packed-tarball consumer build) passes against exactly that artefact.

When the Git route is taken, the change is one line in
`luc-visuals/apps/showcase/package.json` plus a re-resolved lockfile — a local
install was verified this phase, a tarball install was verified this phase, and
no claim is made about Git installation.

## What this repository carried of Visuals after Phase 2

Two things, both deliberate and both listed in the Phase 2 report. Phase 3
resolved them, so this section is now a record of where they went:

* `docs/visual-architecture/**` (31 files) and the Phase 10A/10B audits under
  `docs/audits/**` — the design and verification record of the Visuals product,
  written while it lived here. They are history, not code, which is why Phase 2
  left them in place: moving them is a publication decision, not an extraction
  step. Phase 3 moved all three directories to the `luc-visuals` repository
  (`docs/visual-architecture/`, `docs/audits/phase-10a/`,
  `docs/audits/phase-10b/`) before this repository's first public commit, and
  removed the two `i18n-merge.mjs` handoff directories that pointed at them.
* `artifacts/` — committed review evidence from the combined era. The Phase 2
  report expected the pixel baselines to include Visuals pages; they do not.
  All 25 committed baselines are UI surfaces (foundations, controls, forms, the
  application shell, charts, TradingView), and the only Visuals residue was one
  route list inside `artifacts/reports/behaviour.json`, which the committed
  QA reports rewrite on every run. No Visuals screenshot is committed here:
  `artifacts/screenshots/` and `artifacts/qa/` are `.gitignore`d.
