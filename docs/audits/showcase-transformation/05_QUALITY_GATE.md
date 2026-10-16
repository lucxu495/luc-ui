# 05 — Quality Gate & Acceptance Protocol

Why earlier phases reported success while the product still felt broken, and the
acceptance system that makes quality review reliable instead of optimistic.

---

## 1. Quality levels

| Level | Name | Question it answers | Evidence required |
|---|---|---|---|
| **G1** | Functional correctness | Does the thing work at all? | Correct routes (HTTP 200, no console error), real state change on interaction, controls that alter the specimen, **no unexpected navigation** |
| **G2** | Visual correctness | Does it look right and can it be read? | Layout/geometry measurements, no clipping or overlap, readable contrast, demo presented meaningfully (in the first viewport on a 1440×900 stage) |
| **G3** | End-to-end journey | Can a person actually do the task? | Scripted journey: find → open → interact → configure → inspect code → return, recorded as a passing browser script **and** a human read |
| **G4** | Independent verification | Is the claim trustworthy? | Evidence produced by the implementer is reviewed by a different agent or the user, against the item's named acceptance criteria |

A task is never VERIFIED on the strength of G1 alone. Levels are cumulative.

**Tests cannot guarantee artistic quality.** No checklist decides whether a
specimen reads well. What G1–G4 can do is make the *claims* reliable: a reviewer
sees what was measured, on which build, in which browser, with which steps. The
remaining aesthetic judgement stays with the user and must be requested
explicitly at Gate C.

---

## 2. What the current QA system actually covers

Measured from the repository, not from reports:

| Layer | Where | What it asserts |
|---|---|---|
| Unit / component tests | 116 test files across `packages/ui`, `packages/visuals`, `apps/showcase/tests/unit` (14 suites) | adapter determinism, playground wiring both directions, registry integrity, navigation integrity, area integrity, i18n merge |
| Chart verifier | `apps/showcase/scripts/chart-catalog.mjs` | every catalogued symbol exists as a real export; unique ids; no double claims |
| Docs registry check | `scripts/docs-registry.mjs --check` | the generated registry is not stale |
| i18n gate | `scripts/i18n-coverage.mjs` | headers/nav/chrome/long-form keys are translated and no orphan keys exist |
| Package gates | `build:package`, `publint`, `attw`, consumer tree-shaking + isolation | subpath isolation (button-only must not contain a chart engine or provider host string) |
| Route sweep | `qa/routes.mjs` + `qa/run.mjs` | per route: HTTP, axe, console errors, hydration, geometry, screenshots |
| Behaviour groups | `qa/behaviour.mjs` (`html · primitives · data · forms · charts · application · navigation · motion · providers`) | specific DOM/geometry/interaction facts per group |
| Baselines | `qa/baseline` (Playwright snapshots) | pixel diffs on a small committed set |

### 2.1 Where it is strong

- **HTML semantics** (raw server HTML scanned for illegal nesting) and **axe**
  coverage are better than most component libraries.
- **Engine isolation** is a real, enforced invariant (ADR-017/035/036).
- **Registry integrity** is machine-checked in both directions (a catalogued
  symbol must exist; a wired playground must resolve).

### 2.2 Known blind spots (evidence: this audit's own probes)

| Blind spot | Evidence from this audit |
|---|---|
| Route health | Two documented routes returned **HTTP 500** while every current gate would still report "green" if a sweep was not run after the change (CS-01) |
| Product relevance of a route | Eight 200-OK routes are unreachable orphans (CS-03) |
| Document-level anchor correctness | The outline rail listed specimen content and emitted a duplicated mangled id; no gate inspects rail contents (CS-02) |
| Single-page information hierarchy | No assertion bounds "words before the demo" or "demo top offset"; chart pages place the plot 1.5–2 screens down and nothing notices (CS-04) |
| Reachability / link integrity | No gate crawls internal links; orphans and thin links are invisible (CS-03, CS-06) |
| DOM id uniqueness | Duplicate ids on `/visuals/elements` pass axe (CS-05) |
| Control completeness | No gate asserts that *every* workbench has reset/clipboard/viewport controls (CS-07) |
| Journey continuity | Behaviour checks are per-page assertions; nothing walks find→open→configure→code→return |
| Live-vs-fixture honesty | The 500s come from a boundary violation that only appears when the page actually renders server-side — a static or fixture-only check can miss it |

