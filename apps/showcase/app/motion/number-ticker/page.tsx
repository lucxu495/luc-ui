"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Code,
  Delta,
  Inline,
  Metric,
  MetricValue,
  NumberTicker,
  Panel,
  Section,
  SegmentedControl,
  SegmentedItem,
  Text,
  useReducedMotion,
} from "@luc/ui";
import { RiArrowUpLine, RiRefreshLine } from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { Demo } from "@/components/docs/demo";
import { ControlRow, Playground } from "@/components/docs/playground";
import { PropsTable } from "@/components/docs/tables";
import { useI18n } from "@/lib/i18n/provider";
import { EntryFooter } from "@/components/docs/entry-footer";

type Kind = "number" | "decimal" | "percent" | "currency" | "compact";

export default function NumberTickerPage() {
  const { tcs } = useI18n();
  const [value, setValue] = useState(128431);
  const [kind, setKind] = useState<Kind>("currency");
  const [duration, setDuration] = useState<"0.4" | "0.55" | "0.9">("0.55");
  const reducedMotion = useReducedMotion();

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Motion")}
        title="NumberTicker"
        lead="A value that moves to its new state without moving anything around it. Width is reserved, digits are tabular, and the roll is quick enough to read as precision rather than theatre."
      />

      <Section title={tcs("Playground")} description={tcs("Update the value and watch the digits roll. The layout never changes width.")}>
        <Playground
          /* MOT-002: the snippet the controls produce, copyable — see `reveal`. */
          code={`<NumberTicker value={${value}} kind="${kind}" duration={${duration}} />`}
          note={
            reducedMotion
              ? tcs("Reduced motion is on: the number snaps to its new value. It still updates — it just does not travel.")
              : tcs("Formatting is guarded: a null or NaN value renders an em dash, never “NaN”.")
          }
          controls={
            <>
              <ControlRow label={tcs("Value")}>
                <div className="flex flex-wrap gap-1.5">
                  {[128431, 129_640, 88_120, 1_284_310].map((option) => (
                    <Button
                      key={option}
                      size="sm"
                      variant={value === option ? "primary" : "secondary"}
                      onClick={() => setValue(option)}
                    >
                      {option.toLocaleString("en-US")}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant="ghost"
                    leadingIcon={<RiRefreshLine />}
                    onClick={() => setValue(Math.round(Math.random() * 900_000 + 50_000))}
                  >
                    Random
                  </Button>
                </div>
              </ControlRow>
              <ControlRow label={tcs("Format")}>
                <SegmentedControl size="sm" value={kind} onValueChange={(next) => next && setKind(next as Kind)}>
                  {(["number", "decimal", "percent", "currency", "compact"] as Kind[]).map((option) => (
                    <SegmentedItem size="sm" key={option} value={option}>
                      {option}
                    </SegmentedItem>
                  ))}
                </SegmentedControl>
              </ControlRow>
              <ControlRow label={tcs("Duration")}>
                <SegmentedControl
                  size="sm"
                  value={duration}
                  onValueChange={(next) => next && setDuration(next as typeof duration)}
                >
                  {["0.4", "0.55", "0.9"].map((option) => (
                    <SegmentedItem size="sm" key={option} value={option}>
                      {option}s
                    </SegmentedItem>
                  ))}
                </SegmentedControl>
              </ControlRow>
              <ControlRow label={tcs("Rendered as")}>
                <Code>{`<NumberTicker value={${value}} kind="${kind}" duration={${duration}} />`}</Code>
              </ControlRow>
            </>
          }
        >
          <div className="flex flex-col items-center gap-3">
            <NumberTicker
              value={value}
              kind={kind}
              duration={Number(duration)}
              className="font-display text-display font-semibold text-fg-primary"
            />
            <Badge size="sm" tone="outline">
              {tcs("reserved width · tabular figures")}</Badge>
          </div>
        </Playground>
      </Section>

      <Section
        title={tcs("Stable width")}
        description={tcs("The most important property: a column of values must not shift when one of them changes.")}
      >
        <Demo layout="block">
          <StableWidthDemo />
        </Demo>
      </Section>

      <Section title={tcs("In metrics")} description={tcs("MetricValue uses the ticker by default, so every metric in a product inherits the behaviour.")}>
        <Demo layout="grid" stageClassName="lg:grid-cols-3">
          <Card variant="raised" className="gap-3 p-4">
            <Metric label="Total return" aside={<Delta value={18.2} />}>
              <MetricValue value={182_410} kind="currency" currency="USD" />
            </Metric>
          </Card>
          <Card variant="raised" className="gap-3 p-4">
            <Metric label="Win rate" aside={<Delta value={1.4} />}>
              <MetricValue value={58.6} kind="percent" />
            </Metric>
          </Card>
          <Card variant="raised" className="gap-3 p-4">
            <Metric label="Trades" aside={<Badge size="sm" tone="outline">1h bars</Badge>}>
              <MetricValue value={1284} />
            </Metric>
          </Card>
        </Demo>
      </Section>

      <Section title={tcs("Formatting reference")}>
        <Panel className="divide-y divide-line-subtle">
          {[
            { kind: "number", example: 128431, note: "Grouped integer." },
            { kind: "decimal", example: 27.4, note: tcs("1–2 fraction digits, chosen by magnitude.") },
            { kind: "percent", example: 12.4, note: tcs("Already-scaled value with a % suffix; signed for deltas.") },
            { kind: "currency", example: 109241.42, note: tcs("ISO-4217 code; defaults to USD.") },
            { kind: "compact", example: 48_291_004, note: tcs("48.3M — for scale, never for precision.") },
          ].map((row) => (
            <div key={row.kind} className="flex flex-wrap items-center gap-4 px-4 py-3">
              <Code className="w-24">{row.kind}</Code>
              <span className="w-32 font-mono text-label text-fg-primary">
                <NumberTicker value={row.example} kind={row.kind as Kind} />
              </span>
              <Text variant="caption" tone="muted">
                {tcs(row.note)}
              </Text>
            </div>
          ))}
        </Panel>
      </Section>

      <Section title={tcs("API")}>
        <PropsTable
          rows={[
            { name: "value", type: "number | null | undefined", description: tcs("Null renders an em dash; NaN never reaches the DOM.") },
            { name: "kind", type: '"number" | "decimal" | "percent" | "currency" | "compact"', default: '"number"', description: "Formatting strategy." },
            { name: "duration", type: "number", default: "0.55", description: tcs("Roll length in seconds. 0 disables animation.") },
            { name: "startFrom", type: "number", description: tcs("Count up from here on first paint; omit to start at the value.") },
            { name: "align", type: '"left" | "right" | "center"', default: '"left"', description: tcs("Alignment of the animating digits inside the reserved box.") },
            { name: "format", type: "(value: number) => string", description: tcs("Escape hatch for a custom formatter.") },
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
              <li>{tcs("Keep rolls between 0.4s and 0.7s.")}</li>
              <li>{tcs("Pair a ticker with a delta so the direction is explicit.")}</li>
              <li>{tcs("Use compact formatting for scale, exact values for decisions.")}</li>
            </ul>
          </Card>
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="micro" tone="negative" as="p">
              Don&apos;t
            </Text>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-label text-fg-secondary">
              <li>{tcs("Animate every cell in a table.")}</li>
              <li>{tcs("Roll a value that updates several times a second.")}</li>
              <li>{tcs("Use proportional figures anywhere next to a ticker.")}</li>
            </ul>
          </Card>
        </div>
      </Section>
      <EntryFooter />
    </DocPage>
  );
}

function StableWidthDemo() {
  const { tcs } = useI18n();
  const [ninth, setNinth] = useState(12_400);

  return (
    <div className="flex flex-col gap-4">
      <Inline gap="sm">
        <Button size="sm" variant="secondary" onClick={() => setNinth(Math.round(Math.random() * 9_000_000 + 100_000))}>
          {tcs("Change the ninth row only")}</Button>
        <Text variant="caption" tone="muted">
          {tcs("Watch the right edge of the column: it does not move.")}</Text>
      </Inline>
      <Panel className="divide-y divide-line-subtle">
        {Array.from({ length: 10 }).map((_, index) => {
          const isTarget = index === 8;
          const value = isTarget ? ninth : 10_000 + index * 137_411;
          return (
            <div key={index} className="flex items-center justify-between gap-4 px-4 py-2.5">
              <Text variant="caption" tone="muted" as="span">
                run_{String(index + 1).padStart(3, "0")}
              </Text>
              <Inline gap="xs">
                {isTarget ? <RiArrowUpLine className="size-3.5 text-fg-accent" /> : null}
                <NumberTicker
                  value={value}
                  kind="currency"
                  duration={0.5}
                  className="text-label text-fg-primary"
                />
              </Inline>
            </div>
          );
        })}
      </Panel>
    </div>
  );
}
