import type { Metadata } from "next";
import { Badge, Button, Callout, Code, Inline, Panel, Section, Sparkline, Text } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { EntryApiSection } from "@/components/docs/entry-api";
import { PageHeader } from "@/components/docs/page-header";
import { Sparkline as FilledSparkline } from "@/components/showcase/sparkline";
import { ApplyPalette, ApplyTypeface } from "@/components/showcase/apply-appearance";
import { PALETTES, TYPEFACES } from "@/lib/appearance";
import { getServerCopy } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Themes & typography" };

/**
 * Measured, not asserted: WCAG contrast for the two pairs a palette can break,
 * computed from the declared oklch values by `palette-tokens.test.ts` and
 * re-measured in the browser by the Showcase's axe sweep. Reproduce the numbers
 * with the test, not by eye.
 */
const CONTRAST = {
  cyan: { onAccent: [5.49, 9.66], accentText: [6.37, 11.3] },
  violet: { onAccent: [6.46, 8.92], accentText: [7.46, 10.46] },
  cobalt: { onAccent: [6.19, 9.02], accentText: [7.16, 10.59] },
  emerald: { onAccent: [5.53, 9.72], accentText: [6.38, 11.36] },
  rose: { onAccent: [6.55, 8.79], accentText: [7.56, 10.37] },
  ember: { onAccent: [6.32, 8.97], accentText: [7.31, 10.49] },
  graphite: { onAccent: [16.26, 14.77], accentText: [14.59, 12.93] },
} as const;

const SERIES = [12, 18, 15, 24, 21, 33, 29, 41, 38, 47];

