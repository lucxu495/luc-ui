# Phase 9.5 — progress record

`luc-ui/**` only. Nothing committed, published or pushed. The worktree is shared
with other LUC agents and their uncommitted work; no Git command beyond
`status`, `diff`, `log` and `rev-parse` was run.

## Order of work

| # | Step | Outcome |
| --- | --- | --- |
| 1 | Reconnaissance: worktree, branch, running services, docker images, memory | baseline confirmed; the Phase 9 Hardening image was live and healthy |
| 2 | `qa/probe-95.mjs` written as a read-only measuring tool | six modes; the numbers in `00-architecture…md` are its output |
| 3 | Defects reproduced before any fix | three reproduced as reported, one (the Playground jump) reproduced only after the *test* was corrected |
| 4 | Sheet edge latch (library) + demo fix | the one real component defect; verified mid-animation in all four directions |
| 5 | Layout system + intents | 150 pages change width from one file |
| 6 | Navigation page composition | equal split → rail + flex, `overflow-clip` code, content-height tree |
| 7 | Playground stability | `scrollbar-gutter: stable`, stage clip, stage floor |
| 8 | Experience stage + full preview | new island; `--experience-max` makes the expanded preview genuinely wider |
| 9 | Career / academic / garden / forum / community / publishing / AI widths | `width="prose"` (704 px) removed; career recomposed |
| 10 | `Code` block scrolls, and the overflow it introduced | found by the new geometry check, fixed with `contain: inline-size` |
| 11 | Three pre-existing axe failures | status bar, composer `pre`, carousel lint; 5 findings → 2 → 0 in the sweep |
| 12 | `geometry` behaviour group | six checks, always run with the full sweep |
| 13 | `pnpm verify` | exit 0 |
| 14 | `pnpm qa:full` on the deployed container | 167 routes · 475 screenshots · 150/150 behaviour · 0 axe violations in 257 scans · no problems |
| 15 | Deployment | image `96e7ae94a048` tagged `phase-9-5`, container healthy on 127.0.0.1:3000 |

## Errors made and corrected in this phase

Recorded because both are the kind of mistake that produces a confident wrong
answer.

1. **The Playground jump was measured wrong first.** Clicking a control through
   a Playwright locator scrolls it into view, and the first version of the check
   reported the test's own scroll as a 1702 px product defect. The measurement
   now clicks by coordinate and compares *document* positions.
2. **The first version of the Sheet check compared against the raw window
   width.** A fixed panel is laid out against the viewport minus the scrollbar,
   so a correct panel was reported 10 px off. The check now compares the exit
   box against the open box, which is both more accurate and a stronger
   assertion: the bug it guards changes the box, not its offset.

## Not run

* `pnpm qa:providers` (the live TradingView smoke). Not relevant to layout, and
  it depends on a third-party host.
* `pnpm qa:baseline`. The Playwright image baselines still describe the old
  widths; re-freezing them is deliberately left to a separate act, and
  `03-remaining-issues.md` says why.
* WebKit. Playwright's WebKit cannot launch on this host.
