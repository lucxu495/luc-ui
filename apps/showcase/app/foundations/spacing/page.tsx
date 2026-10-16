"use client";

import { Card, Code, Inline, Input, Panel, Section, SegmentedControl, SegmentedItem, Button, Text, cn } from "@luc/ui";
import { useState } from "react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { DataTable } from "@/components/docs/data-table";
import { useI18n } from "@/lib/i18n/provider";

const scale = [
  { step: "1", px: 4, utility: "p-1 / gap-1" },
  { step: "1.5", px: 6, utility: "gap-1.5" },
  { step: "2", px: 8, utility: "p-2 / gap-2" },
  { step: "3", px: 12, utility: "p-3 / gap-3" },
  { step: "4", px: 16, utility: "p-4 / gap-4" },
  { step: "5", px: 20, utility: "p-5" },
  { step: "6", px: 24, utility: "p-6 / gap-6" },
  { step: "8", px: 32, utility: "p-8 / gap-8" },
  { step: "10", px: 40, utility: "py-10" },
  { step: "12", px: 48, utility: "py-12" },
];

export default function SpacingPage() {
  const { tcs } = useI18n();
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Foundations")}
        title="Spacing"
        lead="A 4px base rhythm, used without exception. Dense product UI is designed to be dense — spacing is generous where it aids scanning and tight where it does not."
      />

      <Section title={tcs("Scale")} description={tcs("The default Tailwind numeric utilities map 1:1 to this scale. There is no other spacing value.")}>
        <Panel className="flex flex-col gap-2 p-4">
          {scale.map((row) => (
            <div key={row.step} className="flex items-center gap-4">
              <span className="w-10 shrink-0 font-mono text-caption text-fg-primary">{row.step}</span>
              <span className="w-12 shrink-0 font-mono text-micro text-fg-muted">{row.px}px</span>
              <span
                aria-hidden="true"
                className="h-2.5 shrink-0 rounded-xs bg-accent-soft"
                style={{ width: `${row.px * 2}px` }}
              />
              <code className="font-mono text-micro text-fg-muted">{row.utility}</code>
            </div>
          ))}
        </Panel>
      </Section>

      <Section
        title={tcs("Density")}
        description={tcs("The same components serve comfortable product UI and dense research terminals through one attribute.")}
      >
        <Inline gap="sm" className="mb-4">
          <Text variant="label" tone="muted">
            Preview density:
          </Text>
          <SegmentedControl value={density} onValueChange={(next) => next && setDensity(next as typeof density)}>
            <SegmentedItem value="comfortable">Comfortable</SegmentedItem>
            <SegmentedItem value="compact">Compact</SegmentedItem>
          </SegmentedControl>
        </Inline>

        <div
          data-density={density === "compact" ? "compact" : undefined}
          className="grid gap-4 rounded-lg border border-line-subtle bg-surface-canvas p-5 md:grid-cols-2"
        >
          <div className="flex flex-col gap-3">
            <Text variant="micro" tone="muted" as="p">
              Controls
            </Text>
            <Inline gap="sm">
              <Button size="sm">Small</Button>
              <Button size="md" variant="secondary">
                Medium
              </Button>
              <Button size="lg" variant="outline">
                Large
              </Button>
            </Inline>
            <Input placeholder="Search instruments…" />
          </div>
          <div className="flex flex-col gap-2">
            <Text variant="micro" tone="muted" as="p">
              Table rhythm (--density-row)
            </Text>
            <Panel className="divide-y divide-line-subtle overflow-hidden">
              {[
                { symbol: "BTC-USD", value: "109,241.00", change: "+2.10%" },
                { symbol: "ETH-USD", value: "4,182.40", change: "+0.84%" },
                { symbol: "SOL-USD", value: "212.07", change: "-1.32%" },
              ].map((row) => (
                <div
                  key={row.symbol}
                  className="flex items-center justify-between gap-4 px-3"
                  style={{ minHeight: "var(--density-row)" }}
                >
                  <span className="font-mono text-caption text-fg-secondary">{row.symbol}</span>
                  <span className="luc-numeric text-caption text-fg-primary">{row.value}</span>
                  <span
                    className={cn(
                      "luc-numeric w-16 text-right text-caption",
                      row.change.startsWith("+") ? "text-fg-positive" : "text-fg-negative",
                    )}
                  >
                    {row.change}
                  </span>
                </div>
              ))}
            </Panel>
          </div>
        </div>
      </Section>

      <Section title={tcs("Semantic spacing")} description={tcs("Three layout tokens cover page-level rhythm.")}>
        <DataTable
          caption={tcs("Layout spacing tokens")}
          columns={[
            { key: "token", header: "Token", render: (row: { token: string; value: string; usage: string }) => <code className="font-mono text-fg-primary">{row.token}</code> },
            { key: "value", header: "Value", render: (row: { token: string; value: string; usage: string }) => <code className="font-mono text-fg-accent">{row.value}</code> },
            { key: "usage", header: "Use for", render: (row: { token: string; value: string; usage: string }) => row.usage },
          ]}
          rows={[
            { token: "container content", value: "1216px", usage: tcs("Maximum width of a page's content column.") },
            { token: "container prose", value: "704px", usage: tcs("Long-form reading width inside documentation.") },
            { token: "density-row", value: "36px / 30px", usage: tcs("Table and list row height (comfortable / compact).") },
            { token: "control heights", value: "28 / 34 / 40px", usage: tcs("Small, medium and large control sizing.") },
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
              <li>Use the <Code>gap</Code> scale on <Code>Stack</Code> and <Code>Inline</Code>.</li>
              <li>{ tcs("Prefer one spacing decision per container.") }</li>
              <li>Reach for <Code>data-density=&quot;compact&quot;</Code> {tcs("instead of local padding overrides.")}</li>
            </ul>
          </Card>
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="micro" tone="negative" as="p">
              Don&apos;t
            </Text>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-label text-fg-secondary">
              <li>Invent values like <Code>p-[13px]</Code>.</li>
              <li>{ tcs("Compensate for a wrong layout by shrinking type.") }</li>
              <li>{ tcs("Mix comfortable and compact rhythm in one table.") }</li>
            </ul>
          </Card>
        </div>
      </Section>
    </DocPage>
  );
}
