"use client";

import { useCallback, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Code,
  Delta,
  FreshnessBadge,
  Inline,
  Metric,
  MetricValue,
  Panel,
  Section,
  StatCard,
  Text,
} from "@luc/ui";
import { RiBitCoinLine, RiRefreshLine, RiServerLine } from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { EntryFooter } from "@/components/docs/entry-footer";
import { ImportLine } from "@/components/docs/family-imports";
import { Example } from "@/components/docs/example";
import { PropsTable } from "@/components/docs/tables";
import { Sparkline } from "@/components/showcase/sparkline";
import { useI18n } from "@/lib/i18n/provider";

const series = [86, 92, 88, 104, 99, 118, 112, 126, 121, 134, 128, 142];
const latency = [42, 39, 44, 37, 35, 38, 33, 31, 34, 29, 30, 27];
const priceSeries = [96, 94, 99, 101, 98, 104, 107, 105, 110, 108, 112, 109];
const ingestionSeries = [38, 42, 40, 44, 47, 45, 48, 46, 50, 48, 52, 49];

// Fixed reference clock: deterministic demos, and pure during render.
const DEMO_NOW = new Date("2026-09-26T12:00:00Z");
const secondsAgo = (seconds: number) => new Date(DEMO_NOW.getTime() - seconds * 1000);

