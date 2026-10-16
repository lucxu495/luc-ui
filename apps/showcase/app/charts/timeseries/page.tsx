"use client";

import {
  AreaChart,
  Badge,
  Code,
  Inline,
  LineChart,
  Section,
  Text,
  formatNumber,
  type SeriesSpec,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ChartPanel } from "@/components/charts/chart-panel";
import { TIME_RANGES, marketSeries, pctChange, revenueRows, windowForRange } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n/provider";

const ROWS = marketSeries({ days: 900 });
const LATEST = ROWS[ROWS.length - 1]!;
const YEAR_AGO = ROWS[Math.max(0, ROWS.length - 366)]!;
const CHANGE = pctChange(YEAR_AGO.close, LATEST.close);

const MULTI: SeriesSpec[] = [
  { key: "close", label: "Close", type: "line", tone: "accent", lineWidth: 2 },
  { key: "sma50", label: "SMA 50", type: "line", tone: "info", lineWidth: 1.5, lineType: "dashed", symbol: false },
  { key: "sma200", label: "SMA 200", type: "line", tone: "neutral", lineWidth: 1.5, symbol: false },
];

const BAND_ROWS = ROWS.map((row) => ({
  time: row.time,
  bandBase: row.bandLower,
  bandWidth: row.bandUpper !== null && row.bandLower !== null ? row.bandUpper - row.bandLower : null,
  close: row.close,
}));

const CHANGE_ROWS = ROWS.map((row, index) => {
  const previous = index === 0 ? row.close : ROWS[index - 1]!.close;
  const change = row.close - previous;
  return { time: row.time, gain: Math.max(0, change), loss: Math.min(0, change) };
});

const SPARSE_ROWS = ROWS.map((row, index) =>
  index % 17 === 0 || index % 53 === 0 ? { ...row, rv30: null } : row,
);

const REVENUE = revenueRows(10);

