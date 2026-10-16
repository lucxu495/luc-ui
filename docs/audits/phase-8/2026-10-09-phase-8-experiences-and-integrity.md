# Phase 8 — universal and vertical product ecosystem

**Date:** 2026-10-09 (Asia/Singapore)
**Branch:** `main`, HEAD `fce3614` — nothing committed; the whole phase is in the
working tree.
**Scope of writes:** `luc-ui/**` only.

Phase 8 is the phase where the library had to stop being a component gallery and
become something a person can build a *website* with. The brief set the hierarchy
explicitly: general-purpose first, personal websites as a first-class category,
specialised verticals built on the same foundation.

That ordering changed what got built. Phase 4–7 had grown the analytics side of
the library hard — 78 chart components, a quant workspace, an inspector — so the
risk in this phase was not a lack of capability but a lack of *breadth*: a
library whose only reference product looks like a research desk is a library
nobody reaches for when the job is a portfolio.

## 1. What was built

### 1.1 Layer C — `@luc/ui/experiences`

Seven published composites, one new subpath, and an explicit rule for what stays
out of the package:

| Composite | The contract it owns |
| --- | --- |
| `ProfileHero` | The heading hierarchy (the name is the `h1`), the facts definition list, and the editorial/instrument variants |
| `SocialLinks` | Accessible names, new-tab warnings, list semantics — the three things every personal site gets wrong |
| `ExperienceTimeline` | A career as an `<ol>` with a machine-readable `<time dateTime>` period and a localisable open end |
| `ProjectShowcase` | A grid that grows the chosen project into a detail region, controlled or uncontrolled |
| `PublicationList` | Year/type/topic facets derived from the entries, and no invented DOIs or citation counts |
| `ReadingShelf` | Grouping by status, with progress as a real `role="progressbar"` |
| `NowSection` | A `/now` block that must carry the date it was last true, formatted in UTC so it cannot drift a day |

`docs/EXPERIENCE_GUIDE.md` draws the published/recipe boundary with the reasoning,
and lists the recipes that are deliberately *not* components: pricing table,
testimonial wall, lead form, article index, feed, quiz, checkout stepper,
instrument panel, media metadata editor.

### 1.2 Sixteen reference products

Four general-purpose, four personal, eight vertical. Every one is a working page
with local deterministic state, a bilingual body, a desktop and 390 px layout,
and a browser assertion that reads a value back out of the DOM after the
interaction.

The four personal sites are deliberately not one template: they differ in layout
grammar, type voice, density, motion and content structure, and each pins a
different palette/personality/depth combination.

### 1.3 The chart defect that was still open

Phase 7 recorded a known, unfixed defect: `/charts/quantitative`'s drawdown axis
printed `Jan Jan Feb Feb Feb Mar Mar Mar Apr Apr Apr May`. Phase 7's own note
said the correct fix needed the plot width plumbed into the axis fragment.

Phase 8 fixed it at the root instead, without the width, by removing the split
decision that caused it:

- `timeAxisFormatter(span)` decided *how much of a date to print*.
- ECharts decided *how many ticks to draw*, from the canvas width.
- On a wide plot of a four-month series those two answers disagreed.

`timeAxisTickPlan(span)` now returns **both** the label scale and the
`splitNumber`, so the tick count and the label granularity come from one input.
For every scale the tick spacing is at least one label unit — a minute for clock
labels, a day for dates, 31 days for month names — which is what makes a repeated
label impossible rather than unlikely. The month-name bucket also now ends at 330
days rather than 400, because twelve month ticks cannot be unique.

Three supporting changes:

- `timeSpanMs(values)` gives a family component the span of the data it was
  handed, and six families that used to let the engine assume a year
  (`CandlestickChart`, `DrawdownChart`, both band charts, `GanttChart`, the state
  timeline) now say what they cover.
- `axis-time.test.ts` renders nine spans × four widths through the real ECharts
  server renderer and reads the ticks back out of the live scale: **43
  assertions**, failing on any interior duplicate label.
- The `formatters.test.ts` plan tests pin the decision itself.

### 1.4 Everything else

- Route family `/experiences` (hub + 16 products), a new sidebar group at the top
  of the navigation, and all 16 registered in the browser QA registry.
- A new behaviour group, `experiences`, with **16 checks** across the sixteen
  products.
- Bilingual bodies for all of it: **148/148 routes** and **14 073/14 073 prose
  sentences**, verified by the coverage script rather than asserted.
- One new consumer scenario (`experiences`) and one extension to the independent
  packed-package proof (`@luc/ui/experiences` must resolve, typecheck, SSR and
  stay free of engines).

### 1.5 Two accessibility defects found by building products

