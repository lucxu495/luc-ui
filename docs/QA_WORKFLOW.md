# Luc UI — QA and verification workflow

This document is the contract for how Luc UI is verified. It exists because the
original QA suite grew to 91 routes, 132 axe scans and 71 behaviour checks and then
took **25–58 minutes per run**, almost none of which was spent testing anything
new. The current tiers keep the same coverage and finish a full milestone sweep
in about five minutes.

The registry in `apps/showcase/qa/routes.mjs` is the single source of truth for
coverage: **101 entries today (91 non-provider + 10 provider)**. Phase 2 added six
of them — `/foundations/themes`, `/patterns/industries`, and the four Design Lab
routes under the `experiments` group. A route that is not in the registry is not
covered by any tier, so add the entry in the same change as the page.

Read §7 before running anything.

---

## 1. Tiers

| Command | What it does | Target on this host | When |
| --- | --- | --- | --- |
| `pnpm verify` | typecheck · lint · 417 unit tests · package build · publint · consumer isolation + bundle baseline · attw | **~1.5 min** | after every meaningful edit |
| `pnpm qa:quick` | the **default loop**: routes affected by the diff (alias of `qa:changed` with the bounded 2 workers) | **~1 min** | while iterating on UI |
| `pnpm qa:charts` | the chart-primitive loop: affected chart routes only | **~30 s** | while iterating on a chart |
| `pnpm qa:changed` | routes reachable from the working-tree diff: dark + light + mobile, axe, screenshots, console + hydration | **~1 min** | while iterating on UI |
| `pnpm qa:behaviour` | all 155 behaviour checks, no route sweep | **~4 min** | after touching behaviour/ARIA |
| `pnpm qa:live` | the 155 behaviour checks on the running Showcase (alias of `qa:behaviour`): the real-browser interaction tier | **~4 min** | when interaction is what changed |
| `pnpm qa:full` | all 357 registered routes + all 155 behaviour checks, deterministic provider | **~15 min** | end of a feature set |
| `pnpm qa:providers` | live TradingView: all 10 provider routes swept + the wrapper contract asserted | **~1.1 min** | before freezing/release |
| `pnpm qa:baseline` | 25 host-local pixel baselines (10 on macOS, 25 on Linux) | **~25 s** | before freezing/release |
| `pnpm qa:release` | `verify` → `qa:preview-inputs` → `qa:full` → `qa:product` → `qa:providers` → `qa:baseline` | **~15 min** | release/freeze only |

Every command above starts (and, when the source hash changed, rebuilds) the
Showcase container itself — there is no manual `docker compose` step and no
"start a server and hope it is ready".

**There is also a personal, always-on local preview.** It reuses the same
Dockerfile and base compose file, but runs as its own Compose project
(`luc-ui-standalone-local`, container
`luc-ui-showcase-standalone-local`) on a Docker-assigned loopback port, so it can
never collide with the QA container above or with another project's port. Start
it, find its URL, read its logs and stop it with the commands in
[`LOCAL_PREVIEW.md`](LOCAL_PREVIEW.md). Both containers share the
`luc-ui-standalone/showcase:1.0.0` image tag: if `qa-server.mjs` rebuilds that
tag, run the preview's `up -d --build` again to move the preview onto the new
image.

`-standalone` is not decoration. Until 2026-10-16 this stack lived at
`luc-quant/luc-ui`, where Compose derived the project name `luc-ui` from the
directory name, the image was `luc-ui/showcase:1.0.0` and the QA container was
`luc-ui-showcase`. A second checkout of the same files collides with the first
on all three — the project name also names the default network — so the project,
image and container names are now the standalone ones above.

### Host policy, concurrency and caches (ADR-036)

- **Visual baselines are host-local and both hosts are covered.** The 10
  Showcase surfaces have committed Darwin and Linux baselines; the 15 library
  surfaces currently have Linux baselines. Never diff a Linux-headless
  screenshot against a Mac-Retina baseline: baselines are per-host, with
  viewport, DPR, fonts, locale, theme, animation state and data as-of fixed.
  macOS runs the 10 Showcase assertions and reports the 15 Linux-only tests as
  skips; the mandatory Linux CI job asserts all 25.
