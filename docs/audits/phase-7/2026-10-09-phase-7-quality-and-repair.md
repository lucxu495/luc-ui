# Phase 7 — library-wide visual excellence, interaction correctness and
# scientific-visualisation verification

**Date:** 2026-10-09 (Asia/Singapore)
**Branch:** `main`, HEAD `fce3614` — nothing committed; the whole phase is in the
working tree.
**Scope of writes:** `luc-ui/**` only.

Phase 6 closed the documentation debt and reconciled the chart catalogue. Phase 7
is the phase the user asked for after testing the product by hand: *"many
components have real visual or interaction problems despite previous successful
automated QA."* That observation was correct, and it was correct for a specific
reason — the previous gates could all pass while a component looked wrong:

| Gate | What it cannot see |
| --- | --- |
| unit tests | painted output, Tailwind selector semantics |
| axe | a dashed border on the wrong surface, an axis whose labels repeat |
| "route loads, no console error" | a chart that renders the wrong numbers |
| a screenshot taken but never read | everything above |

So Phase 7 built the missing instruments first, then used them.

## 1. What was built to look with

| Instrument | File | What it adds |
| --- | --- | --- |
| Structural probe | [`qa/inspect.mjs`](../../../apps/showcase/qa/inspect.mjs) | horizontal overflow and its cause, clipped text, sub-minimum hit targets (resolving `<label>` hit areas), collapsed slots, console errors — per route |
| Chart geometry probe | [`qa/chart-geometry.mjs`](../../../apps/showcase/qa/chart-geometry.mjs) | composites every canvas of a plot, reports ink ratio, ink box, colour count, axis-margin ink, 24×24 modal-luminance grid, and column/row inked bands |
| Data-fidelity assertions | [`qa/chart-assertions.mjs`](../../../apps/showcase/qa/chart-assertions.mjs) | properties of the *known* fixture: ECDF monotonicity, Q–Q linearity, ROC descent, confusion-matrix diagonal, bar/violin band counts, polar centring, calendar coverage |
| Chart unit contract | [`qa/chart-units.mjs`](../../../apps/showcase/qa/chart-units.mjs) | compiles the deterministic fixtures and the real library formatter, builds the six axis ticks, and fails when a `percent` axis is fed ratios or when the ticks collapse to one string |
| Cross-browser pass | [`qa/browsers.mjs`](../../../apps/showcase/qa/browsers.mjs) | the same structural probe and axe scan in every engine Playwright can launch here |
| Interaction journeys | `qa/behaviour.mjs` group `components` | 12 new checks over the Phase 4/5 families, driven from ARIA rather than test ids |

`qa/chart-units.mjs` and the `components` behaviour group are wired into
`pnpm verify` / `pnpm qa:full`, so the classes of defect found here fail a gate
from now on.

## 2. Issues found and fixed

Severity: **P0** crash / scientific misrepresentation / a11y blocker ·
**P1** broken primary interaction, invisible content, wrong chart geometry ·
**P2** noticeable visual or interaction defect · **P3** cosmetic.

