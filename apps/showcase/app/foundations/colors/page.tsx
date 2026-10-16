import type { Metadata } from "next";
import { Badge, Card, Code, Inline, Input, Panel, Section, StatusBadge, Text } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { Demo } from "@/components/docs/demo";
import { SwatchGrid } from "@/components/docs/swatch";
import { getServerCopy } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Colors" };

export default async function ColorsPage() {
  const { tcs } = await getServerCopy();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Foundations")}
        title="Colors"
        lead="Components never use a raw colour. They use a semantic token, and the theme decides what that token resolves to. Dark is the reference theme; light is designed separately rather than inverted."
      />

      <Section
        title={tcs("Surfaces")}
        description={tcs("Depth in LUC UI is a luminance step plus a hairline, not a big drop shadow. Surfaces form an ordered stack.")}
      >
        <SwatchGrid
          items={[
            { variable: "--surface-canvas", label: "surface.canvas", detail: "Page background" },
            { variable: "--surface-sunken", label: "surface.sunken", detail: "Inputs, code, wells" },
            { variable: "--surface-default", label: "surface.default", detail: "Cards" },
            { variable: "--surface-raised", label: "surface.raised", detail: "Popovers, stat cards" },
            { variable: "--surface-overlay", label: "surface.overlay", detail: "Dialogs, tooltips" },
            { variable: "--surface-interactive", label: "surface.interactive", detail: "Buttons, hover targets" },
            {
              variable: "--surface-interactive-hover",
              label: "surface.interactive.hover",
              detail: tcs("Hover state of the above"),
            },
            { variable: "--surface-inverse", label: "surface.inverse", detail: "Inverted chips" },
          ]}
        />
      </Section>

      <Section
        title={tcs("Text")}
        description={tcs("Four text levels keep hierarchy predictable. Anything below 4.5:1 against its surface is only ever used for decorative microcopy.")}
      >
        <Panel className="divide-y divide-line-subtle">
          {[
            { tone: "text-fg-primary", token: "text.primary", usage: tcs("Titles, values, active labels") },
            { tone: "text-fg-secondary", token: "text.secondary", usage: "Body copy, descriptions" },
            { tone: "text-fg-muted", token: "text.muted", usage: tcs("Meta, captions, axis labels") },
          ].map((row) => (
            <div key={row.token} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <span className={`text-body ${row.tone}`}>
                {tcs("The quick brown fox jumps over 1,284 lazy dogs")}</span>
              <Inline gap="sm">
                <Code>{row.token}</Code>
                <Text variant="caption" tone="muted">
                  {tcs(row.usage)}
                </Text>
              </Inline>
            </div>
          ))}
          {/*
            Disabled text is exempt from the contrast requirement because it is
            part of an inactive control — so it is shown as one, rather than as
            body copy someone might be tempted to copy.
          */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Input
              size="sm"
              disabled
              defaultValue="Disabled control text"
              aria-label={tcs("Example of disabled control text")}
              className="w-56"
            />
            <Inline gap="sm">
              <Code>text.disabled</Code>
              <Text variant="caption" tone="muted">
                {tcs("Disabled controls and placeholders only — never body copy")}</Text>
            </Inline>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <span className="text-body text-fg-accent">{tcs("Accent text — links and active emphasis")}</span>
            <Code>text-accent</Code>
          </div>
        </Panel>
      </Section>

      <Section title={tcs("Accent")} description={tcs("One accent. It marks selection, focus and action — nothing else.")}>
        <SwatchGrid
          columns={6}
          items={[
            { variable: "--accent-default", label: "accent.default" },
            { variable: "--accent-hover", label: "accent.hover" },
            { variable: "--accent-active", label: "accent.active" },
            { variable: "--accent-strong", label: "accent.strong" },
            { variable: "--accent-soft", label: "accent.soft" },
            { variable: "--accent-on-accent", label: "accent.on-accent", detail: tcs("Text on accent fills"), onAccent: true },
          ]}
        />
        <Demo title={tcs("Accent in context")} description={tcs("Primary action, soft selection, and accent text.")} layout="inline">
          <span className="rounded-md bg-accent-default px-3 py-1.5 text-label font-medium text-accent-on-accent">
            Primary action
          </span>
          <span className="rounded-md border border-line-accent bg-accent-soft px-3 py-1.5 text-label text-fg-accent">
            Selected
          </span>
          <span className="text-label text-fg-accent underline decoration-line-accent underline-offset-4">
            Accent text
          </span>
          <span className="rounded-md bg-accent-soft p-2 text-fg-accent">{tcs("Icon on soft accent")}</span>
        </Demo>
      </Section>

      <Section
        title={tcs("Status")}
        description={tcs("Status colour always ships with a label or a glyph. Colour is never the only carrier of meaning.")}
      >
        <SwatchGrid
          columns={6}
          items={[
            { variable: "--positive", label: "status.positive" },
            { variable: "--negative", label: "status.negative" },
            { variable: "--warning", label: "status.warning" },
            { variable: "--info", label: "status.info" },
            { variable: "--positive-soft", label: "status.positive.soft" },
            { variable: "--negative-soft", label: "status.negative.soft" },
          ]}
        />
        <Demo layout="inline">
          <StatusBadge status="live" />
          <StatusBadge status="healthy" />
          <StatusBadge status="degraded" />
          <StatusBadge status="pending" />
          <StatusBadge status="down" />
          <Badge tone="outline">Custom label</Badge>
        </Demo>
      </Section>

      <Section title={tcs("Borders and lines")} description={tcs("Hairlines carry most of the structure. They are always alpha-based so they sit correctly on any surface.")}>
        <SwatchGrid
          columns={4}
          items={[
            { variable: "--line-subtle", label: "border.subtle", detail: tcs("Dividers inside a surface") },
            { variable: "--line-default", label: "border.default", detail: tcs("Control outlines, card edges") },
            { variable: "--line-strong", label: "border.strong", detail: "Hover, unchecked controls" },
            { variable: "--line-accent", label: "border.focus / accent", detail: tcs("Focus and selection edges") },
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
              <li>Use <Code>bg-surface-*</Code> and <Code>text-fg-*</Code> utilities.</li>
              <li>{tcs("Add a new token to")}{" "}<Code>tokens.css</Code> {tcs("when you need a new role.")}</li>
              <li>{tcs("Check contrast in both themes before shipping a new pairing.")}</li>
            </ul>
          </Card>
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="micro" tone="negative" as="p">
              Don&apos;t
            </Text>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-label text-fg-secondary">
              <li>Hard-code hex, <Code>rgb()</Code> {tcs("or palette scales inside a component.")}</li>
              <li>{tcs("Reach for a second accent colour for “variety”.")}</li>
              <li>{tcs("Put the accent behind body text.")}</li>
            </ul>
          </Card>
        </div>
      </Section>
    </DocPage>
  );
}
