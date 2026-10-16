/*
 * The chart demos, in one lookup.
 *
 * A chart page is the only page that imports this module, because importing it
 * brings every chart component's option builder with it. That is the same
 * boundary the Playground draws (`components/playground/registry.charts.ts`)
 * and for the same reason: a `Button` page must not pay for the charting
 * surface.
 *
 * The engine itself is still loaded lazily by the chart component, so this
 * module is a table of specifications and fixtures, not a bundle of ECharts.
 */

import { chartDiagnosticsDemos } from "./charts/diagnostics";
import { chartFinancialDemos } from "./charts/financial";
import { chartGeneralDemos } from "./charts/general";
import { chartGeographicDemos } from "./charts/geographic";
import { chartMultidimensionalDemos } from "./charts/multidimensional";
import { chartScientificDemos } from "./charts/scientific";
import { chartStatisticalDemos } from "./charts/statistical";
import { chartTimeDemos } from "./charts/time";
import { chartWorkflowDemos } from "./charts/workflow";
import { indexDemos, type DemoSpec } from "./index";

export const chartDemos: readonly DemoSpec[] = [
  ...chartGeneralDemos,
  ...chartStatisticalDemos,
  ...chartFinancialDemos,
  ...chartScientificDemos,
  ...chartMultidimensionalDemos,
  ...chartWorkflowDemos,
  ...chartTimeDemos,
  ...chartDiagnosticsDemos,
  ...chartGeographicDemos,
];

const byId = indexDemos(chartDemos);

export function chartDemoFor(id: string | undefined): DemoSpec | undefined {
  return id === undefined ? undefined : byId.get(id);
}

export const chartDemoIds: readonly string[] = [...byId.keys()].sort();