export default function TimeSeriesPage() {
  const { tcs } = useI18n();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Charts · Time series")}
        title="Line and area"
        lead="One component covers the line family: smooth, step, area, band, stacked, positive/negative and missing values are all properties of a series, not separate chart types."
      />

      <Section
        title={tcs("Multi-series with a legend and a range")}
        description={tcs("Three prepared series, the legend doubling as the visibility control, a trailing range selector and a fullscreen research view.")}
      >
        <ChartPanel
          title={tcs("Close with moving averages")}
          readout={
            <Inline gap="sm">
              <Text variant="label" as="span">
                {formatNumber(LATEST.close, { kind: "currency", minimumFractionDigits: 2 })}
              </Text>
              <Badge size="sm" tone={CHANGE >= 0 ? "positive" : "negative"} dot>
                {formatNumber(CHANGE, { kind: "percent", signed: true })}
              </Badge>
            </Inline>
          }
          series={[
            { id: "close", label: "Close", tone: "accent" },
            { id: "sma50", label: "SMA 50", tone: "info" },
            { id: "sma200", label: "SMA 200", tone: "neutral" },
          ]}
          defaultVisible={["close", "sma50", "sma200"]}
          ranges={TIME_RANGES}
          defaultRange="1y"
          height={360}
          states
          render={({ range, visibleSeries, state, height }) => (
            <LineChart
              data={windowForRange(ROWS, range)}
              xKey="time"
              series={MULTI}
              visibleSeries={visibleSeries}
              interaction={{ zoom: "inside" }}
              height={height}
              state={state}
              ariaLabel={tcs("Close price with 50 and 200 day moving averages")}
            />
          )}
        />
      </Section>

      <Section title={tcs("Line weight")} description={tcs("Smooth and step are attributes of the same series model.")}>
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartPanel
            title={tcs("Smooth")}
            description={tcs("Interpolated join, no symbols past 60 points.")}
            height={260}
            render={({ height }) => (
              <LineChart
                data={windowForRange(ROWS, "1y")}
                xKey="time"
                series={[{ key: "close", label: "Close", type: "line", smooth: true, tone: "accent" }]}
                height={height}
              />
            )}
          />
          <ChartPanel
            title={tcs("Step")}
            description={tcs("For values that change discretely, such as a policy rate.")}
            height={260}
            render={({ height }) => (
              <LineChart
                data={windowForRange(ROWS, "1y")}
                xKey="time"
                series={[
                  { key: "rv30", label: "Realized vol 30d", type: "line", step: "middle", tone: "warning", symbol: false },
                ]}
                height={height}
              />
            )}
          />
        </div>
      </Section>

      <Section title={tcs("Area")} description={tcs("Gradient fill by default; stacking is a property, not a different component.")}>
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartPanel
            title={tcs("Gradient area")}
            description={tcs("A single series, filled toward the axis.")}
            height={260}
            render={({ height }) => (
              <AreaChart
                data={windowForRange(ROWS, "1y")}
                xKey="time"
                series={[{ key: "close", label: "Close", type: "area", tone: "accent" }]}
                height={height}
              />
            )}
          />
          <ChartPanel
            title={tcs("Stacked area")}
            description={tcs("Three revenue lines sharing one stack key.")}
            height={260}
            series={[
              { id: "product", label: "Product", tone: "accent" },
              { id: "services", label: "Services", tone: "info" },
              { id: "partnerships", label: "Partnerships", tone: "neutral" },
            ]}
            render={({ height, visibleSeries }) => (
              <AreaChart
                data={REVENUE}
                xKey="period"
                series={[
                  { key: "product", label: "Product", type: "area", stack: "revenue", tone: "accent" },
                  { key: "services", label: "Services", type: "area", stack: "revenue", tone: "info" },
                  { key: "partnerships", label: "Partnerships", type: "area", stack: "revenue", tone: "neutral" },
                ]}
                visibleSeries={visibleSeries}
                height={height}
              />
            )}
          />
        </div>
      </Section>

      <Section
        title={tcs("Range and direction")}
        description={tcs("A confidence band is a transparent stacked base plus a filled range; positive/negative areas are two series split at zero.")}
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartPanel
            title={tcs("Confidence band")}
            description={tcs("Prepared upper and lower bounds; the chart does not compute them.")}
            height={260}
            render={({ height }) => (
              <LineChart
                data={windowForRange(BAND_ROWS, "1y")}
                xKey="time"
                series={[
                  {
                    key: "bandBase",
                    label: "Band base",
                    type: "line",
                    stack: "band",
                    area: true,
                    color: "transparent",
                    symbol: false,
                    lineWidth: 0,
                  },
                  {
                    key: "bandWidth",
                    label: "Band",
                    type: "line",
                    stack: "band",
                    area: true,
                    tone: "accent",
                    symbol: false,
                    lineWidth: 1,
                    opacity: 0.9,
                  },
                  { key: "close", label: "Close", type: "line", tone: "neutral", lineWidth: 1.6, symbol: false },
                ]}
                tooltip={{ mode: "axis" }}
                height={height}
              />
            )}
          />
          <ChartPanel
            title={tcs("Positive / negative area")}
            description={tcs("Daily change split at zero, ready for a div-based renderer.")}
            height={260}
            render={({ height }) => (
              <AreaChart
                data={windowForRange(CHANGE_ROWS, "1y")}
                xKey="time"
                series={[
                  { key: "gain", label: "Up days", type: "area", tone: "positive", symbol: false, lineWidth: 1 },
                  { key: "loss", label: "Down days", type: "area", tone: "negative", symbol: false, lineWidth: 1 },
                ]}
                height={height}
              />
            )}
          />
        </div>
      </Section>

      <Section
        title={tcs("Gaps, thresholds and events")}
        description={tcs("Missing values are gaps, never zeros; reference lines and event markers are annotations on the same chart.")}
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartPanel
            title={tcs("Missing values")}
            description={tcs("Null points break the line instead of dropping to the axis.")}
            height={260}
            render={({ height }) => (
              <LineChart
                data={windowForRange(SPARSE_ROWS, "1y")}
                xKey="time"
                series={[{ key: "rv30", label: "Realized vol 30d", type: "line", tone: "warning", symbol: true }]}
                height={height}
              />
            )}
          />
          <ChartPanel
            title={tcs("Thresholds and events")}
            description={tcs("A reference line, a reference band and two event markers, all prepared data.")}
            height={260}
            render={({ height }) => (
              <LineChart
                data={windowForRange(ROWS, "1y")}
                xKey="time"
                series={[{ key: "close", label: "Close", type: "line", tone: "accent", symbol: false }]}
                annotations={{
                  referenceBands: [
                    {
                      from: windowForRange(ROWS, "1y")[60]!.time,
                      to: windowForRange(ROWS, "1y")[110]!.time,
                      label: "Elevated regime",
                      tone: "warning",
                    },
                  ],
                  referenceLines: [{ value: 100_000, label: "100k", axisLabel: true, tone: "neutral" }],
                  markers: [
                    { at: windowForRange(ROWS, "1y")[40]!.time, label: "Rate decision", shape: "flag", line: true },
                    { at: windowForRange(ROWS, "1y")[150]!.time, label: "Protocol event", shape: "pin", line: true },
                  ],
                }}
                height={height}
              />
            )}
          />
        </div>
      </Section>

      <Section title={tcs("Usage")} description={tcs("The band trick is worth copying verbatim when you need an envelope.")}>
        <Code block>{`<LineChart
  data={rows}
  xKey="time"
  series={[
    { key: "bandBase", stack: "band", area: true, color: "transparent", lineWidth: 0 },
    { key: "bandWidth", stack: "band", area: true, tone: "accent", lineWidth: 1 },
    { key: "close", tone: "neutral", lineWidth: 1.6 },
  ]}
/>`}</Code>
      </Section>
    </DocPage>
  );
}
