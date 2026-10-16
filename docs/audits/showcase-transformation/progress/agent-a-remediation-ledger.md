# Agent A — QA Remediation Ledger

Responds to Agent C's independent audit
(`../qa-independent/00_EXECUTIVE_SUMMARY.md` … `07_FINAL_QA_PROTOCOL.md`).
Append-only. Statuses: TODO · IN_PROGRESS · IMPLEMENTED · SELF_TESTED · BLOCKED.

Agent C's findings are not edited here; this file records what was done about them.

---

## WP-0 (P0) — protect the working tree

**Finding**: C-01 — HEAD `83aae8d0` references a module that is not in Git
(`packages/visuals/src/index.ts:58-59 → ./artifacts/studies | ./artifacts/skins`), so a
clean checkout cannot build.

### Manifest (recorded before staging)

**A. Tracked modifications — 105 files**

| Area | Count | Owner |
|---|---|---|
| `luc-ui/packages/visuals/**` | 28 | B |
| `luc-ui/apps/showcase/{app,components,lib}/visuals/**` | 6 | B |
| `luc-ui/apps/showcase/**` (non-visuals) | 67 | A |
| `luc-ui/packages/ui/src/components/native-select.tsx` | 1 | A |
| `luc-ui/docs/**` (QA_WORKFLOW, audits) | 3 | A |

**B. Untracked that MUST be committed (42 entries)**

| Path | Owner | Why |
|---|---|---|
| `packages/visuals/src/artifacts/{render.tsx,skins.ts,studies.ts}` | B | **the P0 module** — `index.ts` imports it |
| `packages/visuals/src/elements/{analysis,events,learning,relations,report,scientific,study,systems}/` (2 files each) | B | element contracts + renderers |
| `packages/visuals/src/__tests__/*.test.tsx` (8) | B | the tests for those elements |
| `packages/visuals/scripts/lib/contrast.mjs` | B | helper imported by its scripts |
| `docs/audits/phase-10b/**` (4) | B | B's phase reports |
| `apps/showcase/qa/*.mjs` (10) | A | the Showcase gate suite |
| `apps/showcase/components/demo/islands/{experience-demo,motion-tiles}.tsx` | A | client islands |
| `apps/showcase/components/docs/local-link.tsx` | A | locale-aware specimen link |
| `apps/showcase/tests/unit/{i18n-prose,summary-budget}.test.ts` | A | regression tests |
| `docker-compose.local.yml` | A | loopback-only local preview |
| `docs/{DEV_MODE,LOCAL_PREVIEW}.md` | A | local runbook |
| `docs/audits/showcase-transformation/{progress,qa-independent}/` | A / C | progress ledger + audit reports |

**C. Never committed (verified ignored or excluded)**

| Path | Why |
|---|---|
| `packages/visuals/dist/`, `packages/visuals/artifacts/` | build output, review PNGs — ignored by `packages/visuals/.gitignore` |
| `luc-ui/artifacts/screenshots/`, `artifacts/qa/`, `artifacts/qa-report.json` | QA output — already ignored |
| `luc-ui/artifacts/qa-independent/` | audit evidence — **ignore rule added in this WP** |
| `**/.next/`, `**/node_modules/`, `*.tsbuildinfo` | build/deps |
| `.env*` | none exist under `luc-ui/` (checked with `find`) |

Facts recorded: `ELEMENT_LIST.length === 79` and `ELEMENT_REGISTRY` keys `79` (read from the
built package), matching the running catalogue banner, card count and 79 detail links.
`.gitignore` was extended by one line (`artifacts/qa-independent/`); the stray temporary
probe `apps/showcase/qa/_tmp-dom.mjs` was deleted (it was my own leftover, not source).

Agent B's source was last modified 23:50 the previous day — **idle at this checkpoint** —
so the tree was stable enough to commit.

### WP-0 outcome

- **Commit 1** `624f4a03` — `packages/visuals/**` (+ its phase reports): the three
  `src/artifacts` modules, eight element families, their tests, the contrast helper.
