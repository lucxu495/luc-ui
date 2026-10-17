"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Code,
  GeoScatterChart,
  HierarchyTreeChart,
  ScatterMatrixChart,
  Section,
  Text,
  registerEChartsMap,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ChartPanel } from "@/components/charts/chart-panel";
import { geoPoints, hierarchyRoot, scatterMatrixRows, scatterMatrixVariables } from "@/lib/chart-packs-data";
import { useI18n } from "@/lib/i18n/provider";


/*
 * A stand-in for a real boundary file.
 *
 * LUC ships no map data, so the Showcase registers a synthetic strip of
 * rectangles over Europe and West Asia. It proves the mechanism — register,
 * then scatter — without shipping a political boundary set, and the page says
 * so out loud.
 */
const DEMO_MAP = {
  type: "FeatureCollection" as const,
  features: Array.from({ length: 12 }, (_, row) =>
    Array.from({ length: 24 }, (_, column) => ({
      type: "Feature" as const,
      properties: { name: `cell-${row}-${column}` },
      geometry: {
        type: "Polygon" as const,
        coordinates: [
          [
            [-100 + column * 9.5, -40 + row * 8],
            [-90.6 + column * 9.5, -40 + row * 8],
            [-90.6 + column * 9.5, -32.2 + row * 8],
            [-100 + column * 9.5, -32.2 + row * 8],
            [-100 + column * 9.5, -40 + row * 8],
          ],
        ],
      },
    })),
  ).flat(),
};

export default function MultidimensionalChartsPage() {
  const { tc, tcs } = useI18n();
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    registerEChartsMap("luc-demo-world", DEMO_MAP)
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
      <PageHeader
        eyebrow={tcs("Charts")}
        title="Multidimensional, hierarchy and geography"
        lead={tc("charts.multidimensional.lead")}
      />

      <Section
        title={tc("charts.multidimensional.matrix.title")}
        description={tc("charts.multidimensional.matrix.lead")}
      >
        <ChartPanel
          title={tcs("Scatterplot matrix")}
          description={tc("charts.multidimensional.splom")}
          height={520}
          render={({ height }) => (
            <ScatterMatrixChart
              height={height}
              ariaLabel={tcs("Pairwise relationships between four portfolio measures")}
              variables={scatterMatrixVariables}
              rows={scatterMatrixRows}
              cellSize={130}
            />
          )}
        />
      </Section>

      <Section
        title={tc("charts.multidimensional.tree.title")}
        description={tc("charts.multidimensional.tree.lead")}
      >
        <ChartPanel
          title={tcs("Hierarchy")}
          description={tc("charts.multidimensional.tree")}
          height={360}
          render={({ height }) => (
            <HierarchyTreeChart
              height={height}
              ariaLabel={tcs("Package tree of the Luc UI workspace")}
              root={hierarchyRoot}
              orientation="left-right"
              format={{ kind: "integer" }}
            />
          )}
        />
      </Section>

      <Section
        title={tc("charts.multidimensional.geo.title")}
        description={tc("charts.multidimensional.geo.lead")}
      >
        <div className="grid gap-5 xl:grid-cols-2">
          <ChartPanel
            title={tcs("Geographic scatter")}
            description={tc("charts.multidimensional.geo.registered")}
            height={340}
            render={({ height }) => (
              <GeoScatterChart
                height={height}
                mapName={mapReady ? "luc-demo-world" : ""}
                ariaLabel="Activity by location"
                points={geoPoints}
                valueFormat={{ kind: "integer" }}
                /* The synthetic grid carries no projection metadata, so the
                   bounds are passed explicitly — the documented escape hatch. */
                boundingCoords={[
                  [-110, 56],
                  [130, -45],
                ]}
              />
            )}
          />
          <Card variant="outline" className="flex flex-col gap-4 p-5">
            <Text variant="label">{tc("charts.multidimensional.geo.rules.title")}</Text>
            <Text variant="caption" tone="secondary">
              {tc("charts.multidimensional.geo.rules.body")}
            </Text>
            <Code block>{`import { registerEChartsMap, GeoScatterChart } from "@luc/ui/charts";

// Once, before the first render.
await registerEChartsMap("world", worldGeoJson);

<GeoScatterChart mapName="world" points={offices} />`}</Code>
            <Text variant="caption" tone="muted">
              {tc("charts.multidimensional.geo.blocked")}
            </Text>
          </Card>
        </div>
      </Section>
    </DocPage>
  );
}
