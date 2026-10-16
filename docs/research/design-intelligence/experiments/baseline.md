# Research Workspace baseline

Source: [existing Showcase route](../../../../apps/showcase/app/patterns/research-workspace/page.tsx). Browser evidence was captured in local Chromium at 1440×900 and 390×900, in both themes, on 8 October 2026. The baseline is a working product pattern, not a blank reference.

## Captured states

| State | Evidence |
| --- | --- |
| Desktop dark, rest | [PNG](screenshots/baseline-1440-dark-rest.png) |
| Desktop light, rest | [PNG](screenshots/baseline-1440-light-rest.png) |
| Mobile dark, rest | [PNG](screenshots/baseline-390-dark-rest.png) |
| Mobile light, rest | [PNG](screenshots/baseline-390-light-rest.png) |
| Desktop dark, hover | [PNG](screenshots/baseline-1440-dark-hover.png) |
| Desktop dark, keyboard focus | [PNG](screenshots/baseline-1440-dark-focus.png) |
| Desktop dark, selected | [PNG](screenshots/baseline-1440-dark-selected.png) |
| Desktop dark, reduced motion | [PNG](screenshots/baseline-1440-dark-reduced.png) |

## Observed strengths

- The page already combines time range, two chart engines, searchable and selectable research runs, and an inspector in one workspace. Its table selection has a checkbox, row tint and selection count.
- The charts and table use LUC's existing compact density and tabular number treatment. Dark and light modes retain the same hierarchy and state meanings.
- Keyboard focus is visible; the page includes an explicit reduced-motion control in the shared Showcase header. The page is responsive and remains within the 390px document width.

## Observed opportunity

- The selected research run changes the inspector, while the chart's inspected time is a separate state. The user has to infer how a row relates to a plotted point. The Design Lab tests one controlled identity across row, chart marker and inspector for an observation dataset.
- The working surface is dense but the reading question is quiet: chart controls and table controls lead the first scan. The experiments vary the prominence of a question, finding and contextual detail while retaining comparable data.
- Mobile relies on vertical scrolling and a horizontally scrollable table. A visible hint clarifies horizontal access in the experiment.
- The baseline's selected state is clear in the table but its inspector is long and primarily form-like; the experiment tests a short, reading-oriented detail surface.

## Semantics and limits

The baseline already supports selection and responsive display. This study does not claim those capabilities are missing from LUC UI. It explores a tighter linked workflow and a more distinctive hierarchy. An automated axe-core pass on the baseline dark desktop rest state reported one minor `empty-table-header` finding in the baseline table and four moderate `region` nodes in the shared Showcase shell. These are observations only; this task does not alter shared components.
