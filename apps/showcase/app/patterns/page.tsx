"use client";

import { useState } from "react";
import {
  Badge,
  BorderGlow,
  Button,
  Card,
  Code,
  Delta,
  FreshnessBadge,
  Heading,
  IconButton,
  Inline,
  Input,
  Metric,
  MetricValue,
  Panel,
  Reveal,
  Section,
  SegmentedControl,
  SegmentedItem,
  Separator,
  Skeleton,
  SkeletonText,
  StatCard,
  StatusBadge,
  Switch,
  Tabs,
  Text,
} from "@luc/ui";
import { RiAddLine, RiDownloadLine, RiMoreLine, RiRefreshLine, RiSearchLine, RiStackLine } from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { Demo } from "@/components/docs/demo";
import { Sparkline } from "@/components/showcase/sparkline";
import { useI18n } from "@/lib/i18n/provider";

const equity = [86, 92, 88, 104, 99, 118, 112, 126, 121, 134, 128, 142, 138, 151];

// Fixed reference clock: deterministic demos, and pure during render.
const DEMO_NOW = new Date("2026-09-26T12:00:00Z");
const secondsAgo = (seconds: number) => new Date(DEMO_NOW.getTime() - seconds * 1000);

const rows = [
  { symbol: "BTC/USD", price: 109_241.42, change: 2.1, series: equity },
  { symbol: "ETH/USD", price: 4_182.4, change: 0.84, series: [40, 42, 41, 45, 44, 47, 46, 49, 48, 52, 51, 55] },
  { symbol: "SOL/USD", price: 212.07, change: -1.32, series: [60, 58, 61, 57, 54, 56, 52, 50, 51, 48, 46, 44] },
  { symbol: "AVAX/USD", price: 38.19, change: 4.62, series: [20, 22, 21, 24, 26, 25, 28, 30, 29, 33, 35, 38] },
];

