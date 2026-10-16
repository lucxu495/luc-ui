"use client";

import { BarChart, Card, Code, LineChart, Section, Text } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ChartPanel } from "@/components/charts/chart-panel";
import { TIME_RANGES, marketSeries, windowForRange } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n/provider";

const ROWS = marketSeries({ days: 500 });

export default function InteractionPage() {
  const { tcs } = useI18n();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Charts · Interaction")}
        title="Tooltips, zoom, brush, fullscreen"
        lead="Interaction is where a chart stops being a picture. LUC owns the tooltip surface, the crosshair, the zoom behaviour and the fullscreen research view, so none of them is left to an engine default."
      />

      <Section
        title={tcs("Tooltip modes")}
        description={tcs("Axis tooltips for time series, item tooltips for marks, and an explicit off switch.")}
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartPanel
            title={tcs("Axis tooltip")}
            description={tcs("One date header, one aligned row per visible series.")}
            height={280}
            render={({ height }) => (
              <LineChart
                data={ROWS}
                xKey="time"
                axes={[
                  { id: "primary", format: { kind: "currency", currency: "USD" } },
                  { id: "secondary", position: "left", format: { kind: "percent", decimals: 1 } },
                ]}
                series={[
                  { key: "close", label: "Close", tone: "accent", symbol: false, axis: "primary" },
                  { key: "rv30", label: "RV 30d", tone: "warning", symbol: false, axis: "secondary" },
                ]}
                tooltip={{ mode: "axis", sort: "none" }}
                height={height}
              />
            )}
          />
          <ChartPanel
            title={tcs("Item tooltip")}
            description={tcs("Used where there is no shared x: bars, scatter, heatmap, flow.")}
            height={280}
            render={({ height }) => (
              <BarChart
                data={ROWS.slice(-14).map((row) => ({ period: row.time, volume: row.volume / 1e9 }))}
                xKey="period"
                x={{ type: "time" }}
                tooltip={{ mode: "item" }}
                series={[{ key: "volume", label: "Volume", type: "bar", tone: "accent" }]}
                height={height}
              />
            )}
          />
        </div>
      </Section>

      <Section
        title={tcs("Zoom and brush")}
        description={tcs("Wheel zoom is opt-in per chart; brush selection is opt-in and stays a research affordance.")}
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartPanel
            title={tcs("Zoom inside")}
            description={tcs("Wheel to zoom, drag to pan. Scroll hijacking is limited to the plot itself.")}
            ranges={TIME_RANGES}
            defaultRange="1y"
            height={300}
            render={({ range, height }) => (
              <LineChart
                data={windowForRange(ROWS, range)}
                xKey="time"
                series={[{ key: "close", label: "Close", tone: "accent", symbol: false }]}
                interaction={{ zoom: "inside", pan: true }}
                height={height}
              />
            )}
          />
          <ChartPanel
            title={tcs("Brush")}
            description={tcs("Drag inside the plot to select a subrange; the toolbar clears it.")}
            height={300}
            render={({ height }) => (
              <LineChart
                data={ROWS}
                xKey="time"
                series={[{ key: "close", label: "Close", tone: "accent", symbol: false }]}
                interaction={{ zoom: "none", brush: true }}
                height={height}
              />
            )}
          />
        </div>
      </Section>

      <Section
        title={tcs("Scale")}
        description={tcs("Linear or logarithmic is a presentation choice over the same values: the axis maps them, the data never changes, and a range change never re-scales the chart silently.")}
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartPanel
            title={tcs("Long-horizon price")}
            description={tcs("Log is the declared default for a series spanning four orders of magnitude; the reader may switch to Linear and the choice sticks.")}
            height={320}
            scale={{ allowed: ["linear", "log"], default: "log" }}
            render={({ height, scaleMode }) => (
              <LineChart
                data={ROWS}
                xKey="time"
                scale={{ allowed: ["linear", "log"], default: "log", mode: scaleMode }}
                series={[{ key: "close", label: "Close", tone: "accent", symbol: false }]}
                height={height}
              />
            )}
          />
          <ChartPanel
            title={tcs("Signed measurement")}
            description={tcs("A drawdown is linear-only: a log axis over a value that reaches zero would be a broken chart, so the renderer offers no control at all.")}
            height={320}
            scale={{ allowed: ["linear"] }}
            render={({ height }) => (
              <LineChart
                data={ROWS}
                xKey="time"
                axes={[{ id: "primary", format: { kind: "percent", decimals: 1 } }]}
                // Signed data that touches zero: a log request is refused by the
                // axis itself, and the padded edges keep the curve off the frame.
                scale={{ allowed: ["linear", "log"], default: "log", mode: "log" }}
                series={[{ key: "drawdown", label: "Drawdown", tone: "negative", symbol: false }]}
                height={height}
              />
            )}
          />
        </div>
      </Section>

      <Section
        title={tcs("Fullscreen research view")}
        description={tcs("The fullscreen button on every panel above opens a real workspace, not a stretched div. Escape exits; focus returns to the trigger. The selected scale, range and series travel with it.")}
      >
        <ChartPanel
          title={tcs("Fullscreen research")}
          description={tcs("Title, latest readout, range, legend, export and a chart that fills the remaining height.")}
          height={320}
          ranges={TIME_RANGES}
          defaultRange="1y"
          scale={{ allowed: ["linear", "log"], default: "log" }}
          render={({ range, height, scaleMode }) => (
            <LineChart
              data={windowForRange(ROWS, range)}
              xKey="time"
              scale={{ allowed: ["linear", "log"], default: "log", mode: scaleMode }}
              series={[
                { key: "close", label: "Close", tone: "accent", symbol: false },
                { key: "sma50", label: "SMA 50", tone: "info", symbol: false, lineType: "dashed" },
              ]}
              interaction={{ zoom: "inside" }}
              height={height}
            />
          )}
        />
      </Section>

      <Section title={tcs("Deferred")} description={tcs("One interaction that did not ship this round.")}>
        <Card variant="outline" className="gap-1.5 p-4">
          <Text variant="label" as="p">
            Pinned inspection
          </Text>
          <Text variant="caption" tone="muted" as="p">
            {tcs("Click-to-pin a tooltip for comparison belongs with the research workspace work: it needs a visible pin affordance, an unpin gesture, and a decision about what happens when the pinned x scrolls out of view. The transient tooltip already covers reading a single value.")}</Text>
        </Card>
      </Section>

      <Section title={tcs("Usage")}>
        <Code block>{`<LineChart interaction={{ zoom: "inside", pan: true }} … />
<LineChart interaction={{ brush: true }} … />
<LineChart tooltip={{ mode: "item" }} … />

// Fullscreen is a wrapper: give it the same render function you use inline.
<ChartPanel
  ranges={["1m", "3m", "1y", "all"]}
  defaultRange="1y"
  render={({ range, height }) => <LineChart data={windowForRange(rows, range)} height={height} … />}
/>`}</Code>
      </Section>
    </DocPage>
  );
}
