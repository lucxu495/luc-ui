# Phase 9.6 — verification record

Every number below is the output of the command above it, run on this host
(15 GB RAM, load 6–10, Chromium only). Nothing is estimated, and where a gate
was not run it says so.

## 1. `pnpm verify` → exit 0

| Stage | Result |
| --- | --- |
| `pnpm typecheck` | `packages/ui`, `apps/showcase`, `luc-web` — no errors |
| `pnpm lint` | same three projects, `--max-warnings 0` |
| `pnpm test` | **907 unit tests in 91 files** (was 899) · **85 Showcase tests in 11 files** |
| `pnpm verify:i18n` | page bodies 158/161 · nav labels 90/90 · **nav descriptions 51/51** · chrome 89/89 · long-form 581/581 · prose 56 801/56 801 |
| `pnpm verify:charts` | chart catalogue: 76 distinct public plots, 5 variants, 1 composition, 2 planned/blocked · **11/11 unit contracts hold** |
| `pnpm verify:docs` | 223 documented entries (62 curated / 157 generated / 4 reference), 368 symbols with compiler-extracted props, 28 alias redirects |
| `pnpm verify:registry` | 4 items, 6 files, clean-fixture typecheck clean |
| `pnpm verify:package` | 1 061 files, 1 318.4 KB; 277 modules, 267 declarations; exports/tarball/metadata agree; **17 consumer scenarios**, no budget failures; declarations OK for ESM + bundler |

The +8 unit tests are the two new chart suites (4 token-bridge assertions and 4
axis-pairing assertions).

Two generated artifacts were regenerated as part of this phase, which is what
their `--check` gates are for: `docs/component-catalog.json` +
`docs/COMPONENT_CATALOG.md`, and `apps/showcase/lib/docs/generated/*`. The
diff is the new public exports and nothing else.

## 2. `pnpm qa:full` → 0 problems

Run against the **deployed container** (`127.0.0.1:3000`), not a local dev
server, after the image was rebuilt for this phase.

| Metric | Phase 9.5 | Phase 9.6 |
| --- | --- | --- |
| Routes swept | 167 | 167 |
| Screenshots | 475 | 475 |
| Behaviour checks | 150/150 | **152/152** |
| axe scans | 257 (desktop + light) | **347** (+ 90 mobile) |
| axe violations | 0 (desktop only) | **0** |
| Console / page errors | none | **none** |

The 90 extra scans are the mobile variant at 390×844. They are the reason two
real defects were found (§`01`), and they add ~36 s to the sweep.

Timings: routes 582.9 s, behaviour 261.4 s (geometry 59.6 s, experiences
38.8 s, primitives 27.1 s, charts 21.3 s). Slowest routes: `date-time-calendar`
32.3 s, `date-time-date-range` 20.6 s, `buttons` 20.5 s,
`foundations-personality` 20.5 s.

## 3. `node qa/mobile-a11y.mjs` → 0 findings

```
mobile-a11y · 90 route(s) × 2 viewport(s) = 180 scan(s) · 2 worker(s)
mobile-a11y · 180 scan(s) · 0 findings
```

Before the fixes in §`01`, the same command reported 3 nodes across 2 routes at
390 px and 1 at 768 px. The artifact (`artifacts/qa/mobile-a11y/report.json`)
records the box, the overflow metrics and the DOM path of every node, so a
finding is reviewable rather than a list of rule ids.

`--all-viewports` adds 1280/1440/1920; used to re-measure the `target-size`
question on `/date-time/date-range`, which is clean at every width.

## 4. `--group=geometry` → 8/8

Six checks carried over from Phase 9.5, plus `checkOverlayLifecycles` and
`checkSheetFocusRestoration`. All eight pass with `problems: none`.

## 5. `consumer-capture` → PASS

See §`06` for the full account. Headline: SSR, hydration, 16 vector `<path>`
elements, 43 895 painted canvas pixels across 64 colours, a settled transform
under reduced motion, a 2160×2400 PNG at 2× from a 1080×1200 box, and a PDF that
is 93 KB with the charts and 33 KB without them.

## 6. Not run, with the reason

| Gate | Why not |
| --- | --- |
| `pnpm qa:providers` (live TradingView) | unrelated to this phase's changes and dependent on a third-party host answering |
| `pnpm qa:baseline` (Playwright image baselines) | the baselines still describe the Phase 9.5 widths and need a *reviewed* re-freeze; declared in §`03-remaining-issues.md` rather than regenerated silently |
| WebKit / Firefox suites | `qa/browsers.mjs` cannot launch WebKit on this host (missing system libraries); Firefox is available but the phase's gates are Chromium, and running two engines concurrently on a host at load 9 was not worth the risk to the other services |
| Android/iOS device testing | the 390×844 context is a real viewport with `isMobile`/`hasTouch`, not a device. Touch momentum, the visual viewport and the soft keyboard are not covered by anything here |

## 7. Visual review

Reviewed by eye, not only by assertion:

* `artifacts/consumer-capture/capture@2x.png` — the external consumer's page,
  including the chart whose axis the pairing fix corrected.
* `artifacts/screenshots/*` from the sweep (475 images).
* `docs/audits/phase-9-5/evidence/*` for the widths Phase 9.5 changed.

What that review changed in this phase: nothing structural. The pages whose
charts changed are the ones with a numeric x declared positional, of which the
Showcase has none — so the sweep's screenshots should differ from Phase 9.5 only
where a `<pre>` became a `Code block` (four pages).
