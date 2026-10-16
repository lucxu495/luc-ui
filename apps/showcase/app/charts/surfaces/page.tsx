"use client";

import { useState } from "react";
import { Section, Slider, Surface3DChart, Text, VolatilitySurfaceChart } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ChartPanel } from "@/components/charts/chart-panel";
import { Demo } from "@/components/docs/demo";
import { surfaceMaturities, surfaceStrikes, surfaceValue, volatilityGrid } from "@/lib/chart-packs-v5-data";
import { useI18n } from "@/lib/i18n/provider";


const strikeGrid = surfaceMaturities.map((maturity) => surfaceStrikes.map((strike) => surfaceValue(strike, maturity)));

export default function SurfaceChartsPage() {
  const { tc, tcs } = useI18n();
  const [azimuth, setAzimuth] = useState(-34);
  const [elevation, setElevation] = useState(28);

  return (
    <DocPage>
      <PageHeader eyebrow={tcs("Charts")} title="Surfaces" lead={tc("charts.surfaces.lead")} />

      <Section title={tc("charts.surfaces.view.title")} description={tc("charts.surfaces.view.lead")}>
        <Demo layout="block" code={"<Surface3DChart z={grid} azimuth={azimuth} elevation={elevation} />"}>
          <div className="flex flex-col gap-4">
            <Surface3DChart
              height={400}
              ariaLabel={tcs("Projected surface of a two-parameter function")}
              z={strikeGrid}
              xLabels={surfaceStrikes}
              yLabels={surfaceMaturities}
              xLabel="Strike"
              yLabel="Maturity"
              zLabel="Value"
              azimuth={azimuth}
              elevation={elevation}
              onViewChange={({ azimuth: nextAzimuth, elevation: nextElevation }) => {
                setAzimuth(nextAzimuth);
                setElevation(nextElevation);
              }}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Text variant="caption" tone="muted">
                  {tc("charts.surfaces.view.azimuth")}
                </Text>
                <Slider
                  value={azimuth}
                  min={0}
                  max={360}
                  label={tc("charts.surfaces.view.azimuth")}
                  onValueChange={setAzimuth}
                  showValue="always"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Text variant="caption" tone="muted">
                  {tc("charts.surfaces.view.elevation")}
                </Text>
                <Slider
                  value={elevation}
                  min={-80}
                  max={80}
                  label={tc("charts.surfaces.view.elevation")}
                  onValueChange={setElevation}
                  showValue="always"
                />
              </div>
            </div>
          </div>
        </Demo>
      </Section>

      <Section title={tc("charts.surfaces.wire.title")} description={tc("charts.surfaces.wire.lead")}>
        <div className="grid gap-5 xl:grid-cols-2">
          <ChartPanel
            title={tcs("Wireframe")}
            description={tc("charts.surfaces.wire.note")}
            height={340}
            render={({ height }) => (
              <Surface3DChart
                height={height}
                ariaLabel={tcs("Wireframe of the same surface")}
                z={strikeGrid}
                xLabels={surfaceStrikes}
                yLabels={surfaceMaturities}
                xLabel="Strike"
                yLabel="Maturity"
                zLabel="Value"
                mode="wireframe"
              />
            )}
          />
          <ChartPanel
            title={tcs("Volatility surface")}
            description={tc("charts.surfaces.vol.note")}
            height={340}
            render={({ height }) => (
              <VolatilitySurfaceChart
                height={height}
                ariaLabel="Implied volatility surface"
                strikes={surfaceStrikes}
                maturities={surfaceMaturities}
                vols={volatilityGrid}
                strikeLabel="Strike"
                maturityLabel="Maturity (years)"
              />
            )}
          />
        </div>
      </Section>

      <Section title={tc("charts.surfaces.rule.title")} description={tc("charts.surfaces.rule.lead")}>
        <Text variant="caption" tone="muted">
          {tc("charts.surfaces.rule.body")}
        </Text>
      </Section>
    </DocPage>
  );
}
