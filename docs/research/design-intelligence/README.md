# LUC UI design intelligence

Research snapshot: 2026-10-08 (Asia/Singapore). Research only; no package, component, token, dependency, consumer, or existing Skill was changed. Upstream `main` branches, product pages and license terms can change; recheck them before importing code. Existing local worktree changes were left alone.

## Read this set

1. [External Skills and proposed Codex setup](./external-skills.md)
2. [UI libraries and interaction references](./library-reference-study.md)
3. [LUC opportunity matrix](./opportunity-matrix.md)
4. [Three aesthetic directions](./aesthetic-directions.md)
5. [Top ten opportunities and a small exploration plan](./priorities-and-experiments.md)

## Research stance

LUC already has an unusually complete foundation: semantic surface and chart tokens, two themes and compact density, Radix and React Aria behavior, native DataTable, chart/table alternatives, shell/workspace composition, a separate TradingView entry, and opt-in motion with reduced-motion paths. See the [verified current-state audit](../../audits/2026-10-productization-current-state.md), [gap audit](../../audits/2026-10-productization-gaps-and-consumers.md), [design system](../../../DESIGN_SYSTEM.md), and [motion guide](../../MOTION_GUIDE.md). The highest-value work is improving the *grammar connecting existing primitives*, not accumulating another catalog of controls.

Source-linked comparisons below distinguish observed LUC behavior from proposals. Difficulty and maintenance are relative estimates for a future implementation, not measured effort. “Reusable” means the upstream license permits code use subject to its conditions; it does not mean copied code would fit LUC's public API or visual identity. LUC's own package currently declares `UNLICENSED` in `packages/ui/package.json`; external MIT code cannot be assumed to set LUC's future distribution terms.

The five requested upstream Skills were verified against their own repositories (not forks or aggregator pages). Official product documentation and repository licenses were preferred for libraries. No third-party installer was run.
