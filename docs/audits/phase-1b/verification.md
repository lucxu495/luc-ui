# LUC UI Phase 1B — quality and accessibility verification

Date: 2026-10-08. Scope: the Phase 1B allowlist. No commit or push.

## Baseline and root causes

| Gate | Reproduction | Root cause and resolution |
| --- | --- | --- |
| Package typecheck | `pnpm --dir luc-ui/packages/ui typecheck` | Nine TS18047 errors in `chart.test.tsx`: Vitest's non-null assertion does not narrow `querySelector`. Explicit failure branches now narrow the element while preserving the geometry assertions. |
| Package lint | `pnpm --dir luc-ui/packages/ui lint` | Three missing dependencies: the ECharts sync callback used `reportVisibleSpan`, Histogram used both axis labels, and EventTimeline used the range. Dependency arrays now include those values, with no lint suppression. |
| Motion tests | `pnpm --dir luc-ui/packages/ui exec vitest run src/motion/kinetic.test.tsx` | Two tests nested native buttons inside `MorphingDialogTrigger` and `MorphingPopoverTrigger`, which already expose a button role. This produced two controls with the same accessible name. The fixtures now use noninteractive content and assert one accessible trigger. The Showcase morphing examples also use noninteractive content. |
| Consumer bundle | `pnpm --dir luc-ui/packages/ui test:consumer` after a package build | The charts scenario measured 59.1 KB raw against a 53,429 byte baseline plus 8% allowance. Since the 2026-09-29 baseline, chart source added about 2,900 lines, including sizing, palette, position charts, matrix work and timeline behavior; `charts/index.ts` gained two runtime exports. The consumer script and bundler configuration did not change in that interval. This is an obsolete baseline for the current chart entry, rather than an isolation leak. |

The charts consumer is `Chart` plus `ChartSyncGroup` from the built `@luc/ui/charts` subpath. Third party modules are external in this measurement. Button, date picker, app shell, TradingView, slider, menus, surfaces and barrel isolation checks still pass. The existing consumer script rejects chart engines in nonchart scenarios.

## Bundle measurement

| Charts entry | Raw bytes | Gzip bytes |
| --- | ---: | ---: |
| Recorded baseline | 53,429 | 16,444 |
| Initial failing measurement | 59.1 KB (rounded by script) | 18.1 KB (rounded) |
| Final measured bundle and new chart baseline | 60,952 | 18,602 |

The final raw size is 7,523 bytes (14.1%) above the old baseline; gzip is 2,158 bytes (13.1%) above. `bundle-baseline.json` changed **only** its `charts` entry to the exact measured bytes. A fresh `test:consumer` passes. No entry point, public export, dependency or consumer budget rule was changed.

## Accessibility

### SharedHighlight

The underline variant exposed `role="tablist"` while rendering links with `aria-current="page"` or native buttons with `aria-pressed`. Those descendants are not tabs, and the component does not implement tab keyboard behavior. An all-link set now exposes a navigation landmark; a button or mixed set exposes a group, independent of visual variant. Native link and button keyboard activation remains intact, with normal Tab order. The `luc-focus` class remains on every item. The selected link retains `aria-current="page"`; selected buttons retain `aria-pressed="true"`. Tests cover both modes, the absence of false tab roles, Enter activation, and reduced motion removing indicator travel. No roving tab index or arrow-key tab behavior was added because this component is not a tab control.

Testing Library role queries verified the semantic structure. The Showcase has no SharedHighlight specimen, so a browser screen reader snapshot of that component was not available in the existing route set.

### Disabled Button

Chromium measurements used the rendered Showcase Button styles, five intents, `sm` and `md` sizes, normal and compact density, on a `bg-surface-default` specimen. Contrast was computed from browser computed colors after compositing the disabled opacity against the surface. Before the change, the measured label contrast range was **2.02–2.81:1 light** and **2.45–4.24:1 dark**. Disabled controls are exempt from WCAG's minimum text contrast rule, but the labels were difficult to read, especially in light mode.

The recipe no longer fades the entire control to 45% opacity. Filled intents use a soft intent surface and primary text; secondary, outline and ghost use muted text and quieter borders where present. The controls remain native `disabled` buttons and retain the disabled pointer and shadow treatment. After the change, the measured range across the same matrix is **6.42–14.07:1 light** and **6.48–13.76:1 dark**. The minimum covers all tested size and density combinations. Chromium's accessibility snapshot reports `button "Primary action" [disabled]`.

Visual specimens were inspected at 100% and 200% CSS zoom: [light 100%](buttons-light-100.png), [light 200%](buttons-light-200.png), [dark 100%](buttons-dark-100.png), [dark 200%](buttons-dark-200.png). The 200% check scales the specimen with CSS zoom; it does not substitute for a full page reflow sweep.

## QA results

- Focused chart and motion tests: 47 passed before the reduced-motion addition; the final `motion-primitives.test.tsx` run passed all 17 tests.
- Entire `@luc/ui` suite: 69 files and 616 tests passed before the final reduced-motion test, which also passed independently.
- `@luc/ui` TypeScript, lint, package build, package export verification, catalog check, type consumer verification and consumer isolation: passed.
- `git diff --check`: passed.
- `pnpm verify`: stopped during Showcase typecheck at the committed `luc-ui/apps/showcase/app/charts/uncertainty/page.tsx:193` (`TS1127 Invalid character`, followed by `TS1382` at line 198). The JSX string contains escaped double quotes (`\"`) in a text attribute. This file is outside the Phase 1B write allowlist, so it was left untouched. Package typecheck and `luc-web` typecheck passed in the same run; later workspace stages did not execute.
- `pnpm qa:changed -- --routes=buttons`: could not start because Docker could not connect to `/Users/luc/.docker/run/docker.sock`. Browser checks above ran against the already running local Showcase on port 3000. The Docker route sweep, axe scan and full browser behavior tier remain open.

The pnpm Corepack shim on this host points to a missing file. Commands used the installed pnpm 12.6.0 module directly or a temporary `/tmp` wrapper. No repository manifest or lockfile was changed for this environment issue.

## Files changed in Phase 1B

- `luc-ui/packages/ui/src/charts/adapters/echarts/echart-surface.tsx`
- `luc-ui/packages/ui/src/charts/components/chart.test.tsx`
- `luc-ui/packages/ui/src/charts/components/distribution-charts.tsx`
- `luc-ui/packages/ui/src/charts/components/sequence-charts.tsx`
- `luc-ui/packages/ui/src/components/button-variants.ts`
- `luc-ui/packages/ui/src/motion/kinetic.test.tsx`
- `luc-ui/packages/ui/src/motion/motion-primitives.test.tsx`
- `luc-ui/packages/ui/src/motion/shared-highlight.tsx`
- `luc-ui/packages/ui/bundle-baseline.json`
- This report and its four Button screenshots under `luc-ui/docs/audits/phase-1b/`.

Pre-existing Phase 1A and concurrent Design Lab work was preserved. The Showcase development server regenerated `next-env.d.ts`; its original content was restored, leaving no Phase 1B diff there.

## Follow-ups

- Fix the committed JSX syntax in `apps/showcase/app/charts/uncertainty/page.tsx` under that project's ownership, then rerun `pnpm verify`.
- Run `qa:changed` and targeted axe/behavior checks when Docker is available.
- `FullscreenChart` currently wraps its default `FullscreenButton` in a `MorphingDialogTrigger`, creating a nested interactive control. That production composition is in the chart implementation, but changing its trigger geometry or public render behavior needs focused design and focus-return verification. It was not changed as part of the two stale motion fixture fixes.
