"use client";

import {
  DistributionChart,
  EventTimeline,
  FanChart,
  LineChart,
  QuadrantScatterChart,
  RangeBandChart,
  RegimeStrip,
  ScatterRegressionChart,
  Section,
  SmallMultiple,
  SmallMultiples,
  divergingPalette,
  seriesColor,
  sequentialPalette,
  useChartTheme,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ChartPanel } from "@/components/charts/chart-panel";
import { fanSeries, marketSeries, regimeIntervals, returnDistribution, scatterRows, studyEvents } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n/provider";

const FAN = fanSeries();
const DIST = returnDistribution();
const REGIME = regimeIntervals();
const EVENTS = studyEvents();
const SCATTER = scatterRows(160).map((row) => ({ x: row.factor, y: row.forward, label: row.bucket }));
const BAND = marketSeries({ days: 420 }).map((row) => {
  const value = row.drawdown * 100;
  // A visible interval: the demo band is deliberately wide so the fill reads.
  return { t: row.time, center: value, lower: value - 600, upper: value + 600 };
});

/**
 * The V1.1 research vocabulary: uncertainty bands, prepared fits, categorical
 * time strips and event studies. Every value on this page is *prepared* — LUC UI
 * never simulates, regresses or bins.
 */
export default function UncertaintyPage() {
  const { tcs } = useI18n();
  const theme = useChartTheme();

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Charts · Uncertainty")}
        title="Uncertainty and evidence"
        lead="A forecast cone, a prepared fit, a regime strip, an event study and a distribution — the charts a research page needs once a single line stops being enough. Nothing here is computed in the UI."
      />

      <Section
        title={tcs("Fan chart")}
        description={tcs("Nested quantile bands on one hue: the shared colour says 'the same estimate', the layered opacity says 'how far from the centre'.")}
      >
        <ChartPanel
          title={tcs("Bootstrapped 90-day path")}
          description={tcs("Two prepared quantile bands around a median.")}
          height={320}
          render={({ height }) => (
            <FanChart
              x={FAN.x}
              bands={FAN.bands}
              median={FAN.median}
              height={height}
              ariaLabel="Bootstrapped path fan"
            />
          )}
        />
      </Section>

      <Section
        title={tcs("Range band")}
        description={tcs("A centre line with one interval around it. The band is a fill, not two more lines.")}
      >
        <ChartPanel
          title={tcs("Estimate with interval")}
          description={tcs("Prepared lower/upper bounds.")}
          height={280}
          render={({ height }) => (
            <RangeBandChart points={BAND} bandLabel="80% interval" height={height} ariaLabel="Estimate band" />
          )}
        />
      </Section>

      <Section
        title={tcs("Prepared regression")}
        description={tcs("Observations plus a fit the analytics layer already computed — slope and intercept arrive as input.")}
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <ChartPanel
            title={tcs("Factor regression")}
            description={tcs("Point cloud, fitted line and a confidence band.")}
            height={300}
            render={({ height }) => (
              <ScatterRegressionChart
                points={SCATTER}
                regression={{ slope: 0.82, intercept: 0.04 }}
                band={{
                  xValues: SCATTER.map((point) => point.x),
                  lower: SCATTER.map((point) => 0.82 * point.x + 0.04 - 0.12),
                  upper: SCATTER.map((point) => 0.82 * point.x + 0.04 + 0.12),
                  label: "95% band",
                }}
                xLabel="Factor return"
                yLabel="Asset return"
                height={height}
                ariaLabel="Factor regression"
              />
            )}
          />
          <ChartPanel
            title={tcs("Risk vs return")}
            description={tcs("Four named quadrants around a reference pair.")}
            height={300}
            render={({ height }) => (
              <QuadrantScatterChart
                points={SCATTER}
                xReference={0}
                yReference={0}
                quadrantLabels={{
                  topRight: "Add",
                  topLeft: "Watch",
                  bottomRight: "Review",
                  bottomLeft: "Avoid",
                }}
                xLabel="Volatility"
                yLabel="Excess return"
                height={height}
                ariaLabel={tcs("Risk and return quadrants")}
              />
            )}
          />
        </div>
      </Section>

      <Section
        title={tcs("Distribution")}
        description={tcs("Bars, a density overlay and prepared reference levels. Signed samples split into the semantic positive/negative colours.")}
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <ChartPanel
            title={tcs("Forward returns")}
            description={tcs("Pre-binned sample with a kernel density the caller supplied.")}
            height={300}
            render={({ height }) => (
              <DistributionChart
                bins={DIST.bins}
                density={DIST.density}
                references={DIST.references}
                height={height}
                ariaLabel="Forward-return distribution"
              />
            )}
          />
          <ChartPanel
            title={tcs("Signed daily moves")}
            description={tcs("The same bins, split by sign — a histogram is not automatically two-coloured.")}
            height={300}
            render={({ height }) => (
              <DistributionChart
                bins={DIST.bins}
                signed
                height={height}
                ariaLabel="Signed distribution"
              />
            )}
          />
        </div>
      </Section>

      <Section
        title={tcs("Regime strip and event study")}
        description={tcs("Categorical regimes and dated events on a shared time axis — annotation that answers 'in which regime was this?'.")}
      >
        <div className="flex flex-col gap-4">
          <ChartPanel
            title={tcs("Regime timeline")}
            description={tcs("Each state keeps its own colour wherever it appears.")}
            height={110}
            render={({ height }) => (
              <RegimeStrip intervals={REGIME.intervals} states={REGIME.states} height={height} ariaLabel="Regimes" />
            )}
          />
          <ChartPanel
            title={tcs("Market events")}
            description={tcs("Events grouped by category, each with a dated guide.")}
            height={140}
            render={({ height }) => <EventTimeline events={EVENTS} height={height} ariaLabel="Events" />}
          />
          <ChartPanel
            title={tcs("Sparse events carry their own labels")}
            description={tcs("`labelMode=\"auto\"` prints each label at its marker while the history is short enough to read, and falls back to markers-only (the tooltip carries the name) once it is not.")}
            height={160}
            render={({ height }) => (
              <EventTimeline events={EVENTS.slice(0, 6)} labelMode="auto" height={height} ariaLabel="Sparse events" />
            )}
          />
        </div>
      </Section>

      <Section
        title={tcs("Small multiples")}
        description={tcs("One panel per window, shared x semantics — the alternative to an overcrowded single plot.")}
      >
        <SmallMultiples columns={2} label="Rolling Sharpe (annualised)">
          {["30D", "90D", "180D", "1Y"].map((window, index) => (
            <SmallMultiple key={window} title={window} aside={`${(0.6 + index * 0.12).toFixed(2)}`}>
              <LineChart
                data={SCATTER.slice(0, 80).map((_point, pointIndex) => ({
                  x: pointIndex,
                  value: 0.6 + index * 0.12 + Math.sin(pointIndex / 7 + index) * 0.5,
                }))}
                xKey="x"
                series={[{ key: "value", label: window, tone: "accent" }]}
                animation="subtle"
                height={120}
              />
            </SmallMultiple>
          ))}
        </SmallMultiples>
      </Section>

      <Section
        title={tcs("Palettes")}
        description={tcs("Categorical answers 'which series?', sequential answers 'how much?', diverging answers 'which side?'.")}
      >
        <div className="flex flex-col gap-5">
          <PaletteRow
            label={tcs("Categorical · series keys")}
            hint={tcs("A key maps to a stable slot, so filtering a series never repaints the others.")}
            colors={["price", "benchmark", "funding", "open_interest", "volatility", "dvol", "drawdown"].map((key) =>
              seriesColor(theme, key),
            )}
            captions={["price", "benchmark", "funding", "OI", "vol", "DVOL", "drawdown"]}
          />
          <PaletteRow
            label={tcs("Sequential · how much")}
            hint={tcs("Interpolated from the theme anchors, so a ramp sits beside the categorical hues.")}
            colors={[...sequentialPalette(theme, 7)]}
          />
          <PaletteRow
            label={tcs("Diverging · which side")}
            hint={tcs("A low-chroma midpoint, so 'no signal' reads as nothing.")}
            colors={[...divergingPalette(theme, 7)]}
          />
        </div>
      </Section>
    </DocPage>
  );
}

/** A swatch row. Kept presentational: this page demonstrates colour, not data. */
function PaletteRow({
  label,
  hint,
  colors,
  captions,
}: {
  label: string;
  hint: string;
  colors: readonly string[];
  captions?: readonly string[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-0.5">
        <span className="text-label font-medium text-fg-secondary">{label}</span>
        <span className="text-caption text-fg-muted">{hint}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {colors.map((color, index) => (
          <div key={`${color}-${index}`} className="flex flex-col gap-1">
            <span
              aria-hidden="true"
              className="block size-12 rounded-md border border-line-subtle"
              style={{ background: color }}
            />
            {captions?.[index] ? (
              <span className="text-micro text-fg-muted">{captions[index]}</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
