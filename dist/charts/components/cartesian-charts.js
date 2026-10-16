"use client";
import { Chart } from "./chart.js";
import { jsx } from "react/jsx-runtime";
//#region src/charts/components/cartesian-charts.tsx
function createFamilyChart(defaultFamily) {
	return function FamilyChart({ family, state, height, className, visibleSeries, ariaLabel, ariaDescription, onReady, onEvent, ...spec }) {
		return /* @__PURE__ */ jsx(Chart, {
			spec: {
				...spec,
				family: family ?? defaultFamily
			},
			state,
			height,
			className,
			visibleSeries,
			ariaLabel,
			ariaDescription,
			onReady,
			onEvent
		});
	};
}
/**
* Line chart. `series[].smooth` gives the smooth variant, `series[].step` the
* step variant, and a series with `area: true` the area variant — all from the
* same component so a "line family" page cannot drift into three styles.
*/
const LineChart = createFamilyChart("line");
/** Same engine path as `LineChart` with area fills on by default. */
const AreaChart = createFamilyChart("area");
/**
* Bar chart. `orientation="horizontal"` swaps the axes; `series[].stack` groups
* bars, and `series[].stackMode="percent"` normalises them to 100%.
*/
const BarChart = createFamilyChart("bar");
/** Scatter plot. Data comes from `xKey` plus one numeric key per series. */
const ScatterChart = createFamilyChart("scatter");
/** Bubble chart — the same as scatter with a larger, emphasis-friendly symbol. */
const BubbleChart = createFamilyChart("bubble");
/** Line + bar + area + dual axis, in one plot. Axis ids make the split explicit. */
const ComposedChart = createFamilyChart("composed");
//#endregion
export { AreaChart, BarChart, BubbleChart, ComposedChart, LineChart, ScatterChart };

//# sourceMappingURL=cartesian-charts.js.map