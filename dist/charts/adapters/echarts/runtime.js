//#region src/charts/adapters/echarts/runtime.ts
let loading = null;
let svgRendererPromise = null;
function loadECharts() {
	if (loading) return loading;
	loading = (async () => {
		const [core, charts, components, renderers, features] = await Promise.all([
			import("echarts/core"),
			import("echarts/charts"),
			import("echarts/components"),
			import("echarts/renderers"),
			import("echarts/features")
		]);
		core.use([
			charts.LineChart,
			charts.BarChart,
			charts.ScatterChart,
			charts.EffectScatterChart,
			charts.CandlestickChart,
			charts.BoxplotChart,
			charts.HeatmapChart,
			charts.CustomChart,
			charts.LinesChart,
			charts.PieChart,
			charts.TreemapChart,
			charts.SunburstChart,
			charts.FunnelChart,
			charts.TreeChart,
			charts.SankeyChart,
			charts.GraphChart,
			charts.ThemeRiverChart,
			charts.RadarChart,
			charts.GaugeChart,
			charts.ParallelChart,
			charts.MapChart,
			components.GridComponent,
			components.TooltipComponent,
			components.AxisPointerComponent,
			components.LegendComponent,
			components.LegendScrollComponent,
			components.AriaComponent,
			components.DatasetComponent,
			components.TransformComponent,
			components.MarkLineComponent,
			components.MarkAreaComponent,
			components.MarkPointComponent,
			components.GraphicComponent,
			components.DataZoomComponent,
			components.DataZoomInsideComponent,
			components.DataZoomSliderComponent,
			components.VisualMapComponent,
			components.VisualMapContinuousComponent,
			components.VisualMapPiecewiseComponent,
			components.CalendarComponent,
			components.BrushComponent,
			components.ToolboxComponent,
			components.PolarComponent,
			components.RadarComponent,
			components.ParallelComponent,
			components.SingleAxisComponent,
			components.GeoComponent,
			renderers.CanvasRenderer,
			features.LabelLayout,
			features.UniversalTransition
		]);
		return core;
	})();
	return loading;
}
/**
* Register zrender's SVG renderer, on demand.
*
* The default surface paints to a canvas: it is the faster path for the ~20
* interactive families and the one every existing consumer already gets. A
* *capture* pipeline wants the other one — an SVG renderer emits real vector
* paths, which stay sharp at any scale and survive a PDF intact instead of
* being rasterised at whatever resolution the page happened to be printed at.
*
* It is registered rather than always loaded because the SVG renderer is a
* second implementation of the same drawing layer: a consumer that only ever
* renders interactive charts should not download it. Registration is a global
* engine property and is idempotent, so this is called at most once per page
* and only when `renderer: "svg"` is actually asked for.
*/
function ensureSvgRenderer() {
	svgRendererPromise ??= (async () => {
		const core = await loadECharts();
		const renderers = await import("echarts/renderers");
		core.use([renderers.SVGRenderer]);
	})();
	return svgRendererPromise;
}
/**
* Register a GeoJSON / TopoJSON map with the engine.
*
* LUC ships **no map data**: a world or country boundary file is large, it
* carries a licence, and bundling one would impose a particular political
* boundary set on every consumer. A product that wants a map therefore
* registers one itself, once, before rendering a `GeoScatterChart`:
*
*   await registerEChartsMap("world", worldGeoJson);
*   <GeoScatterChart mapName="world" points={…} />
*
* It lives on the runtime rather than in a component because registration is a
* global engine property; doing it inside a render would run once per mount.
*/
async function registerEChartsMap(name, geoJson, options = {}) {
	(await loadECharts()).registerMap(name, geoJson, options.specialAreas);
}
//#endregion
export { ensureSvgRenderer, loadECharts, registerEChartsMap };

//# sourceMappingURL=runtime.js.map