import * as EChartsCore from "echarts/core";
//#region src/charts/adapters/echarts/runtime.d.ts
export type EChartsModule = typeof EChartsCore;
export type EChartsInstance = ReturnType<EChartsModule["init"]>;
export declare function loadECharts(): Promise<EChartsModule>;
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
export declare function registerEChartsMap(name: string, geoJson: unknown, options?: {
  specialAreas?: Record<string, unknown>;
}): Promise<void>;
//#endregion
//# sourceMappingURL=runtime.d.ts.map