| ID | Sev | Where | Defect | Root cause | Fix | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| P7-01 | **P1** | `Input`/`TagInput`/`NumberInput`/`SearchInput`/`InputGroup` shell | Every shell containing a chip, a clear button or a stepper rendered the **read-only dashed border and the canvas surface** while staying fully editable | `has-[:read-only]` — `:read-only` matches *any* element that is not `:read-write`, including `<span>` chips, `<button>`s and `<svg>`s | the variant now matches `[readonly]`, `[aria-readonly=true]` and `[contenteditable=false]` | `number-input.before/after`, `tag-input.before/after`, `search-input.before/after` |
| P7-02 | **P1** | `@luc/ui` modal contract | A modal opened by the product itself (no `DialogTrigger`) closed to `<body>`: **focus was never restored** | Radix restores to `triggerRef.current`, which only exists for a `DialogTrigger` | `useDialogFocusRestore` shared by `DialogContent` and `SheetContent` | `packages/ui/src/components/dialog-focus.test.tsx`, behaviour check *gallery opens a lightbox…* |
| P7-03 | **P1** | `/charts/quantitative` efficient frontier | Axis read **`0 %` at every tick** — an unreadable frontier | ratio-typed fixture (`risk: 0.16`) formatted with `{ kind: "percent" }`, which expects already-scaled values | fixtures scaled to percent (`risk: 16`) | `efficient-frontier.before/after` |
| P7-04 | **P1** | `DrawdownChart` default axis | A shallow drawdown labelled **all five ticks `0 %`** | `formatRatio`'s "round sub-half-unit to zero" rule applied *per tick* at decimals derived from each value | axis decimals derived from the drawdown's depth | `drawdown.before/after` |
| P7-05 | **P1** | `/charts/statistical` ECDF | x axis read **`0.0 %` six times** | ratio fixture + percent format | fixture scaled to percent | `ecdf.before/after` |
| P7-06 | **P2** | `/charts/distribution` histogram | x axis read `-0.09 % … 0.08 %` for a ±9 % return distribution — **100× understated** | ratio fixture + percent format | fixture scaled to percent | `histogram.before/after` |
| P7-07 | **P2** | `/charts/sizing` return calendar | Cells read `+0.1 %` for a +14 % month; legend said `≥ +0.2 %` — every number 100× low | ratio values + percent format | values scaled to percent; the deliberate outlier is now `+68 %`, not `+450 %` | `return-calendar.before/after` |
| P7-08 | **P2** | `/charts/scientific` ternary | Tooltip read `0 %` / `1 %` for 10 %–70 % shares | ratio shares + percent format | shares in percent (the component normalises, so geometry is unchanged) | `qa/chart-units.mjs` row *ternary shares* |
| P7-09 | **P2** | `/components/ai` | First paint showed an **empty assistant bubble**: the answer only arrived after a click | the demo seeded `text=""` and never started the stream; `StreamingText` rendered an empty span inside a painted bubble | `StreamingText` returns nothing when there is no text and no stream; the demo streams on mount, with `streaming` derived instead of stored | behaviour check *the AI answer streams on mount…* |
| P7-10 | **P2** | `SegmentedItem size="sm"` | 22 px tall — below WCAG 2.2 SC 2.5.8, and toolbar segments sit edge to edge so the spacing exception does not apply | the size token itself | `sm` is now 24 px | `qa/inspect.mjs` tiny-target detector |
| P7-11 | **P2** | `Checkbox`, `Switch`, `Tag` remove, `TagInput` chip remove, `SearchInput` clear, `DataTable` sort header | 16–22 px hit targets | the visual size is right, the target was not | new `luc-hit` utility grows the target to 24×24 without changing a pixel | `qa/inspect.mjs`, `field-shell.test.tsx` |
| P7-12 | **P2** | `Combobox` / `SearchInput` clear buttons | An **enabled** control painted with `--fg-disabled` | state colour used as a quiet style | `--fg-muted`; the docs' own rule ("`--fg-disabled` is never used for content") now holds | design review |
| P7-13 | **P2** | `/charts/uncertainty` | **Linked in the sidebar, absent from the QA route registry** — never captured, scanned or reviewed | the registry is hand-maintained | registered; the sweep now covers 131 routes | `qa/routes.mjs` |
| P7-14 | **P3** | `/components/notifications` demo | Trigger-only card reads as empty | demo composition | documented, not changed (the component itself is correct) | visual review |

### What the probes did *not* find

- **No horizontal overflow, no clipped text, no collapsed slots** on any of the
  131 routes, in Chromium or Firefox.
- **No blank charts.** All 126 measured plots paint: composite ink, ≥3 colours
  and ink in an axis margin. The three previous "canvas exists but says nothing"
  regressions do not reproduce.
- **0 serious/critical axe violations** across 204 scans (Chromium) and 29
  (Firefox), and no new contrast finding from the `luc-hit`/colour changes.

## 3. Chart verification

126 plots across the 34 chart routes were measured, and **all ten data-fidelity
assertions pass**:

| Assertion | Measurement |
| --- | --- |
| ECDF rises | rise 0.830, worst reversal 0.042 (a step curve that never falls) |
| Q–Q is a line | corr −0.999, rise 0.663 |
| ROC descends | corr −0.884 |
| confusion-matrix diagonal | brightest column per row `[0, 1, 2]` — the supplied `[[412,47,21],[38,706,44],[19,52,361]]` is row-normalised, so the colour scale puts the mass on the diagonal |
| grouped bars form distinct columns | 5 bands, bar-top σ 0.236 |
| horizontal bars form distinct rows | 5 row bands, 1 column band |
| violins are three peaks | exactly 3 |
| polar rose is centred | centre (0.50, 0.50), aspect 0.82 |
| correlation matrix is square and full | aspect 1.04, ink 0.782 |
| calendar covers the year | ink columns 0.03 … 0.98 |

Getting there was measurement work, not assertion tuning, and the two mistakes
are worth recording because they are the same mistakes a reviewer would make by
eye:

1. **A canvas is not a picture.** ECharts and Lightweight Charts both split one
   chart across canvases by z-level, so measuring a canvas at a time reports the
   idle crosshair layer as a blank chart. Every measurement here is taken on a
   composite.
