/*
 * The fixture base map, registered once per browser realm.
 *
 * `registerEChartsMap` is a global engine property — the library says so itself —
 * and calling it again while a choropleth instance is alive is the one thing
 * that can make ECharts throw inside its own geo layout. More than one page in
 * this Showcase needs the same synthetic grid (the geospatial family page and
 * the three geographic chart pages), and each of them mounts on its own route,
 * so the registration is memoised here rather than repeated per mount.
 *
 * The promise is cached, not the boolean: two components that mount at the same
 * moment await the same registration instead of racing two of them.
 */

import { registerEChartsMap } from "@luc/ui";
import { gridMapGeoJson, gridMapName } from "./chart-packs-v5-data";

let registered: Promise<void> | null = null;

export function ensureGridMap(): Promise<void> {
  if (registered === null) {
    registered = registerEChartsMap(gridMapName, gridMapGeoJson).catch((error: unknown) => {
      /* A failed registration must not be cached: the next mount should try
       * again rather than inherit an unretryable rejection. */
      registered = null;
      throw error;
    });
  }
  return registered;
}

export { gridMapName };
