import { ChartAnimationPreset } from "../types.js";
import { ChartTheme } from "./theme-tokens.js";
//#region src/charts/core/use-chart-theme.d.ts
/**
 * The resolved chart theme for the current LUC theme, kept in sync without a
 * re-render loop: the snapshot only changes when `<html>` flips theme.
 */
export declare function useChartTheme(): ChartTheme;
/** Past this many plotted points a per-point entrance animation is waste. */
export declare const CHART_ANIMATION_POINT_LIMIT = 4000;
export interface ChartMotionBudget {
  reduced: boolean;
  /** Intro animation duration in ms; 0 when motion is reduced or disabled. */
  intro: number;
  /** Duration for a data/range update. */
  update: number;
  /** Hover/emphasis feedback duration. */
  emphasis: number;
  /** Whether the caller asked for a universal (morph) transition. */
  universal: boolean;
}
/**
 * Chart motion budget.
 *
 * Precedence: reduced motion wins over everything (a chart under
 * `prefers-reduced-motion` renders its final frame immediately — motion is
 * never merely slowed down). Then the caller's preset, then a **large-data
 * clamp**: a 20 000-point scatter does not animate twenty thousand marks into
 * place, it appears.
 */
export declare function useChartMotion(theme: ChartTheme, preset?: ChartAnimationPreset, pointCount?: number): ChartMotionBudget;
export interface ElementSize {
  width: number;
  height: number;
}
/**
 * Observe an element's box. Returns `null` until the first measurement so a
 * caller can decide whether rendering an engine is worth it yet.
 */
export declare function useElementSize<T extends HTMLElement>(): [React.RefObject<T | null>, ElementSize | null];
//#endregion
//# sourceMappingURL=use-chart-theme.d.ts.map