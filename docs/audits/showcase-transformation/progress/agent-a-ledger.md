# Agent A — Showcase Transformation Progress Ledger

Durable checkpoint file for **Agent A** (implementation owner). Append-only.
Never edit an earlier line; add a dated row. Status vocabulary is the action
plan's: `TODO · IN_PROGRESS · IMPLEMENTED · BLOCKED · DEFERRED`.

Agent A owns: global IA, navigation, sidebar, breadcrumbs, page outline/anchors,
Components Showcase, Charts Showcase presentation, Motion Showcase + Motion
component repairs, Card Stack, Workbench architecture/adapters outside Visuals,
global page layouts, Explore + documentation presentation, non-Visuals legacy
cleanup, global Showcase QA.

**Agent B owns (Agent A must not edit):** `luc-ui/packages/visuals/**`,
`apps/showcase/app/visuals/**`, `apps/showcase/components/visuals/**`,
`apps/showcase/lib/visuals/**`.

---

## 0. Environment record

| Item | Value |
|---|---|
| Repo | `luc-quant`, cwd `/Users/luc/Documents/luc/luc-quant` |
| Starting revision | `83aae8d01a5d25a572d7cf2d1f2dfb2dbf55ba32` (`codex 43`, branch `main`) |
| Working tree at start | clean (0 changes) |
| Working tree during work | **shared with a live Agent B** — `packages/visuals/**` and `app/lib/components/visuals/**` change underneath Agent A (first seen 2026-10-11 18:04 local) |
| Node / pnpm | `node v24.3.0` (engines `>=22`, ok) · `pnpm 12.6.0` (matches `packageManager`) |
| Workspace | pnpm workspace root = repository root; members `luc-ui`, `luc-ui/apps/*`, `luc-ui/packages/*`, `luc-web` |
| Backend needed | **none** — confirmed by `06_LOCAL_DEVELOPMENT_PLAN.md` and re-observed: no `fetch(`, no Redis/ClickHouse/API reads in `apps/showcase` |
| Dev server | `cd luc-ui/apps/showcase && pnpm exec next dev --port 3100` → `http://127.0.0.1:3100` |
| Dev log | `/tmp/showcase-dev.log` |

### Transient blocker observed and cleared (18:00–18:05 local)

At the start of the session almost every route returned HTTP 500 with
`Module not found: Can't resolve './artifacts/skins' | './artifacts/studies'`
from `packages/visuals/src/index.ts` (and `../artifacts/render` from
`packages/visuals/src/react/index.ts`), because commit `83aae8d0` added those
export lines while the three modules themselves were untracked and had been
lost. **A live Agent B re-created `packages/visuals/src/artifacts/{studies,skins,render}`
at 18:04–18:05**, after which `/docs`, `/explore`, `/components/*` and
`/visuals/*` returned 200 again. Agent A did **not** touch `packages/visuals`.

### Commands that work (recorded per `06_LOCAL_DEVELOPMENT_PLAN.md` §9 / DEV-001)

```bash
# start (loopback, dedicated port so Agent B's work cannot collide)
cd luc-ui/apps/showcase && pnpm exec next dev --port 3100

# route health
curl -s -o /dev/null -w '%{http_code} %{url_effective}\n' http://127.0.0.1:3100/<route>

# library + showcase gates (run from luc-ui/)
cd luc-ui && pnpm verify
```

---

## 1. Item ledger

| Date (local) | Item | Status | Evidence |
|---|---|---|---|
| 2026-10-11 | (env) | DONE | local dev server on :3100; 326-route set reachable; recorded above |
| 2026-10-11 | CMP-001 | IMPLEMENTED / SELF_TESTED | both routes 200 + real specimen markup (see §2) |
| 2026-10-11 | IA-001 | IMPLEMENTED / SELF_TESTED | `qa/outline.mjs` PASS on 9 routes — every row targets a unique, page-owned id (see §3); row-count reduction on catalog/docs pages is UX-004 / DOC-002 |
| 2026-10-11 | QA-001 | IMPLEMENTED / SELF_TESTED | `qa/route-health.mjs` — 326/326 documented routes healthy in 24.9 s at 2 workers (§4) |
| 2026-10-11 | UX-004 (motion) | IMPLEMENTED / SELF_TESTED | `/motion` rail 32 → 6 rows; `data-outline-ignore` contract (§3) |
| 2026-10-11 | MOT-001 | IMPLEMENTED / SELF_TESTED | reproduced-*nothing*: full protocol passes at 2 viewports; recorded negative (§5) |
| 2026-10-11 | MOT-003 (partial) | IMPLEMENTED / SELF_TESTED | Card Stack now starts at index 0, live region "1 / 3" (§5). Replay/pause still TODO |
| 2026-10-11 | UX-001 | IMPLEMENTED / SELF_TESTED (pre-existing) | measured: plot top 395 px, 32–39 words before it, on 10 chart routes (§6) |
| 2026-10-11 | WB-001 | IMPLEMENTED / SELF_TESTED (pre-existing) | `qa/playground.mjs` PASS on 5 pages: control → code change → Reset restores (§7) |
| 2026-10-11 | WB-002 | IMPLEMENTED (pre-existing) | the shell already ships Full/384/320 preview widths (§7) |
| 2026-10-11 | DOC-001 (partial) | IMPLEMENTED / SELF_TESTED | 7 phase labels removed from Motion pages + dictionary; `/visuals` banner delegated to B (§8) |
| 2026-10-11 | DEV-001 (partial) | IMPLEMENTED / SELF_TESTED | local Docker preview shipped and documented (§11); `next dev` hydration still broken (§10) |
| 2026-10-11 | DISC-01 (new) | IMPLEMENTED / SELF_TESTED | `/date-time/time` hydration mismatch found in the container, fixed and re-verified (§12) |
| 2026-10-11 | CHT-001 | IMPLEMENTED / SELF_TESTED | plot top 395 px on 10 chart routes (§6); chart catalogue verified |
| 2026-10-11 | UX-002 | IMPLEMENTED / SELF_TESTED | chart lead rewritten job-first; `summary-budget.test.ts` asserts ≤ 25 words + no self-class opener (§13) |
| 2026-10-11 | IA-001 (closed) | IMPLEMENTED / SELF_TESTED | `<article>` + top-level-section rules; **227-route sweep, 0 failures** (§16) |
| 2026-10-11 | UX-004 (both halves) | IMPLEMENTED / SELF_TESTED | `/visuals/elements` rail 73 → 10, `/motion/spatial` 25 → 8, `/components` rail suppressed as a sidebar duplicate (§16) |
| 2026-10-11 | DEV-001 | IMPLEMENTED / SELF_TESTED | **root cause found and fixed** — HMR upgrade refused for `Origin: 127.0.0.1`; `allowedDevOrigins` added; `qa/dev-hmr.mjs` gates it (§15) |
| 2026-10-11 | QA-005 (proposed) | TODO | new ID requested for `DISC-01`; the fix is in `date-time/time` (§12) |
| 2026-10-11 | WB-003 | IMPLEMENTED / SELF_TESTED | control bands + derived preset row + collapsed advanced band in every adapter; `qa/playground.mjs` asserts presets/advanced, 6 new unit cases (§18) |
| 2026-10-11 | WB-004 | IMPLEMENTED / SELF_TESTED | `disabledWhen` + `list.minSelected`; 3 chart and 2 card controls inert *with a reason*; probe proves 0 silent disabled controls (§18) |
| 2026-10-11 | UX-005 | IMPLEMENTED / SELF_TESTED | related-link row + previous/next on every registry entry page; `qa/navigation.mjs` 7/7 (§19) |
| 2026-10-11 | CHT-002 | IMPLEMENTED / SELF_TESTED | every catalogue row addressable at its registry id; deep link verified (§19) |
| 2026-10-11 | WB-005 | IMPLEMENTED / SELF_TESTED | sticky presentation follows the reader across sibling specimens, incl. a full page load; `__stageTheme`/`__stageWidth` too (§19) |
| 2026-10-11 | DEV-002 | IMPLEMENTED / SELF_TESTED | `qa/standalone.mjs`: 358 files, 0 product imports, 0 requests, 0 deployment vars; deliberate-failure shown (§19) |
| 2026-10-11 | DEV-003 | IMPLEMENTED | the fixtures-boundary rule written into `06_LOCAL_DEVELOPMENT_PLAN.md` §11 (§19) |
| 2026-10-11 | QA-005 | IMPLEMENTED / SELF_TESTED | new id assigned for `DISC-01`; item text added to the action plan's addendum (§12) |
| 2026-10-12 | i18n extractor | IMPLEMENTED / SELF_TESTED | `isCodeString` — an import statement in an array is not prose; **`pnpm verify:i18n` now passes** (§20) |
| 2026-10-12 | locale routing | IMPLEMENTED / SELF_TESTED | 104 unprefixed links → **6 routes left, all Agent B's**; new `qa/locale.mjs` incl. a 326-route `/zh` sweep (§20) |
| 2026-10-12 | IA-005 | IMPLEMENTED / SELF_TESTED | Motion promoted to primary; header = Components · Charts · Visuals · Motion + More; fits at 1024/1280/1440/390 (§20) |
| 2026-10-12 | MOT-004 | IMPLEMENTED / SELF_TESTED | all **26** motion gallery tiles render the real component (§20) |
| 2026-10-12 | MOT-003 (complete) | IMPLEMENTED / SELF_TESTED | page Replay remounts timed specimens; header reduced-motion control proven to flatten motion (§20) |
| 2026-10-12 | MOT-002 | TODO | per-example preview/code on the 8 motion detail pages — not started (§21) |

---

### §20 — Phase 2 session (2026-10-12): i18n, locale routing, Motion, IA-005

**Baseline.** HEAD unchanged at `83aae8d0`; the tree carries both agents' work.
Agent B was still writing `packages/visuals/**` at 23:50 the night before (its
element contract count in source is ~92 while the running catalogue reports 79,
so its expansion is mid-flight). The preview was rebuilt three times from a
clean read of the shared tree; no Agent B file was touched.

**1. `pnpm verify:i18n` is green.** The gate failed with "338 missing
sentences" — 2 × 169 routes. The 2 were the import lines of a usage snippet in
`components/visuals/element-detail.tsx`, collected by the extractor's
array-literal rule ("any literal of two or more words is prose"), which is right
for `{["Tooltips — markup, typography, …"]}` and wrong for a code sample. The
fix is in the extractor, not in the dictionary: `isCodeString()` rejects a string
that *starts* as a module statement (`import`/`export`, single- or multi-line) or
a JSX/HTML tag, and the rule now skips those. A sentence that merely mentions
importing stays prose.

Nine regression fixtures (`tests/unit/i18n-prose.test.ts`) pin both directions:
the two snippet shapes, a collapsed JSX line, "Import the stylesheet once at the
app root." (still prose), an array of real prose, a `description` property, a
`tcs()` sentence, and a `description` that is really an import. No fake Chinese
translation was added and no Visuals file was edited.

Result: `prose sentences 90133/90133 (100%)`, `page bodies 169/173`, exit 0.

**2. `qa/locale.mjs` — the browser-only `/zh` defect, reproduced and fixed.**
The reported symptom ("browser-only redirect loop, `curl` returns 200") has a
specific mechanism: Next prefetches a `<Link>` as soon as it is in the viewport,
and an *unprefixed* internal link on a Chinese page receives the middleware's
307 into `/zh/...`, which the client router caches and replays on click. `curl`
follows one redirect and sees a correct page.

The gate drives a real browser: fresh context in each language, `/` → `/zh`,
direct deep links, reload, back/forward, and the language switch in both
directions — counting redirect hops and repeated requests. `--all` then loads
**every documented route under `/zh`** (326: the QA route policy plus the
registry) and asserts that no internal link is unprefixed.

First full run: **10 routes, 353 unprefixed links.** Fixed on the Agent A side:
`getServerCopy()` now returns `href()` (making the correct link the shortest
thing to write), threaded through `DocEntryPage`, `DocFamilyPage`, the related
and previous/next footers, the home sections, `/components`, `/charts`,
`/explore` (+ its explorer), `/docs`, `/docs/reference`, `/docs/theming`,
`/foundations`, `/experiences` (`ExperienceCard` — where the prop `href` shadowed
the localizer), `/blocks` (`BlockSpec.render(href)`), the application shell demo,
the design-lab and research-workspace pages, and the specimen fixtures
(`LocalLink` for the Link demo; two fixtures moved to plausible fictional
external targets, because a *profile* link and a *publication* link should not
point inside this Showcase).

Result: **6 routes, 104 links — every one of them Agent B's `/visuals/**`** (see
the handoff below). Zero redirect chains longer than one hop anywhere.

**3. IA-005 — Motion is a primary destination (OPEN-02).** `tier: "primary"`, and
`NAV_AREAS` reordered to the approved sequence. The header is now
**Components · Charts · Visuals · Motion** with Explore, Blocks, Studios and Docs
behind More; a unit case pins the four primary ids and the four secondary ids.

The first browser run of the new header check found a real defect the plan
predicted: at **1024px** the fourth primary was clipped (426px needed, 274px
available). The budget was the reviewer's motion control (139px) plus five
disclosure chevrons (24px each). Both are now `xl`-only: below 1280px the
sidebar and the More menu already cover what the chevron panel offered, and the
row fits; from 1280px up everything returns. `qa/navigation.mjs` asserts
visibility, order, no overflow, no clipping and no horizontal document scroll at
**1024 / 1280 / 1440 / 390**.

**4. MOT-004 — every gallery tile shows the component.** `/motion` had 26 tiles
and 5 specimens. It now has 26 of 26: nine inline wrappers
(ParallaxScene/ParallaxLayer, OrbitField, BeamFlow, MagnifyDock, Marquee,
Magnetic, TiltSurface, GlareSurface, BorderTrail, TextReveal) and five stateful
islands in `components/demo/islands/motion-tiles.tsx` (SelectionBeam links two
live elements by ref; ClickBurst, IconMorph, DataChangeFlash, Collapse,
ExpandableSurface, CardStack, KineticHeadline and MorphingDialog are *changes of
state*, and a still frame of those is a picture of nothing).

