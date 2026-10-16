# Design Lab Phase 1 — comparison, verification and recommendation

Run date: 2026-10-08 (server). This completes the experiment that Agent B started
locally and finishes on the server checkout. It is an exploration artifact: no
library component, token, export, dependency, consumer or shared Showcase route
was changed. Screen evidence was re-captured on the server against a production
Showcase build so the report and the code are the same revision.

## 1. Implemented routes

| Route | Treatment | File |
| --- | --- | --- |
| `/experiments/design-lab` | index (not a treatment) | [page.tsx](../../../../apps/showcase/app/experiments/design-lab/page.tsx) |
| `/experiments/design-lab/precision-instrument` | A · Precision Instrument | [precision-instrument/page.tsx](../../../../apps/showcase/app/experiments/design-lab/precision-instrument/page.tsx) |
| `/experiments/design-lab/editorial-research` | B · Editorial Research | [editorial-research/page.tsx](../../../../apps/showcase/app/experiments/design-lab/editorial-research/page.tsx) |
| `/experiments/design-lab/focused-workspace` | C · Focused Workspace | [focused-workspace/page.tsx](../../../../apps/showcase/app/experiments/design-lab/focused-workspace/page.tsx) |

All three routes render the same component
([design-lab.tsx](../../../../apps/showcase/app/experiments/design-lab/design-lab.tsx))
with only `treatment` differing. Every visual difference comes from one page-scoped
CSS module, [design-lab.module.css](../../../../apps/showcase/app/experiments/design-lab/design-lab.module.css);
the composition, dataset and interaction are identical. The routes are
deliberately absent from `apps/showcase/lib/navigation.ts` and from
`apps/showcase/qa/routes.mjs`, so they cannot leak into the product shell or the
standing QA sweep.

## 2. Shared dataset and interaction model

One prepared dataset, [data.ts](../../../../apps/showcase/app/experiments/design-lab/data.ts):
eight neutral observations (`Sample 01…08`, 01–15 Sep 2026, four channels, an
`responseMs` value and a `referenceMs` value). The values are display fixtures;
there is no financial calculation, no indicator maths, no network request and no
backend dependency anywhere in the experiment.

One controlled interaction model, shared by all three treatments:

- one controlled identity — `selectedId` state owned by `DesignLab`; the row,
  the chart marker/crosshair and the inspector all read the same object;
- **table → chart → inspector**: clicking a row (or pressing Enter on the focused
  row, which is a real `<tr>` with a focus ring) selects the observation, draws a
  pin annotation plus a synced crosshair and tooltip on the chart, and fills the
  inspector with the value, recorded context and reading note;
- **chart → table → inspector**: the plot is wrapped in
  `ChartInspectionArea`, a focusable `role="group"` with arrow-key stepping,
  Enter to pin, Escape to clear and a `role="status"` announcement; the pin is
  lifted into the same `selectedId`, so the table row and the inspector follow the
  chart;
- `Clear selection` returns the whole surface to its resting state;
- selection is expressed by more than colour: an accent left rule, a `▸` glyph,
  the bolded sample label and an explicit `SELECTED` badge, on top of the
  `data-selected` surface tint.

Charts use the existing public `LineChart` and `DataTable`; the experiment adds no
primitive and no variant.

## 3. The three treatments

| | A · Precision Instrument | B · Editorial Research | C · Focused Workspace |
| --- | --- | --- | --- |
| Idea | Calibrated instrument panel | Reading-first research page | Selection-centred workspace |
| Header | Tighter type scale, ruled meta strip, accent left rule on the question | Larger headline, wider measure, evidence panel pushed below the reading block | Compact header, quieter chrome |
| Surfaces | `radius-sm` work surface, sunken chart well, mono hero number | One elevated evidence surface, flat prose | Sunken chart well, raised table header, raised inspector |
| Selection emphasis | Instrument-like: mono value, exact rules | Editorial rule under the reading note | Accent cue rule + `SELECTED` badge + thicker inset row rule |
| First-screen evidence | Chart visible immediately | Chart below the fold at 1440×900 | Chart visible immediately |

Treatments are graded variations of one system, not three themes: they share the
same tokens, fonts, chart palette and semantic colours, which is why a reviewer
can switch route and theme without re-learning the page.

## 4. Screenshots

All screenshots in [screenshots/](screenshots/) were re-captured on the server
from the production Showcase image (`luc-ui/showcase:qa-3100`, built from this
revision) at 1440×900 (desktop) and 390×900 (mobile), dark and light, with the
`Sample 04` row selected.