export default function MetricsPage() {
  const { tcs } = useI18n();
  const [revenue, setRevenue] = useState(128431);
  const [price, setPrice] = useState(109241.42);
  const [rows, setRows] = useState(48_291_004);

  const simulate = useCallback(() => {
    setRevenue((current) => Math.round(current * (1 + (Math.random() - 0.4) * 0.03)));
    setPrice((current) => Number((current * (1 + (Math.random() - 0.45) * 0.02)).toFixed(2)));
    setRows((current) => Math.round(current * (1 + (Math.random() - 0.4) * 0.01)));
  }, []);

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Data")}
        title="Metrics"
        lead="The same four primitives render finance, SaaS and infrastructure numbers. Nothing in this layer knows what Bitcoin is."
      />

      <ImportLine line={'import { Button, Delta, FreshnessBadge, Metric, MetricValue, StatCard } from "@luc/ui";'} />

      <Section
        title={tcs("StatCard")}
        description={tcs("Label, value, delta, optional visual and footer. Values animate to their new state without moving anything around them.")}
        actions={
          <Button variant="secondary" size="sm" leadingIcon={<RiRefreshLine />} onClick={simulate}>
            {tcs("Update values")}
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Revenue"
            value={revenue}
            kind="currency"
            currency="USD"
            delta={12.4}
            deltaLabel="vs 30d"
            visual={<Sparkline values={series} tone="positive" />}
            footer={
              <>
                <FreshnessBadge updatedAt={secondsAgo(42)} now={DEMO_NOW} showAge />
                <span className="text-fg-disabled">·</span>
                <span>Billing</span>
              </>
            }
          />
          <StatCard
            label="BTC price"
            icon={<RiBitCoinLine />}
            value={price}
            kind="currency"
            currency="USD"
            minimumFractionDigits={2}
            delta={2.1}
            deltaLabel="24h"
            visual={<Sparkline values={priceSeries} tone="accent" />}
            footer={<span>{ tcs("Coinbase · 1d close") }</span>}
          />
          <StatCard
            label="Rows ingested"
            icon={<RiServerLine />}
            value={rows}
            kind="compact"
            delta={4.2}
            deltaLabel="24h"
            visual={<Sparkline values={ingestionSeries} tone="positive" />}
            aside={
              <Badge size="sm" tone="outline">
                clickhouse
              </Badge>
            }
          />
          <StatCard
            label="P95 latency"
            value={27.4}
            kind="decimal"
            minimumFractionDigits={1}
            suffix=" ms"
            delta={-8.1}
            invertDelta
            deltaLabel="vs 24h"
            visual={<Sparkline values={latency} tone="accent" />}
            footer={<span>edge-eu-west</span>}
          />
        </div>
      </Section>

      <Example
        title={tcs("Metric block")}
        code={`<Panel className="p-4">
  <Metric label="Sharpe ratio" aside={<Delta value={0.18} variant="absolute" />}>
    <MetricValue value={1.42} kind="decimal" size="lg" />
  </Metric>
  <Metric label="Max drawdown" aside={<Delta value={-2.4} />}>
    <MetricValue value={-11.8} kind="percent" size="lg" />
  </Metric>
</Panel>`}
        description={tcs("For headers and dense rows where a full card would be too heavy.")}
        layout="grid"
        stageClassName="lg:grid-cols-3"
      >

        <Panel className="p-4">
          <Metric label="Sharpe ratio" aside={<Delta value={0.18} variant="absolute" />}>
            <MetricValue value={1.42} kind="decimal" size="lg" />
          </Metric>
          <Metric label="Max drawdown" aside={<Delta value={-2.4} />} className="mt-4 border-t border-line-subtle pt-4">
            <MetricValue value={-11.8} kind="percent" size="lg" />
          </Metric>
        </Panel>
        <Panel className="p-4">
          <Metric
            label="Portfolio value"
            aside={
              <Badge size="sm" tone="positive" dot>
                live
              </Badge>
            }
            meta={
              <>
                Updated <FreshnessBadge updatedAt={secondsAgo(8)} now={DEMO_NOW} showAge />
              </>
            }
          >
            <MetricValue value={1_284_310.22} kind="currency" currency="USD" size="xl" />
          </Metric>
        </Panel>
        <Panel className="flex flex-col gap-4 p-4">
          <Text variant="micro" tone="muted" as="p">
            Value sizes
          </Text>
          <div className="flex flex-col gap-3">
            <MetricValue value={128431} kind="currency" size="sm" />
            <MetricValue value={128431} kind="currency" size="md" />
            <MetricValue value={128431} kind="currency" size="lg" />
            <MetricValue value={128431} kind="currency" size="xl" />
          </div>
        </Panel>
      </Example>

      <Example
        title={tcs("Delta")}
        description={tcs("Direction is carried by colour and a glyph. Invert it when down is good — latency, error rate, drawdown.")}
        layout="block"
        code={`<Delta value={12.4} />
<Delta value={-11.8} />
<Delta value={-8.1} invert />   {/* down is good */}
<Delta value={0} />              {/* neutral */}`}
      >

        <Panel className="flex flex-wrap items-center gap-8 p-4">
          {[
            { label: "Up", node: <Delta value={12.4} /> },
            { label: "Down", node: <Delta value={-11.8} /> },
            { label: tcs("Inverted (lower is better)"), node: <Delta value={-8.1} invert /> },
            { label: "Neutral", node: <Delta value={0} /> },
            { label: "Absolute", node: <Delta value={0.18} variant="absolute" /> },
            { label: "Missing data", node: <Delta value={null} /> },
          ].map((item) => (
            <div key={item.label} className="flex flex-col gap-1.5">
              <Text variant="micro" tone="muted" as="p">
                {item.label}
              </Text>
              {item.node}
            </div>
          ))}
        </Panel>
      </Example>

      <Section title={tcs("Formatting")} description={tcs("Every numeric formatter is guarded: a missing value renders an em dash, never “NaN”.")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Panel className="flex flex-col gap-3 p-4">
            <Text variant="micro" tone="muted" as="p">
              Kinds
            </Text>
            <div className="flex flex-col gap-2">
              {[
                { label: "number", node: <MetricValue value={128431} size="sm" /> },
                { label: "decimal", node: <MetricValue value={27.4} kind="decimal" size="sm" /> },
                { label: "percent", node: <MetricValue value={12.4} kind="percent" size="sm" /> },
                { label: "currency", node: <MetricValue value={109241.42} kind="currency" size="sm" /> },
                { label: "compact", node: <MetricValue value={48291004} kind="compact" size="sm" /> },
                { label: "missing", node: <MetricValue value={null} size="sm" /> },
              ].map((row) => (
                <Inline key={row.label} gap="sm" className="w-full">
                  <Code className="w-24">{row.label}</Code>
                  {row.node}
                </Inline>
              ))}
            </div>
          </Panel>
          <Panel className="flex flex-col gap-3 p-4">
            <Text variant="micro" tone="muted" as="p">
              {tcs("Why tabular figures matter")}</Text>
            <div className="flex flex-col gap-1.5">
              <MetricValue value={128431} kind="currency" size="md" />
              <MetricValue value={128977} kind="currency" size="md" />
              <MetricValue value={129140} kind="currency" size="md" />
            </div>
            <Text variant="caption" tone="muted">
              {tcs("The width is reserved by an invisible copy of the formatted result, so the layout is identical before, during and after the ticker runs.")}</Text>
          </Panel>
        </div>
      </Section>

      <Section title={tcs("API")}>
        <PropsTable
          rows={[
            { name: "StatCard label / value", type: "ReactNode / number | null", description: tcs("The two required slots.") },
            { name: "StatCard delta / invertDelta", type: "number / boolean", description: tcs("Rendered through Delta; invert when down is good.") },
            { name: "StatCard visual / footer", type: "ReactNode", description: tcs("Chart slot and provenance line.") },
            { name: "MetricValue size", type: '"sm" | "md" | "lg" | "xl"', default: '"lg"', description: tcs("Value scale; xl for headline metrics.") },
            { name: "MetricValue animate", type: "boolean", default: "true", description: tcs("Uses NumberTicker; set false for static exports.") },
            { name: "Delta variant", type: '"percent" | "absolute"', default: '"percent"', description: tcs("Percent is signed and one decimal by default.") },
          ]}
        />
      </Section>

      <Section title={tcs("Rules")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="micro" tone="positive" as="p">
              Do
            </Text>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-label text-fg-secondary">
              <li>{ tcs("Always state the comparison window next to a delta.") }</li>
              <li>{ tcs("Use the same size for values that sit in the same grid.") }</li>
              <li>{ tcs("Show freshness where a number could be stale.") }</li>
            </ul>
          </Card>
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="micro" tone="negative" as="p">
              Don&apos;t
            </Text>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-label text-fg-secondary">
              <li>{ tcs("Colour a metric value itself — keep colour on the delta.") }</li>
              <li>{ tcs("Use a sparkline without a labelled range.") }</li>
              <li>Mix <Code>xl</Code> values with <Code>sm</Code> {tcs("values in one row.")}</li>
            </ul>
          </Card>
        </div>
      </Section>
          <EntryFooter />
    </DocPage>
  );
}