**5. MOT-003 — replay and reduced motion.** `Replay the specimens` remounts the
timed specimens (one control for the page, not 26), and the reduced-motion path
is the header's existing `Motion auto · Reduced` control writing `data-motion`
on `<html>` — the same attribute `useReducedMotion()` reads. `qa/motion.mjs`
asserts the remount by **node identity** (the element that was on screen is
disconnected after the click), and asserts that the marquee's own transform stops
changing while reduced motion is set and moves again under default motion.

**Gate results on the final build (`127.0.0.1:55153` unless noted)**

| Gate | Result |
|---|---|
| `qa/route-health.mjs` | **326/326 healthy** |
| `qa/outline.mjs --all --max-rows=12` | 326 routes, 0 failures |
| `qa/navigation.mjs` | 9/9 — UX-005 ×7, WB-005, CHT-002, **IA-005 header** |
| `qa/motion.mjs` | PASS — 26 tiles, replay, reduced motion |
| `qa/preview-check.mjs` | 6/6 |
| `qa/playground.mjs` | 5/5, 0 silent disabled controls |
| `qa/standalone.mjs` | 0 product imports, 0 requests, 0 deployment vars |
| `qa/locale.mjs --all` | 320/326 clean; **6 = Agent B's `/visuals/**`** |
| `pnpm verify:i18n` | **PASS** (90133/90133) |
| typecheck / lint | 0 / 0 |
| `pnpm --filter @luc/ui test:showcase` | **142/142** (16 files) |

**Handoff to Agent B — six `/zh` routes hand out unprefixed links**

| Route | Links | Where |
|---|---|---|
| `/visuals/elements` | 81 | element cards → `/visuals/elements/<id>` |
| `/visuals` | 9 | featured elements |
| `/visuals/docs` | 5 | the five resource pages |
| `/visuals/styles` | 4 | element examples |
| `/visuals/compositions` | 1 | `/visuals/artifacts` |

Requested behaviour: use the localizer for every internal anchor
(`useI18n().href` in a client component, `getServerCopy().href` in a server one —
`href("/visuals/elements/" + id)`), leaving any copyable snippet unprefixed.
Acceptance: `LUC_QA_BASE_URL=… node qa/locale.mjs --all` reports 0 offenders, and
`/zh/visuals/elements` mentions no `href="/visuals…"`.

### §19 — UX-005, CHT-002, WB-005, DEV-002, DEV-003

**UX-005 — detail footers.** `RelatedEntries` existed but rendered nothing on
almost every page, because it only used an entry's *declared* `related` list and
most entries declare none. It now resolves its row from, in order: declared
relations; the family's own peers (`familyPeers`, which cannot invent a
relationship); and finally the reading-order previous/next, which is how
`/components/typography` — the only entry in its family — still gets a row. The
result is 2–4 canonical links, rendered as `nav[aria-label="Related pages"]`
rather than a paragraph of links. Previous/next was already present and correct.

**Gap recorded:** the five richest *hand-written* component pages
(`/components/{buttons,inputs,cards,ai,slider}`) and the hand-written motion and
foundations pages do not go through `DocEntryPage`, so they still have no
Related/pager footer. That belongs with **UX-003** (which restructures those same
pages); doing it twice would be wasted work.

**CHT-002 — addressable catalogue rows.** Every card in `/charts/catalog` now
carries `id={entry.id}` (the registry's own id — already unique on the page and
already the key the catalogue script resolves against `@luc/ui/charts`) with
`scroll-mt-24`, and the row's name is a link to it with an accessible name. 80
ids, no collision with the nine group ids (`scroll-mt` keeps the sticky header
off the row).

**WB-005 — the reader's presentation follows them.** Two mechanisms:

- `sticky` controls (`line-chart` height/legend/animation/state, `violin-chart`
  height/state, `button`/`input` size) are remembered by name and layered onto a
  sibling spec that declares the same name. The remembered set is
  `sessionStorage`-backed, so it survives a full page load (a shared deep link),
  not only a client-side navigation.
- the stage theme and preview width are remembered the same way.

Three details that make it safe rather than surprising:

1. a remembered value fills only a control **the reader has not touched on this
   page** — the reducer tracks `touched`, so memory is a default, never an
   override of a value just chosen;
2. the store's *server* snapshot is always empty and the values are read during
   render, so hydration still matches the server byte for byte (an effect that
   called `setState` would both flash and break the repo's
   `react-hooks/set-state-in-effect` rule);
3. Reset clears the memory as well as the page, because "reset to defaults"
   should mean the *next* page is at its defaults too.

Nothing goes into the URL: a Playground configuration stays a scratch pad
(`ADR-011` governs the values that are worth sharing, and a slider in the address
bar would make every drag a history entry).

**DEV-002 / DEV-003.** `qa/standalone.mjs` scans 358 source files under `app/`,
`components/` and `lib/` and found **0 product imports, 0 network calls, 0
deployment variables**; a scratch file importing `luc-api` made it exit 1 and
name the file, so a green run is evidence rather than a vacuous pass. The
fixtures-boundary rule and the gate commands are written into
`06_LOCAL_DEVELOPMENT_PLAN.md` §11.

**Gate results on the rebuilt image** (Compose project `luc-ui-local`, container
`luc-ui-showcase-local`, port re-read from Docker each time):

| Gate | Result |
|---|---|
| `qa/route-health.mjs` | **326/326 healthy**, 38.1 s |
| `qa/outline.mjs --all --max-rows=12` | all pass (227 registry routes) |
| `qa/playground.mjs` | 5/5, presets/advanced/disabled all asserted |
| `qa/navigation.mjs` | 9/9 (UX-005 ×7, WB-005, CHT-002) |
| `qa/preview-check.mjs` | 6/6 |
| `qa/standalone.mjs` | clean |
| `pnpm --filter @luc/showcase typecheck` / `lint` | 0 / 0 |
| `pnpm --filter @luc/ui test:showcase` | **132/132** |
| `pnpm verify:i18n` | still red: the same **2** sentences in Agent B's `components/visuals/element-detail.tsx` counted per route (338 = 2 × 169); all Agent A sentences are translated |

### §18 — WB-003 / WB-004: the Workbench panel

**WB-003 (§6.1, §6.2 rule 6).** The panel is now three bands instead of one flat
list, and the preset row is *derived* rather than typed:

- `ControlGroup = essential | variant | advanced`, defaulting to `essential` so
  a new adapter cannot accidentally hide a control;
- the `advanced` band renders inside a `<details data-slot="playground-advanced">`
  that is **closed** by default;
