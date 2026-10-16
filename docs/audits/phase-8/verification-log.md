# Phase 8 — verification log

All commands run from `/home/luc/code/luc-quant/luc-ui` unless stated. Times are
the wall-clock reported by the tool that ran them.

## 1. Engineering gate

```bash
pnpm verify
```

```
 Test Files  89 passed (89)
      Tests  898 passed (898)
  routes on disk          : 148 (148 registered in QA)
  page headers            : 148/148 (100%)
  page bodies (sentence)  : 148/148 (100%)
  navigation labels       : 163/163 (100%)
  navigation descriptions : 149/149 (100%)
  chrome strings          : 88/88 (100%)
  long-form content keys  : 581/581 (100%)
  prose sentences         : 14096/14096 (100%)
  catalog:check           : in sync
  verify:package          : ok
  test:consumer           : ✓ subpath imports stay isolated
  verify:types            : ok
EXIT=0
```

Baseline on entry was 829 tests / 86 files; the phase adds 69 tests across three
files (`axis-time.test.ts`, `experiences.test.tsx`, `field-composition.test.tsx`).

## 2. Chart axis defect — the engine-level proof

```bash
npx vitest run src/charts/adapters/echarts/axis-time.test.ts
```

```
 Test Files  1 passed (1)
      Tests  43 passed (43)
```

43 assertions: nine spans (30 minutes → 20 years) × four widths (420 → 1600 px),
each rendered through ECharts' own server renderer, ticks read back out of the
live scale, failing on any interior duplicate label.

```bash
npx vitest run src/charts
```

```
 Test Files  23 passed (23)
      Tests  318 passed (318)
```

## 3. Full browser QA

```bash
node scripts/qa-server.mjs --mode=full
```

```
LUC UI QA — mode=full provider=stub workers=3
  routes      : 148
  screenshots : 452
  behaviour   : 109/109 passed
  a11y        : 0 violation(s) across 238 scans
  timings     : routes 459.7s · behaviour 190.4s
  counters    : providerReady=147 · providerErrors=8 · axeScans=238
  problems    : none
EXIT=0
```

The `experiences` group is 16 checks, one per reference product. Two earlier runs
of this group failed and both failures were the checks, not the pages: a
`role="region"` attribute selector matched nothing (the panel is a `<section>`),
and two assertions read a value that could not change (the free plan's price; a
canvas's `innerHTML`). All three were fixed in the harness, and the two probes
now read what the interaction actually produces.

## 4. Chart rendering and geometry

```bash
node apps/showcase/qa/chart-geometry.mjs --route-groups=charts
```

```
  experiences-science          plots= 2 ok
  experiences-finance          plots= 3 ok
  ...
plots 142 · failing 0
EXIT=0
```

142 plots (Phase 7 measured 126). The probe now finds a plot host by walking the
engine surfaces and taking the nearest `chart-plot` ancestor, so a chart composed
into a product's own Card is measured too — which is why the two experience
pages, the design lab (three routes) and anything a consumer composes are covered
instead of silently skipped.

```bash
node apps/showcase/qa/chart-assertions.mjs    # 10/10 assertions passed
node apps/showcase/qa/chart-units.mjs         # 11/11 chart unit contracts hold
```

## 5. Structural probe

```bash
node apps/showcase/qa/inspect.mjs --all
```

```
summary {"routes":148,"hOverflow":0,"clip":0,"tiny":148,"collapsed":0,"console":0,"errors":0}
```

Horizontal overflow, clipped text, collapsed slots, console errors: zero, on
every route. `tiny` is the detector's own known-noise class (see §8).

## 6. Cross-browser

```bash
node apps/showcase/qa/browsers.mjs
```

```
  chromium  routes=33 harness-axe-scans=33 failures=0
  firefox   routes=33 harness-axe-scans=33 failures=0
  webkit    UNAVAILABLE — host system is missing dependencies to run browsers
engines ran=2 unavailable=1 failing=0
EXIT=0
```

The sample was extended with `experiences`, `experiences-portfolio`,
`experiences-saas` and `experiences-science`: four routes, 33 → and the most
transform-heavy page in the library is now in the cross-engine set.

## 6a. Live bilingual rendering

```bash
node apps/showcase/qa/i18n-live.mjs
```

```
LUC UI Showcase — Chinese rendering check (148 routes, http://127.0.0.1:3000)
  routes with no English prose leak : 148/148
```

This is the check that found the gap described in §1.6 of the phase report: the
static coverage number read 148/148 while nine deployed Chinese pages still
contained English sentences. First run `139/148`, second `144/148`, final
`148/148`.

## 7. Localization

```bash
node apps/showcase/scripts/i18n-coverage.mjs
```

```
  routes on disk          : 148 (148 registered in QA)
  page bodies (sentence)  : 148/148 (100%)
  prose sentences         : 14096/14096 (100%)
EXIT=0
```

641 new prose renderings, 34 navigation renderings, 17 route headers and 32
copy-attribute renderings were written for this phase.

## 8. Known noise and deviations, stated rather than hidden

- `inspect.mjs` counts any control whose *box* is under 24 px on an axis. Wide
  but short controls (a 229×26 search field) and the 18 px visual boxes of
  `Checkbox`, `Radio` and `Switch` are all listed. Those three carry `luc-hit`,
  which grows the pointer target to 24×24 without moving a pixel; the probe
  measures boxes, not hit areas, so it cannot see that. `Radio` gained `luc-hit`
  in this phase — it was the one of the three that had been missed.
- WebKit cannot launch on this host.
- `qa:providers` (`--provider-mode=live`) and `qa:baseline` were not run in this
  cycle: the live provider tier talks to a third party and the pixel-baseline
  suite would have needed 15+ regenerated baselines for pages whose layout
  changed, which is a release-freeze action rather than a development one.