- **Commit 2** `185f1647` — `packages/ui/**` and `apps/showcase/**`: the QA gate
  suite, the client islands, the i18n extractor fix, the local preview compose file
  and the runbooks.
- `.gitignore` gained one line (`artifacts/qa-independent/`); a stray temporary
  probe (`qa/_tmp-dom.mjs`) was deleted.

**Clean-checkout proof (the acceptance criterion).** `git archive HEAD | tar -x` into
a fresh temporary directory, then:

```
pnpm install --offline --frozen-lockfile   → 641 packages added, 0 downloaded
pnpm -r --no-bail --filter='!luc-ui-workspace' typecheck
    luc-ui/packages/ui        Done
    luc-ui/packages/visuals   Done
    luc-ui/apps/showcase      Done
    luc-web                   Done
pnpm --filter @luc/showcase build          → route table rendered, build succeeded
```

Before the commit the same check failed with six unresolved relative imports in
`@luc/visuals`. **C-01 is closed.**

---

## WP-1 (C-02) — CardStack defaults

**Component** (`packages/ui/src/motion/card-stack.tsx`): new optional `dim` prop
(default `0.28`) makes each layer behind the active one dimmer, so depth is
expressed on the layer instead of left to every caller's card surface. Measured on
the live deck: layer opacity **1.00 / 0.72 / 0.44** (was `1.00` three times).

**Specimen** (`components/demo/islands/d-motion.tsx`, `motion-tiles.tsx`,
`lib/demo/motion/spatial.tsx`): an opaque `Card` instead of `variant="outline"`
(`bg-transparent`), content at the top so the peek strip is empty padding, one
position readout beside the controls instead of a "Card N of 3" inside every card,
and a copyable sample that matches.

**`/motion/spatial`** also had a deck that overflowed its stage by `2 × offsetY` with
its control pill over the third card (`gap −64px`). Card height and stage height are
now explicit and the controls live in the deck's overlay slot.

**Evidence**: `artifacts/qa-independent/shots/cardstack-desktop-before.png` (after the
fix) and `cardstack.json`; `qa/card-stack.mjs` gained four geometry records —
opaque front surface, strictly decreasing layer opacity, no back-card text outside
the front card, controls within 56px — plus a reduced-motion arrangement check. All
four runs pass on `/motion/card-stack` and `/motion/spatial`, desktop and 390px.

## WP-2 (C-03) — MorphingDialog geometry

Two independent causes, both fixed:

1. `layoutId` sat on the `fixed inset-0` centring frame together with
   `luc-overlay-in`, which animates `transform`. Motion's layout projection writes
   `transform` from a measured rect, so the frame settled at the trigger's width and
   stayed pinned to the top-left. The frame now fades only (`luc-scrim-in`), and
   `layoutId` moved to the panel — the thing that is supposed to morph.
2. The demo passed `w-[26rem]` as `className`, which lands on the **frame**, not the
   panel: that is where the measured 416px width came from. The panel owns its width
   (`width="md"`), and the specimen is now a real dialog (title, description, a
   definition list, Cancel, Open the run, a named close control).

**Evidence**: `qa/motion.mjs` asserts settled geometry at **1440 / 390 / 1280×640**:
panel centre within 5% of the viewport centre, panel inside the viewport, opaque
panel, frame equal to the viewport, a named close control, Escape closes.
`shot: artifacts/qa-independent/shots/morphing-fixed-mobile.png`. All pass.

## WP-3 (C-04) — Localized leads

The lead now renders through the translation layer: `DocEntryHeader` takes a
`lead`, and `DocEntryPage` passes `entryLead(entry, tcs)` (new `lib/docs/lead.ts`).
The same fix went to `family-page.tsx`, `app/components/page.tsx` and
`app/docs/page.tsx`, which printed `{family.summary}` / `{group.summary}` raw.

The chart family composes **one** translated template with the translated chart
name (76 leads: one dictionary entry), via a generated `chartName`/`chartEngine`.

