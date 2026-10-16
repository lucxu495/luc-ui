"use client";

import {
  Badge,
  Button,
  Card,
  Code,
  Input,
  Section,
  SegmentedControl,
  SegmentedItem,
  Text,
} from "@luc/ui";
import { useState } from "react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { Demo } from "@/components/docs/demo";
import { Swatch } from "@/components/docs/swatch";
import { PropsTable } from "@/components/docs/tables";
import { useI18n } from "@/lib/i18n/provider";

/*
 * The spatial language, as a page.
 *
 * Every sample on this page is a real `@luc/ui` component — there is no
 * Showcase-only styling here, because the claim being made is precisely that
 * the *library* carries this. The "before" column is the honest part: it is the
 * pre-V4 recipe (a Tailwind default shadow, a 1px translate on hover) rendered
 * with plain classes, so a reader can see what changed rather than take it on
 * faith.
 */

export default function SpatialPage() {
  const { tc, tcs } = useI18n();
  const [space, setSpace] = useState<"flat" | "layered" | "deep">("layered");

  return (
    <DocPage>
      <PageHeader eyebrow={tcs("Foundations")} title="Spatial language" lead={tc("foundations.spatial.lead")} />

      <Section title={tc("foundations.spatial.idea.title")} description={tc("foundations.spatial.idea.lead")}>
        <Demo layout="block">
          <div className="grid gap-4 md:grid-cols-2">
            <Card variant="outline" className="gap-3 p-4">
              <Text variant="micro" tone="muted" as="p">
                {tc("foundations.spatial.before")}
              </Text>
              {/* The pre-V4 recipe: Tailwind's own shadow ladder and a flat 1px lift. */}
              <button
                type="button"
                className="inline-flex h-control-md items-center rounded-md border border-line-default bg-surface-interactive px-3 text-label text-fg-primary transition-transform hover:-translate-y-px"
                style={{ boxShadow: "0 1px 2px rgb(0 0 0 / 0.08)" }}
              >
                {tc("foundations.spatial.sampleAction")}
              </button>
              <div className="rounded-lg border border-line-subtle bg-surface-default p-3" style={{ boxShadow: "0 1px 2px rgb(0 0 0 / 0.08)" }}>
                <Text variant="caption" tone="secondary">
                  {tc("foundations.spatial.beforeNote")}
                </Text>
              </div>
            </Card>
            <Card variant="outline" className="gap-3 p-4">
              <Text variant="micro" tone="positive" as="p">
                {tc("foundations.spatial.after")}
              </Text>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="md" variant="secondary">
                  {tc("foundations.spatial.sampleAction")}
                </Button>
                <Button size="md">Primary</Button>
                <Badge tone="accent" size="md">
                  Badge
                </Badge>
              </div>
              <Card interactive padding="sm">
                <Text variant="caption" tone="secondary">
                  {tc("foundations.spatial.afterNote")}
                </Text>
              </Card>
            </Card>
          </div>
        </Demo>
      </Section>

      <Section title={tc("foundations.spatial.rungs.title")} description={tc("foundations.spatial.rungs.lead")}>
        <Demo layout="grid">
          {(
            [
              ["luc-rest", "shadow-rest", "rest"],
              ["luc-hover", "shadow-hover", "hover"],
              ["luc-float", "shadow-layer-2", "float"],
              ["luc-float-high", "shadow-layer-3", "modal"],
              ["luc-well", "shadow-well", "well"],
            ] as const
          ).map(([utility, token, key]) => (
            <div key={utility} className="flex flex-col gap-3">
              <div className={`grid h-20 place-items-center rounded-lg border border-line-subtle bg-surface-default ${utility}`}>
                <Text variant="caption" tone="muted">
                  {token}
                </Text>
              </div>
              <div className="flex flex-col gap-1">
                <Text variant="label">{tc(`foundations.spatial.rung.${key}.title`)}</Text>
                <Text variant="caption" tone="muted">
                  {tc(`foundations.spatial.rung.${key}.body`)}
                </Text>
              </div>
            </div>
          ))}
        </Demo>
      </Section>

      <Section title={tc("foundations.spatial.depth.title")} description={tc("foundations.spatial.depth.lead")}>
        <Demo layout="block">
          <div className="flex flex-wrap items-center gap-3">
            <SegmentedControl
              value={space}
              onValueChange={(next) => setSpace(next as typeof space)}
              aria-label="Depth scale"
            >
              <SegmentedItem value="flat">flat</SegmentedItem>
              <SegmentedItem value="layered">layered</SegmentedItem>
              <SegmentedItem value="deep">deep</SegmentedItem>
            </SegmentedControl>
            <Code>data-space=&quot;{space}&quot;</Code>
          </div>
          <div data-space={space} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {["Card", "Row", "Action", "Overlay"].map((label) => (
              <Card key={label} interactive padding="sm" className="gap-1.5">
                <Text variant="label">{label}</Text>
                <Text variant="caption" tone="muted">
                  --spatial-depth: {space === "flat" ? 0 : space === "layered" ? 1 : 1.6}
                </Text>
              </Card>
            ))}
          </div>
          <div data-space={space} className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="secondary">Secondary</Button>
            <Button>Primary</Button>
            <Badge tone="positive">Live</Badge>
            <Input defaultValue="Focused field" aria-label="Sample field" className="w-48" />
          </div>
        </Demo>
      </Section>

      <Section title={tc("foundations.spatial.states.title")} description={tc("foundations.spatial.states.lead")}>
        <Demo layout="inline">
          <Button>Resting</Button>
          <Button disabled>Disabled</Button>
          <Card interactive padding="sm" className="w-40">
            <Text variant="caption" tone="secondary">
              Hover a card
            </Text>
          </Card>
          <Input placeholder="Focus me" aria-label="Focus sample" className="w-40" />
          <Swatch variable="--elevation-rest" label="--elevation-sm" detail="luc-rest" className="luc-rest" />
        </Demo>
      </Section>

      <Section title={tc("foundations.spatial.tokens.title")} description={tc("foundations.spatial.tokens.lead")}>
        <PropsTable
          rows={[
            { name: "--spatial-depth", type: "0 · 1 · 1.6", description: tcs("Set by data-space=flat|layered|deep; a personality sets the resting unit.") },
            { name: "--spatial-lift", type: "length", description: tcs("calc(lift-unit × depth) — how far a surface rises to the pointer.") },
            { name: "--spatial-sink", type: "length", description: tcs("How far it settles under the finger, paired with --spatial-press-scale.") },
            { name: "--elevation-rest / -hover / -active / -float", type: "box-shadow", description: tcs("The four rungs every component names instead of picking a shadow.") },
            { name: "--layer-2-shadow / --layer-3-shadow", type: "box-shadow", description: tcs("Two stacked steps: a floating menu, then a modal surface.") },
            { name: "--well-shadow", type: "box-shadow", description: tcs("Sunken: inputs, progress tracks, segmented controls, selected toggles.") },
            { name: "luc-rest · luc-hover · luc-float · luc-float-high · luc-well", type: "utility", description: tcs("The rungs as classes, for a consumer styling its own surface.") },
          ]}
        />
      </Section>

      <Section title={tc("foundations.spatial.reduced.title")} description={tc("foundations.spatial.reduced.lead")}>
        <Card variant="outline" className="gap-2 p-4">
          <Text variant="caption" tone="secondary">
            {tc("foundations.spatial.reduced.body")}
          </Text>
        </Card>
      </Section>
    </DocPage>
  );
}
