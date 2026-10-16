import type { Metadata } from "next";
import { Callout, Code, Inline, Section, Text } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import {
  AiDeveloperVignette,
  CommerceVignette,
  CreatorVignette,
  FinanceVignette,
} from "@/components/showcase/industry-vignettes";
import { ApplyPalette, ApplyTypeface } from "@/components/showcase/apply-appearance";
import { getServerCopy } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Cross-industry" };

/**
 * Scope is the whole argument of this page.
 *
 * `data-palette` and `data-typeface` are ordinary attribute selectors, so the
 * four vignettes below are *the same components in four brands* rather than four
 * copies of a card. A financial library would have made the fourth one look
 * right; a general one has to make all four look right with one codebase.
 */
export default async function IndustriesPage() {
  const { tcs } = await getServerCopy();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Patterns")}
        title="Cross-industry"
        lead="LUC UI grew up on dense analytics, and that shows in its tables, charts and workspaces. It is not only for them. Each vignette below is built from the same public components — only the palette and the type voice change."
      />

      <Section
        title={tcs("AI & developer tools")}
        description={tcs("Status, code, an instruction field and an approval flow. Nothing here is financial; the components that carry it are the same ones a research desk uses.")}
      >
        <Scope palette="cobalt" typeface="technical">
          <AiDeveloperVignette />
        </Scope>
        <Callout tone="neutral" title={tcs("Why cobalt and mono")}>
          <Text variant="caption" tone="secondary">
            {tcs("A cool, saturated blue reads as infrastructure rather than finance, and a monospaced display face signals “this output is literal”. Both are one attribute — the approve button, the switch and the status badge did not change.")}</Text>
        </Callout>
      </Section>

      <Section
        title={tcs("Commerce & lifestyle")}
        description={tcs("Product surfaces, prices with a discount, variant chips and a cart summary. The interactive Card and the numeric text are the same primitives used in a data grid.")}
      >
        <Scope palette="rose" typeface="humanist">
          <CommerceVignette />
        </Scope>
        <Callout tone="neutral" title={tcs("Why rose and a system sans")}>
          <Text variant="caption" tone="secondary">
            {tcs("A warm accent keeps the storefront from looking like an admin tool, and the humanist system stack proves a product can ship with no webfont at all — the same components, zero font payload.")}</Text>
        </Callout>
      </Section>

      <Section
        title={tcs("Creator & community")}
        description={tcs("An editorial article: serif display, looser leading, a byline, a pull quote and topics. Turbulent typesetting is the product here, not a data table.")}
      >
        <Scope palette="ember" typeface="editorial">
          <CreatorVignette />
        </Scope>
        <Callout tone="neutral" title={tcs("Why ember and a serif")}>
          <Text variant="caption" tone="secondary">
            {tcs("The `editorial` typeface re-points the sans role as well as the display role, because an editorial voice is a whole-page decision. Line heights loosen with it — the preset ships the leading a serif needs.")}</Text>
        </Callout>
      </Section>

      <Section
        title={tcs("Finance & analytics")}
        description={tcs("The home turf: metrics with deltas, a sparkline, a compact attribution table with signed numeric columns.")}
      >
        <Scope palette="emerald" typeface="inter">
          <FinanceVignette />
        </Scope>
        <Callout tone="neutral" title={tcs("Why emerald")}>
          <Text variant="caption" tone="secondary">
            {tcs("Emerald is deliberately *not* the default cyan: the point is that the strongest data components in the system are palette-agnostic. Positive and negative values keep their semantic colours in every palette.")}</Text>
        </Callout>
      </Section>

      <Section
        title={tcs("What stayed identical")}
        description={tcs("Versatility is only credible if nothing was special-cased.")}
      >
        <ul className="flex flex-col gap-2 text-body text-fg-secondary">
          {[
            "The same Button, Card, Badge, Tag, Switch, Metric, DataTable, Sparkline and typography components.",
            "The same status vocabulary — healthy, pending, degraded — with the same colours in all four brands.",
            "The same density, radius, elevation, focus ring and motion vocabulary.",
            "The same keyboard behaviour and accessible names; a palette changes paint, never semantics.",
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-accent-default" />
              {tcs(item)}
            </li>
          ))}
        </ul>
        <Inline gap="sm" className="flex-wrap">
          <Text variant="caption" tone="muted">
            {tcs("Try one of them on the whole Showcase:")}</Text>
          <ApplyPalette id="cobalt" />
          <ApplyPalette id="rose" />
          <ApplyPalette id="ember" />
          <ApplyPalette id="emerald" />
          <ApplyTypeface id="editorial" />
          <ApplyTypeface id="technical" />
        </Inline>
      </Section>

      <Section title={tcs("How a scoped brand is written")} description={tcs("Two attributes on a wrapper. Nothing else.")}>
        <Code block>{`<section data-palette="ember" data-typeface="editorial">
  <Article ... />
</section>`}</Code>
        <Text variant="caption" tone="muted">
          {tcs("The wrapper above is the entire implementation of this page's four brands. If a vignette needed a bespoke class to look right, that would be a defect in the component, not a missing variant.")}</Text>
      </Section>
    </DocPage>
  );
}

function Scope({
  palette,
  typeface,
  children,
}: {
  palette: string;
  typeface: string;
  children: React.ReactNode;
}) {
  return (
    <div
      data-palette={palette}
      data-typeface={typeface}
      data-testid={`vignette-${palette}`}
      className="rounded-xl border border-line-subtle bg-surface-canvas p-4 shadow-sm sm:p-5"
    >
      {children}
    </div>
  );
}
