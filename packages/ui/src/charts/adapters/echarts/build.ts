/**
 * Family dispatch for the declarative path.
 *
 * Only the cartesian families live behind `ChartSpec`; the specialised families
 * (heatmap, sankey, gauge …) have their own components with their own typed
 * data props, because forcing them into a rows+series shape would produce the
 * universal-API mess the architecture explicitly avoids.
 */

import type { ChartSpec } from "../../types";
import type { ChartTheme } from "../../core/theme";
import { buildCartesianOption, type CartesianInput } from "./cartesian";
import type { MotionBudget, Option } from "./option";

export interface BuildInput {
  spec: ChartSpec<object>;
  theme: ChartTheme;
  motion: MotionBudget;
  normalized: CartesianInput["normalized"];
  /** The loaded extent's span, in ms. */
  xSpanMs?: number;
  /** The span the window currently shows; drives the *axis label* granularity. */
  xLabelSpanMs?: number;
  ariaLabel?: string;
  ariaDescription?: string;
}

export function buildChartOption(input: BuildInput): Option {
  return buildCartesianOption(input);
}

export type { Option };
