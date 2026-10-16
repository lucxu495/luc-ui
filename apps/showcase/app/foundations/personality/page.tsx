"use client";

import { useState } from "react";

/*
 * Visual personality.
 *
 * The page has one job: prove that a personality is a *material* change, not a
 * colour change. It does that by rendering the same four specimens — a button, a
 * field, a card and a data row — inside four subtrees that differ by exactly one
 * attribute, so nothing else can explain the difference.
 */

import {
  Badge,
  Button,
  Card,
  Code,
  Delta,
  Heading,
  Input,
  Metric,
  MetricValue,
  SegmentedControl,
  SegmentedItem,
  Section,
  Switch,
  Text,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ApplyPersonality } from "@/components/showcase/apply-appearance";
import { PERSONALITIES } from "@/lib/appearance";
import { useI18n } from "@/lib/i18n/provider";

export default function PersonalityPage() {
  const { tc, t, tcs } = useI18n();
  const [density, setDensity] = useState("comfortable");

  return (
    <DocPage>
      <PageHeader
        eyebrow={t("appearance.personalityTitle")}
        title="Personality"
        lead="A palette changes hue and a type voice changes the letterforms. A personality changes the material: radius, control height, row density, type proportions, motion physics and glow strength — all from one attribute on any subtree."
      />

      <Section
        title={tcs("What actually moves")}
        description={tcs("Four token groups move together. Nothing about behaviour, semantics, contrast or keyboard support changes — a personality is a surface property, not another mode.")}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Geometry",
              body: tcs("--radius-xs … --radius-2xl. How much the material curves."),
            },
            {
              title: "Density",
              body: tcs("--control-height-*, --density-gap, --density-row. How tightly it packs."),
            },
            {
              title: "Proportions",
              body: tcs("Leading, tracking and display weights. How much air the type takes."),
            },
            {
              title: "Physics",
              body: tcs("--motion-*, --ease-*, --ambient-*, --effect-*-strength. How it moves."),
            },
          ].map((item) => (
            <Card key={item.title} variant="outline" className="gap-1.5 p-4">
              <Heading size="title" as="h3">
                {item.title}
              </Heading>
              <Text variant="caption" tone="muted" className="font-mono">
                {tcs(item.body)}
              </Text>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        title={tcs("Four materials, one component set")}
        description={tcs("Each column is a real subtree with its own data-personality attribute. The components inside are imported once and rendered four times.")}
        actions={<Badge tone="accent" size="sm">{tc("home.personalities.title")}</Badge>}
      >
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
          {PERSONALITIES.map((preset) => (
            <div
              key={preset.id}
              data-personality={preset.id}
              data-testid={`personality-${preset.id}`}
              className="flex flex-col gap-3 rounded-lg border border-line-subtle bg-surface-canvas p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col">
                  <Heading size="title" as="h3">
                    {preset.label}
                  </Heading>
                  <Text variant="caption" tone="muted">
                    {tcs(preset.note)}
                  </Text>
                </div>
                <ApplyPersonality id={preset.id} />
              </div>

              {/* The specimens. Every one of them is a real public component. */}
              <div className="flex flex-col gap-3">
                <Button variant="primary">Primary action</Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Outline
                  </Button>
                  <Button variant="ghost" size="sm">
                    Ghost
                  </Button>
                </div>
                <Input placeholder="An input field" aria-label="Personality specimen field" />
                <Card variant="raised" className="gap-2 p-3">
                  <Metric label="Weekly active" aside={<Delta value={4.8} />}>
                    <MetricValue value={12840} kind="compact" size="lg" />
                  </Metric>
                </Card>
                <div className="flex items-center justify-between gap-3">
                  <SegmentedControl
                    size="sm"
                    aria-label="Density specimen"
                    value={density}
                    onValueChange={(next) => next && setDensity(next)}
                  >
                    <SegmentedItem size="sm" value="comfortable">
                      Cozy
                    </SegmentedItem>
                    <SegmentedItem size="sm" value="compact">
                      Dense
                    </SegmentedItem>
                  </SegmentedControl>
                  <Switch defaultChecked aria-label={tcs("Personality specimen switch")} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title={tcs("How a product should use it")}
        description={tcs("Pick one personality for the whole product and put it on <html>, exactly like the theme. The subtrees above exist so a reviewer can compare; shipping four personalities inside one application is a way to make it feel assembled, not designed.")}
      >
        <Card variant="outline" className="gap-3 p-5">
          {/*
           * `Code block`, not a bare `<pre className="overflow-x-auto">`.
           *
           * The line is 692 px wide; at 390 px it scrolls, and a region that
           * scrolls and cannot be reached from the keyboard is unreachable
           * content — the one real defect the mobile scan found on this page.
           * The library's block form is a tab stop and carries
           * `contain: inline-size`, so the snippet scrolls inside its own box
           * instead of widening the card.
           */}
          <Code block>{`<html data-theme="dark" data-palette="violet" data-typeface="inter" data-personality="expressive">`}</Code>
          <Text variant="caption" tone="muted">
            {tcs("The attribute is inherited, so a nested subtree can reset to a different personality only when that is genuinely a different product surface — a marketing page embedded in an application shell, for example.")}</Text>
        </Card>
      </Section>
    </DocPage>
  );
}
