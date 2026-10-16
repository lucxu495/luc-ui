import { AxisSide } from "../../core/axis.js";
import { ChartFormat } from "../../types.js";
import { ChartTheme } from "../../core/theme-tokens.js";
//#region src/charts/adapters/echarts/option.d.ts
export type Option = Record<string, unknown>;
export interface AxisFragmentOptions {
  type: "category" | "time" | "value" | "log";
  theme: ChartTheme;
  /** Axis id, referenced by series. `0`/`1` index order is derived from this. */
  name?: string;
  /**
   * Where the axis *name* sits: at an end of the plate, or beside its middle.
   *
   * A name at the end lands in the corner the first tick label also occupies —
   * the bump chart's "Rank" printed on top of "Q1" until it moved to the middle,
   * which the renderer diagnostics measured rather than a screenshot guess.
   */
  nameLocation?: "start" | "middle" | "end";
  /** Distance from the plate to the name. ECharts' default is 15. */
  nameGap?: number;
  /**
   * Which side the plate sits on. Omitted means the engine's own default (left);
   * a cartesian `ChartSpec` always resolves it through `DEFAULT_Y_AXIS_SIDE`
   * before it gets here, so "no side" is only reachable from a family that
   * deliberately owns its geometry.
   */
  position?: AxisSide;
  format?: ChartFormat;
  /** The loaded extent's span, in ms. */
  spanMs?: number;
  /**
   * The span the window currently shows, in ms — what a time axis labels.
   *
   * Falls back to `spanMs`, which is the correct answer whenever the reader is
   * on MAX (the loaded extent *is* the visible window).
   */
  labelSpanMs?: number;
  /**
   * A caller-supplied display label for a point on the axis.
   *
   * It is consulted *before* the span-based date formatting, so an axis whose
   * caller knows a better name for a tick (a fiscal identity over a period-end
   * date) prints that name while every tick the caller did not name keeps the
   * engine's own label. The engine never inspects the string.
   */
  pointLabel?: (value: number) => string | undefined;
  /**
   * Fixed bound, or a function ECharts calls with the *visible* extent (so a
   * padded domain follows a zoom instead of freezing at the full history).
   */
  min?: AxisBoundInput;
  max?: AxisBoundInput;
  nice?: boolean;
  /**
   * Fit the axis to the data instead of forcing zero into the range.
   * `false` for anything whose mark is measured from a baseline.
   */
  scale?: boolean;
  /** Show a hairline on the axis itself (used by bar charts' baseline). */
  baseline?: boolean;
  showGrid?: boolean;
  splitNumber?: number;
  /**
   * Suppress the label on an extreme tick that is display headroom rather than a
   * value the chart reports. The tick and its split line stay; only the number
   * goes, so a padded drawdown cannot show a `+8.5%` tick.
   */
  hideMinLabel?: boolean;
  hideMaxLabel?: boolean;
  hidden?: boolean;
  logBase?: number;
}
/**
 * An axis bound: a fixed value, `"dataMin"` / `"dataMax"`, or a function of the
 * *visible* extent (which is what keeps display headroom after a zoom).
 */
export type AxisBoundInput = number | "dataMin" | "dataMax" | ((extent: {
  min: number;
  max: number;
}) => number);
//#endregion
//# sourceMappingURL=option.d.ts.map