2. **The fill is not the background.** Both engines clear their canvases, so a
   region chart's fill is `rgba(255,131,124,0.16)` over nothing. Comparing raw
   channels against the canvas's own modal colour makes that semi-transparent
   fill the reference — which measured a drawdown covering 55 % of its plot as
   0.4 % ink. The composite now paints the layers in order onto the **CSS
   backdrop** of the plot, and applies a chroma test for the shape mask, because
   LUC's gridlines are light enough on a dark surface to clear any brightness
   threshold that still keeps a muted series.

### Known limitation: month-granularity time ticks

On a span between 60 and 400 days the time axis labels months, while ECharts
places ticks at a ~15-day interval, so two ticks can land in the same month:
`/charts/quantitative` (drawdown) shows `Jan Jan Feb Feb …`. The cause is the
label scale being derived from the **total span** while the tick spacing comes
from ECharts' own nice-interval search. The honest fix is to derive the label
scale from the *tick spacing*, which needs the plot width plumbed into the axis
fragment; that change was deferred rather than made blind at the end of the
cycle. It is cosmetic (every label is still a real date), affects the month
band only, and is recorded here rather than hidden.

## 4. Surface renderer (3D) — limits, restated

`Surface3DChart` and `VolatilitySurfaceChart` are a **canvas projection**, not a
WebGL renderer: painter-order sorting on a fixed grid, no occlusion culling, no
per-pixel lighting. They render correctly (both plots pass the geometry probe;
the wireframe and the volatility surface both paint with structure), and they do
not claim general 3D capability. Rotation is exposed on the wrapper element,
which is focusable and labelled. A true 3D entry point remains out of the
ordinary `@luc/ui/charts` dependency graph by design.

## 5. Cross-browser and device

| Engine | Result |
| --- | --- |
| Chromium (Desktop Chrome 1440×1000 + 390×844) | 29 routes, 0 failures, 0 serious axe violations |
| Firefox | 29 routes, 0 failures, 0 serious axe violations |
| WebKit | **not run.** The browser downloads, but the host is missing `libhyphen`, `libsecret`, `libGLESv2`, `libx264`; installing them is a system-package change outside this phase's authority |

Nothing here is claimed as native iOS/Android verification: the mobile pass is a
390 px viewport with `hasTouch` in the navigation group's context, not a device.

## 6. What remains open

1. Month-granularity duplicate time ticks (above).
2. Date/time **segments** are 22 px tall. They are contiguous by construction
   (a segmented field), so the spacing exception cannot apply; the pattern is
   React Aria's and is accepted in the field's own documentation as a deviation
   rather than restyled.
3. A per-chart *interaction* geometry suite (zoom/brush pixel assertions) is not
   written; the chart interaction contracts are covered behaviourally.
4. Luc Web was not built, opened or visually tested. All compatibility claims are
   source-level.

## 7. Files that carry the changes

```
packages/ui/src/components/input.tsx              read-only selector
packages/ui/src/components/dialog-focus.ts        new — shared focus restore
packages/ui/src/components/dialog.tsx             uses it
packages/ui/src/components/sheet.tsx              uses it
packages/ui/src/components/segmented-control.tsx  sm = 24 px
packages/ui/src/components/checkbox.tsx           luc-hit
packages/ui/src/components/switch.tsx             luc-hit
packages/ui/src/components/badge.tsx              luc-hit, fg-muted
packages/ui/src/components/search-input.tsx       luc-hit, fg-muted
packages/ui/src/components/combobox.tsx           fg-muted
packages/ui/src/components/ai.tsx                 StreamingText empty state
packages/ui/src/forms/inputs/tag-input.tsx        luc-hit
packages/ui/src/table/pieces.tsx                  luc-hit on the sort header
packages/ui/src/styles/utilities.css              new luc-hit utility
packages/ui/src/charts/components/quantitative-charts.tsx  drawdown axis decimals
packages/ui/src/components/field-shell.test.tsx   new
packages/ui/src/components/dialog-focus.test.tsx  new
apps/showcase/lib/mock-data.ts                    histogram bins in percent
apps/showcase/lib/chart-packs-data.ts             ECDF / frontier / ternary units
apps/showcase/app/charts/sizing/page.tsx          calendar in percent
apps/showcase/app/charts/quantitative/page.tsx    frontier current portfolio
apps/showcase/app/components/ai/page.tsx          stream on mount
apps/showcase/qa/routes.mjs                       + charts-uncertainty
apps/showcase/qa/behaviour.mjs                    + components group (12 checks)
apps/showcase/qa/inspect.mjs                      new
apps/showcase/qa/chart-geometry.mjs               new
apps/showcase/qa/chart-assertions.mjs             new
apps/showcase/qa/chart-units.mjs                  new
apps/showcase/qa/browsers.mjs                     new
apps/showcase/qa/shots.mjs, probe-one.mjs         new — review helpers
```
