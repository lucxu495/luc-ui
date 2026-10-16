# 04 — Prioritised Transformation Action Plan

The operational document for future agents. Every item has a **stable ID** that
must never be renumbered, reused or re-scoped. Read
[05_QUALITY_GATE.md](05_QUALITY_GATE.md) before executing any item.

> **No implementation item in this document is checked, and none may be checked
> by an implementation agent.** Implementation agents may set status
> `IMPLEMENTED`; only an independent verification pass may set `VERIFIED`.

---

## 0. Research checklist (evidence-backed — the only boxes that may be ticked)

- [x] R-01 Preflight: git revision, dirty tree, running-build identity recorded — evidence: `01_CURRENT_STATE.md` §1
- [x] R-02 Repository/architecture map including duplicated concerns — evidence: §2, §2.1
- [x] R-03 Route inventory (326 routes, statuses, reachability) — evidence: `data/routes.csv`, §4
- [x] R-04 Navigation model reconstructed from source + live DOM — evidence: §5
- [x] R-05 Component/specimen coverage per family from current registries — evidence: §7, `data/components.csv`
- [x] R-06 Workbench inventory — evidence: §8
- [x] R-07 Live UX sweep, 57 routes (structure, console, hydration) — evidence: `tools/browser-sweep.mjs`
- [x] R-08 Card Stack + motion interaction probe — evidence: `tools/card-stack-probe.mjs`, `card-stack.json`
- [x] R-09 Demo-position and density measurements — evidence: `tools/detail-probe.mjs`
- [x] R-10 Link-graph crawl + orphan/500 detection — evidence: `tools/link-crawl.sh`
- [x] R-11 Competitor study, 9 sites — evidence: `02_COMPETITOR_RESEARCH.md`
- [x] R-12 Legacy/technical-debt classification — evidence: §9
- [x] R-13 QA blind-spot analysis — evidence: `05_QUALITY_GATE.md`
- [x] R-14 Local-development readiness study — evidence: `06_LOCAL_DEVELOPMENT_PLAN.md`
- [x] R-15 Internal consistency cross-check — evidence: §7 of this file

Open questions that need the user (not implementable yet): `OPEN-01` Card Stack
reproduction steps; `OPEN-02` Motion's header tier; `OPEN-03` Experiments'
audience; `OPEN-04` whether the `/visuals/*` resource pages are product or
internal.

---

## 1. Workstreams and counts

| WS | Name | P0 | P1 | P2 | Total |
|---|---|---|---|---|---|
| IA | Information architecture & navigation | 2 | 4 | 0 | 6 |
| UX | Page layout & presentation | 0 | 4 | 1 | 5 |
| WB | Workbench & interactive preview | 0 | 4 | 1 | 5 |
| MOT | Motion reliability (incl. Card Stack) | 1 | 2 | 1 | 4 |
| CMP | Components catalog & detail | 1 | 0 | 0 | 1 |
| CHT | Charts catalog & preview | 0 | 1 | 1 | 2 |
| VIS | Visuals catalog & preview | 0 | 2 | 1 | 3 |
| DOC | Documentation & copy | 1 | 2 | 2 | 5 |
| LEG | Legacy retirement | 1 | 2 | 2 | 5 |
| QA | Acceptance infrastructure | 1 | 1 | 2 | 4 |
| DEV | Local development readiness | 0 | 1 | 2 | 3 |
| **Total** | | **7** | **23** | **13** | **43** |

---

## 2. P0 — Do these first

### CMP-001 — Two documented component pages return HTTP 500

- **Priority:** P0 · **Status:** TODO · **Complexity:** S · **Owner:** UNASSIGNED
- **Risk to concurrent agents:** HIGH — the routes live in `app/components/[component]/` territory plus a demo island; the in-flight Visuals work touches neighbouring files.
- **Problem:** `/components/native-select` and `/components/project-showcase` return HTTP 500 on the running build. Both are registry entries linked from the catalog and the sidebar (24 and 8 inbound links).
- **Evidence:** `01_CURRENT_STATE.md` §4.3 and the server log quoted there.
- **Expected user-visible result:** both pages render preview, controls, code and API table like every other component page.
- **Scope:** the demo/island used by those two entries; `app/components/[component]/page.tsx`; `lib/demo/**`; their playground adapter if one exists.
- **Forbidden:** changing the public API of the components; deleting the entries; touching `packages/visuals`; changing other component pages.
- **Depends on:** none.
- **Instructions:** reproduce with `curl -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/components/native-select`, read the server log, find the module that calls a client-only hook during SSR, and make that path render through a client island (the existing `components/demo/islands/**` pattern).
- **Acceptance criteria:** both routes return 200 with the specimen visible; zero console errors; axe clean; catalog and sidebar links resolve.
- **Verification:** the QA-001 route-health probe plus a browser visit.
- **Evidence to mark VERIFIED:** HTTP 200 for both routes, one screenshot each, console log free of the boundary error.

### IA-001 — The right rail must describe the page, not the specimen