| Treatment | Dark desktop | Light desktop | Dark mobile | Light mobile |
| --- | --- | --- | --- | --- |
| Precision Instrument | [rest](screenshots/precision-instrument-1440-dark-rest.png) · [selected](screenshots/precision-instrument-1440-dark-selected.png) | [rest](screenshots/precision-instrument-1440-light-rest.png) · [selected](screenshots/precision-instrument-1440-light-selected.png) | [rest](screenshots/precision-instrument-390-dark-rest.png) · [selected](screenshots/precision-instrument-390-dark-selected.png) | [rest](screenshots/precision-instrument-390-light-rest.png) · [selected](screenshots/precision-instrument-390-light-selected.png) |
| Editorial Research | [rest](screenshots/editorial-research-1440-dark-rest.png) · [selected](screenshots/editorial-research-1440-dark-selected.png) | [rest](screenshots/editorial-research-1440-light-rest.png) · [selected](screenshots/editorial-research-1440-light-selected.png) | [rest](screenshots/editorial-research-390-dark-rest.png) · [selected](screenshots/editorial-research-390-dark-selected.png) | [rest](screenshots/editorial-research-390-light-rest.png) · [selected](screenshots/editorial-research-390-light-selected.png) |
| Focused Workspace | [rest](screenshots/focused-workspace-1440-dark-rest.png) · [selected](screenshots/focused-workspace-1440-dark-selected.png) · [reduced motion](screenshots/focused-workspace-1440-dark-reduced-selected.png) | [rest](screenshots/focused-workspace-1440-light-rest.png) · [selected](screenshots/focused-workspace-1440-light-selected.png) | [rest](screenshots/focused-workspace-390-dark-rest.png) · [selected](screenshots/focused-workspace-390-dark-selected.png) · [reduced motion](screenshots/focused-workspace-390-dark-reduced-selected.png) | [rest](screenshots/focused-workspace-390-light-rest.png) · [selected](screenshots/focused-workspace-390-light-selected.png) |

`screenshots/_superseded-local-run/` holds four files from the interrupted local
run that used an older naming scheme; they are kept for provenance and are not
part of the current evidence set.

## 5. Light / dark comparison

- Both themes keep the same reading order, chart palette and state meaning. The
  accent mark, the `SELECTED` badge and the inset row rule are legible in both.
- Dark mode gets its depth from the token luminance step plus the hairline edge;
  light mode relies on the same edges rather than shadow, matching the three-level
  surface rule. No treatment introduces a second accent or a colour-only state.
- The one honest weakness is the pre-existing light-theme depth step: LUC's light
  `default` / `raised` / `overlay` surfaces are close in luminance, so a treatment
  that leans on surface steps (Precision, Focused) reads flatter in light than in
  dark. This is a *system* observation from the design-intelligence gap audit, not
  an experiment defect.

## 6. Responsive comparison

- At 390px the three panes stack: chart, then observation log, then inspector;
  the resize handle disappears. Verified programmatically — the inspector's
  document position is below the chart region in every run.
- The observation table keeps its column set and scrolls horizontally inside its
  own container (534px table in a 344px viewport) while the document stays at
  380px ≤ 390px, so the page itself never scrolls sideways.
- The added "Scroll the table sideways to read every column." hint is visible at
  ≤40rem and is the only affordance that signals horizontal access.
- The editorial treatment gives up having the chart on the first mobile screen;
  the other two keep it.

## 7. Accessibility findings

`@axe-core/playwright` with `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa` was run
on each of the 6 route/theme/viewport combinations twice (rest and after
selection): **24 scans, 0 violations**.

That is an improvement on the baseline, which reported one minor
`empty-table-header` finding in the baseline table and four moderate `region`
nodes in the shared Showcase shell. Both experiment findings are now zero:
`DataTable` is given an explicit `ariaLabel`/`ariaDescription`, and the experiment
content sits inside the shared `AppShellContent` landmark. The `region` finding
that the baseline reported was a shared-shell observation, not a defect of the
baseline page's own markup, so it is recorded rather than "fixed".

Keyboard paths verified in the browser:

- table: `Tab` reaches a row (`document.activeElement` is a `TR` with a visible
  focus ring); `Enter` selects that row and the inspector, chart marker and live
  status follow;
- chart: the plot region is focusable; `Enter` pins the most recent point,
  `ArrowLeft` steps to the previous point, `Escape` clears the pin and the live
  `role="status"` text updates each step;
- `Clear selection` returns the surface to the empty inspector.

Known limitation (shared library, not fixed here): `DataTable` does not expose
`aria-selected` on the `<tr>` for a controlled single selection — the accessible
state lives on the internal checkbox and the `data-selected` attribute. The
experiment compensates with a visible glyph and the word `SELECTED`, but a
screen-reader user does not receive a row-level "selected" announcement. Proposed
fix and rationale are in the handoff report; it is a public-component change and
was deliberately not made in this task.

