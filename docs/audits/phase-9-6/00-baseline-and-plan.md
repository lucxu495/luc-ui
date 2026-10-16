# Phase 9.6 — baseline, workstreams and ownership

Phase 9.6 makes LUC UI ready for two things that have not happened yet:
independent publication, and consumption by a static visual renderer
(`luc-render`). It is an implementation phase: an audit that changes nothing
would not be a deliverable.

Writable scope is `luc-ui/**`. Everything else in `luc-quant` is read-only,
including `luc-render/**` — which is read, never written.

## 1. Baseline, verified rather than reported

| Fact | Verified state at the start of the phase |
| --- | --- |
| Branch / HEAD | `main` @ `5329c65`, worktree dirty with 141 changed paths |
| Dirty paths inside scope | `luc-ui/**` only, plus other agents' work in `.context`, `luc-api`, `luc-cron`, `luc-jobs`, `infra` (untouched) |
| Showcase container | `luc-ui-showcase`, healthy, `127.0.0.1:3000`, started 2026-10-09T22:25:15Z |
| Deployed image | `luc-ui/showcase:1.0.0` = `f4fc57961382`, also tagged `phase-9-5` |
| Rollback preserved | tagged `rollback-20261010-pre-phase-9-6` → `f4fc57961382` before any rebuild |
| Host resources | 15 GB RAM, ~5 GB available, swap 6/7 used, load ≈2.6 |
| Commits / pushes | none made. Nothing published, no repository created |

The 9.5 report's numbers (167 routes, 150 behaviour checks, 257 axe scans, 76
chart types) are re-measured by the commands in `03-verification.md` rather than
assumed; where this phase's numbers differ, the difference is explained.

## 2. Workstreams and where each one landed

| # | Workstream | Owner | Deliverable |
| --- | --- | --- | --- |
| A | Interaction quality | lead | `qa/mobile-a11y.mjs`; mobile axe in the sweep; overlay lifecycle checks; the two defects the mobile matrix found |
| A2 | Overlay geometry | lead | `checkOverlayLifecycles` + `checkSheetFocusRestoration` in `qa/geometry.mjs` |
| B | Public library quality | lead | `02-public-api-audit.md`; fixes where the audit found a real inconsistency |
| C | Static-render compatibility | lead | `renderer: "svg"`, `chartThemeFromTokens`, `staticChartSpec`, `docs/STATIC_RENDERING.md` |
| D | External consumer capture | lead | `apps/showcase/scripts/consumer-capture.mjs` — packs, installs with npm, SSRs, hydrates, captures PNG + PDF |
| E | Repository independence | lead | `04-release-readiness.md` |
| F | Registry maturity | lead | `05-source-registry.md` |
| — | Deployment | lead | rebuild + verify `luc-ui-showcase` only; rollback tag kept |

## 3. Why the work is sequential here

The Phase 9 parallel-agent model is not used in this phase. Two reasons, both
concrete:

1. **Resource reality.** The host runs the LUC data platform and several
   uncorrelated services; swap was already 6/7 at the start. Every gate in this
   phase that matters is a Chromium suite, and the repository's own rule is one
   browser suite at a time.
2. **The size of the shared surface.** Workstream C touches the chart engine
   boundary that B, D and F all read, and workstream A touches the QA harness
   that gates every other claim. Splitting those across writers is how a phase
   ends up with two half-merged registries.

## 4. What "release ready" means in this phase

Three claims are made only with evidence attached:

- **Static rendering.** A vector path, a DOM-free theme, a capture preset and a
  reduced-motion guarantee, each with a test or a browser measurement.
- **External consumption.** A tarball installed by `npm` in a directory outside
  the workspace, rendered, hydrated and captured — the PNG and PDF are checked
  into `luc-ui/artifacts/consumer-capture/`.
- **Repository independence.** An audit of what actually couples `luc-ui` to
  `luc-quant`, and a named decision for each coupling. Licence choice is *not*
  made here: it is a product decision and it stays open, as recorded in
  `04-release-readiness.md`.
