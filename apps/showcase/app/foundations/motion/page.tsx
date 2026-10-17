"use client";

import { useState } from "react";
import { Button, Card, Code, Inline, Panel, Section, Text, cn, useReducedMotion } from "@luc/ui";
import { RiPlayLine } from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { DataTable } from "@/components/docs/data-table";
import { useI18n } from "@/lib/i18n/provider";

const durations = [
  { token: "motion.instant", value: "70ms", usage: "State echo: pressed feedback, hover tint." },
  { token: "motion.fast", value: "140ms", usage: "Default for colour, border and opacity changes." },
  { token: "motion.normal", value: "200ms", usage: "Functional movement: tabs, popovers, tooltips." },
  { token: "motion.slow", value: "300ms", usage: "Larger surfaces entering: menus, dialogs, reveals." },
  { token: "motion.slower", value: "460ms", usage: "Rare: page-level reveals and chart entrance." },
];

const easings = [
  { token: "ease.standard", value: "cubic-bezier(0.2, 0, 0, 1)", usage: "Everything by default." },
  { token: "ease.enter", value: "cubic-bezier(0.16, 1, 0.3, 1)", usage: "Elements arriving on screen." },
  { token: "ease.exit", value: "cubic-bezier(0.4, 0, 1, 1)", usage: "Elements leaving. Exit faster than entry." },
  { token: "ease.emphasized", value: "cubic-bezier(0.3, 0.85, 0.15, 1)", usage: "Indicators that slide and resize." },
  { token: "ease.overshoot", value: "cubic-bezier(0.34, 1.32, 0.64, 1)", usage: "State delight only: checkbox tick, radio dot." },
];

const tiers = [
  {
    tier: "1",
    name: "Functional",
    budget: "140–220ms",
    examples: "Tabs, tooltip, popover, dialog, switch, sidebar.",
    rule: "Fast, precise, predictable. Never removed — only shortened under reduced motion.",
  },
  {
    tier: "2",
    name: "Micro delight",
    budget: "180–480ms",
    examples: "BorderGlow sweep, shine, hover lift, number ticker, shimmer, spotlight.",
    rule: "At most one per view. Must degrade to a static state with no loss of meaning.",
  },
  {
    tier: "3",
    name: "Atmospheric",
    budget: "2s+",
    examples: "Hero backgrounds, report covers, special AI surfaces.",
    rule: "Landing pages and reports only. Never inside dense application UI.",
  },
];

function MotionSample({ duration, easing, label }: { duration: string; easing: string; label: string }) {
  const [playing, setPlaying] = useState(false);
  const reducedMotion = useReducedMotion();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-label font-medium text-fg-primary">{label}</span>
        <Button
          size="sm"
          variant="ghost"
          leadingIcon={<RiPlayLine />}
          onClick={() => setPlaying((current) => !current)}
        >
          Play
        </Button>
      </div>
      <div className="relative h-10 overflow-hidden rounded-md border border-line-subtle bg-surface-sunken">
        <span
          aria-hidden="true"
          className="absolute top-1/2 size-4 -translate-y-1/2 rounded-[5px] bg-accent-default shadow-[0_0_12px_-2px_var(--accent-default)]"
          style={{
            left: playing ? "calc(100% - 1.5rem)" : "0.5rem",
            transitionProperty: "left",
            transitionDuration: reducedMotion ? "0ms" : duration,
            transitionTimingFunction: easing,
          }}
        />
      </div>
      <code className="font-mono text-micro text-fg-muted">
        {duration} · {easing}
      </code>
    </div>
  );
}