## 8. Performance observations

- No new runtime dependency, no new package export, no token change; the
  experiment is a page-scoped CSS module over existing public components.
- Selecting an observation repaints the chart canvas only. A document-relative
  measurement of the chart region before/after selection showed **0px** shift in
  x, y, width and height in all 12 runs, and the chart canvas digest changed every
  time (proving the marker actually painted).
- No console errors, no page errors and no hydration mismatch in any run.
- Consumer isolation is unchanged: `charts` 59.1 KB raw / 18.1 KB gzip,
  `button-only` 5.9 KB raw / 2.1 KB gzip — the experiment adds no engine.

## 9. Baseline comparison

| | Baseline (`/patterns/research-workspace`) | Design Lab |
| --- | --- | --- |
| Selection model | Row selection changes the inspector | One controlled identity across row, chart marker and inspector |
| Chart relation | Chart inspection time is a separate state | The pinned chart point *is* the selected observation |
| Inspector | Long, form-like | Short, reading-first |
| Table accessibility | one minor `empty-table-header` | explicit label + description, 0 violations |
| Regions | 4 moderate shared-shell `region` nodes | 0 |
| Mobile | vertical scroll, horizontal table | same, plus a visible horizontal-scroll cue and a stacked inspector |

The baseline was already a capable page; the experiment's contribution is the
*grammar* between components, not new capability. That matches the design
intelligence conclusion that LUC's near-term gain is in the links between
existing primitives.

## 10. Recommended visual direction

**Base the next iteration on C · Focused Workspace**, with two borrowings:

- take **A · Precision Instrument's** numerics — mono tabular hero value, tighter
  heading scale, ruled meta strip — into Focused's inspector and chart well;
- keep **B · Editorial Research** as a *narrative* variant for research-style
  pages (question → finding → evidence), not as the default workspace.

This matches the research's own first-choice candidate and the evidence above: it
is the only treatment that exercises the differentiator (linked table/chart/
inspector state) and the responsive and accessibility behaviour both hold up
under it.

## 11. Candidate design rules (proposals only — nothing was applied)

1. **One selected identity.** A composed data view has exactly one controlled
   selected datum; row, chart marker and inspector read it and never keep private
   selection state.
2. **Selection is never colour-only.** A selected row carries a glyph and a word,
   not just a tint.
3. **Selection does not reflow evidence.** Choosing a datum must not move the
   chart; measure a 0px shift as the acceptance condition.
4. **One chart keyboard contract.** Focusable plot region; `Enter` pins, arrows
   step, `Escape` clears, `role="status"` announces, and the pin is published to
   the shared identity.
5. **Numbered/eyebrow labels only for real sequences.** The current experiment
   labels its sections `01 /` and `02 /`; that is defensible because chart → table
   is a reading order, but the reviewed `frontend-design` guidance flags eyebrow
   labels and numbered markers as generated-design tells. A future revision should
   either make the sequence real (a stepped flow) or drop the numbering.
6. **One accent, concentrated on the active object.** Keep cyan for selection and
   focus; keep inactive panes neutral instead of dimming the shell.

## 12. Rejected approaches

- **Three separate themes.** Rejected; all three treatments are graded variations
  of one system so they stay comparable.
- **Trading on component count.** No new primitive or variant was added; the
  experiment composes what the library already publishes.
- **Whole-surface dimming** to de-emphasise inactive regions — rejected (it lowers
  contrast and fights the light-theme depth problem instead of solving it).
- **Hover-only selection.** Rejected; pointer, keyboard-row and keyboard-chart
  paths all drive the same identity.
- **Reusing the baseline's long inspector.** Rejected in favour of a short,
  reading-first detail surface.
- **Making the chart the first selection surface.** Rejected; the table remains
  the primary, fully-labelled selection list, with the chart as the linked
  evidence.

## 13. Remaining limitations

- The experiments are intentionally not in the Showcase navigation or the standing
  QA route registry, so `pnpm qa:changed` / `pnpm qa:full` do not cover them. Their
  evidence comes from the targeted script described in the handoff report.
- Only 8 observations are exercised; no long series, empty dataset, or loading
  state was tested.
- The `fullPage` screenshots duplicate the fixed topbar part-way down the mobile
  captures. That is a screenshot artifact of `position: fixed`, not a page defect.
- The pairwise distinctiveness of A and C is untested with real users; the research
  plan's five-person task check was not run.
- Contrast was judged by axe (0 violations) plus visual review; no separate numeric
  contrast table was produced for the selected row and inspector.
- `DataTable`'s missing row-level `aria-selected` is a shared-library limitation,
  carried forward rather than fixed.
