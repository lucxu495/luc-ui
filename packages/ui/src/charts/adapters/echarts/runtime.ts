/**
 * ECharts runtime — modular registration, loaded lazily.
 *
 * The whole ECharts bundle is never imported: only the chart types and
 * components LUC actually renders are registered, and registration happens in a
 * dynamic import so the module never evaluates during SSR. The promise is
 * memoised, so every adapter instance shares one download.
 *
 * Apache ECharts is Apache-2.0; its NOTICE travels with the installed package.
 */

import type * as EChartsCore from "echarts/core";

export type EChartsModule = typeof EChartsCore;
export type EChartsInstance = ReturnType<EChartsModule["init"]>;

let loading: Promise<EChartsModule> | null = null;
let svgRendererPromise: Promise<void> | null = null;

export function loadECharts(): Promise<EChartsModule> {
  if (loading) return loading;
  loading = (async () => {
    const [core, charts, components, renderers, features] = await Promise.all([
      import("echarts/core"),
      import("echarts/charts"),
      import("echarts/components"),
      import("echarts/renderers"),
      import("echarts/features"),
    ]);

    core.use([
      // Cartesian + relational
      charts.LineChart,
      charts.BarChart,
      charts.ScatterChart,
      charts.EffectScatterChart,
      charts.CandlestickChart,
      charts.BoxplotChart,
      charts.HeatmapChart,
      charts.CustomChart,
      charts.LinesChart,
      // Composition + hierarchy
      charts.PieChart,
      charts.TreemapChart,
      charts.SunburstChart,
      charts.FunnelChart,
      charts.TreeChart,
      // Flow / network
      charts.SankeyChart,
      charts.GraphChart,
      charts.ThemeRiverChart,
      // Radial
      charts.RadarChart,
      charts.GaugeChart,
      /*
       * Multidimensional. `ParallelChart` is the second parallel-coordinate
       * implementation in the ecosystem and the only one ECharts can brush, so
       * it is the right engine for a scatterplot-matrix alternative: it stays
       * readable at ten dimensions where a SPLOM needs ten grids.
       */
      charts.ParallelChart,
      /*
       * Maps. `MapChart` is the region fill and `GeoComponent` is the
       * coordinate system a `GeoScatterChart` scatters into — registering the
       * chart without the component is the classic "option accepted, nothing
       * drawn" trap.
       */
      charts.MapChart,
      // Components
      components.GridComponent,
      components.TooltipComponent,
      components.AxisPointerComponent,
      /*
       * The series legend — the control that hides and restores a series.
       *
       * ECharts' modular build makes an unregistered component a *silent* no-op:
       * the `legend` option is accepted, merged, and never drawn. Both the plain
       * and the scrolling variants are registered, because a chart with many
       * series declares `type: "scroll"`.
       */
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
      /*
       * Brush stores its clear/select controls in the toolbox. Registering
       * Brush alone accepts the option but leaves ECharts emitting a runtime
       * "ToolboxComponent is used but not imported" error whenever the reader
       * enables brush selection.
       */
      components.ToolboxComponent,
      components.PolarComponent,
      components.RadarComponent,
      components.ParallelComponent,
      /*
       * A single-axis chart (theme river / a vertical Gantt rail) is built on
       * `singleAxis`; without this registration the option is accepted and
       * silently draws nothing — the same failure mode the legend had.
       */
      components.SingleAxisComponent,
      components.GeoComponent,
      // Renderer + optional behaviours
      renderers.CanvasRenderer,
      features.LabelLayout,
      features.UniversalTransition,
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
export function ensureSvgRenderer(): Promise<void> {
  svgRendererPromise ??= (async () => {
    const core = await loadECharts();
    const renderers = await import("echarts/renderers");
    core.use([renderers.SVGRenderer]);
  })();
  return svgRendererPromise;
}

/** ECharts' own option type, kept behind a name that reads as "escape hatch". */
export type EngineOption = Record<string, unknown>;

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
export async function registerEChartsMap(
  name: string,
  geoJson: unknown,
  options: { specialAreas?: Record<string, unknown> } = {},
): Promise<void> {
  const core = (await loadECharts()) as unknown as {
    registerMap: (mapName: string, geoJson: unknown, specialAreas?: unknown) => void;
  };
  core.registerMap(name, geoJson, options.specialAreas);
}
