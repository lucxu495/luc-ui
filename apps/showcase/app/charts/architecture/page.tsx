"use client";

import { Badge, Code, Panel, Section, Text } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { Demo } from "@/components/docs/demo";
import { DataTable } from "@/components/docs/data-table";
import { useI18n } from "@/lib/i18n/provider";

const LAYERS = `LUC chart system

  Chart chrome ......... ChartCard, ChartHeader, ChartToolbar, ChartLegend,
                         RangeSelector, ChartSkeleton, ChartEmptyState,
                         ChartErrorState, FullscreenResearchView

  Config primitives .... ChartSpec, SeriesSpec, AxisSpec, AnnotationSpec,
                         ChartFormat, ChartRangeSpec, syncGroup

  Adapters ............. adapters/echarts      (general)
                         adapters/lightweight  (financial)

  Engines .............. Apache ECharts 6.1                Apache-2.0
                         TradingView Lightweight Charts 5.2  Apache-2.0 + notice`;

const SPEC_SAMPLE = `defineChartSpec({
  id: "btc-close-1d",
  family: "line",
  xKey: "time",
  x: { type: "time" },
  axes: [{ id: "primary", format: { kind: "currency" } }],
  series: [
    { key: "close", label: "Close", tone: "accent" },
    { key: "sma50", label: "SMA 50", tone: "info", lineType: "dashed" },
  ],
  annotations: { referenceLines: [{ value: 100000, label: "100k" }] },
  interaction: { zoom: "inside" },
  ranges: { ranges: ["1m", "1y", "all"], default: "1y" },
  syncGroup: "research-stack",
})`;

const TOKEN_BRIDGE = `/* 1. tokens.css defines semantic chart tokens per theme. */
:root         { --chart-series-1: oklch(0.545 0.130 213); }
[data-theme]  { --chart-series-1: oklch(0.780 0.115 205); }

/* 2. The resolver reads computed values and normalises them. */
const theme = resolveChartTheme();
// oklch() and color-mix() resolve through a canvas round-trip, because the
// engines' own colour parsers understand hex and rgb() only.

/* 3. Adapters build options from the resolved theme, never a literal. */
chart.setOption({ color: theme.palette, ...baseOption(theme, motion) });`;

const ESCAPE_HATCH = `// 80% path: specs and components.
<LineChart data={rows} xKey="time" series={series} interaction={{ zoom: "inside" }} />

// 20% path: reach the engine deliberately.
<LineChart extendOption={(option) => { /* the assembled ECharts option */ }} />

// Or hold the live instance for export and custom actions.
<LineChart onReady={(chart) => (chartRef.current = chart)} />`;

interface EngineRow {
  need: string;
  engine: string;
  why: string;
  status: string;
}

const ENGINE_ROWS: EngineRow[] = [
  {
    need: "General analytical charts",
    engine: "Apache ECharts 6.1",
    why: "Line, bar, scatter, heatmap, hierarchy, flow, radial and gauge from one modular API. Apache-2.0.",
    status: "now",
  },
  {
    need: "Financial price charts",
    engine: "Lightweight Charts 5.2",
    why: "Candles, volume, panes and crosshair are native. Apache-2.0 with a visible attribution notice.",
    status: "now",
  },
  {
    need: "Sparklines",
    engine: "Hand-rolled SVG",
    why: "Eight to sixty points do not justify an engine instance per table row.",
    status: "now",
  },
  {
    need: "Bespoke visualisation",
    engine: "visx",
    why: "Reserved for shapes neither engine can express. Not installed — nothing needed it this round.",
    status: "deferred",
  },
  {
    need: "Ultra-dense streaming",
    engine: "uPlot / ChartGPU",
    why: "Studied for cursor synchronisation and WebGPU ceilings. Neither is justified while ECharts holds 10k points.",
    status: "reference",
  },
];

