import { ChartFormat } from "../types.js";
import { FamilyCommonProps } from "./chart-common.js";
//#region src/charts/components/surface3d-charts.d.ts
/**
 * A true 3D surface, with no 3D engine.
 *
 * The usual answer is `echarts-gl`, and it was considered and rejected here for
 * a measurable reason: it is a large WebGL dependency (a second renderer, a
 * GPU context per surface) that would have to be installed for every consumer
 * of `@luc/ui/charts` — or shipped behind a second entry point that also needs
 * the shader/layout machinery. A gridded surface, however, is a solved problem
 * in two dimensions: rotate, project orthographically, sort the quads by depth
 * and paint them back to front. That is ~120 lines of arithmetic, no renderer,
 * no GPU context, deterministic output, and it works in the same
 * `ChartSurface` shell as every other chart in the library (tooltip, export,
 * reduced motion, aria).
 *
 * It is a **display projection of supplied values**, exactly like a log axis:
 * the grid is the caller's, the heights are the caller's, and nothing is
 * interpolated, fitted or filled in. A missing cell is a hole in the surface.
 */
export interface Surface3DChartProps extends FamilyCommonProps {
  /** `z[row][column]`. One row per `yLabel`. Non-finite cells are holes. */
  z: readonly (readonly number[])[];
  xLabels?: readonly (string | number)[];
  yLabels?: readonly (string | number)[];
  xLabel?: string;
  yLabel?: string;
  zLabel?: string;
  /** View azimuth in degrees. Pair with `onViewChange` to control it. */
  azimuth?: number;
  /** View elevation in degrees (0 = edge-on, 90 = straight down). */
  elevation?: number;
  onViewChange?: (view: {
    azimuth: number;
    elevation: number;
  }) => void;
  /** `surface` paints shaded quads, `wireframe` draws only the mesh. Default `surface`. */
  mode?: "surface" | "wireframe";
  /** Height of the z range relative to the base plane. Default 0.72. */
  zScale?: number;
  xFormat?: ChartFormat;
  yFormat?: ChartFormat;
  zFormat?: ChartFormat;
  title?: string;
  description?: string;
}
export declare function Surface3DChart({ z, xLabels, yLabels, xLabel, yLabel, zLabel, azimuth, elevation, onViewChange, mode, zScale, xFormat, yFormat, zFormat, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: Surface3DChartProps): import("react").JSX.Element;
export interface VolatilitySurfaceChartProps extends FamilyCommonProps {
  /** Strike or moneyness values, one per column, ascending. */
  strikes: readonly number[];
  /** Maturity values, one per row, ascending. Units are the caller's (years, days). */
  maturities: readonly number[];
  /** Implied volatilities as a **ratio** (`0.24` = 24%), `vols[maturityIndex][strikeIndex]`. */
  vols: readonly (readonly number[])[];
  /** Caption for the strike axis, e.g. "Strike" or "Moneyness (K/S)". */
  strikeLabel?: string;
  /** Caption for the maturity axis, e.g. "Maturity (years)". */
  maturityLabel?: string;
  /** Show volatilities as percentages. Default `true`. */
  percent?: boolean;
  azimuth?: number;
  elevation?: number;
  onViewChange?: (view: {
    azimuth: number;
    elevation: number;
  }) => void;
  mode?: "surface" | "wireframe";
  title?: string;
  description?: string;
}
/**
 * A volatility surface from a **supplied grid** of implied volatilities.
 *
 * The grid shape is deliberate. Turning a scatter of (strike, maturity, IV)
 * quotes into a surface needs interpolation or a fitted parameterisation, and
 * that is exactly the kind of hidden modelling this library refuses to do: the
 * number under the pointer would no longer be a quote. A caller that has quotes
 * fits its own surface, on its own terms, and passes the grid in — so the chart
 * can only ever show volatilities somebody actually computed.
 */
export declare function VolatilitySurfaceChart({ strikes, maturities, vols, strikeLabel, maturityLabel, percent, azimuth, elevation, onViewChange, mode, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: VolatilitySurfaceChartProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=surface3d-charts.d.ts.map