- **Concurrency is bounded in code**: workers default to **2** and are clamped at
  **4** (`apps/showcase/qa/config.mjs`). One worker holds a desktop context and a
  lazily created mobile one, so the pages really in flight are roughly twice the
  worker count. A wider run is not a supported QA strategy.
- **The tiers are not interchangeable**: QUICK/`qa:quick` is the default,
  `qa:live`/`qa:behaviour` is the interaction escalation, `qa:full`/`qa:release`
  is acceptance. Escalate only when the lower tier passes.
- **Generated artifacts have a lifecycle**: `artifacts/**` is the only
  disposable root; `pnpm qa:clean` removes class-B output and refuses anything Git
  tracks (so `artifacts/baselines/**` and the committed `artifacts/phase7/**`
  evidence are never deleted). Generated framework caches (`apps/showcase/.next`)
  are pruned by `pnpm cache:prune` with a bound
  (`pnpm cache:prune --dry-run`, `--if-over=2048` for MiB) and only while the dev
  server is stopped; `pnpm qa:clean` reports their size so an unbounded cache is
  visible.

### Selecting routes and groups

```bash
# explicit routes
pnpm qa:changed -- --routes=buttons,components-slider

# a whole family
pnpm qa:changed -- --route-groups=charts

# one behaviour group
pnpm qa:behaviour -- --group=primitives
pnpm qa:behaviour -- --group=providers

# environment equivalents
LUC_QA_ROUTES=data-table,charts-timeseries pnpm qa:changed
LUC_QA_GROUPS=forms pnpm qa:behaviour
LUC_QA_BASE_URL=http://127.0.0.1:3000 pnpm qa:full
```

Tuning knobs (all optional): `--workers=N`, `--themes=dark`, `--viewports=desktop`,
`--timeout-scale=1.5`, `--out=<dir>`, `--verbose`.

---

## 2. Readiness: never wait for a third party

The old suite called `page.waitForLoadState("networkidle")` on every route. On a
TradingView page that is a duration decided by TradingView: it either resolved
by luck or burned its full timeout. The provider block had a second, worse bug —
it waited for the loading placeholders to disappear *before* scrolling the lazy
widget into view, so the condition could never become true. That pattern alone
cost **~9 minutes per run**.

The contract now is:

1. `domcontentloaded` for the document (Playwright's `goto`).
2. `data-luc-hydrated="1"` on `<html>` — set by the Showcase shell from a React
   effect, i.e. "the application is hydrated". Missing ⇒ the page is broken, and
   QA fails loudly instead of screenshotting an unhydrated page.
3. `document.fonts.ready`.
4. `data-luc-tv-status="idle|loading|ready|error"` on every TradingView wrapper
   — Luc UI's own lifecycle attribute, not the provider's markup. **And only after
   the widget has been scrolled into view**, because that is what starts the lazy
   load.
5. A short, bounded settle (≈200–300 ms) for layout.

Every wait is bounded and every timeout that fires is counted in
`artifacts/qa-report.json`.

### Instant scrolling

The Showcase sets `scroll-behavior: smooth`. A scripted read-through cannot keep
up with a smooth scroll — each `scrollTo` re-targets the animation, the page
never reaches the bottom, and content below the first screen is never
intersected. The QA helpers force `scroll-behavior: auto` for the pass and
restore it afterwards.

---

## 3. Deterministic provider vs live provider

Two different questions, two different tiers:

| Question | Tier | How |
| --- | --- | --- |
| Does Luc UI's wrapper behave correctly? | `qa:full` (default) | `page.route` intercepts the two official hosts and answers with a minimal substitute: a module that registers exactly the custom element the request names, and an embed script that appends one iframe into the widget slot. The real loader, the real lifecycle and the real `data-luc-tv-status` attribute all still run. |
| Does the real TradingView integration work? | `qa:providers` | No interception. The real provider scripts load in a real browser: a route sweep over all ten provider routes, plus the wrapper-contract behaviour group. Measured ~46 s + ~20 s. |

The stub is not a mock of LUC. It replaces *the provider's bytes* and nothing
else — reserved geometry, loading/ready/error surfaces, retry, attribution,
theme bridge and duplicate-mount protection are all exercised for real.

The deterministic tier still asserts: widgets register, iframes render, the
attribution block is present on every container, a theme flip does not stack a
second iframe, an unreachable provider degrades to a retryable error state, and
provider requests are deferred until the widget is in view.

The live tier is not narrower than the deterministic one: every provider route
is swept against the real provider, and `--routes=` narrows it to one widget when
that is what you are debugging.

---

## 4. `qa-report.json`

The report is the diagnostic artifact. It carries:

- `durations.totalMs`, `durations.phases[]` (routes, per behaviour group),
  `durations.routes[]` with `navigationMs`, `readinessMs`, `providerWaitMs`,
  `axeMs`, `screenshotMs`, `mobileMs`;
- `counters` — console errors, page errors, failed requests, axe scans/errors,
  provider timeouts, provider ready/error transitions, theme misses;
- `behaviour[]`, `axe[]`, `problems[]`, `selectedRoutes[]`, `workers`.

`qa-report.json` is always the most recent run; `reports/<mode>.json` keeps one
per tier, so a release run's full sweep is not overwritten by the provider smoke
that follows it.

Answer "why was this run slow?" from this file. Do not guess, and do not infer
timing from filesystem timestamps.

---

## 5. Artifacts

See `artifacts/README.md`. In short: `artifacts/baselines/**` is the only
committed *visual* output; the other committed artifacts (`reports/`,
`consumer-capture/`, `phase7/`) are evidence, not scratch. Everything else under
`artifacts/` is regenerated and ignored by git. `pnpm qa:clean` removes exactly
the generated paths, refuses any target that Git tracks, and never touches
baselines.

`pnpm qa:baseline` asserts the committed baselines with real pixel diffing.
Charts are excluded on purpose: canvas output legitimately differs between
machines, and the chart behaviour checks assert the mark counts that matter.
`pnpm qa:baseline:update` regenerates baselines — treat that as a review event.

Two suites, two file conventions, and one collector rule — which is what
`qa:baseline` was missing. `playwright.config.mjs` said `testDir: "./tests"` and
nothing else, so Playwright also collected `tests/unit/**`, the **Vitest** suites
that `pnpm test:showcase` runs, and the gate died before its first assertion with
`Cannot find package 'vitest' imported from tests/unit/summary-budget.test.ts`.
`testMatch: "**/*.spec.mjs"` fixes that: the two baseline suites are the
`.spec.mjs` files and only those.

That failure had a second cost worth writing down. The gate had been un-runnable,
so **nobody could have noticed the baselines going stale** — and four of them had.
On the first run after the fix, `/components/buttons`, `/blocks`,
`/charts/line-chart` and `/motion/card-stack` differed, every one of them by
being *shorter* than its baseline (4393→3008, 5176→2735, 7006→5636, 5763→4389
px). The pixels were reviewed rather than assumed: the pages render complete —
the example counts are asserted by `qa/v2-pages.mjs` and the routes are healthy —
and the difference is the accumulated product work of the day (the Blocks gallery
lost five one-line wrappers, and the V2 pages lost the material that moved behind
the example disclosures). Those four baselines are re-generated in this commit,
which is the review event this file asks for.

Playwright's response to a missing snapshot is to write one into the repository.
That is never an acceptable CI outcome: a missing platform baseline would become
an unreviewed baseline from whichever runner happened to execute first. The two
suites now share `tests/baseline-host.mjs`; `requireHostedBaseline` reports the
missing host as a skip with an ADR-036 reason, while every baseline that does
exist still asserts normally.

The committed set is:

- `tests/visual.spec.mjs`: 15 Linux library surfaces;
- `tests/showcase.spec.mjs`: 10 Showcase surfaces on Darwin and Linux.

On macOS the local result is 10 passed and 15 skipped. The mandatory
`visual regression (Linux baselines)` CI job asserts all 25. Baselines are only
updated after the expected/actual/diff review recorded in
[`audits/RELEASE_V1_0_1_VISUAL_ACCEPTANCE.md`](./audits/RELEASE_V1_0_1_VISUAL_ACCEPTANCE.md).

---

## 6. Builds and the QA server

The host `next build` fails in this sandbox: Turbopack's PostCSS worker cannot
bind a port. A cold failure once cost 25 minutes before it was noticed.

- The production Showcase build happens **in Docker only**.
- `scripts/qa-server.mjs` hashes the inputs the image copies. Unchanged ⇒ the
  running container is reused. Changed ⇒ `docker compose up -d --build`, bounded
  by `LUC_QA_BUILD_TIMEOUT_MS` (default 10 min), with an actionable error.
- After start it polls `http://127.0.0.1:${LUC_UI_SHOWCASE_PORT:-3000}` until the
  container answers, so QA never races the server.
- The port stays bound to loopback.

```bash
pnpm qa:serve          # ensure the server is current, change nothing else
pnpm qa:rebuild        # force a rebuild
```

---

## 7. Rules for a Codex session

1. **Never run `qa:release` after an ordinary edit.** Use `pnpm verify`.
2. While iterating: `pnpm verify`, then `pnpm qa:changed` (it maps the diff for
   you) or a targeted `--routes=`/`--group=`.
3. **Freeze the code before launching a full or release tier.** Do not keep
   editing while `qa:full` is running — that is how the historical 58-minute
   outlier happened: a run competing with the agent's own edits.
4. Never wait for third-party network idle. Use the readiness contract in §2.
5. Run `qa:full` once, at milestone completion, not per change.
6. If a build exceeds its bound, stop and read the error; do not retry blindly.
7. Read `qa-report.json` timings before theorising about a slowdown.
8. Luc UI is V1-frozen: add a component only for a proven product need.

### Verification by change type

| Change | Minimum |
| --- | --- |
| Docs, comments, README | none (say so) |
| Token or shared style | `verify` + `qa:changed` (maps to every route) |
| One component | `verify` + `qa:changed --routes=<slug>` + `--group=primitives` if behaviour changed |
| Charts | `verify` + `qa:charts` + `qa:live` (`--group=charts`) |
| TradingView wrapper | `verify` + `qa:behaviour --group=providers` + `qa:providers` |
| Packaging / exports | `verify` (includes publint, attw, consumer isolation) |
| Navigation, discovery or copy | `verify` + `qa:nav` + `qa:journey` |
| Before freezing a version | `qa:release` |

### Mobile overflow (`qa:overflow`)

Three checks already measured a document that scrolls sideways, and between them
they covered sixteen routes: `geometry.mjs` measures nine routes at six widths,
`behaviour.mjs` measures seven at 720px as a 200%-zoom proxy, and
`sidebar-continuity.mjs` measures the Components tree. `qa/mobile-overflow.mjs`
measures **every registered route at 390×844, in both locales** — 196 routes,
392 scans, about 80 seconds at three workers — and names the widest element
responsible rather than only the pixel count. It found nine pages on its first
run; the ones in shared chrome are fixed, and `/visuals/skins` is Agent B's.

Run it after any change to a shared frame (`Example`, `Demo`, `DocPage`,
`DataTable`, `SwatchGrid`), because a frame that stops letting its children
shrink takes every page that uses it with it.

### Controls that do nothing (`qa:dead-controls`)

"Decorative buttons that do nothing" is a named unacceptable pattern for a
reference page, and nothing measured it: `route-health` answers "does the page
return 200", `behaviour` exercises the interactions somebody wrote a check for,
and neither can see the control nobody wired up. `qa/dead-controls.mjs` clicks
every enabled button in `main` on the Experiences, Patterns and Build routes —
213 of them across thirty routes — and compares the whole document before and
after: text, every `aria-*` state, every form control's properties, the URL and
open dialogs.

It found one real defect on its first trustworthy run (`Row actions` on four
pattern pages, inert; now a working menu) and taught the rest of its rules: it
skips already-active controls, drag handles and copy buttons, proves "already in
the target state" by clicking a sibling, and records a restore-to-default with
nothing to restore as *benign with a reason* rather than dropping it.

#### The same probe on the Components pages (`--claims`)

The Build surface is an application, so *every* control there is supposed to do
something. A Components page is not: `<Button>Primary</Button>` in a specimen is
the page's subject, not a control the product failed to wire, and clicking every
drawn button would produce noise, not findings. So `--claims` runs the same
probe over a Components sample and only clicks controls that **claim a state** —
`aria-pressed`, `aria-checked`, `aria-expanded`, a `data-state`, or a role that
implies one (`switch`, `checkbox`, `radio`, `tab`, `option`). A control that
says "I hold a state" and then does not move is a defect; a drawn button is not.

Two false positives were reproduced and fixed in the probe before it was trusted,
both from pointing it at pages it had never seen:

- `/components/buttons` was accused of shipping a dead "Saving" button. The
  button is `loading`: it sets `aria-busy` and `data-loading` and swallows its
  own click on purpose, so Playwright's click timed out and the signature never
  moved. Declared-busy controls are now skipped **and counted** in the summary —
  a skipped control is not a control that passed.
- `/components/inputs` reported a `role="combobox"` that could not be clicked at
  all. It sits behind the Playground's collapsed `<details>`, which the browser
  removes from hit-testing. The probe now opens every closed disclosure in `main`
  before reading controls (90 across the sample), which is what a reader does.

It also gained a provenance field per finding (`#index role "name" in "section"
[data-slot=…]`) and now refuses a `--routes=` list in which *any* slug matches
nothing — the first version silently measured the two slugs it recognised out of
four, and the guard immediately caught a bad slug in this file's own default
list.

It found two genuine defects on its first run, both fixed in the product:

- `/components/toggle` rendered a "Formatting" toolbar from plain
  `ToolbarButton`s: the Bold / Italic / Underline controls could not toggle and
  exposed no pressed state. They are now a `ToolbarToggleGroup` of
  `ToolbarToggleItem`s, which is what a formatting strip is.
- `/components/selection` documented the mixed state with
  `checked="indeterminate"` and no handler, so the page that says "each state
  change is animated" had one control whose state could not change. It is now a
  real tri-state control that starts mixed and resolves on press.

### The product tier (`qa:product`)

Four probes measure what a route sweep cannot, and since 2026-10-13 they are one
tier that `qa:release` runs after `qa:full`:

| probe | question | current result |
| --- | --- | --- |
| `qa:overflow` | does any registered route scroll sideways at 390 px, in either locale? | **0 pages / 392 scans** |
| `qa:dead-controls` | does any enabled button in `main` on the Build surface do nothing? | **0 dead** — 34 routes, 258 buttons, 1 benign |
| `qa:dead-controls --claims` | does any *state-claiming* control on the Components pages do nothing? | **0 dead** — 17 routes, 158 controls, 4 declared busy |
| `qa:reduced-motion` | with `prefers-reduced-motion: reduce`, does anything move, and is any copy hidden by the suppression? | **0 findings** — 16 routes, 7 animate when motion is allowed |
| `qa:reduced-motion --open-overlay` | does the overlay a reader opens animate in, or render with no readable text, under reduce? | **0 findings** — 6 routes, 4 open and 4 entry animations suppressed |
| `qa:i18n-live` | does a Chinese route show English prose or an English chrome label? | **red on six Visuals routes, 303 segments** — see below |

The Chinese gate's residue was 439 segments on ten routes on 2026-10-13 and is 303
on six after the 10B.22 merge and the shared dictionary work of 2026-10-14. Every
remaining segment was inside a Visuals *drawing* that does not declare itself the
way a plate does (`role="img"`), except four sentences on two pages that never
reached `tcs()`. Both are Agent B's files, both were written up in
`phase-10b/handoffs/2026-10-14-agent-a-to-agent-b-i18n-final-residue.md`, and
both moved with the Visuals product to its own repository, where that write-up
now lives. The probe still records the container for every segment in
`artifacts/i18n-live/prose-context.json`. Every route in *this* repository is
clean, and every chrome label is translated or reviewed.

The dead-control probe earned its place by being boring twice: 213 buttons over
30 routes, then 258 over 34. The four routes it gained are the Studio editors —
the scope had asked for a `build` group that no route carries, so `studios` was
never measured while the probe read as complete. Both runs reported the same
single benign case and nothing else, which is the evidence for putting it in the
release tier rather than running it by hand.

`qa:reduced-motion` is the newest of the three and the only one that measures an
accessibility contract rather than a defect class the owner named. It loads each
Motion route twice — once with `prefers-reduced-motion: reduce`, once without —
and requires four things: the page renders, no running animation touches
`transform`, the geometry is *at rest* (sampled until two consecutive reads agree,
because a page still finishing its layout is not motion), no heading or paragraph
resolves to `opacity: 0`, and the reduced run never animates *more* than the
unrestricted one. That last clause is what stops a page that animates nothing
anywhere from passing and proving nothing.

It carries its own negative regression, wired into the tier:

```bash
node qa/reduced-motion.mjs --negative-test --routes=motion-kinetic
node qa/reduced-motion.mjs --open-overlay --negative-test --routes=dialog
node qa/dead-controls.mjs --claims --negative-test --routes=components-toggle
```

…injects a `requestAnimationFrame` loop and an `opacity: 0` paragraph into the
page at runtime and *requires* the probe to report both, exiting 2 if it does
not. JavaScript-driven motion is the class the CSS clamp in
`packages/ui/src/styles/base.css` (`animation-duration: 0.001ms !important`
under reduce) cannot suppress, so a probe that catches the injected loop catches
the real risk; the first version of this file could not, and said so when the
self-test was run. The second line does the same for the dead-control probe: it
appends a `role="switch"` with `aria-checked="false"` and no handler to `main`
and requires the report to contain it, because a candidate filter that is too
narrow would otherwise report "0 with no effect" on every route forever.

#### The overlay pass (`--open-overlay`)

Everything above measures a page *as it loads*, and an overlay is the surface
that is not there yet: Radix mounts a dialog's content when it opens and removes
it when it closes, so a probe that never presses the trigger has never seen the
thing that animates most. `--open-overlay` presses it, and then asks three
questions — did an overlay open, does it carry readable text under reduce, and
did its *entry* animation run under reduce (sampled immediately after the press,
which is when it would be running).

The failure it exists for is specific and invisible to every other gate: a dialog
whose entry keyframes start at `opacity: 0` renders **invisible** once the
reduced-motion clamp suppresses the animation — the content is in the DOM, axe is
happy and a closed-state screenshot shows nothing. Measured on six routes: four
open (`dialog`, `components-alert-dialog`, `components-sheet`, `components-popover`,
`components-menus`, `components-command` all open now) and their entry animations
— `luc-overlay-in`, `luc-anchored-in`, `luc-sheet-in-right` — run when motion is
allowed and do not run under reduce, which is the same shape the Motion routes
already had.

The first run found two routes whose trigger was a plain `<Button>` with no
`aria-haspopup`, so nothing announced the dialog and the probe could not find it:
`/components/sheet` (four edge buttons driving one controlled Sheet) and
`/components/command` (the "Open palette" affordance). Both declare
`aria-haspopup="dialog"` now. The Sheet's example code was updated with them,
because the snippet showed `<SheetTrigger asChild>` while the live specimen was
a controlled Sheet — the page was teaching a different composition than it drew.

Opening the overlay also moves the hidden-copy and geometry walks outside `main`,
which is where a portal puts its content. That exposed one thing worth writing
down: while a modal is open the page behind it is correctly `aria-hidden`, so the
hidden-copy rule skips it — the negative test injects into whichever scope the
probe is reading, and had to be reordered to do so *after* the overlay opens.

`qa:i18n-live` was red on ten Visuals routes when this gate was written, and the
release tier was red with it rather than green without it. Those routes are not
in this repository any more: the Visuals product, its residue classification and
the `phase-10b` write-up of it moved to the `luc-visuals` repository, where the
same gate runs over the same mechanism. The evidence
(`chrome.json`, `chrome-context.json`, `chrome-specimen.json`, `suppressed.json`,
`report.json`) is committed here under `artifacts/i18n-live/`, and the
`CHROME_SKIP` allow-list was never widened to reach green.

### Two development sessions at once (`qa:dev-isolation`)

Two agents work this Showcase at the same time, and until 2026-10-13 both used
one `next dev` output directory. `next dev` guards a shared `distDir` with a
lock **inside** it, so the guard disappears exactly when it is needed: a cache
prune behind a live server (§ADR-036, cache lifecycle) removes the lock and
leaves the server running, and the next `next dev` starts unopposed. Two servers
then own one Turbopack cache and one manifest set — the first stops serving
routes it served seconds earlier.

Each session now selects its own output directory (`LUC_NEXT_DIST_DIR`:
`pnpm dev:a` → `.next-a`:3300, `pnpm dev:b` → `.next-b`:3301). The default
remains `.next`, so nothing else in this document changes.

`qa/dev-isolation.mjs` is the gate, and it has two halves:

- `--mode=isolation` (default) starts two sessions on throwaway `.next-qa-*`
  directories, requires each to hold its own lock, and requires every chunk the
  returned HTML references to resolve **on the server that returned it** — the
  cross-check a foreign module graph fails. It then edits a shared stylesheet
  and requires both sessions to keep serving the page.
- `--mode=collision` reproduces the historical failure on purpose: one output
  directory, the lock moved aside, a second server compiling the same routes
  into it. It exits **0 only when the first server is demonstrably damaged**, and
  **2** when it cannot reproduce — because then the documentation is wrong
  rather than the code being right.

It never touches `.next`, the Docker preview or another agent's server, and it
removes its own directories. `pnpm dev:guard` measures every session's cache,
refuses a prune while any session's lock names a live pid, and reports lockless
("stray") servers by pid instead of killing them. `scripts/dev-guard.test.mjs`
and `scripts/cache-prune.test.mjs` cover the multi-session cases and run against
throwaway checkouts, so `pnpm qa:clean:test` no longer prunes the cache of a
session you have open.

### Journeys (`qa:journey`)

Route health answers "does this page return 200" and the group gates answer "does
this component behave". Neither notices a *discovery path* that dead-ends, a copy
button that copies the wrong string, or a language switch that loses the reader's
place — which is the gap the independent audit recorded as `QA-002`. `qa/journey.mjs`
walks seven journeys by clicking what a person clicks: Home → Components →
catalogue → detail → Preview/Code; Components → Motion → a variant → copy;
Home → Charts → a time axis and a control; Home → Docs → installation → API →
pager; More → Blocks → Templates → Patterns → Experiences; English → Chinese →
deep link → refresh → Back; and the mobile drawer. It writes one screenshot per
journey plus `journeys.json` to
`artifacts/screenshots/showcase-transformation/journeys/`, and exits non-zero on
the first failing step.

---

## 8. Measuring a change to QA itself

QA changes are measured, not asserted. Run the tier before and after with
`time`, and compare `durations` in `qa-report.json`. A QA change that does not
reduce wall-clock time and does not change coverage should not be kept.