export default async function ThemesPage() {
  const { tcs } = await getServerCopy();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Foundations")}
        title="Themes & typography"
        lead="A theme is an attribute, not a stylesheet. One palette changes the brand accent across every component; one typeface attribute re-points the sans, display and mono roles. Both are scoped, so they apply to the document — or to a single card."
      />

      <Section
        title={tcs("Seven palettes, one design system")}
        description={tcs("Every palette below is a live subtree: the same Public API, the same tokens, one data-palette attribute. Nothing is re-implemented for the preview and nothing here needs JavaScript to render.")}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {PALETTES.map((palette) => (
            <article
              key={palette.id}
              data-palette={palette.id}
              data-testid={`palette-${palette.id}`}
              className="flex flex-col gap-3 rounded-lg border border-line-subtle bg-surface-default p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-col gap-1">
                  <Inline gap="sm">
                    <span aria-hidden="true" className="size-4 shrink-0 rounded-full bg-accent-default" />
                    <span className="text-label font-medium text-fg-primary">{tcs(palette.label)}</span>
                  </Inline>
                  <Text variant="caption" tone="muted">
                    {tcs(palette.note)}
                  </Text>
                </div>
                <Code className="shrink-0">{palette.id}</Code>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="primary">
                  Publish
                </Button>
                <Button size="sm" variant="accent">
                  Preview
                </Button>
                <Badge size="sm" tone="accent">
                  Live
                </Badge>
              </div>

              <div className="flex items-end justify-between gap-3">
                <FilledSparkline
                  values={SERIES}
                  tone="accent"
                  marker
                  height={34}
                  width={160}
                  ariaLabel={`${palette.label} accent series`}
                />
                <ApplyPalette id={palette.id} />
              </div>
            </article>
          ))}
        </div>

        <Callout tone="neutral" title={tcs("Why a sparkline is in the card")}>
          {tcs("Chart colour is part of the theme, not a separate configuration. The accent series, the selection band and the pinned marker all resolve from the palette, so a chart drawn inside this card cannot disagree with the button above it.")}</Callout>
      </Section>

      <Section
        title={tcs("What a palette changes — and what it must never change")}
        description={tcs("The line between brand and meaning is the whole reason the palette layer is small.")}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel className="flex flex-col gap-3 p-4" data-palette="violet">
            <Text variant="label" className="font-medium">
              {tcs("Changes with the palette")}</Text>
            <ul className="flex flex-col gap-1.5 text-body text-fg-secondary">
              {[
                "accent.default · hover · active · strong",
                "accent.soft — the tint behind a selected or secondary surface",
                "fg.accent — accent-coloured text",
                "focus.ring — the focus language follows the brand",
                "surface.selected · line.accent · glow.*",
                "chart.marker · chart.selection · chart.band",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-accent-default" />
                  <Code>{tcs(item)}</Code>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel className="flex flex-col gap-3 p-4">
            <Text variant="label" className="font-medium">
              {tcs("Never changes with the palette")}</Text>
            <ul className="flex flex-col gap-1.5 text-body text-fg-secondary">
              {[
                "positive · negative · warning · info — meaning, not brand",
                "the surface stack (canvas → sunken → default → raised → overlay)",
                "the four text levels",
                "radius, spacing, density and motion",
                "component behaviour, semantics and keyboard handling",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-line-strong" />
                  {tcs(item)}
                </li>
              ))}
            </ul>
            <Text variant="caption" tone="muted">
              {tcs("A palette that repainted “negative” green would break every product built on Luc UI. That is why the status set has no palette override at all — the token file simply does not offer one.")}</Text>
          </Panel>
        </div>
      </Section>

      <Section
        title={tcs("Contrast is measured, not assumed")}
        description={tcs("Two pairs can break when an accent moves: the label on a filled accent control, and accent text on the default surface. Both are computed from the declared oklch values in unit tests, then re-measured in the browser by axe.")}
      >
        <Panel className="divide-y divide-line-subtle">
          <div className="grid grid-cols-[1.4fr_repeat(2,1fr)] gap-3 px-4 py-2 text-micro text-fg-muted uppercase">
            <span>Palette</span>
            <span>Label on accent</span>
            <span>{tcs("Accent text on surface")}</span>
          </div>
          {PALETTES.map((palette) => {
            const measured = CONTRAST[palette.id];
            return (
              <div
                key={palette.id}
                data-palette={palette.id}
                className="grid grid-cols-[1.4fr_repeat(2,1fr)] items-center gap-3 px-4 py-2.5"
              >
                <Inline gap="sm">
                  <span aria-hidden="true" className="size-3 shrink-0 rounded-full bg-accent-default" />
                  <Text variant="caption">{tcs(palette.label)}</Text>
                </Inline>
                <ContrastCell light={measured.onAccent[0]} dark={measured.onAccent[1]} />
                <ContrastCell light={measured.accentText[0]} dark={measured.accentText[1]} />
              </div>
            );
          })}
        </Panel>
        <Text variant="caption" tone="muted">
          {tcs("The three columns are the same numbers the unit test asserts. Values are WCAG 2.1 contrast ratios computed from the declared colour; the darker figure is the light theme, the lighter figure the dark theme. Every pair clears 4.5:1 in both themes — the floor for body-size text.")}</Text>
      </Section>

      <Section
        title={tcs("Type roles, not fonts")}
        description={tcs("Components never name a family. They use one of three roles — sans, display, mono — and a preset re-points all three at once. A consumer with licensed brand fonts points the variables at their own stack and never edits a component.")}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {TYPEFACES.map((typeface) => (
            <Panel
              key={typeface.id}
              data-typeface={typeface.id}
              data-testid={`typeface-${typeface.id}`}
              className="flex flex-col gap-3 p-4"
            >
              <Inline gap="sm" className="justify-between">
                <Text variant="label" className="font-medium">
                  {tcs(typeface.label)}
                </Text>
                <Code>{typeface.id}</Code>
              </Inline>
              <Text variant="caption" tone="muted">
                {tcs(typeface.note)}
              </Text>
              <h3 className="font-display text-heading-sm text-fg-primary">
                {tcs("Measured drawdown, not modelled drawdown")}</h3>
              <p className="text-body text-fg-secondary">
                {tcs("The role system means an editorial product can set body copy in a serif with looser leading while the data column stays monospaced and tabular, without a single component knowing which face is which.")}</p>
              <Inline gap="sm" className="items-baseline justify-between pt-1">
                <span className="font-display text-display-sm text-fg-primary">−18.4%</span>
                <Sparkline values={SERIES} tone="accent" width={120} height={28} ariaLabel="Accent preview" />
              </Inline>
              <ApplyTypeface id={typeface.id} />
            </Panel>
          ))}
        </div>
      </Section>

      <Section title={tcs("Developer contract")} description={tcs("Everything above is downstream of three attributes and one token layer.")}>
        <Panel className="flex flex-col gap-4 p-4">
          <Code block>{`<html data-theme="dark" data-palette="violet" data-typeface="editorial">`}</Code>
          <Code block>{`/* A subtree theme is an attribute on any element. */
<section data-palette="graphite" data-theme="light">
  <PricingTable />
</section>`}</Code>
          <ul className="flex flex-col gap-2 text-body text-fg-secondary">
            <li>
              <Code>data-palette</Code> {tcs("— one of the seven accent families. Status colours are deliberately not part of it.")}</li>
            <li>
              <Code>data-typeface</Code> {tcs("— a preset that re-points the type roles. Point")}{" "}
              <Code>--font-sans</Code>, <Code>--font-display</Code> and <Code>--font-mono</Code> {tcs("at your own stack to add one.")}</li>
            <li>
              <Code>data-density</Code> and <Code>data-motion</Code> {tcs("sit alongside them and compose freely: they are the same mechanism, not a second theming API.")}</li>
          </ul>
          <Callout tone="info" title={tcs("Adding a palette")}>
            {tcs("A new palette is ten declarations per mode. Copy an existing block in")}{" "}
            <Code>packages/ui/src/tokens/tokens.css</Code>{tcs(", keep the lightness trajectory, change the hue — and the completeness and contrast tests will tell you if the ramp is incomplete or a label colour fails.")}</Callout>
        </Panel>
      </Section>

      {/*
        * `theme-provider` is a reference row, and this is the page where a reader
        * meets it: the provider is how a subtree is themed, so its props belong
        * beside the contract above rather than on a page of their own.
        */}
      <EntryApiSection
        entryId="theme-provider"
        heading="API"
        primary="ThemeProvider"
        note={tcs(
          "`ThemeProvider` is the mechanism under everything on this page: it writes the three attributes, resolves `system` against the operating system, and exposes `useTheme` to the product.",
        )}
      />
    </DocPage>
  );
}

function ContrastCell({ light, dark }: { light: number; dark: number }) {
  return (
    <span className="font-mono text-caption tabular-nums text-fg-secondary">
      {light.toFixed(2)}
      <span className="text-fg-muted"> / </span>
      {dark.toFixed(2)}
    </span>
  );
}