export default function MotionPage() {
  const { tcs } = useI18n();
  const reducedMotion = useReducedMotion();

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Foundations")}
        title="Motion"
        lead="One motion grammar: a short duration vocabulary, a small set of easings, and a reduced-motion answer for every animation. No component invents its own timing."
      />

      <Section title={tcs("Durations")} description={tcs("Five values, chosen by what the user is tracking — not by how impressive the effect looks.")}>
        <Panel className="flex flex-col gap-3 p-4">
          {durations.map((row) => {
            const px = Math.round((parseInt(row.value, 10) / 460) * 200);
            return (
              <div key={row.token} className="flex flex-wrap items-center gap-4">
                <code className="w-36 shrink-0 font-mono text-caption text-fg-primary">{row.token}</code>
                <code className="w-12 shrink-0 font-mono text-micro text-fg-accent">{row.value}</code>
                <span aria-hidden="true" className="h-2 shrink-0 rounded-xs bg-accent-soft" style={{ width: px }} />
                <span className="min-w-0 flex-1 text-caption text-fg-muted">{tcs(row.usage)}</span>
              </div>
            );
          })}
        </Panel>
      </Section>

      <Section title={tcs("Easing")} description={tcs("Press play and watch the same distance covered with different curves.")}>
        <div className="grid gap-5 md:grid-cols-2">
          {easings.map((row) => (
            <MotionSample key={row.token} duration="300ms" easing={row.value} label={row.token} />
          ))}
        </div>
      </Section>

      <Section title={tcs("Tiers")} description={tcs("Motion is budgeted by tier. Tier 3 has no place in a dashboard.")}>
        <DataTable
          caption={tcs("Motion tiers")}
          columns={[
            { key: "tier", header: "Tier", className: "w-16", render: (row: (typeof tiers)[number]) => <code className="font-mono text-fg-primary">{row.tier}</code> },
            { key: "name", header: "Name", render: (row: (typeof tiers)[number]) => tcs(row.name) },
            { key: "budget", header: "Budget", render: (row: (typeof tiers)[number]) => <code className="font-mono text-fg-accent">{row.budget}</code> },
            { key: "examples", header: "Examples", render: (row: (typeof tiers)[number]) => tcs(row.examples) },
            { key: "rule", header: "Rule", render: (row: (typeof tiers)[number]) => tcs(row.rule) },
          ]}
          rows={tiers}
        />
      </Section>

      <Section
        title={tcs("Reduced motion")}
        description={tcs("Every animation in Luc UI has a stated fallback. Use the “Motion auto / Reduced” control in the top bar to review both paths live.")}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Card variant="outline" className="gap-3 p-4">
            <Inline justify="between" className="w-full">
              <Text variant="label" tone="secondary" as="p">
                Current mode
              </Text>
              <span
                className={cn(
                  "rounded-xs border px-1.5 py-0.5 font-mono text-micro",
                  reducedMotion
                    ? "border-warning-line bg-warning-soft text-fg-warning"
                    : "border-line-accent bg-accent-soft text-fg-accent",
                )}
              >
                {reducedMotion ? "reduced" : "full"}
              </span>
            </Inline>
            <Inline gap="xs" className="flex-wrap">
              {durations.map((row) => (
                <span
                  key={row.token}
                  className="rounded-xs border border-line-subtle bg-surface-interactive px-1.5 py-0.5 font-mono text-micro text-fg-muted"
                >
                  {row.value}
                </span>
              ))}
            </Inline>
            <Text variant="caption" tone="muted">
              {tcs("A traveling highlight stops traveling but still marks the element. A number ticker jumps to its value. A dialog fades. Nothing that carries meaning is deleted.")}</Text>
          </Card>

          <Card variant="outline" className="gap-3 p-4">
            <Text variant="label" tone="secondary" as="p">
              {tcs("How it is implemented")}</Text>
            <ul className="flex list-disc flex-col gap-2 pl-4 text-caption text-fg-muted">
              <li>
                <Code>styles/base.css</Code> {tcs("clamps every animation and transition to ~0ms under")}{" "}
                <Code>prefers-reduced-motion</Code>.
              </li>
              <li>
                Elements marked <Code>data-motion-essential</Code> {tcs("(spinner, live dot) keep a slow pulse so the indicator still means “working”.")}</li>
              <li>
                {tcs("Behavioural animation (ticker, reveal, BorderGlow travel) calls")}{" "}
                <Code>useReducedMotion()</Code> {tcs("and takes a static path.")}</li>
            </ul>
          </Card>
        </div>
      </Section>

      <Section title={tcs("Rules")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="micro" tone="positive" as="p">
              Do
            </Text>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-label text-fg-secondary">
              <li>{tcs("Animate transform and opacity; avoid animating layout properties.")}</li>
              <li>{tcs("Make exits shorter than entrances.")}</li>
              <li>Use <Code>luc-transition</Code> {tcs("so timing stays in one place.")}</li>
            </ul>
          </Card>
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="micro" tone="negative" as="p">
              Don&apos;t
            </Text>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-label text-fg-secondary">
              <li>{tcs("Spring-overshoot a professional surface.")}</li>
              <li>{tcs("Animate something that is not a response to a user action.")}</li>
              <li>{tcs("Use motion to hide a slow data load.")}</li>
            </ul>
          </Card>
        </div>
      </Section>
    </DocPage>
  );
}