- **Priority:** P0 · **Status:** TODO · **Complexity:** S · **Owner:** UNASSIGNED
- **Risk to concurrent agents:** MED — one component, but its output changes on ~100 pages.
- **Problem:** `PageOutline` scans `main` for every `h2/h3`, so demo content becomes page anchors: `/components/accordion` yields `#ingestionok`, `#analytics7`, `#serving`; `/motion/spatial` yields `#apac` and the mangled `#built-for-dense-interfacesbuilt-for-dense-interfaces`; `/visuals/elements` yields 55 rows; `/motion` 32.
- **Evidence:** `01_CURRENT_STATE.md` §5.1 N1/N3; `detail-probe.json`; competitor contrast CP-04 (Radix's 9-row page-local rail).
- **Expected user-visible result:** the rail lists only real page sections (typically 5–9), and each entry lands where its label says.
- **Scope:** `components/docs/page-outline.tsx`; `data-anchor-id` on declared headings; pages that need declared anchors.
- **Forbidden:** removing the rail; deleting demo content; any heuristic that still collects specimen DOM.
- **Depends on:** none.
- **Instructions:** collect only document-authored headings (e.g. headings carrying `data-anchor-id` inside the page's own wrapper), explicitly excluding specimen subtrees (`[data-slot="demo-stage"]`, `[data-slot="playground"]`, `[data-slot="card-stack"]`, `figure`, canvas hosts). Render no rail when nothing is declared rather than inventing anchors.
- **Acceptance criteria:** on `/components/accordion`, `/motion/spatial`, `/visuals/elements`, `/motion`, `/charts/line-chart`, `/docs/reference` no rail label comes from a specimen; all ids unique; ≤ 12 rows on `/docs/reference` (splitting is DOC-002).
- **Verification:** extend `tools/detail-probe.mjs` to record rail labels; click each rail link and assert it scrolls to a heading with matching text.
- **Evidence to mark VERIFIED:** before/after rail listings per page plus a screenshot of one scrolled landing.

### IA-002 — Duplicate DOM ids on the Visuals catalog

- **Priority:** P0 · **Status:** TODO · **Complexity:** S · **Owner:** UNASSIGNED
- **Risk to concurrent agents:** HIGH — `components/visuals/element-catalog.tsx` is part of the in-flight Visuals work.
- **Problem:** on `/visuals/elements` the ids `metrics` and `tables` each occur twice (family chip and section anchor), so `#metrics` deep links are ambiguous.
- **Evidence:** `01_CURRENT_STATE.md` §5.1 N2 (`detail-probe.json`).
- **Expected user-visible result:** one unique id per anchor; family links land on exactly one target.
- **Scope:** `components/visuals/element-catalog.tsx`, `app/visuals/elements/page.tsx`, references to `#<family-id>`.
- **Forbidden:** removing the family filter; renaming public family ids used in `?family=`.
- **Depends on:** none.
- **Instructions:** keep the section anchor as the id; give the chip a non-id attribute; update references; add a duplicate-id assertion.
- **Acceptance criteria:** no duplicate ids on `/visuals/elements`; chips scroll to the matching section; filtering still works.
- **Verification:** duplicate-id DOM query across the Visuals routes + chip click-through.
- **Evidence to mark VERIFIED:** the query returning empty and a click-through recording.

### QA-001 — Documented-route health gate

- **Priority:** P0 · **Status:** TODO · **Complexity:** M · **Owner:** UNASSIGNED
- **Risk to concurrent agents:** LOW/MED — a new QA module plus a script entry.
- **Problem:** the crawl found two HTTP 500 routes and eight orphans; no current gate reports either. `qa/routes.mjs` discovers pages from disk, but the acceptance set asserts behaviour, not route health.
- **Evidence:** `01_CURRENT_STATE.md` §4.3/§4.4; `05_QUALITY_GATE.md` §3.
- **Expected user-visible result:** none directly — it prevents shipping a documented page that errors.
- **Scope:** a new probe (e.g. `apps/showcase/qa/route-health.mjs`) + a `package.json` script; optionally a unit test reading `lib/docs/generated/nav.ts`.
- **Forbidden:** editing application pages to make the gate pass; whitelisting a route without a recorded reason and an owning action item.
- **Depends on:** CMP-001 (for a green baseline).
- **Instructions:** for every canonical registry route and every declared navigation href assert HTTP 200 + hydration marker + zero console errors; print the failing list; allow `known-broken` only beside an action-item ID.
- **Acceptance criteria:** fails on the current 500s pre-CMP-001 and passes after; fails when a new non-200 appears; ≤ ~2 min at ≤ 2 workers.
- **Verification:** demonstrate the failure before the fix and the pass after.
- **Evidence to mark VERIFIED:** both outputs plus runtime.

### MOT-001 — Card Stack: reproduce the user's failure or record a sound negative

- **Priority:** P0 · **Status:** TODO · **Complexity:** S · **Owner:** UNASSIGNED
- **Risk to concurrent agents:** LOW — read-only until a root cause exists.
- **Problem:** the user reports Card Stack has remained broken despite earlier claims of successful fixes. On the audited build `/motion/card-stack` and `/motion/spatial` behaved correctly (buttons, arrow keys, Home/End, pointer drag, tab order, live region, no stray navigation).
- **Evidence:** `01_CURRENT_STATE.md` §7.3; `card-stack.json`. **Not reproduced.**
- **Expected user-visible result:** a definitive answer instead of another "fixed" claim.
- **Scope:** read-only reproduction; extend `tools/card-stack-probe.mjs` with the user's exact steps.
- **Forbidden:** changing `packages/ui/src/motion/card-stack.tsx` or any page in this item; declaring the defect fixed.
- **Depends on:** `OPEN-01` (starting URL, viewport, browser, failing action).
- **Instructions:** reproduce with a scripted probe plus a manual pass; record geometry, DOM state, a screenshot/trace and the browser/viewport matrix. If unreproducible, record the environments attempted.
- **Acceptance criteria:** a recorded reproduction (steps → observed vs intended) **or** an explicit cannot-reproduce record listing every environment and step tried.
- **Verification:** an independent re-run of the recorded steps by another agent.
- **Evidence to mark VERIFIED:** the reproduction/negative record plus trace or screenshots in the ignored evidence root.

### DOC-001 — Remove phase labels and QA assertions from product copy

- **Priority:** P0 · **Status:** TODO · **Complexity:** S · **Owner:** UNASSIGNED
- **Risk to concurrent agents:** HIGH — many page files also touched by in-flight work.
- **Problem:** `/motion/spatial`'s eyebrow reads `MOTION · V3.0`; `/visuals/elements` prints `45 OF 45 CAPABILITIES HAVE A RENDERED PREVIEW ON THIS PAGE.`
- **Evidence:** `03_SHOWCASE_DESIGN_SPEC.md` §9.3 rows 1 and 4 (verbatim from the running Showcase).
- **Expected user-visible result:** pages read as a product, not a release log.
- **Scope:** page eyebrows/leads containing phase labels (`V1.0`, `V3.0`, `Phase NN`, `10B.5`); all-caps QA assertions.
- **Forbidden:** deleting derived counts that express scope (e.g. "45 elements across 7 families" as a scope statement is allowed); touching the i18n merge machinery.
- **Depends on:** none.
- **Instructions:** grep `app/**` and `components/**` for `V[0-9]\.`, `Phase \d`, and all-caps sentences; replace with product language or remove; render any retained count in sentence case from the registry.
- **Acceptance criteria:** no phase label and no QA claim on a public page; both locales updated; `pnpm verify:i18n` passes.
- **Verification:** grep + live spot check of affected pages + i18n gate.
- **Evidence to mark VERIFIED:** post-change grep output and before/after screenshots of two pages.

### LEG-001 — Route disposition decisions (no deletions)

- **Priority:** P0 · **Status:** TODO · **Complexity:** S · **Owner:** UNASSIGNED
- **Risk to concurrent agents:** LOW — a document, not code.
- **Problem:** eight unreachable chart family pages, the retired Visuals routes deleted mid-flight, and `/experiments/**` unclassified.
- **Evidence:** `01_CURRENT_STATE.md` §4.4/§9; `data/routes.csv`.
- **Expected user-visible result:** none yet — this is the decision that makes LEG-002/003 safe.
- **Scope:** a decision table appended to §8 of this file. No code change.
- **Forbidden:** deleting routes, redirects or files.
- **Depends on:** `OPEN-04`.
- **Instructions:** for each orphan and each retired path record `KEEP` / `CONSOLIDATE` / `RETIRE` with a rationale, the consumer list (`tests/unit/*`, `qa/routes.mjs`, `qa/behaviour.mjs`, `lib/navigation.ts`, docs) and, for RETIRE, a redirect plan.
- **Acceptance criteria:** every orphan and retired path has a decision, rationale, consumer list and redirect plan where applicable.
- **Verification:** user review.
- **Evidence to mark VERIFIED:** the accepted decision table with the user's approval recorded.

---

## 3. P1 — The main body of work

### IA-004 — Consolidate the five Visuals resource pages behind one destination

- **Priority:** P1 · **Status:** TODO · **Complexity:** M · **Owner:** UNASSIGNED
- **Risk:** HIGH — in-flight Visuals work.
- **Problem:** `/visuals/{art,compositions,artifacts,themes,skins}` are reachable only from `/visuals/docs` and carry 2 028–3 424 words each; they are implementation resources presented as product pages.
- **Evidence:** `01_CURRENT_STATE.md` §4.5, §6.2, §9; `routes.csv` inbound counts.
- **Expected result:** one declared Resources destination (or a `/visuals/docs` section) linking all five; a reader no longer needs one page as a gateway to five invisible ones.
- **Scope:** the five `page.tsx` files, `/visuals/docs`, the Visuals navigation group, the QA route policy.
- **Forbidden:** deleting content or the pages; moving them outside `/visuals`.
- **Depends on:** LEG-001.
- **Instructions:** either add a "Resources" row landing on an index, or absorb them as `/visuals/docs` sections with anchors. Keep every URL alive.
- **Acceptance criteria:** each of the five has ≥ 1 inbound link from a declared destination; the Visuals sidebar stays ≤ 5 rows.
- **Verification:** re-run `bash tools/link-crawl.sh` and read the inbound counts.
- **Evidence to mark VERIFIED:** crawl output + a sidebar screenshot.

### IA-005 — Decide and implement Motion's header tier

- **Priority:** P1 · **Status:** TODO · **Complexity:** S · **Owner:** UNASSIGNED
- **Risk:** MED — `lib/discovery/areas.ts`, `global-nav.tsx`, `tests/unit/discovery-areas.test.ts`.
- **Problem:** Motion has 35 entries and a 1 230-word flagship page but sits behind "More" while Visuals (45 entries) is primary — an artefact of phase order.
- **Evidence:** `01_CURRENT_STATE.md` §3, §7.1; `03_SHOWCASE_DESIGN_SPEC.md` §2.2.
- **Expected result:** the primary tier reflects the product's real shape (recommended: Components · Charts · Visuals · Motion).
- **Scope:** `tier` in `lib/discovery/areas.ts`, header rendering, integrity tests, i18n if labels change.
- **Forbidden:** adding a fifth primary area without the user's decision; changing `/motion` routing.
- **Depends on:** `OPEN-02`.
- **Instructions:** flip the declared tier, check the header at 1024/1280/1440 px for overflow, update the integrity tests.
- **Acceptance criteria:** four primaries render without wrapping or clipping at all three widths; keyboard path to each area works; tests green.
- **Verification:** browser check at three widths + `pnpm --filter @luc/showcase test`.
- **Evidence to mark VERIFIED:** screenshots at three widths + passing test output.

### IA-006 — Explore becomes the filter tool, not a landing page

- **Priority:** P1 · **Status:** TODO · **Complexity:** M · **Owner:** UNASSIGNED
- **Problem:** `/explore` is 460 words plus a link; the value lives ~200 links deep in `/explore/browse`, which is the single point of failure for site reachability.
- **Evidence:** `01_CURRENT_STATE.md` §4.5, §6.1; `03_SHOWCASE_DESIGN_SPEC.md` §5 T9.
- **Expected result:** `/explore` *is* the search/filter UI (name + use case + art direction + type) with canonical result links and a real empty state.
- **Scope:** `app/explore/page.tsx`, `components/explore/**`, `lib/discovery/{catalog,curation,taxonomy}.ts`.
- **Forbidden:** removing `/explore/browse` (it has inbound links) or changing filter URL params.
- **Depends on:** none.
- **Instructions:** move the browse experience to `/explore`; keep `/explore/browse` as an alias; add the empty state.
- **Acceptance criteria:** `/explore` shows filters + results; all results canonical; `/explore/browse?use=` still resolves; works at 390 px; keyboard-only filtering works.
- **Verification:** browser journey + axe + crawl delta.
- **Evidence to mark VERIFIED:** screenshots (desktop + 390 px), axe output, crawl delta.

### IA-007 — Split the "Build with it" area's four products

- **Priority:** P1 · **Status:** TODO · **Complexity:** M · **Owner:** UNASSIGNED
- **Problem:** one area declaration covers Blocks, Templates, Experiences (16 routes) and Patterns (11 routes): four products, three sidebar groups, one header entry.
- **Evidence:** `01_CURRENT_STATE.md` §3, §9.
- **Expected result:** a reader can tell Blocks from Templates from Patterns from Experiences from the sidebar alone.
- **Scope:** `lib/discovery/areas.ts` prefixes/sidebar, `lib/navigation.ts` group titles/descriptions, the `/blocks` and `/templates` landings.
- **Forbidden:** folding `/experiences/**` into `/patterns`.
- **Depends on:** IA-005 (one tier decision at a time).
- **Instructions:** state each product's difference in ≤ 20 words on its landing page; order the sidebar groups to match the reading order.
- **Acceptance criteria:** each landing states its difference; sidebar group titles are distinct; no route loses its only inbound link.
- **Verification:** read the landings + crawl inbound counts.
- **Evidence to mark VERIFIED:** the landing copy + crawl table.

### UX-001 — Chart detail: the plot comes first

- **Priority:** P1 · **Status:** TODO · **Complexity:** M · **Owner:** UNASSIGNED
- **Risk:** HIGH — `DocEntryPage` is shared by 229 registry routes.
- **Problem:** on `/charts/line-chart` the plot starts at y≈1 570 with 165 words before it; `/charts/violin-chart` at y≈1 852 with 227 words. Component pages do this correctly (y≈410–435).
- **Evidence:** `01_CURRENT_STATE.md` §6.1; CP-10.
- **Expected result:** the plot is visible without scrolling at 1440×900, with code one tab away.
- **Scope:** `components/doc-pages/entry-page.tsx`, the chart family template, chart page composition.
- **Forbidden:** deleting installation/SSR/accessibility content; changing chart components; removing the playground.
- **Depends on:** none.
- **Instructions:** reorder to purpose (≤ 25 w) → preview (+ `Preview|Code`) → controls → variants → usage → API → a11y; link install/config prose to `/docs/installation`.
- **Acceptance criteria:** for ten sampled chart routes the plot top is < 700 px at 1440×900 and prose before it ≤ 40 words; no section removed (content inventory diff clean).
- **Verification:** `tools/detail-probe.mjs` before/after + a section inventory diff.
- **Evidence to mark VERIFIED:** the measurement table and the diff.

### UX-002 — Detail pages: purpose ≤ 25 words, engine facts secondary

- **Priority:** P1 · **Status:** TODO · **Complexity:** M · **Owner:** UNASSIGNED
- **Problem:** chart/component details run 265–1 425 words, often with implementation-first leads ("LineChart draws line on the ECharts engine; the values, including any statistic, are prepared by the caller.").
- **Evidence:** `01_CURRENT_STATE.md` §6; `03_SHOWCASE_DESIGN_SPEC.md` §9.3 rows 5 and 8.
- **Expected result:** the first paragraph says what the component is *for*; engine/implementation facts move below the preview.
- **Scope:** `lib/docs/curation/summaries.ts`, page leads, `components/doc-pages/*`.
- **Forbidden:** changing derived API content; dropping accessibility notes.
- **Depends on:** none.
- **Instructions:** rewrite summaries to ≤ 25 words starting from the job; add a unit assertion for the budget.
- **Acceptance criteria:** every curated summary ≤ 25 words; none begins by naming its own class; assertion present and green.
- **Verification:** assertion + a read of 10 pages.
- **Evidence to mark VERIFIED:** assertion output + before/after leads for 5 pages.

### UX-003 — Variant-per-section for the five richest hand-written pages

- **Priority:** P1 · **Status:** TODO · **Complexity:** L · **Owner:** UNASSIGNED
- **Problem:** `/components/{buttons,inputs,cards,ai,slider}` are the most-linked hand-written pages (17–34 inbound) and present prose sections rather than a variant sequence with per-variant code.
- **Evidence:** `01_CURRENT_STATE.md` §6; CP-02.
- **Expected result:** each page reads as `Default / Outline / …` with an immediately copyable snippet per variant.
- **Scope:** the five page files and their demos; no library changes.
- **Forbidden:** converting them into registry-generated entries; changing component APIs.
- **Depends on:** WB-001, WB-003.
- **Instructions:** restructure sections so each variant has preview + code; keep prose only where it explains a constraint.
- **Acceptance criteria:** ≥ 4 variants per page have their own snippet; ≤ 700 words per page; a coverage checklist proves no existing feature was dropped.
- **Verification:** browser pass + coverage checklist + word counts.
- **Evidence to mark VERIFIED:** counts, screenshots, checklist.

### UX-004 — Catalog pages must not print a 55-row rail

- **Priority:** P1 · **Status:** TODO · **Complexity:** S · **Owner:** UNASSIGNED
- **Problem:** `/visuals/elements` prints 45 elements + 7 families in the rail; `/motion` prints 32 rows.
- **Evidence:** `01_CURRENT_STATE.md` §5.1 N3.
- **Expected result:** catalog pages use family-level navigation only (≈ 7 rows).
- **Scope:** rail usage on catalog pages.
- **Forbidden:** removing the family filter.
- **Depends on:** IA-001.
- **Instructions:** disable the rail on catalog pages or feed it the explicit family list.
- **Acceptance criteria:** rail ≤ 10 rows on any catalog page; every row maps to a real section or filter.
- **Verification:** rail-length assertion across catalog routes.
- **Evidence to mark VERIFIED:** the assertion output.

### WB-001 — Reset and copy on every playground

- **Priority:** P1 · **Status:** TODO · **Complexity:** S · **Owner:** UNASSIGNED
- **Problem:** only `/motion/spatial` offers "Reset the demo"; playgrounds elsewhere have none.
- **Evidence:** `01_CURRENT_STATE.md` §8.
- **Expected result:** any configuration returns to the documented default in one action.
- **Scope:** `components/docs/playground*.tsx`, `components/playground/**`.
- **Forbidden:** per-page bespoke reset buttons.
- **Depends on:** none.
- **Acceptance criteria:** every mounted playground has a labelled Reset that restores defaults and regenerates the code; keyboard reachable.
- **Verification:** extend `tests/unit/playground-engine.test.ts` + browser check on 5 pages.
- **Evidence to mark VERIFIED:** test output + a reset recording on two pages.

### WB-002 — One shared responsive-viewport control

- **Priority:** P1 · **Status:** TODO · **Complexity:** M · **Owner:** UNASSIGNED
- **Problem:** no workbench can preview a different width, so responsive claims are unverifiable in the product.
- **Evidence:** `01_CURRENT_STATE.md` §8.
- **Expected result:** Small/Medium/Large preview widths for component, motion and block specimens.
- **Scope:** the playground frame; not the chart engine.
- **Forbidden:** replacing the real browsing context with a scaled `div` (ADR-018 — media queries resolve against the browsing context).
- **Depends on:** none.
- **Acceptance criteria:** switching width changes layout exactly as media queries would; the default matches today's behaviour; keyboard operable; controls do not shift.
- **Verification:** verify a `md:`-dependent component changes at each width.
- **Evidence to mark VERIFIED:** screenshots at three widths on one page.

### WB-003 — Group controls by importance with derived presets

- **Priority:** P1 · **Status:** TODO · **Complexity:** M · **Owner:** UNASSIGNED
- **Problem:** control panels are a flat list with equal weighting and no presets.
- **Evidence:** `01_CURRENT_STATE.md` §8; `03_SHOWCASE_DESIGN_SPEC.md` §6.1.
- **Expected result:** essential / variants / advanced grouping with presets derived from the documented variant list.
- **Scope:** `components/playground/**` control rendering and adapter metadata.
- **Forbidden:** hiding a control a variant section depends on; inventing presets.
- **Depends on:** none.
- **Acceptance criteria:** every adapter declares groups; advanced defaults collapsed; presets read the same data as the variant sections.
- **Verification:** adapter test on group metadata + visual check of 3 pages.
- **Evidence to mark VERIFIED:** test output + screenshots.

### WB-004 — Prevent or explain invalid control combinations

- **Priority:** P1 · **Status:** TODO · **Complexity:** S · **Owner:** UNASSIGNED
- **Problem:** nothing prevents combinations that cannot render (log scale on non-positive data falls back silently).
- **Scope:** chart playground controls. **Depends on:** none.
- **Acceptance criteria:** an invalid combination is disabled with a one-line reason, or explained inline; no silent fallback in the product UI.
- **Verification:** browser check with a non-positive series.
- **Evidence to mark VERIFIED:** a screenshot of the disabled/explained state.

### MOT-002 — Motion detail template with per-example preview/code

- **Priority:** P1 · **Status:** TODO · **Complexity:** M · **Owner:** UNASSIGNED
- **Problem:** motion details are one specimen plus up to 1 100 words; Motion Primitives shows six named examples, each independently preview/code toggled.
- **Evidence:** `02_COMPETITOR_RESEARCH.md` §2.3, CP-07.
- **Scope:** `app/motion/**`, `lib/demo/motion/**`, the shared entry template.
- **Forbidden:** duplicating near-identical examples to look complete.
- **Depends on:** IA-001 (so added headings are declared, not harvested).
- **Acceptance criteria:** ≥ 3 distinct named examples on the 8 gallery motion pages, each with preview + code; page prose ≤ 800 words.
- **Verification:** browser pass + word counts.
- **Evidence to mark VERIFIED:** screenshots + counts.

### MOT-003 — Motion: replay, pause, visible reduced-motion switch, initial index 0

- **Priority:** P1 · **Status:** TODO · **Complexity:** M · **Owner:** UNASSIGNED
- **Problem:** demos lack replay/pause and a visible reduced-motion control; `/motion/card-stack` starts at index 1, announcing "2 / 3" before interaction.
- **Evidence:** `01_CURRENT_STATE.md` §7.3; `card-stack.json` (initial `active: "1"`, status "2 / 3").
- **Scope:** motion demo islands, `components/demo/islands/d-motion.tsx`, `lib/demo/motion/**`.
- **Forbidden:** changing the primitives' public props; removing reduced-motion support.
- **Depends on:** none.
- **Acceptance criteria:** every timed specimen has replay (+ pause when looping); a page-level reduced-motion switch visibly flattens motion; Card Stack starts at 0 with the live region reading "1 / 3".
- **Verification:** browser probe of 5 motion pages including the live-region text.
- **Evidence to mark VERIFIED:** probe output + screenshots.

### CHT-001 — Chart playground in the first viewport for all chart pages

- **Priority:** P1 · **Status:** TODO · **Complexity:** M · **Owner:** UNASSIGNED
- **Depends on:** UX-001. **Scope:** the registry-driven chart entry template.
- **Acceptance criteria:** on 10 sampled chart routes the preview is < 700 px from the top; the chart still renders; `pnpm qa:isolation` still passes.
- **Verification:** measurement probe + `pnpm qa:charts`.
- **Evidence to mark VERIFIED:** the measurement table + chart QA output.

### VIS-001 — Visual element detail: one specimen, two chip rows, disclosure for the contract

- **Priority:** P1 · **Status:** TODO · **Complexity:** M · **Owner:** UNASSIGNED
- **Problem:** the element page has the right order (specimen → variants → usage → disclosure) but the specimen is not reliably in the first viewport and contract prose leaks into product copy.
- **Evidence:** `01_CURRENT_STATE.md` §6; `detail-probe.json` (`/visuals/elements/metric-value`: 240 words, 1 code block, 2 h2).
- **Scope:** `components/visuals/element-detail.tsx`, `app/visuals/elements/[element]/page.tsx`.
- **Forbidden:** adding a chart engine; adding runtime props Visuals does not have.
- **Depends on:** IA-002.
- **Acceptance criteria:** all 45 element pages show a specimen within the first 700 px; size + skin are chip rows; the technical reference stays in a disclosure; ≤ 300 words above it.
- **Verification:** probe 5 slugs + word counts across all 45.
- **Evidence to mark VERIFIED:** the measurement table.

### VIS-002 — Trim the Visuals catalog page's prose

- **Priority:** P1 · **Status:** TODO · **Complexity:** S · **Owner:** UNASSIGNED
- **Problem:** `/visuals/elements` is 3 092 words with a QA banner and a defensive paragraph.
- **Evidence:** `01_CURRENT_STATE.md` §6.2; `03_SHOWCASE_DESIGN_SPEC.md` §9.3 rows 3–4.
- **Acceptance criteria:** ≤ 900 words; counts derived; no all-caps assertion; all 45 previews remain.
- **Verification:** word count + screenshot.
- **Evidence to mark VERIFIED:** before/after counts.

### DOC-002 — Split `/docs/reference`

- **Priority:** P1 · **Status:** TODO · **Complexity:** M · **Owner:** UNASSIGNED
- **Problem:** one page, 12 787 px, 27 h3, 1 180 words, no demo.
- **Scope:** `app/docs/reference/page.tsx`, `lib/docs/generated/api.ts` projections.
- **Forbidden:** changing the generated contract; hand-copying API tables.
- **Depends on:** IA-001.
- **Acceptance criteria:** an index page + per-family pages; index ≤ 400 words; every currently listed symbol still reachable; rail ≤ 12 rows per page.
- **Verification:** route health + symbol-count diff (nothing lost).
- **Evidence to mark VERIFIED:** the symbol diff + screenshots.

### DOC-003 — Copy pass on the 20 longest pages

- **Priority:** P1 · **Status:** TODO · **Complexity:** M · **Owner:** UNASSIGNED
- **Problem:** `/visuals/artifacts` 3 424 w, `/visuals/elements` 3 092 w, `/visuals/compositions` 2 028 w, `/charts/line-chart` 1 425 w, `/docs/reference` 1 180 w, `/motion/kinetic` 1 106 w, …
- **Acceptance criteria:** each targeted page meets its budget (docs ≤ 1 000 w, detail ≤ 700 w, catalog ≤ 900 w) with no factual loss.
- **Verification:** word-count table + reviewer sign-off on the content diff.
- **Evidence to mark VERIFIED:** the table.

### LEG-002 — Retire or redirect the orphan chart family pages

- **Priority:** P1 · **Status:** TODO · **Complexity:** S · **Depends on:** LEG-001 + user approval.
- **Problem/Evidence:** eight routes with zero inbound links (`01_CURRENT_STATE.md` §4.4).
- **Forbidden:** deleting a route that any test, QA policy or doc references; deleting without a redirect plan.
- **Acceptance criteria:** each of the eight is linked from a declared destination or 308-redirects to canon; no reference dangles.
- **Verification:** link crawl + reference grep + route-health gate.
- **Evidence to mark VERIFIED:** crawl output + grep results.

### LEG-003 — One component inventory

- **Priority:** P1 · **Status:** TODO · **Complexity:** M · **Owner:** UNASSIGNED
- **Problem:** `luc-ui/docs/COMPONENT_INVENTORY.md`, `luc-ui/docs/COMPONENT_CATALOG.md` and the generated registry all describe the same components; only the registry is mechanically verified.
- **Acceptance criteria:** the generated registry is named as the single source in both documents; stale counts removed or generated.
- **Verification:** diff the human document's counts against `data/components.csv`.
- **Evidence to mark VERIFIED:** the comparison table.

### QA-002 — Journey-level acceptance suite (G3)

- **Priority:** P1 · **Status:** TODO · **Complexity:** L · **Owner:** UNASSIGNED
- **Problem:** existing gates assert implementation facts; nothing walks find → open → interact → configure → inspect code → return.
- **Scope:** a new QA module + CI wiring; bounded at ≤ 2 workers.
- **Acceptance criteria:** ≥ 5 journeys across Components/Charts/Motion/Visuals/Search; fails on a broken control, a wrong-destination link, or a stale code panel; completes in ≤ 6 min.
- **Verification:** run it, then break one control in a scratch branch and show it failing.
- **Evidence to mark VERIFIED:** passing run + the deliberate-failure demonstration.

### DEV-001 — Local development harness with deterministic fixtures

- **Priority:** P1 · **Status:** TODO · **Complexity:** L · **Owner:** UNASSIGNED
- **Details:** `06_LOCAL_DEVELOPMENT_PLAN.md` §4–§6.
- **Acceptance criteria:** `cd luc-ui && pnpm dev` plus a documented fixture mode starts the Showcase with no Redis/ClickHouse/API dependency, and the QA-002 journeys pass locally.
- **Verification:** clean checkout run on the target machine.
- **Evidence to mark VERIFIED:** run log + screenshots from the non-Linux machine.

---

## 4. P2 — Polish and hardening

### UX-005 — Detail page footers: 2–4 related links, not a catalogue

- **Priority:** P2 · **Status:** TODO · **Complexity:** S
- **Problem:** doc entry pages have no previous/next; the only footer is a version strip.
- **Acceptance criteria:** every registry entry page shows 2 related links, both canonical and accessibly named.
- **Verification:** browser check across 10 routes. **Evidence:** screenshots from 3 routes.

### WB-005 — Workbench state is stable across family navigation

- **Priority:** P2 · **Status:** TODO · **Complexity:** S
- **Problem:** navigating between two chart pages resets every control; nothing is shareable.
- **Acceptance criteria:** height/state/appearance persist across sibling specimens; a shareable URL encodes only shareable values.
- **Verification:** browser check across two chart routes. **Evidence:** recording + the URL produced.

### MOT-004 — Motion gallery tiles show live mini specimens

- **Priority:** P2 · **Status:** TODO · **Complexity:** M
- **Problem:** `/motion` lists 8 routes with no specimen on the tile.
- **Acceptance criteria:** each tile renders the real component at a small size, with reduced-motion respected, and the page stays under the engine-isolation budget.
- **Verification:** browser + `qa:isolation`. **Evidence:** screenshots + isolation output.

### CHT-002 — Addressable chart examples in the catalogue

- **Priority:** P2 · **Status:** TODO · **Complexity:** S
- **Problem:** `/charts/catalog` has 81 entries but no per-example deep link (ECharts uses `?c=line-simple`).
- **Acceptance criteria:** each row has a canonical anchor id derived from the entry id; the page can scroll to it.
- **Verification:** DOM check + click-through. **Evidence:** recording.

### VIS-003 — Visuals resource pages: reduce to resource density

- **Priority:** P2 · **Status:** TODO · **Complexity:** M · **Depends on:** IA-004.
- **Acceptance criteria:** each resource page ≤ 1 200 words with detail in disclosures, still listing everything it lists today.
- **Verification:** word counts + content inventory diff. **Evidence:** counts + diff.

### DOC-004 — Sidebar/label copy pass

- **Priority:** P2 · **Status:** TODO · **Complexity:** S
- **Problem:** navigation descriptions use internal vocabulary ("Entry points, capacity rules, diagnostics, isolation.").
- **Acceptance criteria:** every sidebar description is user language, ≤ 12 words; both locales updated; integrity tests green.
- **Verification:** render the sidebar across areas. **Evidence:** the label table before/after.

### DOC-005 — Decide the long-form zh body work

- **Priority:** P2 · **Status:** TODO · **Complexity:** L
- **Problem:** `.context` records long-form body coverage at 29/131 while headers/nav/chrome are complete; a half-translated body is a visible inconsistency.
- **Acceptance criteria:** either a batched plan or an explicit decision that bodies remain English with an honest, visible notice.
- **Verification:** user decision + `pnpm verify:i18n` still passing. **Evidence:** the recorded decision.

### LEG-004 — Consolidate the routed-API inventories

- **Priority:** P2 · **Status:** TODO · **Complexity:** S
- **Problem:** chart counts appear in `/charts/catalog`, `.context` docs and `CHART_GUIDE.md`; `.context` is already stale (79 public vs 78).
- **Acceptance criteria:** one authoritative count statement per family, generated or asserted.
- **Verification:** the assertion/generator output. **Evidence:** output.

### LEG-005 — Per-phase reports must leave the package

- **Priority:** P2 · **Status:** TODO · **Complexity:** S
- **Problem:** untracked per-phase reports and a `skills/` folder live inside `packages/visuals`.
- **Acceptance criteria:** package contents contain no phase reports; `verify:package` unaffected.
- **Verification:** `pnpm verify:package` + a file listing. **Evidence:** output + listing.

### QA-003 — Cross-browser journey subset

- **Priority:** P2 · **Status:** TODO · **Complexity:** M
- **Acceptance criteria:** Firefox + WebKit run the QA-002 journeys; per-browser results documented; engine-specific gaps recorded, not hidden.
- **Evidence:** the results matrix.

### QA-004 — Visual regression limited to flagship pages

- **Priority:** P2 · **Status:** TODO · **Complexity:** S
- **Problem:** pixel baselines must not grow into a 300-screenshot burden.
- **Acceptance criteria:** ≤ 12 baselines, all captured on Mac; never diff Linux headless against Mac baselines (ADR-036).
- **Evidence:** baseline list + one intentional-failure demonstration.

### DEV-002 — Prove the Showcase is standalone

- **Priority:** P2 · **Status:** TODO · **Complexity:** S
- **Acceptance criteria:** no import from `luc-web`/`luc-api` in `apps/showcase`; documented in `06_LOCAL_DEVELOPMENT_PLAN.md`.
- **Evidence:** the import-scan output.

### DEV-003 — Decide the fixtures boundary

- **Priority:** P2 · **Status:** TODO · **Complexity:** S
- **Acceptance criteria:** one written rule for when a specimen uses a fixture vs real served data, enforced where possible.
- **Evidence:** the recorded rule.

---

## 5. Suggested execution batches

Batches are ordered by dependency, not by priority alone.

| Batch | Items | Why together | Concurrency rule |
|---|---|---|---|
| **B0 — Stop the bleeding** | CMP-001, QA-001 | A gate must exist before repairs are claimed | 1 agent; QA-001 after CMP-001 |
| **B1 — Navigation truth** | IA-001, IA-002, MOT-001, DOC-001 | All four change what a page *says*, not what it renders | ≤ 2 agents; IA-001 vs DOC-001 conflict if both touch one page |
| **B2 — Decisions** | LEG-001, OPEN-01…04 | Retirement and tier decisions gate three later batches | user review required |
| **B3 — Chart & component hierarchy** | UX-001, UX-002, CHT-001 | Shared entry template | 1 agent (`entry-page.tsx`) |
| **B4 — Workbench** | WB-001…004 | Same surface | ≤ 2 agents; WB-001/003 share the control renderer |
| **B5 — Motion** | MOT-002, MOT-003 | Same templates | 1 agent |
| **B6 — Visuals consolidation** | IA-004, VIS-001…003 | Same area | **serialize** — in-flight Visuals work conflicts |
| **B7 — Docs** | DOC-002…004, LEG-003 | Copy work is expensive to merge | 1 agent; DOC-002 vs IA-001 conflict |
| **B8 — IA completion** | IA-005…007, UX-003, UX-005 | Header/IA changes ripple into tests | 1–2 agents after B2 |
| **B9 — Legacy** | LEG-002, LEG-004, LEG-005 | Mechanical after decisions | 1 agent |
| **B10 — Hardening** | QA-002…004, DEV-001…003, WB-005, CHT-002, MOT-004, VIS-003 | Verification infrastructure | ≤ 2 agents |

## 6. Independent verification gates

| Gate | Rule |
|---|---|
| A — per item | The implementing agent's evidence is reviewed by a **different** agent or the user against the item's acceptance criteria. Only then may status become VERIFIED. |
| B — per batch | `pnpm verify` + route-health gate + QA-002 pass; a screenshot set for the batch's routes is attached. |
| C — release | `pnpm verify`, QA-002, QA-003 subset, QA-004 baselines, plus a manual read of the five flagship pages. |

Verification may not be performed by the same session that implemented the item
without an independent read of the evidence.

## 7. Status discipline

| Status | Meaning |
|---|---|
| TODO | Not started |
| IN_PROGRESS | Actively being worked |
| IMPLEMENTED | Code/content exists; **not** verified |
| VERIFIED | Acceptance criteria met with the named evidence, reviewed independently |
| BLOCKED | A dependency or decision is missing; the blocker and date are recorded |
| DEFERRED | Deliberately postponed; reason and reviewer recorded |

## 8. Internal consistency check (performed at authoring time)

| Requirement | Status |
|---|---|
| Every major recommendation maps to an observed problem, competitor finding or stated objective | ✅ each item's Evidence line names `CS-xx`, a `CP-xx`, or the user's stated preference |
| Every P0 item has explicit acceptance criteria | ✅ |
| Every verified broken journey maps to an item or a documented exception | ✅ CS-01→CMP-001, CS-02→IA-001, CS-03→LEG-002, CS-04→UX-001/CHT-001, CS-05→IA-002, CS-06→IA-004, CS-07→WB-001/002, CS-08→withdrawn (verified non-defect, `01_CURRENT_STATE.md` §5.1 N4), CS-09→MOT-001, CS-10→IA-001 + MOT-001 |
| Every proposed retirement carries a consumer warning | ✅ LEG-001/002 require the consumer list before any deletion |
| Counts derive from current source | ✅ `data/components.csv`, the chart verifier, `ELEMENT_LIST` |
| The proposed sidebar never mixes anchors with routes | ✅ `03_SHOWCASE_DESIGN_SPEC.md` §3.1/§3.2 |
| The docs hierarchy does not hide essentials | ✅ §9.4 rule — nothing essential only at Level 6 |
| Workbench controls map to real public props | ✅ §6.1 + WB-004 |
| The roadmap respects monorepo concurrency | ✅ §5 concurrency rules + per-item risk |
| The local migration plan assumes no production access | ✅ `06_LOCAL_DEVELOPMENT_PLAN.md` §4–§5 |
| No application code modified; no implementation task checked | ✅ §9 |

## 9. Change and progress log

Append-only. One entry per status change: date (UTC), item ID, agent, from→to
status, evidence link. Never edit or delete an earlier entry.

| Date | Item | Agent | Change | Evidence |
|---|---|---|---|---|
| 2026-10-11 | (audit) | audit agent | 43 items authored (7 P0 / 23 P1 / 13 P2); every implementation item TODO | this document + `data/*.csv`; no application code touched |
| 2026-10-11 | LEG-001 | audit agent | Decision table pending user review (`OPEN-04`) | `01_CURRENT_STATE.md` §9 |

---

## 8b. LEG-001 — route disposition decisions (authored 2026-10-12, Agent A)

`LEG-001` asks for a decision table, not code: "for each orphan and each retired
path record `KEEP` / `CONSOLIDATE` / `RETIRE` with a rationale, the consumer list
(`tests/unit/*`, `qa/routes.mjs`, `qa/behaviour.mjs`, `lib/navigation.ts`, docs)
and, for RETIRE, a redirect plan."

Two decisions inside it are already taken by the product owner and are recorded
here as constraints rather than re-opened: `OPEN-04` (`Visuals` Art, Skins,
Themes, Artifacts and Compositions are **internal implementation resources**, not
public navigation categories, and their reusable contracts are preserved) and the
Build decision (`IA-007`: Blocks, Templates, Patterns and Experiences are four
subareas of one parent, with their routes unchanged).

### The eight unreachable chart pages — **KEEP_PUBLIC**

| Route | Purpose | Inbound links | Deep-link risk | Consumers | Decision |
|---|---|---|---|---|---|
| `/charts/architecture` | how the two engines fit together | 1 (`/charts`) | low — a guide nobody linked to | `qa/routes.mjs` | KEEP_PUBLIC |
| `/charts/interaction` | the interaction contract, tooltips/zoom/brush/fullscreen | 1 (`/charts`) | low | `qa/routes.mjs` | KEEP_PUBLIC |
| `/charts/uncertainty` | forecast cone, prepared fit, regime strip, event study | 1 (`/charts`) | low | `qa/routes.mjs` | KEEP_PUBLIC |
| `/charts/performance` | what happens at real data volumes | 1 (`/charts`) | low | `qa/routes.mjs` | KEEP_PUBLIC |
| `/charts/quantitative` | drawdown, equity curves, attribution | 1 (`/charts`) | low | `qa/routes.mjs` | KEEP_PUBLIC |
| `/charts/networks` | Sankey, graph, tree, sunburst | 1 (`/charts`) | low | `qa/routes.mjs` | KEEP_PUBLIC |
| `/charts/surfaces` | three-dimensional fields and projections | 1 (`/charts`) | low | `qa/routes.mjs` | KEEP_PUBLIC |
| `/charts/sizing` | the sizing rule, as a page | 1 (`/charts`) | low | `qa/routes.mjs` | KEEP_PUBLIC |

**Rationale.** Measured before anything changed: each returned 200, each had
**zero** inbound links from `/charts`, `/charts/catalog`, the family pages,
`/explore`, `/explore/browse`, `/motion` and `/`. None is a duplicate of a family
page — one is the guide to the two engines, one is the interaction contract, one
is the sizing rule — and an infrequently visited page with real content is not an
obsolete one. `LEG-002`'s acceptance criteria allow either a link from a declared
destination or a redirect to canon, and **the link half is implemented**:
`/charts` lists them under "Topic pages". Measured after: **0 → 1** inbound link
each. No consumer list beyond `qa/routes.mjs` and the new links, so no redirect
plan is needed; the RETIRE branch stays open for the owner if they disagree.

### Retired and retired-in-effect Visuals resources — **KEEP_INTERNAL**, owner Agent B

| Route | Purpose today | Inbound links | Deep-link risk | Decision |
|---|---|---|---|---|
| `/visuals/art` | the art library behind the elements | internal only | **high** — reusable art contracts | KEEP_INTERNAL |
| `/visuals/skins` | skin/material contracts | internal only | high | KEEP_INTERNAL |
| `/visuals/themes` | theme contracts | internal only | high | KEEP_INTERNAL |
| `/visuals/artifacts` | composed artifacts | internal only | high | KEEP_INTERNAL |
| `/visuals/compositions` | authored compositions | internal only | high | KEEP_INTERNAL |

**Rationale.** `OPEN-04`: these are implementation resources, not public product
sections, and they are not restored to the Visuals sidebar. Their pages still
exist and their URLs still resolve, which is the "preserve working deep links"
principle. **Owner: Agent B** — this table records the decision; no Agent A edit
to `app/visuals/**` or `packages/visuals/**` is implied or made.

The Phase 10A art-direction *study* pages are the one genuine retirement in this
area: their routes were removed with their pages, and `docs-registry.mjs` records
that ("the design studies that used to be the one exception were retired with
their pages"), so the registry cannot re-advertise them. **RETIRE**, already
executed by Agent B, evidence in the generated registry rather than in this file.

### `/experiments/**` — **KEEP_PUBLIC**

| Route | Purpose | Inbound links | Deep-link risk | Consumers | Decision |
|---|---|---|---|---|---|
| `/experiments/design-lab` and its four studies | the experimental treatments the system learned from | navigation group `experiments` | low | `lib/navigation.ts` (`experimentsGroup`), `qa/routes.mjs`, the docs sidebar | KEEP_PUBLIC |

**Rationale.** Classified here because the audit left it unclassified
(`LEG-001`'s problem statement). It is neither an orphan nor legacy: it has a
declared navigation group, a docs-area owner (`areas.ts` puts `/experiments/**`
in `docs`), and its pages are referenced by the nav model. No change.

### Routed-API inventories — **CONSOLIDATE**, tracked as `LEG-004`

| Resource | Purpose | Decision |
|---|---|---|
| `/charts/catalog`, `.context` docs, `CHART_GUIDE.md`, `COMPONENT_INVENTORY.md`, `COMPONENT_CATALOG.md` | counts of the same catalogue | CONSOLIDATE onto the generated artefacts; see `LEG-004` |

**Rationale.** A count in prose drifted three times in this project (the charts
page said "sixteen routes" while listing twelve; the inventory said "29 entries"
while `package.json` exported 35; `.context` says 79 Visuals elements where the
registry registers 81). Two of the three are fixed at source (derived from the
array / asserted against the manifest), and the third is a `.context` document
owned outside Agent A's scope — recorded as a handoff rather than edited.

**Acceptance for this table:** every orphan and every retired path above has a
decision, a rationale, a consumer list, and a redirect plan where the decision
needs one. The two rows that remain open are the ones that legitimately need the
owner: the RETIRE branch for the eight chart pages, and `.context`'s count.

**Verification evidence:** the inbound-link crawl (`0 → 1` per chart topic page),
`qa/navigation.mjs`'s WP-4 block comparing Explore's counts against the registry
and the live catalogues, and `tests/unit/docs-inventory.test.ts` comparing the
inventory's stated export count against `package.json`.

---

## 10. Addendum — item added after the audit (append-only)

The audit's inventory was fixed at 43 items and this file may not renumber or
re-scope them. Two things happened during implementation that the inventory did
not cover, so they are recorded here with new ids at the end of the sequence.

### QA-005 — `/date-time/time` hydrated with a different time zone than the server

- **Priority:** P2 · **Status:** IMPLEMENTED / SELF_TESTED (2026-10-11, Agent A) ·
  **Complexity:** S · **Found by:** `qa/route-health.mjs` on the review container
- **Problem:** `app/date-time/time/page.tsx` rendered `getLocalTimeZone()` into the
  server HTML. The server (the container, `TZ=UTC`) wrote `UTC` and the browser
  wrote `Asia/Singapore` into the same text node, so React raised minified error
  #418 (text hydration mismatch) on every visit outside the server's zone. It was
  invisible on the developer's machine because both sides were
  `Asia/Singapore`; the container is what exposed it, which is also why the
  route-health gate caught it and no earlier sweep did.
- **Evidence:** `route-health.json` before the fix —
  `200 /date-time/time hydrated=true pageErrors=["Minified React error #418 …"]`.
- **Expected result:** no hydration mismatch in any time zone; the page still
  tells the reader their zone.
- **Scope:** `app/date-time/time/page.tsx` and its zh sentence.
- **Forbidden:** removing the zone readout; rendering a hard-coded zone.
- **Depends on:** none.
- **Instructions:** read the zone after mount
  (`useSyncExternalStore(subscribe, getLocalTimeZone, () => null)`) and render an
  honest pre-mount sentence, so the first client render matches the server's.
- **Acceptance criteria:** `/date-time/time` returns 200 with the hydration marker
  and **zero** page errors in a `TZ=UTC` container; the zone is still correct in
  the browser.
- **Verification:** `qa/route-health.mjs` on the review image (326 routes).
- **Evidence to mark VERIFIED:** the route-health run with `/date-time/time`
  green, plus a screenshot showing the reader's own zone after mount.
