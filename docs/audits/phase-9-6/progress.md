# Phase 9.6 — progress record

`luc-ui/**` only. No commits, no pushes, no npm publish, no repository created.
Git commands used: `status`, `rev-parse`, `log` only.

## Order of work

| # | Step | Outcome |
| --- | --- | --- |
| 1 | Reconnaissance: worktree, services, images, memory, `luc-render` integration notes | baseline recorded; rollback image tagged before anything was rebuilt |
| 2 | `qa/mobile-a11y.mjs` written as a measuring instrument | 90 routes × 2 viewports = 180 scans |
| 3 | First mobile sweep | 3 findings the 257 desktop scans could not see: a scrollable `<pre>` on `/foundations/personality` (390 and 768) and a 24 px inspector column on `/patterns/research-workspace` |
| 4 | Root causes fixed | bare `<pre className="overflow-x-auto">` → the library's `Code block` on 4 pages; `mode="panes"` removed from the research workspace |
| 5 | Mobile axe wired into the sweep | `options.skipAxe`, mobile variant only |
| 6 | `renderer: "canvas" \| "svg"` on the chart engine boundary | lazy `ensureSvgRenderer()`, `ChartSpec.renderer`, `ChartSurface.renderer`, `Chart.eager` |
| 7 | `chartThemeFromTokens` + `CHART_THEME_TOKEN_VALUES` | one mapper for the DOM path and the DOM-free path; verified against `tokens.css` by a test that parses it |
| 8 | `staticChartSpec` / `CHART_STATIC_CAPTURE` | the three properties a capture needs, named and typed |
| 9 | External capture fixture | `apps/showcase/scripts/consumer-capture.mjs` |
| 10 | **A real chart defect found by the fixture** | a numeric x that was not declared positional produced a value axis with plain values → marks plotted at (y, y) |
| 11 | Defect fixed + invariant test | `xAxisType` now follows the axis decision; `axis-pairing.test.ts` asserts the invariant |
| 12 | Overlay lifecycle geometry | `checkOverlayLifecycles`, `checkSheetFocusRestoration` |
| 13 | A measured bundle regression, then a split that removed it | `charts-financial` 46.4 → 44.0 KB, `financial-engine` 36.6 → 34.1 KB; `button-only` untouched |
| 14 | A cwd-dependent docs registry | compiler host pinned to the library root; both cwds now produce byte-identical `api.ts` |
| 15 | Mobile a11y re-run, capture re-run | 180 scans / 0 findings; capture PASS |
| 16 | `pnpm verify` | exit 0 — 907 unit + 85 showcase tests, all gates |
| 17 | `pnpm qa:full` against the deployed container | 167 routes · 475 screenshots · 152/152 behaviour · 0 axe violations in 347 scans · `problems: none` |
| 18 | Deployment | image `5ec4d9bcabd2` tagged `1.0.0` + `phase-9-6`; container `0f693e16532c` healthy from 2026-10-10T04:29:17Z; rollback `f4fc57961382` kept under `rollback-20261010-pre-phase-9-6` and `phase-9-5` |
| 19 | Live content check on the deployed container | `/foundations/personality` and `/studios/charts` serve `data-slot="code"`; no bare `<pre class="overflow-x-auto">` remains |

## Errors made and corrected in this phase

Recorded because each one is a mistake that produces a confident wrong answer.

1. **The first consumer fixture measured a PNG against a fractional box.** A
   CSS box can be 1199.5 px and a screenshot is an integer number of device
   pixels; the assertion demanded exact equality and reported the rounding as a
   failure. It now allows the one pixel that the two representations differ by.
2. **The fixture's first design hydrated the charts.** Server-rendering a
   canvas-backed chart and hydrating it invites hydration mismatches that have
   nothing to do with capture. The fixture now does what a capture host does —
   the server writes the shell, the client mounts the visual into its box.
3. **One Vite config for both builds.** `rollupOptions.input` silently wins over
   `--ssr`, so the "SSR build" bundled the client and the server bundle was
   never written. Two configs now, and the script prints the tool's own error
   when a step fails instead of a stack trace with no message.
4. **The overlay check's first draft asserted a scroll lock by reading
   `document.documentElement.style.overflow` immediately after Escape.** It
   waited on a duration rather than a condition and would have failed against a
   correct implementation with a slow exit animation. Every wait in the final
   version is on a DOM condition.

## Not run

* `pnpm qa:providers` — the live TradingView smoke. Unrelated to this phase and
  dependent on a third-party host.
* `pnpm qa:baseline` — see `02-public-api-audit.md` §5 for the reviewed decision
  on the Playwright image baselines.
* WebKit — Playwright's WebKit still cannot launch on this host (missing system
  libraries, unchanged since Phase 8). Every browser result here is Chromium.