The blind spot is closed: `loadRegistryProse()` reads the registry with the
TypeScript AST, `i18n-coverage.mjs` counts those sentences, and
`tests/unit/registry-lead-i18n.test.ts` fails if a registry summary has no
translation. **Negative case demonstrated**: deleting one key took the gate from
100% to `169 documentation sentence(s) without a translation`.

~170 summaries were translated by hand; source-code identifiers and proper nouns
were preserved. Live check: `/zh/components/popover`, `/zh/charts/heatmap-chart`,
`/zh/motion/card-stack` and five more now open in Chinese.

## WP-4 (C-05) — Explore counts

`app/explore/page.tsx` derives capability counts from the registries
(`docEntries` by group, `ELEMENT_LIST`, `BLOCKS`) and shows the discovery-page count
as a separate line only when it differs. Live: **79 visual elements (4 documentation
pages)**, **12 blocks (1 documentation page)**, 103 components, 76 charts, 35 motion.

`qa/navigation.mjs` cross-checks every tile against the registry — and against the
Visuals catalogue's own banner and the Blocks gallery's own "All (N)" chip.

## WP-5 — Motion is a component family

`areas.ts` gained a documented `nested` tier and a `parent`: Motion is `nested`
under `components`, so the header is **Components · Charts · Visuals · More** and
Motion is found inside Components. The Components sidebar lists the Motion group
(and a `/motion/**` page keeps the component families beside it), so a deep link
still belongs somewhere. The catalogue gained a **Motion and interaction** section
listing all 35 entries across five families.

`tests/unit/discovery-areas.test.ts` asserts the new tiers, and
`qa/navigation.mjs` asserts the pixels: three primaries, ≥5 motion links on
`/components`, a Motion heading, the right sidebar groups on a motion deep link,
and no Motion entry marked active in the header.

## WP-7 — Discovery and demo-first

- **Component catalogue previews**: one live specimen per family (rule: the first
  entry whose demo is not a `stage` demo), rendered compact — specimen only, code
  one click away. Ten families render a preview; a family with no lightweight demo
  shows none rather than a squeezed one. First specimen now at **514px**.
- **Motion catalogue**: the "One grammar" explainer moved below the catalogue, so
  the first tile starts at **356px** (it was behind an explainer card before).
- **MOT-002** (per-example preview/code on the eight motion gallery pages) is **not**
  done — recorded below.

## WP-8 — Gates that would have caught these

| Assertion | Gate |
|---|---|
| CardStack layer opacity order, opaque front surface, no text in the peek, control proximity, reduced-motion arrangement | `qa/card-stack.mjs` |
| MorphingDialog settled centre/inset/opacity/frame/close/Escape at three viewports | `qa/motion.mjs` |
| Explore counts vs registry, Visuals banner and Blocks chip | `qa/navigation.mjs` |
| Motion discoverability inside Components and on a deep link | `qa/navigation.mjs` |
| Every registry summary has a translation | `tests/unit/registry-lead-i18n.test.ts` |
| Every internal link on a Chinese page is prefixed (326 routes) | `qa/locale.mjs --all` |

## Final state

HEAD `7bc10f60`, working tree clean. Image built 02:47, HEAD committed 02:51 from the
same file contents (verified: no source file newer than the image).

| Gate | Result |
|---|---|
| `route-health` | **326/326 healthy**, exit 0 |
| `navigation` | exit 0 (UX-005, WB-005, CHT-002, IA-005, WP-4 counts, WP-5 discovery) |
| `card-stack` | 4/4 with the new geometry records |
| `playground` | 5/5 |
| `motion` | exit 0 (26 tiles, replay, reduced motion, morphing geometry) |
| `preview-check` | 6/6 |
| `outline --all` | exit 0 |
| `locale --all` | **326/326 clean** — Agent B fixed the visuals half in `0d3229bb` |
| `standalone` | exit 0 |
| `verify:i18n` | **90547/90547 (100%)**, and the registry leads are now counted |
| unit tests | 145/145 (17 files) |
| typecheck / lint | 0 / 0 |
| clean-checkout install + typecheck + build | **passes** |

## Still open (recorded, not claimed)