**Interpretation of history (INFERRED, not proven):** the repeated
"tests pass but the product is broken" loop is consistent with a suite that
asserts *implementation facts* (a control exists, a registry resolves, a page
returns 200) while the user experiences *journey facts* (the plot is below the
fold, the rail is nonsense, a catalog link 500s, the demo's controls are hidden).
Nothing in the current suite would have failed for any of CS-02, CS-04, CS-06 or
CS-07.

---

## 3. Required coverage per level

| G1 assertions (per route) | G2 assertions | G3 journeys |
|---|---|---|
| HTTP 200 · no console error · hydration marker · every interactive control changes observable state · no navigation on non-link interaction · canonical links only | demo top < 700 px at 1440×900 · no element overflowing its container · no control overlapped by the specimen · body scrollWidth ≤ viewport at 390 px · contrast ≥ 4.5:1 on primary text | 5 scripted journeys (§4) + 1 human read per flagship page |

---

## 4. Browser journey coverage expectations

The following journeys become the standing G3 set (QA-002):

| # | Journey | Steps | Must fail if… |
|---|---|---|---|
| J1 | Component: name → detail → configure → copy | ⌘K "button" → open → change variant/size → read the code panel → copy | a control does not change the specimen or the code |
| J2 | Catalog: family → filter → detail → back | Components → filter a family → open a card → browser back restores the filtered list | the filter resets on back, or the card links somewhere other than its label |
| J3 | Chart: catalog → detail → inspect → return | `/charts/catalog` → open a chart → confirm the plot is in the first viewport → toggle scale → back | the plot is below the fold or the engine fails |
| J4 | Motion: gallery → specimen → interact → replay | `/motion` → open Card Stack → step with the keyboard → replay/pause → back | an interaction does nothing, or the live region disagrees with what is shown |
| J5 | Visuals: overview → element → size/style → usage | `/visuals` → open an element → change size and style → read the usage snippet | a control does not alter the specimen, or the snippet does not match the chosen configuration |
| J6 | Search & language: ⌘K across areas → switch language | search a chart from a component page → open it → switch language → confirm the page keeps its identity | search is area-scoped, or the language switch loses the route |

Each journey records: browser, viewport, steps, and a screenshot set. A journey
that cannot run for an environmental reason is reported as `UNVERIFIED`, never
as passing.

---

## 5. Card Stack verification protocol

Because the user reports Card Stack as broken while the audit could not
reproduce it, this protocol is mandatory for MOT-001 and for any later change to
the component.

1. **Environment record** — browser + version, OS, viewport, device-pixel ratio,
   reduced-motion setting, remote vs local (`127.0.0.1:3000`), and the build
   identity (`docker inspect luc-ui/showcase:1.0.0 --format '{{.Created}}'`).
2. **Reach path** — the exact URL and the steps that lead to the deck.
3. **Intended vs observed**, one line each:
   - next/previous buttons step the deck;
   - ←/→/↑/↓/Home/End step and clamp, with Next/Previous disabled at the ends;
   - a pointer drag ≥ 48 px steps; shorter drags do not;
   - Tab never enters a non-active layer (`inert`);
   - the live region announces `n / count` and matches the visible card;
   - the deck has non-zero height and the controls are not covered by a card;
   - clicking the card body does **not** navigate.
4. **Geometry + DOM evidence** — layer boxes, transforms, z-index, opacity,
   `inert`/`pointer-events`, deck and control bounding boxes (as
   `tools/card-stack-probe.mjs` records).
5. **Reproduction rate** — observed per N attempts, at two viewports.
6. **Subsystem attribution** — component, showcase wrapper, navigation, or
   unknown. Do not guess; "unknown" is an acceptable and useful result.
7. **Artifact** — screenshot(s) and, where animation is implicated, a trace
   stored under the ignored evidence root.

An environment where it already passed is not evidence that it passes for the
user; the negative result must always carry the environment list.

---

## 6. Navigation interaction protocol

Run this whenever navigation, the outline, breadcrumbs, catalogs or the header
change:

1. For a sample of ≥ 10 routes across all areas: record the header's
   `aria-current`, the sidebar's group list and item labels, the breadcrumb
   trail, and every right-rail entry **with the id it targets**.
2. Assert: exactly one `aria-current` in the header; the sidebar contains no
   same-page anchor; every rail target id exists exactly once in the document;
   no rail label is derived from specimen content.
3. Click every rail entry and assert the page scrolls and the heading text
   matches the label.
4. Click 3 points inside the demo region of 5 detail pages and assert no
   navigation.
5. Crawl internal links and assert: no documented route has zero inbound links
   unless it is on the recorded retirement list.

---

## 7. Release/acceptance criteria

A batch is acceptable when:

- `pnpm verify` exits 0 (typecheck, lint, unit, i18n, chart catalog, docs
  registry, package registry, package verification);
- the route-health gate passes with no `known-broken` entries outside the
  recorded list;
- the G3 journey set passes and its screenshots are attached;
- G2 measurements for touched routes are attached (demo position, overflow,
  scroll width);
- the change log in `04_ACTION_PLAN.md` has an entry per item with from→to
  status;
- every touched item's acceptance criteria are listed with the evidence that
  satisfies them;
- no item was marked VERIFIED by the agent that implemented it.

---

## 8. Evidence conventions

- **Path:** raw evidence lives only under
  `luc-ui/artifacts/screenshots/showcase-transformation/**` (gitignored). Never
  commit screenshots or traces.
- **Naming:** `<route-or-id>__<state>.png`; JSON keys are stable English.
- **Always record** the build identity (`docker inspect` timestamp or commit
  SHA), the browser, the viewport, and the date.
- **Measurements over impressions:** "plot top at 1 570 px" beats "the demo
  feels buried".
- **Distinguish** OBSERVED / SOURCE_ONLY / REPORTED / INFERRED / UNVERIFIED in
  every finding, exactly as `01_CURRENT_STATE.md` does.
- **No fixture presented as production behaviour** (ADR-036).
- **Linux headless screenshots are never diffed against Mac-Retina baselines**
  (ADR-036).

---

## 9. Failure reporting conventions

When a check fails, report:

1. the stable item ID it blocks;
2. the environment (build, browser, viewport, date);
3. the smallest reproducible step list;
4. the expected vs observed result;
5. the artifact path;
6. subsystem attribution, or `UNKNOWN`;
7. whether it is a regression (a previously passing G-level now failing) and
   against which evidence.

Failing checks are never silently skipped. A check that cannot run is reported
with the reason and the coverage it leaves unchecked.

---

## 10. How another agent verifies a completed action item

1. Read the item's acceptance criteria in `04_ACTION_PLAN.md`.
2. Re-run the item's verification method yourself — do **not** read only the
   implementer's summary.
3. Compare against the *named* evidence (measurements, screenshots, probe
   output). If the evidence is missing or the criterion is qualitative, ask the
   user rather than granting VERIFIED.
4. Re-run the level-appropriate checks (G1 for a behaviour change, G1+G2 for a
   layout change, G1–G3 for a template/shell change).
5. Append a change-log entry: date, item, your agent id, `IMPLEMENTED →
   VERIFIED`, the evidence path. If it fails, append the failure report from §9
   and leave the status at `IMPLEMENTED`.
