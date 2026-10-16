# LUC UI artifacts

Three different things used to share this directory, which is why a QA run left
a 236-file git diff. They are separated now:

| Path | Class | In git | Removed by `pnpm qa:clean` |
| --- | --- | --- | --- |
| `baselines/` | **A. Visual-regression baselines** | yes — committed | no |
| `screenshots/` | B. Current-run review screenshots | no | yes |
| `qa-report.json` | B. Current-run timing/problem report | no | yes |
| `reports/<mode>.json` | C. One committed report per tier, so a release run's full-sweep evidence stays reviewable | yes — committed | no |
| `qa/` | B. Server build marker, traces | no | yes |
| `pack/` | B. `pnpm pack` cache used by package verification | no | yes |
| `chart-review/` | B. `chart-shots.mjs` review output | no | yes |

## A — baselines

Asserted by `pnpm qa:baseline` (Playwright `toHaveScreenshot`), regenerated with
`pnpm qa:baseline:update`. The set is deliberately small and representative:
foundations, one core control, one form lane, the four V1.0 primitives, the data
and application lanes, and one provider page under the deterministic stub.
Charts are excluded because canvas pixels legitimately differ between machines;
the chart behaviour checks assert mark counts instead.

Regenerating a baseline is a review event: look at the diff before accepting it.

## B — current-run artifacts

Written by every `pnpm qa:*` run. `qa-report.json` carries per-phase and
per-route timings, provider readiness/error counts and timeout counts, so "why
was this run slow?" is answerable from the file rather than from guessing.

`pnpm qa:clean` removes exactly the class-B paths in the table above and nothing
else; it never touches `baselines/`. Before removing anything it asks `git`
whether the target holds tracked files, and refuses — reporting the paths and
exiting non-zero — if any exist. That check is what keeps a mis-classified entry
(`reports/` was one) from deleting committed files. Use `pnpm qa:clean
--dry-run` first if unsure. `pnpm qa:clean:test` covers the refusal behaviour.