1. **MOT-002** — per-example preview/code on motion detail pages (the audit's
   largest remaining gap; the benchmark comparison in `02_BENCHMARK_COMPARISON.md`
   is the acceptance reference).
2. **UX-003 / C-09** — the five hand-written component pages still differ from the
   registry pages (measured: ~40 more words and ~100px before the specimen).
3. **DOC-003 / C-10** — long copy: `/charts/line-chart` 1422 words, `/components/popover`
   1097, `/motion/kinetic` 1005, against a 700-word budget.
4. **IA-007 / C-12** — Blocks, Templates, Patterns and Experiences still share one
   area in the sidebar.
5. **P3** — the Visuals catalogue's `Tables` family chip is still English on `/zh`
   (Agent B's file; reported rather than edited).

---

# Phase 3 — final integration & release stabilization (2026-10-12)

Single owner, autonomous. Baseline `e069b906` → release candidate **`7fe4404b`**.

## Batch A — baseline

`main` at `e069b906`, working tree clean. All six referenced commits verified as
**ancestors** of HEAD with `git merge-base --is-ancestor` (not assumed from the
reports): `624f4a03`, `185f1647`, `7bc10f60`, `e069b906`, `0d3229bb`, `2e8c2023`.
`ELEMENT_LIST.length` read from the built package: **79**; its 3 `src/artifacts`
modules and 8 element families are tracked (Agent B verified the same from a clean
archive). No `.env`, credential, build output or screenshot is tracked.

## Batch B — Visuals Chinese copy merged

Inspected the merge tool before running it: it reads **16 handoff files** across
five phase directories, so "just run the merge" would have been a leap. A
per-file analysis (same `pairsFrom` logic) showed fifteen files contributed
nothing — 1075 sentences already translated — and only
`showcase-10b9-visuals-copy-zh.json` added **153**. Its 159 values were checked
first: 0 without Chinese, 0 ASCII-only, 0 duplicate keys. The one refusal overall
is `⌘↵` in an old phase-9 file, which is a keyboard chord, not prose.

`node scripts/i18n-merge.mjs --write` → one file changed, +156 lines. Verified in
the Docker standard-alone build: `/zh/visuals/elements` renders **4461 Han
characters in the server HTML** with **0 unprefixed internal links**, and
`表格` / `迷你折线` / `视觉元素` are present. `verify:i18n` stays green.

## Batch C — locale and standalone: the reported loop, reproduced and fixed

Three environments tested, per the handoff's conflicting reports.

| Environment | `/zh` before | after |
|---|---|---|
| Docker container (`HOSTNAME=0.0.0.0`) | 200 | 200 |
| Host standalone, `HOSTNAME=0.0.0.0` | 200 | 200 |
| Host standalone, `HOSTNAME=127.0.0.1` | **307 → `/zh` (forever)** | **200** |

The root cause came from a temporary diagnostic rather than from theory:

```
request.url            http://localhost:3405/zh/components/buttons
request.headers.host   127.0.0.1:3405
request.nextUrl.origin http://localhost:3405
```

`NextResponse.rewrite()` requires an absolute URL, and the runtime compares that
origin with its *own* idea of the origin rather than with the host the client
used. When they disagree — which is exactly what `HOSTNAME=127.0.0.1` produces —
the rewrite is treated as cross-origin and answered with `307 Location: /zh`: a
redirect to the path just requested. A first attempt to derive the origin from the
`host` header failed the same way (mismatch in the other direction), and a
path-only destination is refused outright ("Please use only absolute URLs").

The prefix is now stripped by a `beforeFiles` rewrite in `next.config.ts`,
compiled into the route manifest with no origin to negotiate; middleware only
resolves the locale, sets the cookie and passes the header on.

**One consequence, caught by testing rather than by reasoning**: config redirects
run before the rewrite, so alias URLs under the prefix (`/zh/components/button`)
became 404s. They now have their own rules and **308 to the canonical Chinese
URL** — better than the old behaviour, which rendered the canonical page under the
alias URL without redirecting at all.

## Batch D — documentation

`docs:registry:check` → **up to date** on the committed tree (the staleness Agent B
noticed was resolved by the WP-1/WP-2 regeneration). The generated API carries
`"name": "dim"` for CardStack (the new optional prop) and the live page mentions
it; the MorphingDialog usage example is the corrected one (no `w-[26rem]` on the
frame, and it says where `className` lands).

## Batch E/F/G/H — verification

Clean checkout of `7fe4404b` (`git archive HEAD | tar -x`, outside the working
tree): `pnpm install --offline --frozen-lockfile` → 641 packages, 0 downloaded;
`pnpm -r typecheck` → ui, visuals, showcase **and luc-web** Done; lint → Done ×4;
`pnpm --filter @luc/ui test:showcase` → 145/145; showcase build → 337 static
pages; docs registry up to date; `verify:i18n` → 90547/90547.

Its standalone bundle, started with the previously-failing
`HOSTNAME=127.0.0.1`: `/zh` → **200**; `/` (zh-CN) → 307 `/zh`; four zh routes →
200 with 513–1783 Han characters and **0 unprefixed links**.

## Two defects found by this phase's own verification

1. **KineticHeadline broke Chinese only.** It split on whitespace and rendered
   each unit `inline-block whitespace-pre`, so a Chinese sentence — no spaces —
   was one 501px span in a 339px headline: **131px of horizontal scroll on `/zh`
   at 390px** (the English page measured −11px, which is why no previous check saw
   it). Units now come from `Intl.Segmenter` with a binding rule (a hyphen or
   apostrophe joins the word that follows), and the rendered string is
   byte-identical to the input — verified for four strings. Widest unit on `/zh`:
   501px → **99px**; document overflow −11px.
2. **`qa/locale.mjs --all` reported a timeout as a link defect** — `/zh/charts/
   ecdf-chart` answers in 30ms when asked directly. The sweep now retries once and
   reports a still-failing navigation as a timeout, separately. The gate's
   morphing-frame assertion was also over-strict (it compared a `position: fixed`
   frame with `window.innerWidth`, i.e. ignored the scrollbar); it now allows one
   scrollbar and still fails for any frame a third of the viewport wide.

## Release-candidate gate results (Docker, image built from `7fe4404b`)

| Gate | Result |
|---|---|
| `route-health` | **326/326** |
| `locale --all` | **326/326 clean** (all scenarios + full sweep) |
| `navigation` | exit 0 (incl. WP-4 counts, WP-5 discovery, IA-005 header) |
| `card-stack` | exit 0 (4 runs, geometry records) |
| `motion` | exit 0 (26 tiles, replay, reduced motion, morphing × 3 viewports) |
| `playground` | exit 0 |
| `preview-check` | 6/6 |
| `outline --all` | exit 0 |
| `standalone` | exit 0 |
| `verify:i18n` | 90547/90547 |
| `docs:registry:check` | up to date |
| showcase unit tests | 145/145 |
| typecheck / lint | 0 / 0 |
| clean-checkout install + build | **passes** |

## Known defects recorded, not fixed here

1. **`@luc/ui` `src/charts/adapters/echarts/axis-time.test.ts` — 29 failures.**
   Pre-existing: the same file fails identically in the clean `c819bc3f` snapshot,
   it is unrelated to anything this phase touched, and chart rendering is verified
   separately by the chart gates and the browser sweeps. Reported rather than
   absorbed into this phase's scope.
2. **Product backlog unchanged** — MOT-002 (per-example preview/code on motion
   detail pages), UX-003 (hand-written component pages), DOC-003 (long copy),
   IA-007 (Blocks/Templates/Patterns/Experiences), and the P3 `Tables` chip, which
   the 10B.9 merge has since fixed.

---

# NAV-001 — sidebar ownership (2026-10-12)

**Reported**: clicking items in the Home sidebar can switch the visible sidebar to
Components. Commit **`1ca407f3`**.

## Reproduction, before touching code

A browser walk of every destination in the Home sidebar — one click each from `/`,
recording URL, sidebar area, groups, active row and browser Back:

| Home sidebar item | before | after |
|---|---|---|
| Documentation / Installation / Theming / API reference | Docs ✓ | unchanged |
| Explore | Explore ✓ | unchanged |
| Components | Components (families + Motion) ✓ | unchanged |
| Charts | Charts ✓ | unchanged |
| Visuals | Visuals ✓ | unchanged |
| **Motion** | **area=Motion, groups=[Components, Motion], active=[]** | **area=Motion, groups=[Motion, Part of], active=[Motion gallery]** |
| Blocks | Blocks ✓ | unchanged |
| Studios | Studios ✓ | unchanged |

So ten of eleven were correct; the defect was Motion, whose sidebar printed the
thirteen component families. Clicking "Motion" and seeing the Components tree is
the reported interaction; on `/motion` there was also no active row at all.

## Root cause

`lib/discovery/areas.ts` — `motion.sidebar` was `["components", "motion"]`, a choice
made in WP-5 to keep the component families visible on a Motion deep link. The
effect was that a Motion page looked like a Components page. The ownership fact was
already declared separately (`parent: "components"`) and was simply not used to
express the relationship.

## Changes

| File | Change |
|---|---|
| `lib/discovery/areas.ts` | `motion.sidebar = ["motion"]`; the `parent` declaration stays and now carries the relationship |
| `components/shell/app-frame.tsx` | a nested area renders its parent as one row under a `shell.partOf` label, derived from `area.parent` |
| `lib/navigation.ts` | the Motion group gains a row for `/motion` itself, so the area landing has an active row |
| `lib/i18n/messages.ts` | `shell.partOf` = 所属, plus 动效图库 and the gallery description |
| `tests/unit/discovery-areas.test.ts` | a nested area must name a real parent and must not borrow the parent's navigation group |
| `qa/navigation.mjs` | NAV-001 block: no component-family links on a Motion page (en + zh), and any menu row pointing at the current page must be marked current |

## Evidence

```
en /motion                 area="Motion" groups=[Motion, Part of] active=[Motion gallery] familyLeak=0 parentLink=true
zh /zh/motion              area="动效"   groups=[动效, 所属]      active=[动效图库]        familyLeak=0 parentLink=true
en /motion/card-stack      area="Motion" groups=[Motion, Part of] active=[CardStack]      familyLeak=0 parentLink=true
zh /zh/motion/card-stack   area="动效"   groups=[动效, 所属]      active=[CardStack]      familyLeak=0 parentLink=true
mobile drawer /zh/motion   groups=[动效, 所属] active=[动效图库] familyLeak=0
```

Screenshots: `artifacts/qa-independent/shots/nav-en-motion.png`,
`nav-zh-zh-motion.png`, `nav-mobile-drawer-zh-motion.png`.

## Two things learned the hard way, both recorded in the commit

1. The first edit landed on the **Components** area (`sidebar: ["motion"]`) instead
   of Motion's. The unit suite caught it immediately (`/components` sidebar became
   `["motion"]`); it is a reminder that two similar declarations in one file are
   easy to confuse and that the tests, not the diff reading, are the check.
2. The new gate assertion at first failed **in Chinese only**, on rows that turned
   out to be the sidebar *header* link (the area landing) rather than a menu row.
   The check is now scoped to `[data-slot="sidebar-menu"]`. The zh rows that matter
   (动效图库, CardStack) were never wrong.

## Verification

All seven browser gates exit 0 (`route-health`, `navigation` incl. NAV-001,
`card-stack`, `motion`, `playground`, `preview-check`, `standalone`),
`outline --all` clean, `locale --all` **326/326 clean**, unit tests **146/146**,
i18n **151/151** navigation labels and **90547/90547** prose, docs registry up to
date. Preview: `127.0.0.1:50016`, image built from `1ca407f3`.

## Recorded, not fixed: IA-007

`/templates`, `/patterns` and `/experiences/**` all render a sidebar whose area is
**Blocks** (`groups=[Build with it, Experiences, Patterns]`). A reader on
`/patterns` is told they are in Blocks. That is the known IA-007 item — splitting
the "Build with it" area into four products — and it needs its own product
decision, so it is recorded here rather than folded into this fix.