export default function ChartArchitecturePage() {
  const { tcs } = useI18n();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Charts · Architecture")}
        title="How the chart system is put together"
        lead="Two engines, one experience. The rendering engines are infrastructure: they draw pixels, and everything the reader actually perceives — tooltips, legends, ranges, annotations, synchronisation, fullscreen — is owned by Luc UI."
      />

      <Section title={tcs("Layers")} description={tcs("Nothing above the adapter layer knows which engine is drawing.")}>
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel className="flex flex-col gap-3 p-4">
            <Text variant="micro" tone="muted" as="p">
              Layer diagram
            </Text>
            <Code block>{LAYERS}</Code>
          </Panel>
          <Panel className="flex flex-col gap-3 p-4">
            <Text variant="micro" tone="muted" as="p">
              Declarative spec
            </Text>
            <Code block>{SPEC_SAMPLE}</Code>
          </Panel>
        </div>
      </Section>

      <Section
        title={tcs("The token bridge")}
        description={tcs("Canvas engines cannot read CSS variables. The adapter resolves the chart tokens once per theme, and normalises every colour through a canvas round-trip because the engines' own colour parsers do not understand oklch or color-mix.")}
      >
        <Code block>{TOKEN_BRIDGE}</Code>
        <Text variant="caption" tone="muted" as="p">
          {tcs("A theme flip invalidates the cached theme object, rebuilds each option and re-applies it in place — no remount, no lost zoom, no flash.")}</Text>
      </Section>

      <Section title={tcs("Engine decisions")} description={tcs("Recorded so the choice stays deliberate.")}>
        <DataTable
          caption={tcs("Chart engines")}
          columns={[
            { key: "need", header: tcs("Need"), render: (row: EngineRow) => tcs(row.need) },
            { key: "engine", header: "Engine", render: (row: EngineRow) => <Code>{row.engine}</Code> },
            { key: "why", header: tcs("Why"), render: (row: EngineRow) => tcs(row.why) },
            {
              key: "status",
              header: "Runtime",
              render: (row: EngineRow) => (
                <Badge size="sm" tone={row.status === "now" ? "positive" : "outline"}>
                  {row.status}
                </Badge>
              ),
            },
          ]}
          rows={ENGINE_ROWS}
        />
      </Section>

      <Section title={tcs("Escape hatch")} description={tcs("Raw engine configuration is available, and clearly marked as advanced.")}>
        <Demo layout="block" code={ESCAPE_HATCH}>
          <Text variant="caption" tone="muted" as="p">
            {tcs("The escape hatch is a last resort. If a page needs it for something a spec could express, the spec is missing a field and should gain one instead.")}</Text>
        </Demo>
      </Section>

      <Section title={tcs("Bundle discipline")} description={tcs("Modular registration, lazy loading, split by route.")}>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            "ECharts registers from echarts/core with only the chart types and components the system uses. The full bundle is never imported.",
            "Both engines load through a dynamic import inside an effect, so neither touches window during SSR and neither is in the server bundle.",
            "Lightweight Charts loads only on routes that render a financial chart, so an analytics-only page never pays for it.",
          ].map((item) => (
            <Panel key={item} className="gap-1.5 p-4">
              <Text variant="caption" tone="muted" as="p">
                {tcs(item)}
              </Text>
            </Panel>
          ))}
        </div>
      </Section>

      <Section title={tcs("What LUC owns")} description={tcs("If it appears on screen, it is ours.")}>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            "Tooltips — markup, typography, swatches, alignment, edge avoidance.",
            "Legends — colour, label, visibility toggle, keyboard reachable.",
            "Range controls — which ranges exist and what they mean.",
            "Annotations — reference lines, bands and event markers.",
            "Synchronisation — normalised cursor and range across engines.",
            "Fullscreen — a research view with real chrome.",
            "Loading, empty and error states — no engine is initialised for them.",
            "Accessibility — a label, a description and keyboard-reachable controls.",
          ].map((item) => (
            <Panel key={item} className="gap-1.5 p-4">
              <Text variant="caption" tone="muted" as="p">
                {tcs(item)}
              </Text>
            </Panel>
          ))}
        </div>
      </Section>
    </DocPage>
  );
}
