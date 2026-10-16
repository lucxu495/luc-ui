/*
 * Geographic charts.
 *
 * Two of the three need a registered base map, which is the library's explicit
 * position: no boundary data ships with it. The demos therefore register the
 * Showcase's own synthetic grid — a 6×4 lattice that could not be mistaken for a
 * real country — and say so, rather than importing a world map and pretending
 * the choropleth works out of the box.
 */

import {
  ChoroplethDemo,
  GeoScatterDemo,
  GeoTrajectoryDemo,
} from "@/components/demo/islands/geo-demo";
import { composition, type DemoSpec } from "../index";

export const chartGeographicDemos: readonly DemoSpec[] = [
  composition({
    id: "choropleth-chart",
    node: <ChoroplethDemo />,
    note: "A six-by-four synthetic grid registered by the page; one region carries no value and is drawn as no-data.",
    code: `// A map is registered once, globally, before a choropleth renders.
useEffect(() => {
  registerEChartsMap("luc-showcase-grid", gridGeoJson).then(() => setReady(true));
}, []);

<ChoroplethChart
  mapName="luc-showcase-grid"
  regions={regions}
  valueLabel="Index"
  format={{ kind: "number", decimals: 1 }}
  ariaLabel="Values on a grid map"
/>`,
  }),
  composition({
    id: "geo-scatter-chart",
    node: <GeoScatterDemo />,
    note: "Point locations on the same registered map, sized by the value the caller supplied.",
    code: `<GeoScatterChart
  mapName="luc-showcase-grid"
  points={[
    { name: "R2C3", coordinates: [-30, 45], value: 42 },
    { name: "R2C5", coordinates: [90, 45], value: 28 },
  ]}
  valueFormat={{ kind: "integer" }}
  ariaLabel="Readings on a grid map"
/>`,
  }),
  composition({
    id: "geo-trajectory-chart",
    node: <GeoTrajectoryDemo />,
    note: "Two supplied routes; the second crosses the antimeridian and is unwrapped for drawing only.",
    code: `<GeoTrajectoryChart
  trajectories={routes}
  xLabel="Longitude"
  yLabel="Latitude"
  format={{ kind: "number", decimals: 1 }}
  ariaLabel="Two routes"
/>`,
  }),
];