The brief's premise is that a product finds what a component page cannot. That
happened twice, and both defects were silent — no crash, no visual difference,
nothing a unit test could see, and nothing a scan of the *component's own* demo
would report:

| Defect | How it was found | Why the component's own tests missed it | Fix |
| --- | --- | --- | --- |
| `NativeSelect` inside a `<Field label>` rendered an **unnamed `<select>`** | The axe scan over `/experiences/general/marketing` and `…/commerce` reported `select-name` (critical) on the product page — a place the component is used the way a product uses it | `Field` is not part of `NativeSelect`'s test, and `NativeSelect` alone with an `aria-label` is named correctly | `NativeSelect` now reads `useField()` — id, `describedBy`, invalid, disabled, required — exactly as `Input` and `Textarea` already did |
| `Slider` given `aria-label` instead of `label` had **unnamed thumbs** | `aria-input-field-name` (serious) on `/experiences/vertical/science` | The Root is named; the *thumb* is what a screen reader lands on, and the component's tests used `label` | `Slider` and `RangeSlider` repeat a caller's `aria-label` onto each thumb as the fallback name |

Both are now covered by `field-composition.test.tsx`, which renders the
component *inside the composition that failed* rather than on its own.

### 1.6 The measurement gap that mattered most

The static localization checker said **148/148 page bodies** while the deployed
Chinese pages were still showing English. Both facts were true, and the distance
between them is the most useful thing this phase produced.

| What happened | Why the static checker could not see it | What closed it |
| --- | --- | --- |
| Sixteen products put their copy in domain-shaped data files under keys the extractor did not watch — an article's `standfirst`, a testimonial's `quote`, a quiz `question`, a plan's `features`, a `/now` entry's `value` | The extractor's prose-key list was written for documentation tables; a key nobody listed is a string nobody required, and an unrequired string is one nobody translates | Seven keys added to `DATA_PROSE_KEYS`, with the reasoning written next to them; twenty-three further sentences then had to be translated, including four FAQ answers that had been shipping in English |
| A published composite renders the strings it is given — correctly, since it has no dictionary — and the page handed it raw fixture text | Coverage was measured at the *source*, not at the render site: a sentence can be in the dictionary and never looked up | Every consumption of a composite now maps its content through `tcs` at the call site, which is what a consuming application does with any i18n layer |

The instrument that caught it is `qa/i18n-live.mjs`, which loads each route at
`/zh` in a real browser and looks for English prose in the rendered DOM. It went
from **9 leaking routes to 148/148 clean**, and the route list it printed is what
the fixes were made against. A coverage percentage was never sufficient; a
rendered page was.

## 2. Coverage, honestly

| Target | Status |
| --- | --- |
| General-purpose experiences: marketing, SaaS, publishing, community | **Delivered and browser-verified** |
| Four distinct personal websites | **Delivered and browser-verified** |
| Vertical journeys: AI, science, finance, commerce, education, media, productivity, social | **Delivered and browser-verified** |
| Reusable capability gaps found by composition | **Closed** — seven composites published, five recipes documented |
| Known chart correctness problems | **Fixed at the root**, with an engine-level regression gate |
| English/Chinese coverage intact | **148/148 routes, 100 % of prose and chrome** |
| Packed-package consumption proven | **Extended** — new subpath resolves, typechecks, SSRs and isolates |
| Heavy dependencies stay out of simple imports | **Verified** — button-only 10.9 KB raw / 3.6 KB gzip, unchanged |

## 3. Verification

See [`verification-log.md`](./verification-log.md) for exact commands, exit codes
and outputs. Headline results:

- `pnpm verify` — exit 0. **898 tests / 89 files** (was 829 / 86), catalog in
  sync, package verified, consumer isolation holds with the new entry.
- `pnpm qa:full` — 148 routes, behaviour groups including `experiences`.
- Localization, static: 148/148 routes, 14 096/14 096 sentences, 163/163
  navigation labels, 149/149 descriptions, 88/88 chrome strings.
- Localization, **rendered**: 148/148 routes with no English sentence left in the
  Chinese page, measured in a browser by `qa/i18n-live.mjs`.

## 4. Known limitations

1. **WebKit is not verified.** The host is missing the libraries Playwright needs
   to launch WebKit; the same limitation Phase 7 recorded. Chromium and Firefox
   both pass.
2. **No real device.** Mobile coverage is a 390 × 844 viewport, not a phone.
3. **Covers are generated artwork.** The experiences use deterministic inline
   SVG data URIs with real `alt` text and real dimensions; no photography is
   bundled.
4. **Per-chart zoom/brush geometry** is still covered behaviourally rather than
   by pixel assertions.
5. **Luc Web compatibility** is source-level only: nothing in `luc-web` was
   built, opened or visually tested.
6. **The motion behaviour group** has a single asserted check (pre-existing).
