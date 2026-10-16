import type { Metadata } from "next";
import { Card, Heading, Inline, Panel, Section, Text } from "@luc/ui";
import { RiArrowRightLine } from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { foundationItems } from "@/lib/navigation";
import { getServerCopy } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Foundations" };

const principles = [
  {
    title: "Quiet at rest, alive on interaction",
    body: "A passive surface carries no animation, no glow and no colour. Attention is spent only when the user acts.",
  },
  {
    title: "Eighty percent restraint",
    body: "Delight is a budget, not a style. One memorable moment per view beats five competing ones.",
  },
  {
    title: "Tokens before components",
    body: "Colour, radius, motion and elevation are named roles. A component that needs a new raw value needs a new token.",
  },
  {
    title: "Depth is luminance, not shadow",
    body: "Dark surfaces separate by a luminance step and a hairline. Shadows stay small and mostly communicate layering of overlays.",
  },
  {
    title: "Motion is an enhancement",
    body: "Every animation has a reduced-motion answer that keeps the meaning and drops the travel.",
  },
  {
    title: "Accessibility is construction",
    body: "Keyboard paths, focus visibility, contrast and semantics come from the primitive, not from a later patch.",
  },
];

const layers = [
  {
    name: "Core values",
    file: "tokens.css · @theme",
    body: "Scale values that never change with the theme: type, radius, motion, density, z-index.",
  },
  {
    name: "Semantic tokens",
    file: "tokens.css · :root / .dark",
    body: "Theme-dependent roles: surface, fg, line, accent, status, shadow, glow.",
  },
  {
    name: "Utilities",
    file: "styles/index.css · @theme inline",
    body: "The bridge that turns semantic tokens into Tailwind utilities like bg-surface-default.",
  },
  {
    name: "Brand and voice",
    file: "tokens.css · [data-palette] / [data-typeface]",
    body: "Seven accent families and four type voices, selected by one attribute on any subtree. A product with its own brand points the accent and font variables at its values; components never change.",
  },
];

export default async function FoundationsPage() {
  const { tcs, tn, href } = await getServerCopy();

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Foundations")}
        title="The system behind the components"
        lead="LUC UI is a small set of rules applied consistently. These pages are the contract: if something is not here, it is not part of the system yet."
      />

      <Section title={tcs("Principles")} description={tcs("Six rules that decide most design arguments before they start.")}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {principles.map((item, index) => (
            <Card key={tcs(item.title)} variant="outline" className="gap-2 p-4">
              <Inline justify="between" className="w-full">
                <Heading size="title" as="h3">
                  {tcs(item.title)}
                </Heading>
                <span className="font-mono text-micro text-fg-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </Inline>
              <Text variant="label" tone="muted">
                {tcs(item.body)}
              </Text>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        title={tcs("Token layers")}
        description={tcs("Values flow in one direction. Components read the semantic layer; themes replace it.")}
      >
        <Panel className="divide-y divide-line-subtle">
          {layers.map((layer, index) => (
            <div key={layer.name} className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex w-56 shrink-0 items-center gap-3">
                <span className="grid size-6 place-items-center rounded-sm border border-line-subtle bg-surface-interactive font-mono text-micro text-fg-muted">
                  {index + 1}
                </span>
                <span className="text-label font-medium text-fg-primary">{layer.name}</span>
              </div>
              <code className="w-64 shrink-0 font-mono text-caption text-fg-accent">{layer.file}</code>
              <span className="text-caption text-fg-muted">{tcs(layer.body)}</span>
            </div>
          ))}
        </Panel>
      </Section>

      <Section
        title={tcs("Adding to the system")}
        description={tcs("The same four steps every time, so the system stays predictable.")}
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { step: "1", title: "Find the role", body: tcs("Name what the value is for, not what it looks like.") },
            { step: "2", title: "Add the token", body: tcs("Colour, radius, motion and elevation live in tokens.css.") },
            { step: "3", title: "Use the utility", body: tcs("Consume bg-*, text-*, rounded-*, shadow-* — never raw values.") },
            { step: "4", title: "Document it", body: tcs("Update DESIGN_SYSTEM.md and this showcase in the same change.") },
          ].map((item) => (
            <Card key={item.step} variant="outline" className="gap-2 p-4">
              <span className="font-mono text-micro text-fg-accent">STEP {item.step}</span>
              <Heading size="title" as="h3">
                {tcs(item.title)}
              </Heading>
              <Text variant="caption" tone="muted">
                {tcs(item.body)}
              </Text>
            </Card>
          ))}
        </div>
      </Section>

      <Section title={tcs("Explore")}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {foundationItems.map((item) => (
            <Card key={item.href} as="a" href={item.href ? href(item.href) : undefined} variant="outline" interactive className="gap-1.5 p-4">
              <Inline justify="between" className="w-full">
                <Heading size="title" as="span">
                  {tcs(item.title)}
                </Heading>
                <RiArrowRightLine className="size-4 shrink-0 text-fg-muted" />
              </Inline>
              <Text variant="caption" tone="muted">
                {tn(item.description ?? "")}
              </Text>
            </Card>
          ))}
        </div>
      </Section>
    </DocPage>
  );
}
