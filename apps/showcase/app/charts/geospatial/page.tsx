"use client";

import { useEffect, useState } from "react";
import { ChoroplethChart, GeoTrajectoryChart, Section, Text } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ChartPanel } from "@/components/charts/chart-panel";
import { choroplethRegions, gridMapName, trajectoryRoutes } from "@/lib/chart-packs-v5-data";
import { ensureGridMap } from "@/lib/geo-map";
import { useI18n } from "@/lib/i18n/provider";


export default function GeospatialChartsPage() {
  const { tc, tcs } = useI18n();
  const [mapReady, setMapReady] = useState(false);

  // A map is registered once, globally, before a choropleth is rendered.
  useEffect(() => {
    let cancelled = false;
    /*
     * One registration per realm, shared with the geographic chart pages: the
     * engine's map registry is global, and registering the same map again while
     * a choropleth is alive is what makes ECharts throw inside its own geo
     * layout. See `lib/geo-map.ts`.
     */
    ensureGridMap()
      .then(() => {
        if (!cancelled) setMapReady(true);
      })
      .catch(() => {
        if (!cancelled) setMapReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DocPage>
      <PageHeader eyebrow={tcs("Charts")} title="Geospatial charts" lead={tc("charts.geospatial.lead")} />

      <Section title={tc("charts.geospatial.choropleth.title")} description={tc("charts.geospatial.choropleth.lead")}>
        <ChartPanel
          title={tcs("Choropleth")}
          description={tc("charts.geospatial.choropleth.note")}
          height={380}
          render={({ height }) =>
            mapReady ? (
              <ChoroplethChart
                height={height}
                ariaLabel={tcs("Regional values on a synthetic grid map")}
                ariaDescription={tcs("Regions come from the registered example map; a region without a value is drawn as no-data.")}
                mapName={gridMapName}
                regions={choroplethRegions}
                valueLabel={tc("charts.geospatial.choropleth.value")}
                format={{ kind: "number", decimals: 1 }}
              />
            ) : (
              <div className="grid h-full place-items-center text-caption text-fg-muted">
                {tc("charts.geospatial.choropleth.loading")}
              </div>
            )
          }
        />
      </Section>

      <Section title={tc("charts.geospatial.routes.title")} description={tc("charts.geospatial.routes.lead")}>
        <ChartPanel
          title={tcs("Trajectories")}
          description={tc("charts.geospatial.routes.note")}
          height={340}
          render={({ height }) => (
            <GeoTrajectoryChart
              height={height}
              ariaLabel={tcs("Two routes, one crossing the antimeridian")}
              trajectories={trajectoryRoutes}
              xLabel="Longitude"
              yLabel="Latitude"
              format={{ kind: "number", decimals: 1 }}
            />
          )}
        />
      </Section>

      <Section title={tc("charts.geospatial.policy.title")} description={tc("charts.geospatial.policy.lead")}>
        <Text variant="caption" tone="muted">
          {tc("charts.geospatial.policy.body")}
        </Text>
      </Section>
    </DocPage>
  );
}
