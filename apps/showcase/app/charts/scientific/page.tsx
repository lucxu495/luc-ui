"use client";

import {
  ContourChart,
  HexbinChart,
  ParallelCoordinatesChart,
  PolarRoseChart,
  RidgelineChart,
  Section,
  SpectrogramChart,
  TernaryChart,
  ThemeRiverChart,
  VectorFieldChart,
  WindRoseChart,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ChartPanel } from "@/components/charts/chart-panel";
import {
  contourSurface,
  contourLevels,
  hexbinCells,
  parallelAxes,
  parallelRows,
  ridgelineGroups,
  spectrogramValues,
  spectrogramXValues,
  spectrogramYValues,
  ternaryPoints,
  themeRiverEvents,
  vectorField,
} from "@/lib/chart-packs-data";
import { useI18n } from "@/lib/i18n/provider";


export default function ScientificChartsPage() {
  const { tc, tcs } = useI18n();
  return (
    <DocPage>
      <PageHeader eyebrow={tcs("Charts")} title="Scientific charts" lead={tc("charts.scientific.lead")} />

      <Section title={tc("charts.scientific.many.title")} description={tc("charts.scientific.many.lead")}>
        <ChartPanel
          title={tcs("Parallel coordinates")}
          description={tc("charts.scientific.parallel")}
          height={340}
          render={({ height }) => (
            <ParallelCoordinatesChart
              height={height}
              ariaLabel={tcs("Strategy parameters across six dimensions")}
              axes={parallelAxes}
              rows={parallelRows}
              opacity={0.4}
            />
          )}
        />
      </Section>

      <Section title={tc("charts.scientific.geometry.title")} description={tc("charts.scientific.geometry.lead")}>
        <div className="grid gap-5 xl:grid-cols-2">
          <ChartPanel
            title={tcs("Ternary")}
            description={tc("charts.scientific.ternary")}
            height={320}
            render={({ height }) => (
              <TernaryChart
                height={height}
                ariaLabel={tcs("Portfolio composition in three risk buckets")}
                points={ternaryPoints}
                corners={["Carry", "Trend", "Value"]}
                format={{ kind: "percent", decimals: 0 }}
              />
            )}
          />
          <ChartPanel
            title={tcs("Polar rose")}
            description={tc("charts.scientific.rose")}
            height={320}
            render={({ height }) => (
              <PolarRoseChart
                height={height}
                ariaLabel="Exposure by sector"
                data={[
                  { name: "Rates", value: 32 },
                  { name: "Credit", value: 24 },
                  { name: "Equity", value: 41 },
                  { name: "FX", value: 18 },
                  { name: "Commodity", value: 12 },
                  { name: "Cash", value: 9 },
                ]}
              />
            )}
          />
        </div>
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <ChartPanel
            title={tcs("Wind rose")}
            description={tc("charts.scientific.wind")}
            height={320}
            render={({ height }) => (
              <WindRoseChart
                height={height}
                ariaLabel={tcs("Directional distribution of trade flow")}
                directions={["N", "NE", "E", "SE", "S", "SW", "W", "NW"]}
                series={[
                  { label: "Small", values: [42, 31, 24, 18, 27, 35, 44, 46], tone: "info" },
                  { label: "Medium", values: [22, 17, 13, 11, 16, 21, 26, 24], tone: "accent" },
                  { label: "Large", values: [8, 6, 4, 3, 6, 9, 12, 10], tone: "positive" },
                ]}
              />
            )}
          />
          <ChartPanel
            title={tcs("Vector field")}
            description={tc("charts.scientific.vector")}
            height={320}
            render={({ height }) => (
              <VectorFieldChart
                height={height}
                ariaLabel="Rotational vector field"
                vectors={vectorField}
                scale={0.42}
              />
            )}
          />
        </div>
      </Section>

      <Section title={tc("charts.scientific.density.title")} description={tc("charts.scientific.density.lead")}>
        <div className="grid gap-5 xl:grid-cols-2">
          <ChartPanel
            title={tcs("Contour")}
            description={tc("charts.scientific.contour")}
            height={320}
            render={({ height }) => (
              <ContourChart
                height={height}
                ariaLabel={tcs("Iso-lines of a sampled saddle")}
                levels={contourLevels}
                surface={contourSurface}
                zFormat={{ kind: "number", decimals: 1 }}
              />
            )}
          />
          <ChartPanel
            title={tcs("Hexbin")}
            description={tc("charts.scientific.hexbin")}
            height={320}
            render={({ height }) => (
              <HexbinChart
                height={height}
                ariaLabel={tcs("Sample density over a plane")}
                radius={0.23}
                cells={hexbinCells}
                valueLabel="Samples"
                valueFormat={{ kind: "integer" }}
              />
            )}
          />
        </div>
        <div className="mt-5">
          <ChartPanel
            title={tcs("Spectrogram")}
            description={tc("charts.scientific.spectrogram")}
            height={340}
            render={({ height }) => (
              <SpectrogramChart
                height={height}
                ariaLabel={tcs("Spectrogram of a synthetic chirp")}
                xValues={spectrogramXValues}
                yValues={spectrogramYValues}
                values={spectrogramValues}
                unit="dBFS"
                range={{ min: -96, max: -12 }}
              />
            )}
          />
        </div>
      </Section>

      <Section title={tc("charts.scientific.flow.title")} description={tc("charts.scientific.flow.lead")}>
        <div className="grid gap-5 xl:grid-cols-2">
          <ChartPanel
            title={tcs("Theme river")}
            description={tc("charts.scientific.river")}
            height={320}
            render={({ height }) => (
              <ThemeRiverChart
                height={height}
                ariaLabel={tcs("Stream of research activity by family")}
                events={themeRiverEvents}
              />
            )}
          />
          <ChartPanel
            title={tcs("Ridgeline")}
            description={tc("charts.scientific.ridgeline")}
            height={320}
            render={({ height }) => (
              <RidgelineChart
                height={height}
                ariaLabel={tcs("Return distribution per year")}
                groups={ridgelineGroups}
                overlap={0.55}
              />
            )}
          />
        </div>
      </Section>
    </DocPage>
  );
}
