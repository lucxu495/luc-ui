"use client";

import { useState } from "react";
import { Badge, Card, Code, Inline, Panel, Section, StatusBadge, Tag, Text } from "@luc/ui";
import { RiBitCoinLine, RiLineChartLine } from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ImportLine } from "@/components/docs/family-imports";
import { Example } from "@/components/docs/example";
import { PropsTable } from "@/components/docs/tables";
import { useI18n } from "@/lib/i18n/provider";
import { EntryFooter } from "@/components/docs/entry-footer";

export default function BadgesPage() {
  const { tcs } = useI18n();
  const [tags, setTags] = useState(["momentum", "crypto", "walk-forward"]);

  return (
    <DocPage intent="compact">
      <PageHeader
        eyebrow={tcs("Components")}
        title="Badges and tags"
        lead="Badges state a fact about what they sit next to. Tags are editable labels you can remove. Both stay within the semantic colour set — no decorative colours."
      />

      <ImportLine line={'import { StatusBadge, Tag } from "@luc/ui";'} />

      <Example
        title={tcs("Badge tones")}
        description={tcs("Tone carries meaning: neutral is metadata, accent is emphasis, status tones mirror the palette.")}
        code={`<Badge tone="neutral">Draft</Badge>
<Badge tone="accent">Selected</Badge>
<Badge tone="positive" dot>+12.4%</Badge>`}
      >

        <Badge tone="neutral">Draft</Badge>
        <Badge tone="accent">Selected</Badge>
        <Badge tone="outline">Outline</Badge>
        <Badge tone="positive" dot>
          +12.4%
        </Badge>
        <Badge tone="negative">-3.2%</Badge>
        <Badge tone="warning">Degraded</Badge>
        <Badge tone="info">Scheduled</Badge>
      </Example>

      <Example
        title={tcs("Sizes and shapes")}
        description={tcs("Small uppercase micro labels read as metadata; medium and large behave more like inline status.")}
        layout="block"
        code={`<Badge size="sm">sm · micro uppercase</Badge>
<Badge size="md">md · default</Badge>
<Badge size="lg">lg · standalone</Badge>

<Badge shape="pill" tone="neutral">Pill shape</Badge>
<Badge shape="pill" tone="accent" dot>Live</Badge>
<Badge shape="rounded" tone="neutral">Rounded (default)</Badge>`}
      >

        <Inline gap="sm">
          <Badge size="sm">{ tcs("sm · micro uppercase") }</Badge>
          <Badge size="md">md · default</Badge>
          <Badge size="lg">lg · standalone</Badge>
        </Inline>
        <Inline gap="sm">
          <Badge shape="pill" tone="neutral">
            Pill shape
          </Badge>
          <Badge shape="pill" tone="accent" dot>
            Live
          </Badge>
          <Badge shape="rounded" tone="neutral">
            Rounded (default)
          </Badge>
        </Inline>
      </Example>

      <Example
        title={tcs("Tags")}
        description={tcs("Removable labels for filters and saved queries. The remove control is a real button with an accessible name.")}
        layout="block"
        code={`<Tag onRemove={() => remove(tag)}>{tag}</Tag>`}
      >

        <Panel className="flex flex-col gap-4 p-4">
          <Inline gap="sm" align="center">
            {tags.map((tag) => (
              <Tag key={tag} onRemove={() => setTags((current) => current.filter((item) => item !== tag))}>
                {tag}
              </Tag>
            ))}
            {tags.length === 0 ? (
              <Text variant="caption" tone="muted">
                All tags removed.
              </Text>
            ) : null}
          </Inline>
          <Inline gap="sm" align="center">
            <Text variant="caption" tone="muted">
              {tcs("With a leading icon:")}</Text>
            <Tag>
              <RiLineChartLine className="size-3.5 text-fg-muted" />
              strategy:sma-cross
            </Tag>
            <Tag>
              <RiBitCoinLine className="size-3.5 text-fg-muted" />
              BTC/USD
            </Tag>
          </Inline>
        </Panel>
      </Example>

      <Example
        title={tcs("Status badges")}
        description={tcs("A fixed vocabulary so “healthy” means the same thing everywhere — with an optional pulse for genuinely live data.")}
        layout="inline"
        code={`<StatusBadge status="live" />
<StatusBadge status="healthy" />
<StatusBadge status="degraded" />
<StatusBadge status="pending" />
<StatusBadge status="stale" />
<StatusBadge status="down" />
<StatusBadge status="unknown" />
<StatusBadge status="healthy" size="sm" label="Custom label" />`}
      >

        <StatusBadge status="live" />
        <StatusBadge status="healthy" />
        <StatusBadge status="degraded" />
        <StatusBadge status="pending" />
        <StatusBadge status="stale" />
        <StatusBadge status="down" />
        <StatusBadge status="unknown" />
        <StatusBadge status="healthy" size="sm" label="Custom label" />
      </Example>

      <Section title={tcs("In context")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Panel className="p-4">
            <Inline justify="between" className="w-full">
              <Text variant="label" tone="primary" as="p">
                bt_momentum_v4
              </Text>
              <StatusBadge status="healthy" size="sm" />
            </Inline>
            <Inline gap="xs" className="mt-3">
              <Badge size="sm" tone="outline">
                daily
              </Badge>
              <Badge size="sm" tone="outline">
                1h bars
              </Badge>
              <Badge size="sm" tone="positive" dot>
                Sharpe 1.42
              </Badge>
            </Inline>
          </Panel>
          <Panel className="p-4">
            <Inline justify="between" className="w-full">
              <Text variant="label" tone="primary" as="p">
                candlestick ingestion
              </Text>
              <Badge tone="warning" size="sm">
                2h late
              </Badge>
            </Inline>
            <Text variant="caption" tone="muted" className="mt-2">
              {tcs("A warning badge is a nudge, not an alarm. Reserve negative for genuine failure.")}</Text>
          </Panel>
        </div>
      </Section>

      <Section title={tcs("API")}>
        <PropsTable
          rows={[
            { name: "Badge tone", type: '"neutral" | "accent" | "positive" | "negative" | "warning" | "info" | "outline"', default: '"neutral"', description: tcs("Uses the semantic colour set.") },
            { name: "Badge size", type: '"sm" | "md" | "lg"', default: '"md"', description: tcs("sm is uppercase micro (11px).") },
            { name: "Badge dot", type: "boolean", default: "false", description: tcs("Leading status dot that inherits the tone colour.") },
            { name: "Tag onRemove", type: "() => void", description: tcs("Renders a labelled remove button inside the tag.") },
            { name: "StatusBadge status", type: "StatusPreset", description: tcs("live, healthy, degraded, pending, stale, down, unknown.") },
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
              <li>{ tcs("Keep badge text to one or two words, including the unit.") }</li>
              <li>Use <Code>dot</Code> {tcs("when the badge represents a live state.")}</li>
              <li>{ tcs("Pair a delta badge with an arrow glyph — colour alone is not enough.") }</li>
            </ul>
          </Card>
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="micro" tone="negative" as="p">
              Don&apos;t
            </Text>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-label text-fg-secondary">
              <li>{ tcs("Turn a badge into a button — use a real button.") }</li>
              <li>{ tcs("Put three accent badges in one row.") }</li>
              <li>{ tcs("Introduce a new status colour for a product-specific state.") }</li>
            </ul>
          </Card>
        </div>
      </Section>
      <EntryFooter />
    </DocPage>
  );
}