- `PlaygroundSpec.presetSource` names the control whose own option list *is* the
  preset row. The presets are read from `control.options` at render time, so
  adding a variant to a component adds its preset with no second list to forget
  (the audit's "derived from the existing variant list, not hand-typed");
- pressing a preset resets everything else to defaults — a preset is a starting
  point, not a patch — and the pressed button is `aria-pressed` only while the
  panel is *exactly* in that state.
- the preview-width control now offers the spec's three sizes (Full / 768 / 390)
  and still labels them in pixels, because it is a container width and ADR-018
  forbids claiming a browsing context.

All 8 adapters declare a preset source and at least one control in a non-essential
band (`button`, `card`, `input`, `line-chart`, `violin-chart`, `chat-message`,
`kinetic-headline`, `profile-hero`).

**WB-004 (§6.2 rule 7).** Two mechanisms, both rendering one sentence next to the
control instead of failing silently:

- `disabledWhen: { when, reason }` — the control is inert in that state and the
  reason replaces its help text;
- `list.minSelected` — the last checked box locks, because a chart with no series
  is not a chart.

Real instances: `line-chart.legend` and `line-chart.tooltip` are inert while
`state !== "ready"` ("The chart draws state chrome instead of a plot, so there
are no series to switch."), `line-chart.visibleSeries` keeps one series,
`card.selected` is inert unless `interaction` is `selectable`.

**Evidence.** `LUC_QA_BASE_URL=… node qa/playground.mjs` on the rebuilt image:

```
PASS /components/buttons  control=combobox:Variant codeChanged=true reset=true presets=6 advanced=1 disabled=0 silent=0
PASS /components/inputs   control=combobox:Size    codeChanged=true reset=true presets=3 advanced=1 disabled=0 silent=0
PASS /components/cards    control=combobox:Variant codeChanged=true reset=true presets=4 advanced=1 disabled=2 silent=0
PASS /charts/line-chart   control=combobox:State   codeChanged=true reset=true presets=4 advanced=1 disabled=3 silent=0
PASS /motion/kinetic      control=combobox:Mode    codeChanged=true reset=true presets=2 advanced=1 disabled=0 silent=0
```

`disabled=N` is reported beside `silent=0` on purpose: "no disabled control was
silent" is only evidence if there were disabled controls to check. Screenshots of
each panel *in the state the assertions ran in* (preset applied) are written to
`artifacts/screenshots/showcase-transformation/playground-*.png`.

Unit cases (6 new, `tests/unit/playground-engine.test.ts`): every band is valid;
every adapter derives ≥2 presets from a control it declares; a preset applies
exactly its declared values; a non-preset state is never reported as active; the
essential+variant+advanced split loses no control and leaves something visible;
every declared reason is a ≥30-character sentence; no adapter ships every control
disabled; a `minSelected` is satisfiable by its own default.

`pnpm --filter @luc/showcase typecheck` 0 · `lint` 0 · `test:showcase`
**129 passed** (1 failure is Agent B's `tests/unit/visuals-catalog.test.tsx`, and
its failing case name changed between two runs while this session was working —
that file is being edited concurrently).

## 2. Evidence detail (continued)

### §15 — DEV-001: `next dev` did not hydrate (root cause + fix)

**Symptom.** With `PORT=3300 pnpm dev`, `http://127.0.0.1:3300/` served HTTP 200
with full server HTML, React's dev bundle evaluated (DevTools banner printed),
there was **no page error and no failed script request**, and
`document.documentElement.dataset.lucHydrated` stayed `null` — so no control
responded. The only console output was six identical
`ws://127.0.0.1:3300/_next/hmr … ERR_INVALID_HTTP_RESPONSE` errors.

**Isolation.** A raw socket probe sent the same upgrade twice, differing only in
the `Origin` header:

| Request | Server response |
|---|---|
| no `Origin` (what `curl` sends) | `HTTP/1.1 101 Switching Protocols` + `turbopack-connected` |
| `Origin: http://localhost:3300` | `HTTP/1.1 101 Switching Protocols` |
| `Origin: http://127.0.0.1:3300` (what the browser sends) | body `"Unauthorized"` with **no HTTP status line** |

A bare body is unparseable as HTTP, which is precisely
`net::ERR_INVALID_HTTP_RESPONSE`. The dev server's own log states the policy:

```
⚠ Blocked cross-origin request to Next.js dev resource /_next/hmr from "127.0.0.1".
  Cross-origin access to Next.js dev resources is blocked by default for safety.
```

**Mechanism.** Next's dev client defers `hydrateRoot` until the HMR socket
connects (it needs the session's build hash so it cannot hydrate a stale tree).
The socket is refused, so hydration never starts. The production server has no HMR
socket, which is why `next build && next start` — and the Docker preview — hydrated
throughout, and why every production-build measurement missed this.

**Fix.** `apps/showcase/next.config.ts` declares
`allowedDevOrigins: ["127.0.0.1", "[::1]", "localhost"]`. (Also explains why
`middleware.ts` was a red herring: its matcher already excludes `_next/`.)

**Verification.** After the fix, same origin `http://127.0.0.1:3300`:

```
PASS websocket upgrade with Origin: http://127.0.0.1:3300
PASS http://127.0.0.1:3300/components/native-select hydrated (HMR errors: 0)
dev server hydrates at http://127.0.0.1:3300 — DEV-001 stays fixed.
```

plus `qa/preview-check.mjs` against the dev server: **6/6 surfaces OK** with real
interactions. `next start`/Docker were never affected. Gate: `pnpm qa:dev`
(`qa/dev-hmr.mjs`); write-up: `docs/DEV_MODE.md`.

### §16 — IA-001 closed; UX-004 completed (both halves)

Two more rules in `components/docs/page-outline.tsx`, on top of the three from §3:

4. **a card is not a section** — `<article>` is excluded, because the catalogue
   cards are `<article>` and their `h3` is the *name of the thing in the card*
   (63 of them on `/visuals/elements`);
5. **the rail is top-level sections** — `h2` is the section level and `h3` is a
   sub-heading, used for the rail only when a page has fewer than two `h2`s. That
   removes `#popover-props`-style rows (a 17-row rail on `/components/button-group`
   is now 7) and the captions inside `/motion/spatial`'s demos.

Plus `data-outline-ignore` on the `/components` family list: that page is the
catalogue, its 13 `h2` families are exactly the 13 rows the sidebar already
lists, and the design spec forbids a repeated navigation list.

**Full sweep** — `LUC_QA_BASE_URL=… node qa/outline.mjs --all --max-rows=12`:
**227 routes, 0 failures** (duplicate labels, specimen-owned rows, unresolvable
ids and over-budget rails all clean). Row counts: `/visuals/elements` 73 → 10,
`/motion/spatial` 25 → 8, `/components/popover` 15 → 7, `/blocks` 30 → 6,
`/integrations/tradingview/*` duplicates gone, zero routes left without a rail
that had one.

**New gates shipped with this batch**

| Script | What it proves |
|---|---|
| `qa/preview-check.mjs` (`pnpm qa:preview`) | 6 key surfaces: HTTP 200 + hydration + one real interaction each, with console capture |
| `qa/dev-hmr.mjs` (`pnpm qa:dev`) | the DEV-001 regression: raw upgrade with the loopback-IP `Origin` must return `101`, and the browser must hydrate |
| `qa/outline.mjs --all` | every registry route's rail: unique rows, page-owned targets, ≤ `--max-rows` rows |

### §17 — Local Docker preview re-verified after the batch

Image rebuilt from the current tree (both agents' latest stable files). Actual
assigned port read back from Docker — never assumed:

```
$ docker port luc-ui-showcase-local 3000
127.0.0.1:63408
```

**Container name** `luc-ui-showcase-local` · **Compose project** `luc-ui-local` ·
network `luc-ui-local_default` · image `luc-ui/showcase:1.0.0` · loopback only.

```
PASS /components/native-select  select us-large → us-small
PASS /components/project-showcase  tile click handled in page (no navigation)
PASS /charts/line-chart  control → code panel changed
PASS /motion/card-stack  card stack 1 / 3 → 2 / 3
PASS /visuals/elements  60 specimen host(s) rendered
PASS /visuals/styles  static reference renders (1053 words)
preview check: 6/6 surfaces OK against http://127.0.0.1:63408
```

Zero console errors on all six. Screenshots:
`artifacts/screenshots/showcase-transformation/preview-*.png`.

**Port/host pre-flight (re-run this session, nothing assumed):** Docker Desktop
28.1.1 running; `3001`/`3002`/`4200` held by `io.coress`, `3124` by an orphaned
`next-server` in this app's directory, `5000`/`7000` by macOS ControlCenter —
**none of them touched**; 3000/3100/3101/3200/3201 free; the preview publishes an
ephemeral loopback port so it cannot collide with any of them.

**One environment note for a human reviewer:** the orphaned `next-server` on
`:3124` (pid 20780, started 22:09, parent pid 1, cwd `apps/showcase`) is not
documented anywhere and is **not** part of Agent A's preview; it was left running
because it may belong to Agent B's verification loop. If nobody claims it, it can
be stopped — until then, don't assume `:3124` is the preview URL.

## 2. Evidence detail

### CMP-001 — two documented component pages returned HTTP 500

Root causes (both confirmed from the server log at HEAD):

1. `/components/native-select` — `packages/ui/src/components/native-select.tsx`
   calls the client hook `useField()` but carried **no `"use client"` directive**,
   unlike every sibling (`input.tsx`, `textarea.tsx`, `select.tsx`,
   `checkbox.tsx`, `field.tsx`). React therefore executed it on the server:
   `Attempted to call useField() from the server but useField is on the client`.
   Fix: added the missing `"use client"` directive (one line, non-breaking — the
   component is unusable without it).
2. `/components/project-showcase` — the demo in
   `lib/demo/components/experiences.tsx` is a **server** module but passed
   `renderDetail={(project) => …}` to the client component `ProjectShowcase`:
   `Functions cannot be passed directly to Client Components`. Fix: moved the
   specimen into a client island
   (`components/demo/islands/experience-demo.tsx`) following the existing
   `components/demo/islands/**` pattern; the hand-written `code` snippet is
   unchanged.

Verification (dev server on :3100):

```
200  /components/native-select      -> data-slot="native-select", option "US large cap" present
200  /components/project-showcase   -> data-slot="project-showcase", "LUC UI" + "Tape reader" present
```

Files changed: `luc-ui/packages/ui/src/components/native-select.tsx`,
`luc-ui/apps/showcase/lib/demo/components/experiences.tsx`,
`luc-ui/apps/showcase/components/demo/islands/experience-demo.tsx` (new).

Still to do for VERIFIED: browser console-error + axe pass, screenshots,
route-health gate (QA-001).

### §3 — IA-001, the page outline

`components/docs/page-outline.tsx` was rewritten around three rules:

1. a **specimen subtree is never a source of sections** — anything inside
   `[data-slot="demo" | "demo-stage" | "playground" | "playground-stage" |
   "card-stack" | "chart"]`, `figure`, `canvas` or `[aria-hidden="true"]` is
   skipped;
2. a subtree marked **`data-outline-ignore`** is a catalogue grid, not a table of
   contents (used by `/motion`'s card grid);
3. an anchor must **resolve to exactly one element** — a declared
   `data-anchor-id`/`id` is kept, anything else gets a deterministic slug that is
   checked against the whole document (not just the other rows).

A latent bug found while implementing this: `HTMLElement.id` is `""`, not
`null`, when absent, so `dataset.anchorId ?? heading.id` never fell back — the
first anonymous heading took the empty id and every later one was suffixed
`-2`, `-3`, … — which is the mechanism behind the mangled
`#built-for-dense-interfacesbuilt-for-dense-interfaces` anchor the audit found.

Evidence — `LUC_QA_BASE_URL=http://127.0.0.1:3100 node qa/outline.mjs`
(`artifacts/screenshots/showcase-transformation/outline-probe.json`):

| Route | Rows | Every row's target | Notes |
|---|---|---|---|
| `/components/accordion` | 4 | unique + label-matching | was 11 (7 specimen rows) |
| `/components/native-select` | 11 | ok | |
| `/components/buttons` | 9 | ok | |
| `/motion/spatial` | 25 | ok | hand-written control board; 25 real sections |
| `/motion` | 6 | ok | was 32 (catalogue grid) → UX-004 |
| `/charts/line-chart` | 11 | ok | was 14 |
| `/visuals/elements` | 73 | ok | **Agent B page** — UX-004 row-count reduction delegated |
| `/docs/reference` | 31 | ok | split is DOC-002 |
| `/foundations/colors` | 6 | ok | demo-internal "Accent in context" correctly excluded |

### §4 — QA-001, the route-health gate

`apps/showcase/qa/route-health.mjs`, wired as `pnpm --filter @luc/showcase qa:health`.
Route set = the QA coverage policy + every non-reference route in
`lib/docs/generated/registry.ts` (326 routes). Each route is asserted for
HTTP 200, the hydration marker, and zero console/page errors. A route may only be
excused by a `KNOWN_BROKEN` entry that names the owning action item; the map is
empty because CMP-001 removed its only two members.

```
route health: 326 routes, 24.9s, 2 worker(s)
All 326 documented routes are healthy.
```

Before CMP-001 the same set contained two HTTP 500 routes
(`/components/native-select`, `/components/project-showcase`) and the server log
carried the boundary errors quoted in `01_CURRENT_STATE.md` §4.3 — i.e. the gate
would have failed. A deliberate-failure demonstration (break one control and show
it failing) is left for the independent pass.

### §5 — MOT-001 / MOT-003, Card Stack

`apps/showcase/qa/card-stack.mjs` implements `05_QUALITY_GATE.md` §5. It records
the environment (chromium 1.63.0, darwin, 1440×900 and 390×844), the rail
geometry, and intended-vs-observed for: initial index and live region, deck box,
the hit test under each control, `inert` on hidden layers, Next/Previous stepping
and clamping, card-body click not navigating, Home/End/ArrowLeft, a short drag
not stepping vs a ≥48 px drag stepping, twelve rapid key repeats, return
navigation, and console errors.

Result: **all four runs pass** (`/motion/card-stack` and `/motion/spatial`, at both
viewports). The user's reported failure is **not reproduced** on this build; the
environments and steps attempted are the ones above, per the protocol's
requirement that a negative result carries its environment list.

One real defect was found and fixed on the way: the Card Stack demo passed
`defaultIndex={1}`, so the deck announced "2 / 3" before any interaction
(MOT-003). The deck now starts at index 0 and announces "1 / 3".

### §6 — UX-001, the chart plot's position

Already satisfied in the current tree; measured rather than assumed. Ten chart
routes at 1440×900, `data-slot="demo"` as the specimen: top **395 px**,
words before the specimen **32–39** (budget: < 700 px, ≤ 40 words).
Routes: line, violin, area, bar, box-plot, bubble, calendar-heatmap, candlestick,
chord, drawdown. (The audit's 1 570 px / 165 words came from the older Docker
image; the current template puts `Live preview` first.)

### §7 — WB-001 / WB-002

`PlaygroundShell` already renders a labelled `Reset to defaults` (disabled until
the state is dirty) and a `Full / 384 / 320` width control, and both chart and
component boundaries use that one shell. `apps/showcase/qa/playground.mjs` proves
the behaviour on five pages — change a control, the generated code changes, Reset
restores it:

```
PASS /components/buttons  control=combobox:Variant
PASS /components/inputs   control=combobox:Size
PASS /components/cards    control=combobox:Variant
PASS /charts/line-chart   control=combobox:Animation
PASS /motion/kinetic      control=combobox:Mode
```

Open question for WB-002: the width control sets a container width on a `div`,
which is what ADR-018/036 forbid *if it is presented as a viewport*. It is
labelled with pixel widths rather than Breakpoint names, so it does not overclaim;
whether it should become a real nested browsing context is a product decision.

### §8 — DOC-001 (partial)

Removed phase labels from the Motion area (the part Agent A owns):

| Where | Before | After |
|---|---|---|
| `/motion/spatial` eyebrow | `Motion · V3.0` | `Motion` |
| `/motion/spatial` card badge | `V3.0` | badge removed |
| `/motion/spatial` deck label | `Release notes` | `CardStack` |
| `/motion/kinetic` eyebrow | `Motion · V1.2` | `Motion` |
| `/motion/signature` eyebrow | `Motion · V2.0` | `Motion` |
| `/motion` group notes | `V3.0. Depth, …`, `New in V2.0. …` | version prefixes dropped |
| `/motion/kinetic` body | `The V1.1 physical states, now with the V1.2 press spring.` | `The physical states, with the press spring.` |
| `/motion/kinetic` body | `Links keep the V1.1 sweep; …` | `Links keep the sweep; …` |

Both locales updated in `lib/i18n/messages.ts` and `lib/i18n/prose.zh.ts`.

**Delegated to Agent B:** `/visuals/elements` prints
`45 OF 45 CAPABILITIES HAVE A RENDERED PREVIEW ON THIS PAGE.` (DOC-001 row 2) and
the duplicate ids `metrics` / `tables` (IA-002) — both in Agent B's files.

### §9 — Delegated to Agent B (do not touch from here)

| Item | Requested behaviour | Acceptance |
|---|---|---|
| IA-002 | one unique id per family anchor on `/visuals/elements`; chips scroll to the section | duplicate-id query returns empty |
| UX-004 (visuals) | `/visuals/elements` rail ≤ 10 rows (today 73) | rail-length assertion |
| DOC-001 row 2 | remove the all-caps QA assertion banner | grep + screenshot |
| VIS-001…003, IA-004 | unchanged from the action plan | see `04_ACTION_PLAN.md` |

### §10 — Blockers recorded (not Agent A's to resolve)

- **i18n gate red on `/visuals/**`.** `pnpm verify:i18n` fails with 36
  documentation sentences missing zh translations, and every one of them is on an
  Agent B route (`/visuals`, `/visuals/art`, `/visuals/artifacts`,
  `/visuals/compositions`, `/visuals/docs`, `/visuals/elements`,
  `/visuals/skins`, `/visuals/styles`, `/visuals/themes` — 4 each). No `/motion`
  or component route is missing a translation, so this is Agent B's in-flight
  copy, not a regression from DOC-001.
- **`next dev` does not hydrate on this machine.** Verified with Turbopack *and*
  webpack, and with `middleware.ts` removed: the client bundle loads (React logs
  its DevTools banner) but `document.documentElement.dataset.lucHydrated` is never
  set and no control responds; the only console noise is
  `ws://…/_next/hmr … ERR_INVALID_HTTP_RESPONSE`. All browser evidence in this
  ledger therefore comes from a **production build** (`pnpm exec next build` then
  `next start -p 3100`), which hydrates correctly. This is a real DEV-001
  blocker worth a dedicated investigation.

### §11 — Local Docker preview (2026-10-11, later session)

Reuses `luc-ui/Dockerfile` + `luc-ui/docker-compose.yml`; adds only
`luc-ui/docker-compose.local.yml` (container name + `ports: !override` with
`127.0.0.1::3000`). Compose project `luc-ui-local`, container
`luc-ui-showcase-local`, network `luc-ui-local_default`, ephemeral loopback port
read back from `docker port` (never guessed). No volumes, no env files, no
Redis/ClickHouse/Prefect. Documented in `luc-ui/docs/LOCAL_PREVIEW.md` and linked
from `QA_WORKFLOW.md`.

Pre-flight (recorded): Docker Desktop 28.1.1 running; the only containers were
the exited `polymarket_*` set; 3000/3101/3200/3201 free, **3001 held by another
application (`io.coress`) and deliberately untouched**, 3100 held by Agent A's own
`next start`.

**Result against the container:** `/components/native-select`,
`/components/project-showcase`, `/charts/line-chart`, `/motion/card-stack`,
`/visuals/elements`, `/visuals/styles` all **HTTP 200, hydrated, zero console
errors**; real interactions verified (select `us-large → us-small`;
project tile opens its detail without navigating; playground combobox changes the
generated code; Card Stack `0 → 1` with the live region reading `2 / 3`).
`/visuals/styles` exposes no controls at all — it is a static skin reference
(15 links, no button/input/combobox), which is expected for that page rather than
a defect. Full gate re-run on the container: **326/326 documented routes healthy
in 51.3 s**, outline 9/9 PASS, playground 5/5 PASS, Card Stack 4/4 PASS.

### §12 — `DISC-01`: hydration mismatch on `/date-time/time` (new finding)

Caught by `qa/route-health.mjs` the first time it ran against the **container**
(`TZ=UTC`) and not against the host (`Asia/Singapore`):

```
200 /date-time/time  hydrated=true  pageErrors=["Minified React error #418 …"]
```

`app/date-time/time/page.tsx` rendered `getLocalTimeZone()` into the server HTML,
so the server said `UTC` and the browser said `Asia/Singapore` for the same text
node — a text hydration mismatch that appears whenever the server's zone differs
from the reader's, i.e. for the review container and for any hosted deployment.
Fixed by reading the zone after mount and rendering an honest pre-hydration
sentence instead (plus its `prose.zh.ts` translation). Re-verified: 326/326
healthy on the container.

This is a defect the 43-item plan did not list; it is a candidate for a new
action item (proposed ID `QA-005`, keep the ID stable once assigned).

### §13 — UX-002, the entry lead sentence

The lead on 76 chart pages was generated from a template that opened with the
component's own class name:

> `LineChart draws line on the ECharts engine; the values, including any statistic, are prepared by the caller.`

— a sentence about the implementation, with the least useful fact (the engine)
first. `scripts/docs-registry.mjs` now generates a job-first lead:

> `Draws line with the ECharts engine from the values the caller prepares — the renderer computes no statistic of its own.`

20 words, starts from what the reader gets, keeps the engine fact secondary, and
keeps the "computes no statistic" phrase the behaviour suite already asserts on
chart pages (`qa/behaviour.mjs` line ~2610). The registry was regenerated
(`node scripts/docs-registry.mjs`; `--check` reports "up to date").

`tests/unit/summary-budget.test.ts` (new, 4 cases) is the standing assertion:
every `MODULE_SUMMARIES` entry ≤ 25 words, every generated entry summary ≤ 25
words, **no** generated summary opens with its own class name, and every chart
summary still states the caller-prepares contract. Suite: 123/123 pass
(15 files). Live check on the container: the new copy renders on
`/charts/line-chart`.

### §14 — Preview state at hand-off

- Compose project `luc-ui-local`; container `luc-ui-showcase-local`; network
  `luc-ui-local_default`; image `luc-ui/showcase:1.0.0` (built locally).
- **URL: `http://127.0.0.1:57028`** (ephemeral; re-read it with `docker port`
  after every rebuild — it changes).
- Health `healthy`; `lsof` confirms the listener is `127.0.0.1`-only.
- Gate run on this exact image: **326/326 routes healthy** (45.9 s).
- Agent A's own host `next start` on :3100 was stopped so there is exactly one
  preview URL; the other projects' ports (notably **3001**) were never touched.

---

## 2026-10-12 — Phase 3: landing shell, sidebar hierarchy, Build, detail-page endings, motion examples

Starting revision `e5ba49cc` (clean tree). Six work packages in this session; four
commits, each verified in a browser against a restarted dev server and then
against the rebuilt local Docker preview.

| Package | Status | Commit |
|---|---|---|
| NAV-002 — the front door is a landing page | IMPLEMENTED / SELF_TESTED | `7a412590` |
| NAV-003 — sidebar hierarchy and folding | IMPLEMENTED / SELF_TESTED | `7a412590` |
| IA-007 — Build's four subareas | IMPLEMENTED / SELF_TESTED | `7a412590` |
| UX-003 — one ending for every component page | IMPLEMENTED / SELF_TESTED | `d6cbe052` |
| MOT-002 — motion pages show other configurations | IMPLEMENTED / SELF_TESTED | `ee6fea13` |
| DOC-003 — the two sections a reader rarely needs are folded | IMPLEMENTED / SELF_TESTED | `d3a1d4b9` |

### NAV-002 — measured before and after

Before: `/` rendered the same 256px sidebar column as a documentation page, with
"Start here" (4 rows) and "Site map" (8 rows) — a copy of the header. After: no
column at all (`asideVisible: false`, `mainWidth: 1440` of 1440, document overflow
0), the wordmark moved into the topbar, and the drawer on `/` and `/zh` still
carries the way in plus the site map (2 groups). Browser Back from `/docs`
restores the full-width landing. Gate: `qa/navigation.mjs` → "the landing route
has no sidebar (NAV-002)", at 1440px and 390px, both locales.

### NAV-003 — what the numbers say

Group heading: 11px / weight 560 / uppercase / `fg-muted` → 13px / weight 600 /
normal case / `fg-secondary`, over 13px/400 rows indented 8px and separated by a
hairline. `/docs` renders 7 groups (an empty "Data display" heading is gone) and
unfolds exactly one: the one holding the reader. A deep link unfolds its own
group and marks its own row; Enter and Space fold and unfold it without
navigating; a search result is never behind a fold; and a fold the reader made
survives navigating *within* the area. Gate: "the sidebar states its hierarchy
(NAV-003)".

### IA-007 — Build

`/blocks`, `/templates` and `/patterns` all reported the same sidebar
(`Build with it · Experiences · Patterns`) with Blocks current. Each is now an
area with its own prefix under a `Build` parent that has no route: `Build` is the
switcher group on every subarea (`区块 / 模板 / 模式 / 产品范例` in zh), the parent
row is dropped because the switcher names it, and the header's More panel lists
the four destinations instead of one parent link. The home site map skips an area
whose landing another area owns. Gate: "Build's subareas own their navigation
(IA-007)". `lib/docs/generated/*` regenerated; `docs:registry:check` clean.

### UX-003 — measured before and after

First live specimen, desktop 1440×900: `/components/buttons` 1595px → **388**,
`/components/inputs` 1738 → **388**, `/components/cards` 1549 → **388**,
`/components/ai` 1610 → **432**, `/components/slider` 432 → 432 (already fine).
A registry page's own first specimen is at 369px, so the five now read the same.

`EntryFooter` (related + Previous/Next, the registry footer's own DOM contract)
was added to all **34** handwritten component/chart/motion pages that resolve to a
registry entry; the 33 family and collection pages resolve nothing and render
nothing. Verified on 27 routes: related 3–4 links, prev and next present, no
console error, no horizontal overflow.

Two i18n defects found on the way: the registry pager rendered
"Related/Previous/Next" as literals (English pager on Chinese pages, invisible to
the coverage gate), and `localizeNavGroups` asked the prose dictionary for the
Chinese of an already-Chinese string — ~400 false "missing" warnings per Chinese
render. Both fixed; the dev console is now readable.

### MOT-002 — other configurations

A spec can declare up to four named examples, each materialised through the same
`render` and the same printer as the page's own specimen, so a variant's snippet
is the code that produced it. Shipped for `card-stack` (two cards / five cards),
`morphing-dialog` (narrow panel with one fact), `tilt-surface`, `glare-surface`,
`marquee` and `interactive-grid` — 2 examples each, section between the live
preview and the playground. New test in `tests/audit/demo-coverage.test.ts`
(149/149). `qa/card-stack.mjs` was scoped to the page's first deck: three decks
on one page made its click ambiguous, which is a locator fix, not a weakened
assertion.

### DOC-003 — measured, folded, not deleted

Visible words at 1440px: `/charts/line-chart` 1422 → **1213**,
`/components/popover` 1097 → **895**, `/motion/card-stack` 958 → **919**.
"SSR and rendering" and "Copy for an AI agent" are folded behind their own
headings (level, id and outline position unchanged) with one visible sentence
each. Enter opens (895 → 1083) and Space closes; the first attempt made the
heading itself the trigger and was rejected on measurement — `role="button"` on
an `<h2>` does not inherit the browser's Enter/Space activation. `/motion/kinetic`'s
four-sentence lead is one sentence in both languages.

### Evidence and gates (built preview)

- HEAD after the session's commits: `d3a1d4b9`. Everything below was run against
  the rebuilt container, image `luc-ui/showcase:1.0.0`.
- `qa/route-health.mjs` → **326/326** healthy.
- `qa/navigation.mjs` → all 15 blocks PASS (including NAV-001, NAV-002, NAV-003,
  IA-005, IA-007, WP-4, WB-005, CHT-002).
- `qa/preview-check.mjs` → 6/6; `qa/playground.mjs` → 4/4; `qa/card-stack.mjs` →
  4/4 runs; `qa/locale.mjs --all` → 326/326; `qa/outline.mjs --all` → all pass.
- `pnpm verify:i18n` → 100% on all five dictionaries (92,267 prose sentences);
  `docs:registry:check` → clean; `pnpm --filter @luc/ui test:showcase` → 149/149.
- Console and page errors: clean on every route probed in this session.

### Known limits recorded, not hidden

- Two handwritten pages have no install section (the five UX-003 pages document
  families rather than one export; `/docs/installation` is one click away).
- `next dev` keeps a stale **server** module after an edit under `packages/ui/**`
  or `lib/**` and reports it as a hydration failure naming the value you just
  changed. Documented in `docs/DEV_MODE.md` §5b; every measurement above was taken
  against a restarted server.
- `qa/outline.mjs` and `qa/footer-sweep` hit 60s dev-compile timeouts on
  first-visit routes; both pass on the built preview.
- Still open from earlier audits and untouched here: the `axis-time.test.ts`
  engineering debt, and `MOT-002`'s coverage beyond the six entries above.

---

## 2026-10-12 — Phase 4: the P0 chart defect, and the backlog it was hiding behind

Starting revision `fe2e600f` (clean), ending `a651265e` (clean). Six commits. The
headline is that the "pre-existing" chart test failures were a real, user-visible
defect that four phases of green CI had been stepping around.

### §15 — P0: the time axis chose its ticks in a different timezone from its labels

`packages/ui/src/charts/adapters/echarts/axis-time.test.ts` had **29 failing
assertions**, reported since Phase 7 as pre-existing debt. Measured, not accepted:
they were the only thing in the repository measuring the defect.

Root cause, established by reading tick *values* out of the live scale rather than
guessing: the engine aligned time-axis ticks to **local** calendar boundaries while
every label is formatted in **UTC**. On this machine (Asia/Singapore) the February
tick was placed at `2025-01-31T16:00Z`, which the UTC formatter printed as "Jan".
`/charts/quantitative` — the exact Phase 7 fixture page — read:

    Jan | Jan | Feb | Mar | Apr | May      (before)

That is the Phase 7 symptom from a different cause, and it is invisible on a
machine set to UTC, which is how it survived.

Two things were wrong, and both were found by measurement:

1. ECharts 6 takes `useUTC` as a top-level **option**, not an init flag
   (`coord/axisHelper.ts` reads `ecModel.get("useUTC")`). The product passed
   neither. Tried at `init` first — no effect on tick placement — then verified at
   the option level: `Jan | Feb | Mar | Apr | May | May`, month ticks on UTC
   boundaries.
2. The test built its own `echarts.init(...)` with a *different* engine
   configuration from the surface's, which is why the failures read as "the test
   disagrees with the product" instead of "the product is wrong".

Fix: `echart-init.ts` (new) holds `ECHARTS_GLOBAL_OPTION`/`ECHARTS_INIT_OPTIONS`;
`baseOption` carries the option so a server-rendered option is correct on its own;
the surface merges it so the specialised families get it too; the test harness
renders with the shipped constants; `option.test.ts` asserts the flag is on every
built option.

**29 failed / 14 passed → 43/43**, and the whole `@luc/ui` package is now
**936/936** (94 files) — this was the last red suite in the package. Browser
evidence from the surfaces' own published diagnostics, Asia/Singapore:
`/charts/quantitative` → Jan, Feb, Mar, Apr; `/charts/gantt-chart` → Oct 5 … Oct
25; `/charts/line-chart` → weekly `2026-08-17 …`; all unique.

### §16 — MOT-002, UX-003, DOC-003

`MOT-002`: the six entries from Phase 3 are validated in the browser, and four
more carry real configurations — `aurora-surface`, `beam-flow` (including an
`error` state that keeps the path), `magnetic`, `press-ripple`. Ten entries, twelve
extra configurations, each one the shipped component with different props and the
code printed from those props. Nineteen entries are classified as
single-specimen-sufficient (the small feedback primitives, where a second
specimen would be filler) and left alone.

`UX-003`: the last open criterion — installation guidance on the family pages —
is closed by `FamilyImports`, which prints the import lines the page's own
specimens use and points at the real package setup instead of inventing a
per-component install command.

`DOC-003`: the audit's own example of the wrong copy ("Draws line with the ECharts
engine from the values the caller prepares …") was still the lead on 76 pages, and
the contract inside it was restated in Usage and again in the specimen note. Now:
one sentence per chart family about what the reader does with the chart, from a
single map in `lib/docs/lead.ts` that the generator transpiles and calls — the
page, the search result and the AI prompt are one string. The engine and the
contract are stated once, in Usage. `/charts/line-chart` 1213 → 1208 visible words;
the rest of the page is installation commands, the compiler's prop tables and one
line of help per control.

### §17 — DOC-002 and QA-002, the two FAILs with acceptance criteria

`DOC-002`: `/docs/reference` was one 12,787px document with 27 `h3` in the rail.
Split into an index (**118 words**, 1,163px, rail 4 rows, 27 family links) and one
page per family. Nothing lost, and it is *measured*: walking all 27 family pages
yields 225 rows. `qa/routes.mjs` now sweeps this route shape through every family,
so the gate checks it on every run (205 base routes, up from 178).

`QA-002`: there was no journey-level suite at all. `qa/journey.mjs` walks the seven
journeys the action item names, clicking what a person clicks, and asserts what
came back — including the clipboard after a variant's copy, the uniqueness of the
time-axis months (the P0 defect, now covered twice), that every internal link on a
Chinese page stays Chinese, and that each Build subarea reports its own sidebar.
All seven pass; one screenshot each plus `journeys.json`. Documented in
`QA_WORKFLOW.md` §7.

### §18 — Backlog disposition

| Item | Before | Now | Evidence |
|---|---|---|---|
| P0 axis-time | 29 failing | **43/43**, package 936/936 | tick values + browser labels |
| MOT-002 | FAIL | IMPLEMENTED / SELF_TESTED | 10 entries with examples, browser check |
| UX-003 | FAIL | IMPLEMENTED / SELF_TESTED | specimen 388–432px, footers on 34 pages, installs on 5 |
| DOC-002 | FAIL | IMPLEMENTED / SELF_TESTED | 118 words / 1,163px / rail 4; 27 families, 225 rows |
| DOC-003 | FAIL | PARTIAL | lead rewritten, contract deduplicated; the remainder is reference material |
| DOC-004 | NOT_TESTED | IMPLEMENTED / SELF_TESTED | 78 descriptions ≤ 12 words + `nav-copy.test.ts` |
| DOC-005 | FAIL | PARTIAL | Active copy is localised (100% gate + negative case proven); long-form bodies need the owner's decision |
| LEG-002 | TODO | IMPLEMENTED (link half) | 0 → 1 inbound link each, measured; redirect half needs LEG-001 |
| LEG-003 | TODO | IMPLEMENTED / SELF_TESTED | source-of-truth statement + `docs-inventory.test.ts` (35 exports) |
| LEG-004 | TODO | PARTIAL | charts page count now derived; `.context` 79/78 is a Visuals handoff |
| LEG-001 | BLOCKED | BLOCKED | owner decision table |
| LEG-005 | TODO | NOT_APPLICABLE (Agent B) | `packages/visuals/**` |
| IA-006 | TODO | TODO | keeps `/explore` as a hub rather than the filter tool — needs a product call, recorded |
| QA-003 | NOT_TESTED | BLOCKED | only Chromium is installed in this environment |
| QA-004 | NOT_TESTED | NOT_TESTED | baseline suite not re-run; recorded |

Two i18n defects fell out of the DOC work, both found by making the gate fail
rather than pass: Agent B's `ddea9d9c` landed English copy with no Chinese handoff
(two sentences added to the shared dictionary, attributed here), and
`loadRegistryProse` still looked for `CHART_LEAD_TEMPLATE` — it found nothing,
skipped every chart entry, and the gate counted 72 fewer sentences instead of
failing. It reads the family map now and throws when the map is missing.

**Coordination for Agent B:** (1) `.context` records 79 public Visuals elements
against 78 registered — the count statement needs one owner; (2) the two sentences
from `ddea9d9c` are in `prose.zh.ts` attributed to that commit, so their next
handoff should not re-add them; (3) the Visuals card copy on `/visuals/elements`
was still English at the time of the audit (C-07) — not re-checked this phase.

---

## 2026-10-12 — Phase 5: cross-browser, the Motion inventory, Chinese install copy, Explore, legacy decisions

Starting revision `a42e3632` (clean), ending `4860f435` (clean), seven commits.
Agent B landed nothing during the session, so no shared-file conflict arose.

| Package | Status | Commit |
|---|---|---|
| QA-003 — the journeys run in three engines | IMPLEMENTED / SELF_TESTED | `97cdded5` |
| MOT-002 — exact inventory + code parity | IMPLEMENTED / SELF_TESTED | `976cfc2d` |
| DOC-005 — installation/API copy in Chinese | IMPLEMENTED / SELF_TESTED | `74a9bde7` |
| IA-006 — Explore *is* the filter | IMPLEMENTED / SELF_TESTED | `443d47ba` |
| QA-004 + LEG-001 — Mac baselines, decision table | IMPLEMENTED / SELF_TESTED | `4860f435` |

### §19 — The defect the cross-browser pass found

Playwright's Firefox and WebKit binaries were installed through the project's own
tooling (`playwright install firefox webkit`). `qa/journey.mjs --browser=…` then ran
the seven journeys in all three engines: **21 runs, 7/7 × 3**. Two engine facts were
adapted rather than hidden — `clipboard-read` does not exist outside Chromium, so
the copy step asserts the clipboard where it exists and the code block the button
is wired to elsewhere, saying which in the run detail; and Firefox commits the
pager navigation a tick later, so the step awaits a URL change.

The deeper structural probe (`qa/browsers.mjs`, 33 routes × axe × 3 engines) found
**one real accessibility defect, identical in all three engines**: 45 occurrences
of `target-size (serious)`, all on `.group/rail` — the sidebar's 8px collapse
strip, an interactive target under WCAG 2.2's 24×24 minimum. Fixed in the
primitive: the button is 24px and straddles the sidebar edge, the hairline mark is
unchanged and now sits on the edge it describes, and the 12px overhang lands in the
content gutter. Measured after: **0 failures** in Chromium.

One open, engine-specific finding — recorded, not hidden:

- **WebKit only, container only:** journey 2 emits
  `Fetch API cannot load http://127.0.0.1:55891/components/search-input?_rsc=… due
  to access control checks.` All seven journeys pass in WebKit and every *assertion*
  in journey 2 passes; only the console check fails, and it does not reproduce
  against the dev server, nor in Chromium/Firefox against the same container. Root
  cause not established within this batch: it is a Next RSC prefetch that WebKit
  treats as cross-origin. Recorded as an open defect with the exact URL and engine.

### §20 — MOT-002's missing six, and the code gap they hid

`qa/motion-inventory.mjs` derives the whole table from the generated registry:
**35 = 10 MULTI_EXAMPLE_COMPLETE + 19 SINGLE_EXAMPLE_SUFFICIENT + 6
HANDWRITTEN_PAGE**. The six are `border-glow`, `kinetic`, `number-ticker`, `reveal`,
`shimmer`, `spotlight` — the pages with their own route files, which never went
through the demo registry the other 29 use. (The script's first run said 39 rows:
`"group": "motion"` also matches the four motion *families*.)

Then the gap the classification hid. Measured on all six: the specimen is in the
first viewport (369–432px), but **five rendered no code anywhere** — zero `pre`
elements, no copy button — because they mount the hand-written
`components/docs/playground.tsx`, which was controls-and-stage only. Three worked
around it with a "Rendered as" row holding one line of inline `<Code>`.
`Playground` now takes `code` and prints the same copyable block `Demo` does, and
each of the six builds that snippet from its own control state. Verified across the
inventory: **all 35 motion pages** have a live specimen in the first viewport and
≥ 1 copyable code block.

### §21 — DOC-005, and the guard that had to be fixed too

The policy (active UI, installation, operation instructions and essential public
API explanations in Chinese) was met everywhere *except* the whole installation and
API surface, and the coverage gate reported 100% while it was English — C-04's
blind spot one layer down: `lib/docs/install.ts` holds the copy and
`doc-entry.tsx` renders it through `tcs(variable)`, which the extractor cannot
resolve. Fixed at the render boundary (install section, both API tables, the import
line, two badges, the copy-button names, and the outline rail's label, which was a
hardcoded English literal on every page in both locales).

`tests/unit/install-i18n.test.ts` asserts every string that surface can print has a
Chinese entry, and **both that test and `registry-lead-i18n.test.ts` now read the
runtime dictionary instead of regexing the source file** — the regex version is how
a re-added key landed outside the exported map mid-change, green test, English
page. Two boundaries are recorded in `messages.ts`: prop values and identifiers stay
English, and fixture text a printed snippet also contains stays as written
(otherwise the preview and the code beside it disagree); fixture copy no snippet
prints is translated.

### §22 — IA-006, QA-004, LEG-001

IA-006: `/explore` now mounts the same `BrowseExplorer` island as
`/explore/browse` — one engine, not two. Search at **323px** and the first filter
axis at **389px** at 1440×900 (390×844: 336px, 26 chips, no overflow). Filters
shareable (`?kind=chart` → 107 results), the alias still resolves
(`/explore/browse?use=bu` → 146), keyboard-only filtering works, the empty state is
real. Kind tiles now filter in place; `qa/navigation.mjs`'s WP-4 reader follows them
(same counts, and it caught Agent B's two new Visuals capabilities live: 81).

QA-004: `tests/showcase.spec.mjs` adds **10** Mac-captured baselines for the named
product surfaces (`*-chromium-darwin.png`), coexisting with the Linux CI set and
never diffed against it. Captured then asserted: 10/10 on a second run. The
intentional-failure demonstration: a deliberately wrong expectation produced
"3791107 pixels (ratio 0.46 of all image pixels) are different". Probe and its stray
snapshot directory removed; only the suite is committed.

LEG-001: the decision table appended to §8 of the action plan, as that item
specifies. Eight chart topic pages → KEEP_PUBLIC (0 → 1 inbound, consumers listed,
RETIRE branch left to the owner); five Visuals resources → KEEP_INTERNAL per
OPEN-04, owner Agent B; the Phase 10A study pages → RETIRE (already executed);
`/experiments/**` → KEEP_PUBLIC (classified: the audit left it open); routed-API
inventories → CONSOLIDATE onto the generated artefacts.

### §23 — DOC-003, measured again and still PARTIAL

Reading order is now correct on all four audited pages, and the chart contract is
stated exactly once (measured: `contract×1` on `/charts/line-chart`, where it used
to appear three times). Leads are one sentence (14–16 words; `/motion/kinetic` 25).
Specimens are early: `/components/popover` 369px, `/motion/card-stack` 369px,
`/motion/kinetic` 478px, and the chart page's `Live preview` is its first section.

What is **not** met is the item's word budget (docs ≤ 1000, detail ≤ 700): measured
`/charts/line-chart` 1206, `/motion/kinetic` 1005, `/motion/card-stack` 919,
`/components/popover` 895. The remainder is installation commands, the compiler's
own prop tables (cell text counts as words) and one line of help per control —
reference material the item explicitly protects. Reaching 700 would mean deleting
API tables, so DOC-003 stays **PARTIAL** with that specific unmet requirement rather
than being closed on a technicality.

### §24 — Gates, on the rebuilt container

- Docker preview rebuilt; **http://127.0.0.1:55891** (`docker port luc-ui-showcase-local 3000`).
- `qa/route-health.mjs` **353/353**; `qa/locale.mjs --all` 353/353; `qa/outline.mjs` all pass.
- `qa/journey.mjs --browser=everywhere` 21 runs (one WebKit console finding, §19).
- `qa/navigation.mjs` all blocks PASS; `qa/preview-check.mjs` 6/6; `qa/playground.mjs`
  4/4; `qa/card-stack.mjs` 4/4; `qa/motion.mjs` 26 tiles; `qa/standalone.mjs` clean.
- `pnpm verify:i18n` 100% (94,845); `docs:registry:check` up to date; showcase suite
  **161/161** (20 files); `@luc/ui` **937/937** (94 files); typecheck and lint clean.
- Visual baselines: 10/10 (`tests/showcase.spec.mjs`, Mac set).

### §25 — What remains, and Agent B's handoffs

Open and honestly recorded: IA-006's canonical-URL question (the alias route is kept
deliberately); DOC-003's word budgets; DOC-005's long-form bodies (a documented
policy boundary, not a task); QA-003's WebKit console finding; LEG-001's two owner
rows; MOT-002's 19 entries judged single-specimen.

For Agent B: (1) `.context` states 79 Visuals elements where the registry now
registers 81 (they added two capabilities this phase) — one owner should derive that
count; (2) the two sentences from `ddea9d9c` are already in the shared dictionary,
attributed, so a future handoff should not re-add them.

---

## 2026-10-12 — Phase 6a: Mac disk recovery

The Mac reported a low-disk warning with **5.35 GiB free on a 460 GiB volume (99%
used)**. Measured before deleting anything:

| Category | Actual size | Class |
|---|---|---|
| `luc-ui/apps/showcase/.next` | **41 GiB** (39.78 of it `dev/cache/turbopack/v16.3.6-*/**.sst`, files from Oct 8) | SAFE_REGENERABLE_CACHE |
| Docker Desktop virtual disk (`Docker.raw`, sparse) | 94 GiB allocated by the host | REVIEW_REQUIRED |
| …of which images | 30.77 GB (22.31 GB "reclaimable" per Docker) | REVIEW_REQUIRED |
| …of which **volumes** | 51.82 GB, all `5214g7project_*` — **another project's data** | DO_NOT_DELETE |
| …build cache | 21.18 GB | REVIEW_REQUIRED |
| `/tmp/luc-clean-*`, `/tmp/luc-final-*`, `/tmp/luc-rc*-*`, `luc-verify-*`, `luc-head-*` | 6.46 GiB (clean-checkout verification trees from earlier phases) | SAFE_PROJECT_TEMP |
| `~/Library/Caches` | 15 GiB (com.openai.codex 2.3, Arc 2.0, ms-playwright 1.6, pip 1.3, 微信开发者工具 0.9 …) | other applications |
| `~/.cache` | 16 GiB (uv 8.5, huggingface 4.6, codex-runtimes 1.5 …) | other tooling |
| `~/Library/pnpm` + `~/.npm` | 4.0 + 4.3 GiB | shared package stores — DO_NOT_DELETE |
| `luc-web/.next` | 1.2 GiB | another subproject — needs consent |

**Removed (LUC UI-owned, regenerable, verified path by path):** `.next/dev` (39.78
GiB — stopped the dev server first, and the production build under `.next/server`
was deliberately kept), the six `/tmp` verification trees (6.46 GiB), and ~29 MB
of `luc-*` scratch in the per-user temp dir.

**Result: 5.35 → 49.47 GiB free; 44.1 GiB reclaimed**, measured with `df`, not
summed from directories. Verified afterwards: `git status` clean at `7c225c97`,
the Docker preview still healthy and answering 200, the baselines intact, and
`next dev` restarts and serves `/` (200, 9.3s cold).

**Deliberately not touched:** every Docker volume (another project's databases),
all other images and containers, `~/Library/Caches`, `~/.cache`, the pnpm/npm
stores, `luc-web/.next`, and the shared `ms-playwright` cache. Noted for consent:
Docker's build cache and unused images are "reclaimable" *inside* the VM, and
pruning them does not return space to macOS because `Docker.raw` is a sparse image
that only Docker Desktop's own purge/compaction shrinks — so that is the user's
call, not a cleanup an agent should run.

## 2026-10-12 — Phase 6b: Components V2 standard (phase 1 of the roadmap)

The library has 103 documented component entries and no uniform page. Ant Design's
current taxonomy and page shape were studied from the live site (72 components in
seven groups, fetched 2026-10-12) and written up in **`luc-ui/docs/COMPONENTS_V2.md`**:
taxonomy mapped onto LUC's existing families, API conventions, the detail-page
template, the examples standard, the visual layout standard, an AntD→LUC coverage
matrix, and a prioritised roadmap.

Coverage verdict, from real exports rather than filenames: LUC is short of **four
foundations** — `Icon`, `FloatButton`, `List`, and a full-page `Result` — not of
components. Two of those four were asserted from a filename scan first and
corrected by reading the barrel (`List` matched `TabsListProps`; `Icon` looked
present because 46 source files import `@remixicon/react` directly).

Built in this phase:

- `components/docs/example.tsx` — the V2 example: title, live specimen in a
  bounded card, **Show code / Hide code** as a real disclosure, Copy code.
- Button, Toggle and Dialog rewritten to the V2 template. Measured in a browser at
  1440×900, 390×844 and under `/zh`: first specimen at **433 / 433 / 455 px** (in
  the first viewport on all three), **zero playgrounds** (Button's leading
  playground was ~600px of controls before the six buttons), **one import line and
  no installation block** on each, code toggles `false → true`, copy returns the
  snippet (`<Button variant="primary">Run backtest</…`), no horizontal overflow at
  390px, no console or page errors.
- `tables.tsx`: the props table was translating `row.description` a second time
  after all 39 call sites had already translated it — a wasted lookup that logged a
  warning per row on every Chinese page and rendered the value unchanged. It now
  prints what it is given, which also keeps the string visible to the coverage
  extractor.

Verified: `verify:i18n` 100% (95,229 sentences), showcase suite 161/161, `@luc/ui`
937/937, typecheck and lint clean, docs registry up to date. The Docker preview was
**not** rebuilt — the disk is still being recovered and the dev server serves the
V2 pages; the next phase rebuilds it at a stable checkpoint.

## 2026-10-12 — Components V2 batch B (the template) + batch D (chart thumbnails)

Session start: `c89fa7cf`, working tree clean, 52 GiB free on `/`, one dev server
on 3457, `luc-ui-showcase-local` healthy on 127.0.0.1:55891.

### `673a352b` — every generated entry page loses its workbench

`components/doc-pages/entry-page.tsx` renders all 223 generated entry pages
(`/components/[component]`, `/charts/[chart]`, `/motion/[motion]`). Three changes,
each one a line of `docs/COMPONENTS_V2.md` §5:

1. the Playground renders **only for charts** — the one product area where moving a
   prop changes the plotted result. The boundary already returns `null` for an entry
   that declares no adapter, so this narrows an existing switch instead of adding a
   second one beside it.
2. the installation block (four commands, three steps, on 223 pages, none of it
   specific to the component above it) is gone. The header still prints that
   entry's import line with a copy button; package setup is `/docs/installation`.
3. the folded "Copy for an AI agent" section is gone — the import line, the
   examples with their code and the props table are the brief it promised.

Measured in the browser at 3457 after the change: `/components/native-select`
specimen 369px, `/components/accordion` 432px, `/motion/orbit-field` 369px — all
with **0 playgrounds, 0 installation blocks, 0 agent panels** and the specimen
still inside the first viewport; `/charts/line-chart` keeps its 1 playground.
`tsc`, `eslint`, the showcase suite (161) and `verify:i18n` (100%) clean.

**Known debt:** `components/docs/doc-entry.tsx` still exports `InstallSection`,
`AiGuidanceSection` and `DOC_LOCALES`, now with no consumers. They are dead and
harmless; an attempted scripted removal corrupted the file and it was restored
byte-exact from `HEAD`, so the removal is deferred to a hand-reviewed patch.

### Batch D — the chart catalogue draws pictures

The user's complaint: `/charts/catalog` listed names, so a reader could learn that a
Sankey exists and not what one looks like. Four new pieces:

- `lib/docs/chart-links.ts` — the catalogue keys a chart by **public symbol**, the
  registry keys its page by **route**, and a thumbnail needs the **demo id**. The
  join is derived from the generated navigation projection rather than typed out a
  second time, so a renamed page cannot leave a stale href. A composition ("A + B")
  resolves through its first symbol, which is the component a reader has to import
  to draw it at all.
- `components/charts/chart-thumbnail.tsx` — the real chart, from the page's own
  fixture, at `CHART_THUMBNAIL_HEIGHT` (148px), with `animation: "none"` and
  `renderer: "svg"`. Deferral is the library's own (`useChartArm`), not a second
  gate: 79 rows mount 79 cheap placeholder boxes and only the visible handful build
  engines. Compositions, which have no height prop to turn, keep their author's
  staging and are cropped with a faded bottom edge instead of a hard slice.
- `qa/chart-thumbnails.mjs` (new gate) + `qa:charts:thumbnails` — screenshots every
  thumbnail, decodes it back through the browser and counts distinct colours, so a
  blank box or a wall of identical lines fails. `line`, `rolling-measure` and
  `segmented-bars` legitimately share a plot with another row, hence a 90% bar.
- `tests/unit/chart-links.test.ts` — every public row resolves to a page, every page
  resolves to a demo, and the page count is not the row count.

The catalogue row also became a destination: the picture and the name open the
chart's localised page, and the row keeps its `#id` permalink as its own named
control, so CHT-002's deep links still work.

**Result:** `/charts/catalog` and `/zh/charts/catalog` each render **79
thumbnails, 76 distinct pictures, 0 blank, one height (148px)**; desktop 1440 and
mobile 390 (322px-wide cards, no horizontal overflow, Chinese labels intact); 0
console errors. `qa/navigation.mjs` CHT-002 still PASSES on the catalogue.
Pre-existing, unchanged by this work: `/charts/catalog` has no related/prev-next
footer and `/components/buttons` reports a one-link pager — both reproduce
identically against the older Docker build, so they are not regressions here.

**Dev-server note:** a probe run immediately after an HMR edit can report a
hydration-attribute mismatch; the same run is clean when repeated. Recorded so a
later reader does not chase it as a product defect — the production preview is the
place to confirm.

### Batch C — the four missing foundations, and the generator that would not run

`COMPONENTS_V2.md` §4 named four gaps. All four now ship, in `packages/ui`, exported
from the barrel so the registry, the sidebar and the API tables pick them up with
no second list to maintain (103 → **107 component entries**, 223 → 227).

- **`Icon`** (`components/icon.tsx`) — the wrapper the library never had while 46
  of its own source files imported `@remixicon/react` directly: `size` as a role
  (`xs…xl`), semantic `tone`, and accessibility *derived* — named means
  `role="img"`, unnamed means `aria-hidden`. Plus `iconSet`/`iconNames`/`searchIcons`:
  39 curated glyphs addressable **by name**, searchable by name or keyword in both
  languages, which is what a config or a search box needs. Not a re-export of the
  package: a set that mirrored all 3,000 glyphs would be a copy, not an API. An
  unknown name **throws** rather than rendering nothing.
- **`List` / `ListItem` / `ListHeader` / `ListFooter`** (`components/list.tsx`) —
  a real `<ul>`/`<li>` row model with fixed slots (leading, title, description,
  meta, trailing) and one hairline between rows, so ten rows line up. The library
  previously offered a Card per item, a `TransferList`, a `SortableList` and
  nothing for the plain case.
- **`Result`** (`components/result.tsx`) — the post-submit outcome surface, five
  statuses, `sm`/`md`, `titleAs`, a replaceable or removable mark. Two decisions
  are documented in the file: the **title is required and has no default** (a
  library that ships "Something went wrong" ships an untranslatable string), and
  there is **no implicit live region** (a Result is normally the page's own
  content; the caller opts into `role="status"`).
- **`FloatButton` / `FloatButtonGroup`** (`components/float-button.tsx`) — placement
  is the component: corner offsets that respect `env(safe-area-inset-*)`, a layer
  at `--z-sticky` so a dialog covers it rather than fighting it, `fixed={false}`
  for a surface, a decorative count badge. The group is a disclosure, not a menu:
  real button with `aria-expanded`/`aria-controls`, focus moved to the first action
  on open, Escape closes and returns focus, click-outside closes.

26 new unit tests (the `@luc/ui` suite is now **963/963**). Every new page verified
in the browser at `/` and `/zh`: HTTP 200, one live preview plus 2–3 examples, first
specimen at **395px**, zero horizontal overflow, zero console errors. Cascader and
TreeSelect are **decided, not built** — the reasoning is in `COMPONENTS_V2.md` §4.1.

Two changes were needed to make the documentation chain *able* to see any of this,
and both are defects worth naming:

1. **`catalog:generate` could not run on this machine at all.** A path-normalization
   fixture hardcoded the author's checkout (`/home/luc/code/luc-quant/...`) as the
   workspace root; on any other checkout the prefix did not match, the rewrite fell
   through to "keep the last segment", and `catalog:generate`, `catalog:check` and
   `verify:package` all died before generating anything. The fixture now builds its
   specifier from the real root, so it tests the rule instead of the laptop.
2. **`COMPONENT_CATALOG.md` had drifted from its own generator** — the committed
   copy carried a sentence the template no longer emitted, and the export lists
   were missing 25 symbols added since (range-group, gesture and chart helpers).
   The template's preamble is restored, so regenerating restores the statement the
   inventory test asserts, and the export lists are current again.

Also completed in this batch, because the examples were otherwise invisible:
`/components/[component]` now renders a spec's `examples` as a **"Other
configurations"** section — the same section Motion has had since MOT-002 — using
the Components V2 `Example` frame (source behind a disclosure), while Motion keeps
its always-visible frame. Before this, `examples` on a component demo rendered
nowhere at all.

Verified: `@luc/ui` 963/963, showcase 164/164, `verify:i18n` 100% (97,017
sentences, 42 new entries added), docs registry up to date at 227 entries,
workspace typecheck and lint clean.

### Batch D/E audit — playgrounds, Blocks, and what was deliberately not changed

**Playground classification (the user's "ordinary controls wrapped in a large
playground" complaint).** Counted across every handwritten page: three carry a
playground, and all three mount it *after* the specimens (UX-003), not before:

| Page | Class | Evidence |
|---|---|---|
| `/components/inputs` | RETAIN_FOR_GENUINE_COMPLEXITY | `qa/playground.mjs`: control changes the code, reset restores it, 3 presets, advanced band collapsed, **0 silently disabled controls** |
| `/components/cards` | RETAIN_FOR_GENUINE_COMPLEXITY | same, 4 presets, the two disabled controls each carry a reason |
| `/components/ai` | RETAIN_FOR_GENUINE_COMPLEXITY | a chat surface, not an ordinary control; same probe, 0 disabled |
| `/charts/*` | RETAIN (by design) | a chart prop changes the plotted result |

Nothing was deleted here: removing a working playground whose every control has a
visible effect would have removed functionality, not clutter. The pages a reader
meets first (`buttons`, `toggle`, `dialog` and all 227 generated entries) have none.

**Blocks / Showcase quality scan.** No `lorem ipsum`, no placeholder-image service
(`placehold`, `picsum`, `unsplash`, `dummyimage`), no remote `src` or CSS `url()`
anywhere in `app/`, `components/` or `lib/`, and no `src="http…"`. The only
`placeholder=` hits are real input placeholders. The reference experiences draw
their covers with `experiences/placeholder-art.ts` — deterministic inline-SVG data
URIs with real intrinsic dimensions and real `alt` text, nothing fetched — which is
the "coherent, explicitly labelled synthetic fixture" the brief allows rather than
the broken-image wall it forbids. The "fake portfolio page" risk the brief names is
not present in the current tree.

**Not changed, with the reason recorded:**

- **44 handwritten component pages still use the `Demo` frame** (specimen with the
  source always visible) rather than the V2 `Example` frame (source behind a
  disclosure). This is the largest remaining item in roadmap batch 2. It is a
  per-page content job, not a mechanical one: each `Demo` needs a title that names
  the capability, and where a `Section` holds two or three of them those titles have
  to be written and translated. Doing it half-way would leave the inconsistency the
  brief complains about, so it is left whole and counted rather than sampled.
- **Four pages still head a section "Installation and imports"** (`cards`, `inputs`,
  `slider`, `ai`). The *content* is an import statement — which the V2 template
  allows — not installation commands, so this is a heading that over-promises rather
  than a repeated install block. Renaming it is a four-file, one-dictionary change
  worth doing with the frame migration above.

### Batch F — the checkpoint, the container, and the gates

Docker preview rebuilt from `4fee4e86` on the loopback override
(`docker compose -p luc-ui-local -f docker-compose.yml -f docker-compose.local.yml
up -d --build`). The published port is **ephemeral** and was re-read from Docker
rather than assumed: `127.0.0.1:56527`.

Against the **production container** (not the dev server):

| Gate | Result |
|---|---|
| `qa/route-health.mjs` | **All 357 documented routes healthy** (53s; 353 before the four new pages) |
| `qa/chart-thumbnails.mjs` | `/charts/catalog` and `/zh/charts/catalog`: 79 thumbnails, 76 distinct, **0 blank**, one height |
| `qa/preview-check.mjs` | 6/6 surfaces, each driven through one real interaction |
| `qa/navigation.mjs` | NAV-001/002/003, IA-005/007, WB-005, WP-4 and CHT-002 all PASS |
| `qa/outline.mjs` | `/components/{icon,list,result,float-button}` + catalog + line chart: page-derived, unambiguous |
| `qa/locale.mjs` | PASS — cookies-free both languages, explicit switch, Chinese pages link to Chinese URLs |
| new pages, container | 1 live preview + 2–3 examples each, source behind disclosures, no console errors, no horizontal overflow, Chinese titles |

The production run also settles the dev-server note above: the hydration warnings
seen once after an HMR edit do **not** reproduce in the built container.

**Gates and the one red item:**

- `pnpm typecheck`, `pnpm lint`, `@luc/ui` **963/963**, showcase **164/164**,
  `verify:i18n` 100%, `verify:docs` up to date, `verify:charts` 11/11 unit contracts,
  `verify:registry` clean, `catalog:check` clean, `build:package` + `verify:package`
  + `verify:types` clean.
- `test:consumer` **fails on two bundle-size budgets**: `charts-statistical` 44.2 →
  48.5 KB and `charts-financial` 42.5 → 47.4 KB (allowance 3.5 KB). Both are chart
  entry points, and this session changed no file under `packages/ui/src/charts/**` —
  the growth belongs to the range-group, gesture and time-axis work committed
  earlier (the regenerated catalog shows the new exports: `declareRangeMember`,
  `rangeGroupState`, `watchPlateGesture`, `WHEEL_GESTURE_IDLE_MS`). The budget was
  **not** raised: accepting a 10% growth in two entry points is a decision for
  whoever owns those exports, with the tree-shaking question answered first.
- `qa/navigation.mjs` reports `/charts/catalog` with 0 related links and no pager.
  Pre-existing and reproduced identically against the older image: the probe's
  UX-005 rule looks for a *registry entry* footer, and the catalogue is a roadmap
  page with no registry row, so `EntryFooter` renders nothing by design.

**Disk.** 45 GiB free at the end of the session. `luc-ui/apps/showcase/.next` is
**28 GiB**, of which `.next/dev/cache` (Turbopack) is 26 GiB — the same artefact that
caused the earlier incident. The dev server started in an earlier session is still
serving on :3457 and still owns that directory, so it was **not** removed; the
condition in the brief is "no running process requires it". To reclaim it:
stop that server, then `rm -rf luc-ui/apps/showcase/.next/dev` (regenerable), or
`pnpm cache:prune`.

## 2026-10-13 — Components V2 completion: migration, coverage, simplification, disk

Session start: `3d4645c4`, clean tree, **45.04 GiB free**, `.next/dev/cache` 26.83 GiB
held by a dev server left running from the previous session (pid 10856, port 3457).

### A — the disk, before anything else

`scripts/dev-guard.mjs` (new): free space from `statfs`, the cache size from `du`
(0.1s on 26 GiB, where a recursive walk would stall the dev start it guards), and
the live server from the lock Next writes at `.next/dev/lock` — cross-checked
against the process table, so a crashed server's lock does not block cleanup and a
live one is never deleted behind. `--check` runs in front of `dev` and never fails
it; `--strict` is the gate; `--require-free-gb=N` blocks an expensive build with an
exit code (wired into `build:showcase` and `qa:rebuild`); `--prune` refuses while a
server is live and otherwise delegates to the existing `cache-prune.mjs`, so the
Git and target guards are not re-implemented. 11 tests (`qa:clean:test`).

**Used twice.** It stopped the stale server by its own pid and pruned 27.31 GiB
(45.05 → 72.37 GiB free). At the end of the session, after migrating 45 pages, the
fresh cache had reached 9.56 GiB — past the 8 GiB warning — so the same command
stopped that server and reclaimed it again: **73.57 GiB free**.

### B — the handwritten pages (P0)

`scripts/v2-inventory.mjs` (new) walks the 56 handwritten routes and records what
each page *is*: kind (45 detail / 3 family / 8 collection), entry, specimen counts,
code coverage, import line, footer, API table, playground, AI panel — and enforces
the §4 contract (an example without a title or a source, an undeclared `Demo`, a
repeated installation heading, an agent panel, a detail page with no specimen).
`--check` fails when the committed inventory is stale.

A conservative codemod migrated **126 sections across 45 pages** from
`<Section><Demo>` to `<Example>`: the section heading becomes the example's title,
the demo's props move across, the body is dedented, and the source moves behind the
disclosure. **74 of the 126 examples had no `code` prop at all** — the "no code
access" shape the independent audit found — and every one now carries a snippet
transcribed from its own specimen (the inventory asserts 140/140). Also: an
`ImportLine` on 41 pages, derived from the page's `@luc/ui` imports intersected with
the components it renders; `EntryFooter` on 21 pages that ended nowhere; and
"Installation and imports" → "Import" on four pages, since the section holds an
import statement and no installation commands.

**52/56 pages V2-complete. 4 are PARTIAL with their reason**: `/application`,
`/application/workspace`, `/application/url-state` and `/application/outline-drawer`
render live composites inline in Sections — a legitimate shape for a composite, and
not a V2 page (no example frame, so no disclosure and no copyable source). They are
counted as open work in the inventory, not as done. Five `Demo` sections remain,
each with a declared exception (a specimen plus its own explanation, a heading that
carries an action, a specimen that already names itself).

`qa/v2-pages.mjs` (new) checks the *pages* rather than the source: 200, hydration,
one disclosure and one named copy control per example, a disclosure that actually
toggles, a revealed source that is visible and non-empty, no console error, no
horizontal overflow. It found one real defect — `/date-time/calendar` overflowed
145px at 390px, because the two-month `RangeCalendar` is 472px wide; its stage
scrolls the specimen now. **72/72 checks OK · 220 examples rendered · 12 Chinese ·
12 at 390px** — re-run against the production container at the end.

### C/D/E — simplification, and the pixels

**Blocks.** All twelve were inspected. Six (`personal-hero`, `career-timeline`,
`publication-list`, `reading-shelf`, `now`, `activity-feed`) were a one-line wrapper
around one component each — a component demo wearing a Block's name. The gallery now
shows the six genuine compositions (Marketing 3, Product 3) with a sentence saying
where the personal sections live. The **template composer**, which starts its
`personal` archetype from five of those sections, showed that deleting them was the
wrong move: they are now `BLOCK_SECTIONS` (sections to arrange) beside `BLOCKS`
(compositions to read), and `blockById` spans both. `/blocks` is the only route in
this area, so no deep link moved.

**Experiences.** The generated covers were a full-saturation gradient with a large
centred monogram — technically valid and visibly a placeholder, which is what the
whole page then carried. `placeholder-art.ts` now builds a small system: six deep
desaturated bases with one restraint accent each, four compositions chosen by the
seed, a vignette, and the monogram moved to a bottom-left mark. Same signature and
determinism; six experience pages inherit it. Before/after at
`artifacts/screenshots/showcase-transformation/exp-portfolio.png`.

**The Chinese page showed English.** `/zh/blocks` rendered "Marketing" and both
category summaries in English while `verify:i18n` reported 100% — the strings were
absent from the dictionary. Added (营销 / 产品 + two summaries). A dictionary miss
the extractor cannot see is the DOC-005 blind spot in a new place; recorded for
independent QA.

### F — the two red gates

**`/charts/catalog` was a false positive.** `qa/navigation.mjs` asserted related/
previous-next navigation on every route, including a *catalogue*. `qa/page-kind.mjs`
now classifies a route from the registry's own routes — an **entry** owes UX-005, a
**collection** (a catalogue, an index, a guide) owes neither — and nothing fake was
added to the catalogue page. `qa/page-kind.test.mjs` (`qa:nav:contract`) pins both
halves plus the negative regression: a real entry route fed an empty footer must
produce failures. Verified: `/charts/catalog` PASSes, `/components/alert` and
`/components/icon` still PASS, NAV-001/002/003, IA-005/007, WB-005, WP-4 and CHT-002
unchanged.

**The two chart bundle budgets are still red, on purpose, with the cause
identified.** `charts-statistical` 44.2 → 48.5 KB, `charts-financial` 42.5 → 47.4 KB
(allowance 3.5 KB, measured against `dist` from a fresh `build:package`). This
session changed no file under `packages/ui/src/charts/**`. The diff since the
baseline commit (`31103311`) is ~3,400 lines of intentional feature work in the
chart core: `theme-tokens.ts` + `theme-tokens-light.ts` (434 lines) with a rewrite
of `theme.ts`, `range-group.ts` (339), the `sync.ts` extension (+113), `types.ts`
(+20), and `static-capture.ts`. Two facts worth recording rather than guessing: the
package already declares `sideEffects: ["**/*.css"]` and the new modules are
side-effect free, so this is **not** a lost tree-shaking flag; and the ECharts
surface calls `watchPlateGesture(host)` unconditionally on every armed chart, so
those bytes are needed at runtime. The only fixes that would move the number are
(a) lazily loading the plate-gesture watcher and the range-group state — a
behaviour change that belongs to the owner of those features — or (b) accepting the
growth by re-recording the baseline with the byte-level delta. The budget was
**not** raised, and the test stays red until that decision is made.

### Session-end gates (production container, port 127.0.0.1:65255)

| Gate | Result |
|---|---|
| `qa/route-health.mjs` | **357/357 documented routes healthy** |
| `qa/v2-pages.mjs` | 72/72 checks OK · 220 examples · 12 zh · 12 at 390px |
| `qa/chart-thumbnails.mjs` | both locales: 79 thumbnails, 76 distinct, 0 blank |
| `qa/navigation.mjs` (targeted) | `/charts/catalog`, `/components/alert`, `/components/icon`, NAV-001/002/003, IA-005/007, WB-005, WP-4, CHT-002 PASS |
| `@luc/ui` unit | **963/963** |
| showcase unit | **164/164** |
| `verify:i18n` | 100% (97,018 sentences) |
| docs registry, v2-inventory | up to date |
| tsc / eslint | clean (workspace; `app/**`, `lib/**`, new scripts) |

Red, reported not hidden: `test:consumer` on the two chart budgets above. Also
unowned-by-this-pass: `qa/preview-check.mjs` and the journey/motion/card-stack
probes were not re-run after the last two commits (route health and v2-pages cover
the changed surfaces); the four PARTIAL `/application/*` pages.

---

## 2026-10-12 — Components V2 closure, the API delivery question, runtime i18n, and the debt the three of them exposed

`7f6c1243` → `5e90f786`. Five commits, no push, worktree clean, **75–76 GiB free**
(the pass never came near the disk floor; `dev-guard` reported 0 B of dev cache at
each rebuild because the dev server was never used — this pass worked against the
production container).

### A — the four `/application` pages, and the inventory is empty of gaps

`/application`, `/application/workspace`, `/application/url-state` and
`/application/outline-drawer` were the last PARTIAL entries. Each specimen now
sits in an `<Example>` with a snippet transcribed from its own composition; the
two larger than a fenced block (the 30rem workspace, the shell) carry a **labelled
excerpt** of the real tree rather than an invented or truncated one. `PAGE_GAPS`
is `{}` and the inventory reads **56/56 V2-complete, 146 examples, 146 with a
title and a source**, contract clean.

Localizing them exposed the class this pass then had to build a gate for: the
specimens' labels were plain English string literals — pane handles, facet and
search labels, the "what goes where" vocabulary, the outline drawer's own tree.
All are `tcs()` now.

### B — the API tables: a measured gap, and zero delivered bytes

20 of the 56 handwritten routes are a static `page.tsx` at exactly the URL a
registry entry owns (`/components/select` **is** entry `select`'s route). A static
route beats `/components/[component]`, so for those 20 ids the generated page —
`ExportsTable` and the prop tables with it — rendered nowhere on the site. 29
handwritten pages carried a hand-written `PropsTable`; these 20 carried nothing.

They close with a **server wrapper**: `page.tsx` reads the registry and hands the
rendered section into `page-client.tsx` as a node, so the page stays a client
component and the tables never become client JavaScript. Compositions that export
no component of their own get `RelatedApi` — `#api` links — instead of an empty or
invented table. `v2-inventory` counts the three ways a page can show the API plus
the link form: **54/56**, with the two exemptions named (`/components` is the
index; `/application/packaging` is a process guide).

Delivery is now **checked rather than asserted**: `qa/api-delivery.mjs` samples 47
byte windows from the middle of `api.ts` and searches every built client chunk.
Against the *shipped* container artifacts: 0 windows in 212 chunks (8,363 KB), 4
in `.next/server` — the positive control that proves the sample samples the
payload. `qa/api-delivery.test.mjs` pins the negative regression.

### C — the runtime i18n gate, and what it found

`verify:i18n` reported 100% while `/zh/motion` rendered five English section
headings and `/zh/blocks` its category names. Two blind spots, one gate:

- **Static**: `DOC_ELEMENTS` in `i18n-prose.mjs` listed `Demo` but not `Example`,
  so a short title on the V2 primitive was never required. Fixed.
- **Runtime**: the existing live probe looks for *sentences* (five or more words),
  so a one-word label was invisible to both. `qa/i18n-chrome.mjs` adds the label
  rule as pure functions and `qa/i18n-live.mjs` gains a second pass over chrome
  regions only, with the specimen containers excluded. Identifiers are excluded
  from a **source-backed** list — the registry's entry titles and documented
  exports, read from the generated projections.

The full 205-route sweep found 100 labels. Chrome fixed: the 27
`/docs/reference/<family>` pages rendered their lead through `tn` (the *label*
dictionary) so a family summary fell back to English on every one of them — the
family overview pages one level up already used `tcs` for the same string;
`ChartDataViewToggle` hardcoded the visible words "Chart"/"Table" with no way for
a localizing caller to say otherwise, so it takes `labels` now; the design-lab
pages, "Open quick actions", and the blocks' sample copy (via a `tcs` prop in the
same shape as the existing `href` prop). The residue is `qa/i18n-chrome.json` with
a written reason per label. Result: **chrome 189/205 clean and every remaining
label reviewed; prose 53/205 against 55/205 on the pre-session image** — no
regression, two fewer.

The API tables carry `data-skip-i18n`: they are the compiler's output rendered,
and `i18n-coverage.mjs` already excludes `generated/` for the same reason.

### D — chart budgets: re-recorded, with the reason on the record

`charts-statistical` 45,224 → 49,671 B; `charts-financial` 43,547 → 48,575 B. The
diff touches those two entries and no others, so every other budget stays as tight
as it was. The attribution is measured from the import graph and written into
`docs/research/dependency-decisions.md`: 5.4 KB of theme-tokens (new, and
`theme.ts` shrank by more), 1.9 KB of diagnostics, 1.5 KB of gesture attribution,
the sync extension and the surface lifecycle. Four explanations were checked and
rejected on the record — not a lost tree-shaking flag (`sideEffects` already
correct), not a barrel leak (no `range-group`, no light table, no other family's
options in either graph), not a toolchain change, and not fixable by lazy loading
without breaking gesture attribution. `test:consumer` is green.

### E — what the browser gate was actually asserting

Two findings, reported together because they had the same cause.

`components/blocks/blocks.tsx` is a server component module — it takes `href` from
its caller precisely so it renders the same on the server, in the Showcase and in
a product. This pass called `useOptionalI18n()` inside three blocks and `/blocks`
went to **HTTP 500**. The localizer is a prop now, threaded through
`BlockSpec.render(href, tcs)`. Route health caught it.

Why route health had to: `qa/behaviour.mjs` and `qa/journey.mjs` were still
asserting the product Components V2 removed, so four behaviour checks and one
journey were red for reasons that were not defects — a component page carrying
`pnpm add`, an agent brief in the reading path, a Playground Variant control on
Button, and a `getByText` that counted the example's mounted `<pre>` beside the
visible message. Each assertion is **inverted or retargeted to the V2 contract**,
not deleted: an install command is now a failure, an agent brief is now a failure,
the button page asserts the example shape instead, and the empty-state check reads
visible text. Journey 01 looked for `[data-slot="demo"]`, which the migrated pages
no longer render.

**155/155 behaviour checks, 7/7 journeys, 357/357 routes, 76/76 V2 page checks
(228 examples), chart thumbnails 79/76/0 blank in both locales, `@luc/ui` 963/963,
showcase 164/164, contract tests 18/18, chart units 11/11, tsc and eslint clean.**

### Open, with the evidence

- **Visuals-owned chrome labels**: 61, listed label-by-label in
  `qa/i18n-chrome.json` with a "handed to Agent B" reason. `visuals/**` is not
  this agent's to edit; the probe will fail on any *new* one.
- **Pre-existing prose leaks**, 53 routes, unchanged in kind from the 55 before
  this pass (Visuals 9, docs 27 among them) — the prose half of the runtime gate
  was already red, and this pass neither caused nor hid it.
- **`AiGuidanceSection`** in `components/docs/doc-entry.tsx` is now rendered by
  nothing. Dead code, left in place deliberately.
- **`luc-ui-showcase-local`** still runs the superseded image digest
  (`4742397d…`, ~470 MB) on `127.0.0.1:65255`; the current preview is
  `luc-ui-showcase` on `127.0.0.1:3000`. Not touched — a port someone may have
  open is not mine to close. Docker also reports 22.23 GB of unused images, none
  of them LUC UI's and none of them this pass's to prune.

---

## 2026-10-12 — IA V3: one product, four areas

`9a954a93` → `ac6e9328`. Worktree clean, **75 GiB free**, dev cache 0 B (production
container throughout; `qa:rebuild` ran five times behind the disk guard).

### The audit, in the browser

The complaint was "the navigation is repetitive and confusing". Driving the real
site found the mechanism rather than a taste:

| route | breadcrumb said | sidebar showed | row marked current |
| --- | --- | --- | --- |
| `/date-time/calendar` | Components › Date and time | **Docs** taxonomy | **none** |
| `/foundations/typography` | Components › Typography | **Docs** taxonomy | Overview |
| `/integrations/tradingview` | Integrations › TradingView | **Docs** taxonomy | Overview |
| `/application/workspace` | Components › Application | **Docs** taxonomy | none |
| `/forms/validation` | *(no trail)* | **Docs** taxonomy | none |
| `/components/select` | Components › Forms › Select | Components | Select ✓ |

Plus: Explore mounted the same explorer on two routes with different headings;
`/templates` sold "whole-page starters" whose cards led into Experiences with no
way back; Studios sat beside Build in the header as though a page composer were a
different kind of product; and the front door's third action was a link labelled
"Find the right thing" that led to an introductory page rather than to search.

One suspected defect was **not** real: the breadcrumb appeared to print every
level twice ("Forms › Forms › Select › Select"). It was the probe matching both
the `<li>` and its child `<a>`/`<span>`; the trail is correct.

### What changed

- **Components** is one product: four sections (Design foundations / UI components
  / Motion and interaction / Integrations) over seven route prefixes. The area
  names its own section headings, so `components` is "UI components" inside
  Components and stays "Components" on `/charts`.
- **Four duplicate menus deleted.** The guide groups repeated routes the families
  already listed; the five pages with no registry entry of their own moved into
  `COLLECTIONS` under the family they document. Deleting them lost no
  reachability — checked row by row before and after.
- **Docs** keeps `/docs` and `/experiments` and nothing else.
- **Explore**: one destination, one alias that carries the filter *and the locale*.
  The first version dropped the locale — `/zh/explore/browse` landed on the
  English page, invisible to a curl of the un-prefixed route. The probe now
  fetches both, in separate contexts (the zh fetch sets the locale cookie and had
  already turned a later check Chinese once).
- **Build**: Studios is a subarea, the switcher lists five, and the details carry
  an explicit way back — `CollectionReturn` on sixteen experiences, four studios
  and (via the new `lib/templates.ts` registry) the four experiences that are also
  starters.
- **Home**: three actions with one job each, and Search opens the real palette
  through a context the shell publishes.
- **Visuals**: the two gallery surfaces are listed. Both already existed; no
  Visuals-owned file changed, and the one Visuals *test* that forbade them was
  updated with the reason IA V3 supersedes its 10B.5 decision.

### Gates

Route health **357/357**; behaviour **155/155**; journeys **7/7**; navigation —
every group, including a new IA V3 block that asserts the four sections on the six
moved routes, the single Explore destination, the alias's locale, Build's five
subareas, six return links and a search action that produces results; v2-pages
**76/76 · 228 examples**; chart thumbnails **79 / 76 distinct / 0 blank ×2**;
`@luc/ui` **963/963**; showcase **164/164**; guard **23/23**; i18n **100%**;
docs registry regenerated (40 discovery rows move `docs` → `components`);
tsc and eslint clean.

Five test files were re-pointed rather than relaxed, each with the reason recorded
where it lives: `discovery-areas.test.ts` (the four contract changes),
`visuals-catalog.test.tsx` (10B.5 → IA V3), `qa/geometry.mjs` (the section names),
`qa/journey.mjs` (the mobile drawer's two-level tree), `qa/navigation.mjs`
(NAV-003 moved from Docs to Components, because Components is the long tree now).

### Open, and for the owner

- **Docs is small now** — two sections, eight rows. That is the honest consequence
  of moving documentation-that-documents-the-library into Components, but whether
  Docs should absorb the design laboratory more prominently is a product call.
- **`/templates` still has no detail route of its own**: a card opens the
  reference product it points at. The return link now says so, and the registry is
  the single declaration of which experiences are starters — but a real
  `/templates/[id]` would be a different piece of work.
- **Visuals' other five surfaces** (`themes`, `art`, `skins`, `gallery`,
  `art-direction`) stay out of the sidebar by the 10B.5 decision, which IA V3 did
  not reopen. If the Gallery should absorb them, that is Agent B's call.

---

## 2026-10-13 — NAV-004: Motion is a section, not a sidebar

`df42dbac` → `645b9bb5`. My files committed; the tree also holds Agent B's
in-flight Visuals work (64 paths), untouched.

### Reproduction

Verified before editing: HEAD `df42dbac`, worktree clean, `luc-ui-showcase`
running the image built from that commit (`c5e7ebe2`, 47 minutes old), so port
3000 was serving the newest code. Then, in a browser:

| route | sidebar sections | current row |
| --- | --- | --- |
| `/components` | Design foundations / UI components / Motion and interaction / Integrations | — |
| `/motion` | **Motion / Part of** | Motion gallery |
| `/motion/kinetic` | **Motion / Part of** | KineticHeadline |
| `/motion/card-stack` | **Motion / Part of** | CardStack |
| `/motion/presence` | **Motion / Part of** | **none** |
| `/motion/intensity` | **Motion / Part of** | **none** |

### Root cause, exactly

`lib/discovery/areas.ts` declared `motion` as a `NavArea` with `sidebar:
["motion"]`, `parent: "components"`. `areaForRoute` gives `/motion/**` to it by
longest prefix, so the shell rendered Motion's own tree and then added a "Part of
Components" row to compensate — a gesture at the model, not the model. Motion was
simultaneously a Components *family* (in the registry, in the area's sidebar
list) and a separate *area*, and the area wins at render time.

Fixing that exposed a second defect that had been hiding since the Motion group
got a gallery row. `claimRoutes` dropped any item whose `href` was already
claimed; motion's **Feedback** family declares `landing: "/motion"`, the same href
as the "Motion gallery" row above it, so the entire family was filtered out — 15
of the 35 documented motion entries (PressRipple, ClickBurst, FadeSwap,
MotionIntensityProvider, …) had no sidebar row at all, and nothing failed, because
the routes still answered.

Two page defects the new gate found on its way past, both pre-existing (the older
image on `:65255` reproduces them at the same sizes):

| page | defect | fixed by |
| --- | --- | --- |
| `/motion/orbit-field` | 257px document scroll sideways at 1440px | a bounded stage — the ring radii are percentages of the container's *width*, and the page was handing the specimen the reading column |
| `/components` | 123px overflow at 390px | `overflow-x-auto` on the stepper preview's frame, as the calendar specimen already does |

### The gate

`qa/sidebar-continuity.mjs` (also `pnpm --filter @luc/showcase qa:sidebar`). It
reads no model and no label: it opens `/components`, expands every section and
family until the whole tree is in the DOM, reads the hrefs out of the rendered
sidebar, clicks each one, and asserts the four sections, the expanded section, the
single current row pointing at the page you are on, no locale-dropping redirect
and no sideways scroll — then Back/Forward, direct reloads, the whole sweep again
in Chinese (separate context: a `/zh` visit sets the locale cookie and turned a
later check Chinese once), the mobile drawer, and finally that Charts and Visuals
*do* still change the navigation area.

**168/168 destinations clicked in English. 168/168 in Chinese. 7 direct loads, 4
history steps, 4 mobile routes, area switching intact, no overflow.**

### Self-test summary

Route health 357/357 · behaviour 155/155 · journeys 7/7 · navigation (every group,
including the IA V3 block) · v2-pages 76/76 · chart thumbnails 79/76/0 · `@luc/ui`
963/963 · showcase 168/168 · contract tests 18/18 · docs registry up to date (35
discovery rows move `motion` → `components`) · tsc and eslint clean.

**Red, and not mine:** `verify:i18n` fails on 1019 unattributed sentences that
Agent B added in this working tree (`components/visuals/element-catalog.tsx`,
`element-detail.tsx`, `app/visuals/styles/page.tsx`, `lib/visuals/catalog.ts`).
Their files, their handoff; left for them.

---

## 2026-10-13 — Visuals V2 integration

`8e8bd26c` (Agent B's Phase 10B.13, already committed) → `c177987f`. Worktree clean
of everything except Agent B's in-flight files; NAV-004 (`645b9bb5`) intact.

### The localization handoffs

B's 10B.13 handoff was written as `{ elementRegistry: {…}, uiStrings: {…} }`, and
`i18n-merge.mjs` understood only a flat map or a `sentences` key — so the file was
invisible to the merge and its 19 strings read as *"untranslated on every route"*
in `verify:i18n`. The 1019 occurrences the previous session recorded were that
arithmetic, not 1019 separate gaps. The tool now walks any string map and skips the
keys that describe the handoff. Merged, in four passes: 10b13 (19), the shared page
copy its runtime sweep exposed (35), the Visuals palette copy its own handoff missed
(5), the geographic demos' a11y names (4), `/visuals/works` (2 + route copy), and the
23 sentences from B's 10b14 handoffs as they appeared. `verify:i18n`: **100%** —
175/175 headers, 101,497/101,497 sentences.

### Three code leaks — the dictionary had them, the pages never asked

| where | leak | fix |
| --- | --- | --- |
| `docs/doc-entry.tsx` `StatusBadge` | three literals on every registry and family page | threaded through `tcs` |
| `app/explore/page.tsx`, `browse-explorer.tsx` | discovery titles printed raw (three places) | `tcs(entry.title)` |
| `demo/islands/geo-demo.tsx` | four `ariaLabel`/`ariaDescription` strings read aloud in English | `tcs` |

### The runtime gate

`qa/i18n-live.mjs`: chrome **✓ every label translated or reviewed**; prose 196/206
routes clean. The ten that remain are all `/visuals/**` (B's sample and descriptive
copy — reported, not allowed). The last six non-Visuals sentences were checked
against their sources and are specimen *values*; the extractor draws that line
explicitly and the runtime walker cannot see it, so they are listed in the probe's
allowance with the reason.

### `qa/visuals-v2.mjs` — the cutover, measured

82 capabilities; one 180px stage for every card, none empty; 3 columns at 1440, 4
at 1920; no refusal panels; 9 styles and 14 registered palettes (names read from
the page); the custom-palette explanation; `visual.venn` drawn and re-rendered on
each of the style/size/palette axes; Copy Usage returning the state on screen; the
Chinese route translated. Palette names are not hard-coded: 10B.13's six presets
(four Catppuccin) were replaced by 10B.14's fourteen LUC-owned ones, and a probe
demanding "Catppuccin Mocha" would have failed on the newer, deliberate decision.

`qa/i18n-chrome-pin-visuals.mjs` makes the recurring part repeatable — Visuals keeps
adding plates, their titles are Visuals-owned sample content, and the script pins
**only** `/visuals/**` while preserving every reason already written.

### Verified snapshot

Preview rebuilt from NAV-004 + 10B.13 + 10B.14 + this integration: sidebar continuity
168/168 English and 168/168 Chinese, 4 mobile routes, area switching intact;
behaviour 155/155; journeys 7/7; route health 358/358; navigation all groups;
v2-pages 76/76 · 228 examples; thumbnails 79/76/0 both locales; `@luc/ui` 963/963;
showcase 168/168; docs registry up to date; tsc and eslint clean.

**Open, not mine:** ten `/visuals/**` routes still show English prose (B's copy);
B's later commits `cf3c7c4a` and `2af36848` landed after these runs, so the verified
snapshot is `4e3053c1` + this commit, and the one unit test that failed mid-session
(`fits every card preview into the box a card can offer`) passed on re-run — B was
editing `lib/visuals/catalog.ts` at that moment.