export default function PatternsPage() {
  const { tcs } = useI18n();
  const [range, setRange] = useState("30d");
  const [status, setStatus] = useState("all");

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Patterns")}
        title="Compositions"
        lead="Small, real assemblies that show the system working together. Each one is built only from @luc/ui components — there is no page-local styling language."
      />

      <Section title={tcs("Research run header")} description={tcs("A page header for an analytical view: identity, status, actions, metrics, then navigation.")}>
        <Demo layout="block" bare>
          <Panel className="flex flex-col gap-0 overflow-hidden">
            <div className="flex flex-col gap-4 p-5">
              <Inline justify="between" className="w-full">
                <Inline gap="sm">
                  <span className="grid size-9 place-items-center rounded-md border border-line-subtle bg-surface-interactive text-fg-accent">
                    <RiStackLine className="size-[18px]" />
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <Inline gap="xs">
                      <Heading size="title" as="h2">
                        bt_momentum_v4
                      </Heading>
                      <StatusBadge status="healthy" size="sm" />
                    </Inline>
                    <Text variant="caption" tone="muted" as="p">
                      {tcs("run_2026_09_26_a41f · luc-research · walk-forward")}</Text>
                  </div>
                </Inline>
                <Inline gap="xs">
                  <Button size="sm" variant="secondary" leadingIcon={<RiDownloadLine />}>
                    Report
                  </Button>
                  <Button size="sm" variant="ghost" leadingIcon={<RiRefreshLine />}>
                    Re-run
                  </Button>
                  <IconButton label="More actions" icon={<RiMoreLine />} size="sm" variant="solid" />
                </Inline>
              </Inline>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total return" value={182_410} kind="currency" delta={18.2} deltaLabel="vs benchmark" />
                <StatCard label="Sharpe" value={1.42} kind="decimal" delta={0.18} invertDelta={false} />
                <StatCard label="Max drawdown" value={-11.8} kind="percent" delta={-2.4} invertDelta />
                <StatCard label="Trades" value={1284} delta={4.2} deltaLabel="30d" />
              </div>
            </div>

            <Separator />

            <Tabs defaultValue="equity" variant="line" size="sm" className="gap-0">
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5">
                <Tabs.List>
                  <Tabs.Trigger value="equity">Equity</Tabs.Trigger>
                  <Tabs.Trigger value="drawdown">Drawdown</Tabs.Trigger>
                  <Tabs.Trigger value="trades">Trades</Tabs.Trigger>
                  <Tabs.Trigger value="notes">Notes</Tabs.Trigger>
                </Tabs.List>
                <Inline gap="sm">
                  <FreshnessBadge updatedAt={secondsAgo(180)} now={DEMO_NOW} showAge />
                  <SegmentedControl size="sm" value={range} onValueChange={(next) => next && setRange(next)}>
                    {["7d", "30d", "1y"].map((option) => (
                      <SegmentedItem size="sm" key={option} value={option}>
                        {option}
                      </SegmentedItem>
                    ))}
                  </SegmentedControl>
                </Inline>
              </div>

              <Separator />

              <Tabs.Content value="equity" className="p-5 pt-3">
                <Sparkline values={equity} tone="positive" height={72} />
              </Tabs.Content>
              <Tabs.Content value="drawdown" className="p-5 pt-3">
                <Text variant="caption" tone="muted">
                  {tcs("Drawdown panel — the same header, a different view.")}</Text>
              </Tabs.Content>
              <Tabs.Content value="trades" className="p-5 pt-3">
                <Text variant="caption" tone="muted">
                  Trade log panel.
                </Text>
              </Tabs.Content>
              <Tabs.Content value="notes" className="p-5 pt-3">
                <Text variant="caption" tone="muted">
                  {tcs("Free-form notes captured with the run.")}</Text>
              </Tabs.Content>
            </Tabs>
          </Panel>
        </Demo>
      </Section>

      <Section title={tcs("Instrument list")} description={tcs("A dense row pattern: identity, price, change, sparkline, status. Numbers are tabular so the columns never shift.")}>
        <Demo layout="block" bare>
          <Panel className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 border-b border-line-subtle p-3">
              <Input
                size="sm"
                placeholder="Filter instruments…"
                leadingIcon={<RiSearchLine />}
                className="w-56"
              />
              <SegmentedControl size="sm" value={status} onValueChange={(next) => next && setStatus(next)}>
                <SegmentedItem size="sm" value="all">
                  All
                </SegmentedItem>
                <SegmentedItem size="sm" value="gainers">
                  Gainers
                </SegmentedItem>
                <SegmentedItem size="sm" value="losers">
                  Losers
                </SegmentedItem>
              </SegmentedControl>
              <Inline gap="sm" className="ml-auto">
                <Text variant="caption" tone="muted">
                  Live updates
                </Text>
                <Switch size="sm" defaultChecked aria-label={tcs("Live updates")} />
              </Inline>
            </div>

            <ul className="divide-y divide-line-subtle">
              {rows.map((row) => (
                <li
                  key={row.symbol}
                  className="luc-transition flex flex-wrap items-center gap-4 px-3 py-2.5 hover:bg-surface-interactive-hover"
                >
                  <span className="w-24 shrink-0 font-mono text-caption text-fg-primary">{row.symbol}</span>
                  <span className="luc-numeric w-28 shrink-0 text-right text-caption text-fg-primary">
                    {row.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                  <span className="w-20 shrink-0">
                    <Delta value={row.change} size="sm" />
                  </span>
                  <span className="hidden min-w-32 flex-1 sm:block">
                    <Sparkline values={row.series} tone={row.change >= 0 ? "positive" : "negative"} height={28} fill={false} />
                  </span>
                  <Badge size="sm" tone={Math.abs(row.change) > 3 ? "warning" : "outline"}>
                    {Math.abs(row.change) > 3 ? "volatile" : "normal"}
                  </Badge>
                </li>
              ))}
            </ul>
          </Panel>
        </Demo>
      </Section>

      <Section title={tcs("Featured item")} description={tcs("BorderGlow plus SpotlightSurface plus a Card: the one surface in a grid that the user is meant to notice.")}>
        <Demo layout="grid" stageClassName="lg:grid-cols-3">
          <BorderGlow mode="follow" intensity="subtle" radius="lg" className="h-full">
            <Card variant="raised" className="h-full gap-3 p-4">
              <Inline justify="between" className="w-full">
                <Text variant="micro" tone="muted" as="p">
                  featured
                </Text>
                <Badge size="sm" tone="accent">
                  glow
                </Badge>
              </Inline>
              <Metric label="Signal strength">
                <MetricValue value={0.87} kind="decimal" minimumFractionDigits={2} size="lg" />
              </Metric>
              <Text variant="caption" tone="muted">
                {tcs("One glowing surface per view. The others stay calm.")}</Text>
            </Card>
          </BorderGlow>

          <Card variant="raised" className="h-full gap-3 p-4">
            <Text variant="micro" tone="muted" as="p">
              passive sibling
            </Text>
            <Metric label="Signal strength">
              <MetricValue value={0.42} kind="decimal" minimumFractionDigits={2} size="lg" />
            </Metric>
            <Text variant="caption" tone="muted">
              {tcs("No hover glow, no lift. It is not clickable.")}</Text>
          </Card>

          <Card variant="outline" as="a" href="#" interactive className="h-full gap-3 p-4">
            <Text variant="micro" tone="muted" as="p">
              interactive
            </Text>
            <Metric label="Signal strength">
              <MetricValue value={0.61} kind="decimal" minimumFractionDigits={2} size="lg" />
            </Metric>
            <Text variant="caption" tone="muted">
              {tcs("Hover: border, surface and elevation move one step each.")}</Text>
          </Card>
        </Demo>
      </Section>

      <Section title={tcs("Loading, empty, error")} description={tcs("Three states, three recipes — never a screen full of spinners.")}>
        <Demo layout="grid" stageClassName="lg:grid-cols-3">
          <Card variant="raised" className="gap-3 p-4" aria-busy="true">
            <Skeleton variant="text" className="w-24" />
            <Skeleton className="h-8 w-32" />
            <SkeletonText lines={2} widths={["100%", "68%"]} />
          </Card>

          <Card variant="outline" className="flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="grid size-10 place-items-center rounded-lg border border-line-subtle bg-surface-interactive text-fg-muted">
              <RiAddLine />
            </span>
            <div className="flex flex-col gap-1">
              <Text variant="label" tone="secondary" as="p">
                No runs yet
              </Text>
              <Text variant="caption" tone="muted">
                {tcs("Start a backtest to populate this workspace.")}</Text>
            </div>
            <Button size="sm" variant="primary">
              New run
            </Button>
          </Card>

          <Card variant="outline" className="flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="grid size-10 place-items-center rounded-lg border border-negative-line bg-negative-soft text-fg-negative">
              !
            </span>
            <div className="flex flex-col gap-1">
              <Text variant="label" tone="secondary" as="p">
                Artifacts unavailable
              </Text>
              <Text variant="caption" tone="muted">
                {tcs("The report finished but could not be written to the artifact directory.")}</Text>
            </div>
            <Button size="sm" variant="secondary">
              Retry
            </Button>
          </Card>
        </Demo>
      </Section>

      <Section title={tcs("Reveal on first view")} description={tcs("Stagger is applied to regions, never to individual lines.")}>
        <Demo layout="block" bare>
          <div className="grid gap-4 lg:grid-cols-3">
            {["Bars", "Factors", "Reports"].map((item, index) => (
              <Reveal key={item} delay={index * 0.05} className="h-full">
                <Panel className="h-full p-4">
                  <Text variant="label" tone="primary" as="p">
                    {item}
                  </Text>
                  <Text variant="caption" tone="muted" className="mt-1.5">
                    {tcs("Entering 50ms apart on first view, and never again.")}</Text>
                </Panel>
              </Reveal>
            ))}
          </div>
        </Demo>
      </Section>

      <Section title={tcs("Composition notes")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="micro" tone="positive" as="p">
              Do
            </Text>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-label text-fg-secondary">
              <li>{tcs("Let one component lead each region and keep the rest quiet.")}</li>
              <li>Reuse <Code>Panel</Code> {tcs("for structure so spacing stays identical between pages.")}</li>
              <li>Compose from <Code>@luc/ui</Code>{tcs("; if a pattern needs new styling, it needs a new token.")}</li>
            </ul>
          </Card>
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="micro" tone="negative" as="p">
              Don&apos;t
            </Text>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-label text-fg-secondary">
              <li>{tcs("Stack three elevation levels in one card.")}</li>
              <li>{tcs("Put a border, a shadow and a glow on the same passive surface.")}</li>
              <li>{tcs("Invent a page-local header style.")}</li>
            </ul>
          </Card>
        </div>
      </Section>
    </DocPage>
  );
}
