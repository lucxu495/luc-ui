"use client";

/*
 * The body of the Tabs page.
 *
 * Six examples, one capability each: the two variants, the three sizes, `fill`,
 * the controlled pair, and the shape the component actually takes in a product —
 * a strip in a panel header with something else on the same line.
 *
 * What this page used to carry and no longer does: four `SegmentedControl`
 * specimens. Tabs and a segmented control are different components with different
 * semantics, `SegmentedControl` has its own page, and duplicating its examples
 * here taught the reader the wrong thing — that they are two spellings of one
 * choice. The distinction is now one row of Guidelines, where a reader deciding
 * between them will look.
 */

import { useState, type ReactNode } from "react";
import { Badge, Code, Heading, Inline, Panel, Tabs, Text } from "@luc/ui";
import { RiBarChartLine, RiLineChartLine, RiTableLine } from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ImportLine } from "@/components/docs/family-imports";
import { Example } from "@/components/docs/example";
import { CodeBlock } from "@/components/docs/code-block";
import { GuidanceCards } from "@/components/docs/guidance";
import { EntryFooter } from "@/components/docs/entry-footer";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";
import { useI18n } from "@/lib/i18n/provider";

/*
 * The panel body every example shares. It is a component rather than a constant
 * because the sentence goes through the dictionary, and a module-level JSX
 * constant has nowhere to call it from.
 */
function PanelContent() {
  const { tcs } = useI18n();
  return (
    <Text variant="caption" tone="muted">
      {tcs(
        "The panel swaps instantly. The indicator carries the state so the label hierarchy can stay quiet.",
      )}
    </Text>
  );
}

export function TabsPage({ apiSection }: { apiSection?: ReactNode }) {
  const { tcs } = useI18n();
  const notes = ENTRY_NOTES.tabs;
  const [view, setView] = useState("metrics");

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Navigation")}
        title="Tabs"
        lead="Switch between panels of related content, with the full tab keyboard contract."
      />

      <section className="flex flex-col gap-5">
        <Heading size="title" as="h2" id="examples">
          {tcs("Examples")}
        </Heading>

        <Example
          title={tcs("Line tabs")}
          description={tcs(
            "The default for page and panel-level navigation in dense UI: one row of triggers, a hairline underneath, and a single indicator that slides between them.",
          )}
          layout="block"
          code={`<Tabs defaultValue="overview">
  <Tabs.List>
    <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
    <Tabs.Trigger value="metrics" leadingIcon={<RiBarChartLine />}>
      Metrics
    </Tabs.Trigger>
    <Tabs.Trigger value="data" leadingIcon={<RiTableLine />}>
      Data
    </Tabs.Trigger>
    <Tabs.Trigger value="notes" disabled>
      Notes
    </Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="overview">…</Tabs.Content>
</Tabs>`}
        >
          <Tabs defaultValue="overview">
            <Tabs.List>
              <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
              <Tabs.Trigger value="metrics" leadingIcon={<RiBarChartLine />}>
                Metrics
              </Tabs.Trigger>
              <Tabs.Trigger value="data" leadingIcon={<RiTableLine />}>
                Data
              </Tabs.Trigger>
              <Tabs.Trigger value="notes" disabled>
                Notes
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="overview" className="pt-1">
              <PanelContent />
            </Tabs.Content>
            <Tabs.Content value="metrics" className="pt-1">
              <PanelContent />
            </Tabs.Content>
            <Tabs.Content value="data" className="pt-1">
              <PanelContent />
            </Tabs.Content>
          </Tabs>
        </Example>

        <Example
          title={tcs("Surface tabs")}
          description={tcs(
            "Inside a panel, where the strip is a view switcher rather than navigation: the indicator becomes a raised plate and the container carries the well.",
          )}
          layout="block"
          code={`<Tabs defaultValue="equity" variant="surface">
  <Tabs.List>
    <Tabs.Trigger value="equity" leadingIcon={<RiLineChartLine />}>
      Equity
    </Tabs.Trigger>
    <Tabs.Trigger value="drawdown">Drawdown</Tabs.Trigger>
    <Tabs.Trigger value="trades">Trades</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="equity">…</Tabs.Content>
</Tabs>`}
        >
          <Tabs defaultValue="equity" variant="surface">
            <Tabs.List>
              <Tabs.Trigger value="equity" leadingIcon={<RiLineChartLine />}>
                Equity
              </Tabs.Trigger>
              <Tabs.Trigger value="drawdown">Drawdown</Tabs.Trigger>
              <Tabs.Trigger value="trades">Trades</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="equity" className="pt-1">
              <PanelContent />
            </Tabs.Content>
            <Tabs.Content value="drawdown" className="pt-1">
              <PanelContent />
            </Tabs.Content>
            <Tabs.Content value="trades" className="pt-1">
              <PanelContent />
            </Tabs.Content>
          </Tabs>
        </Example>

        <Example
          title={tcs("Three sizes")}
          description={tcs(
            "`sm` lives in a card header, `md` is the default, and `lg` carries a page-level view switch. The height is the only thing that changes.",
          )}
          layout="block"
          code={`<Tabs defaultValue="s1" size="sm">…</Tabs>
<Tabs defaultValue="m1">…</Tabs>
<Tabs defaultValue="l1" size="lg">…</Tabs>`}
        >
          <div className="flex w-full flex-col gap-6">
            <Tabs defaultValue="s1" size="sm">
              <Tabs.List>
                <Tabs.Trigger value="s1">{"Small"}</Tabs.Trigger>
                <Tabs.Trigger value="s2">{"Tabs"}</Tabs.Trigger>
                <Tabs.Trigger value="s3">{"Row"}</Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="s1" className="pt-1">
                <PanelContent />
              </Tabs.Content>
              <Tabs.Content value="s2" className="pt-1">
                <PanelContent />
              </Tabs.Content>
              <Tabs.Content value="s3" className="pt-1">
                <PanelContent />
              </Tabs.Content>
            </Tabs>
            <Tabs defaultValue="l1" size="lg">
              <Tabs.List>
                <Tabs.Trigger value="l1">{"Large"}</Tabs.Trigger>
                <Tabs.Trigger value="l2">{"Tabs"}</Tabs.Trigger>
                <Tabs.Trigger value="l3">{"Row"}</Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="l1" className="pt-1">
                <PanelContent />
              </Tabs.Content>
              <Tabs.Content value="l2" className="pt-1">
                <PanelContent />
              </Tabs.Content>
              <Tabs.Content value="l3" className="pt-1">
                <PanelContent />
              </Tabs.Content>
            </Tabs>
          </div>
        </Example>

        <Example
          title={tcs("A strip that fills its region")}
          description={tcs(
            "`fill` gives every trigger an equal share of the width, which is what a full-width card header or a two-option switch wants.",
          )}
          layout="block"
          code={`<Tabs defaultValue="chart">
  <Tabs.List fill>
    <Tabs.Trigger value="chart">Chart</Tabs.Trigger>
    <Tabs.Trigger value="table">Table</Tabs.Trigger>
    <Tabs.Trigger value="raw">Raw</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="chart">…</Tabs.Content>
</Tabs>`}
        >
          <Tabs defaultValue="chart" className="w-full">
            <Tabs.List fill>
              <Tabs.Trigger value="chart">Chart</Tabs.Trigger>
              <Tabs.Trigger value="table">Table</Tabs.Trigger>
              <Tabs.Trigger value="raw">Raw</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="chart" className="pt-1">
              <PanelContent />
            </Tabs.Content>
            <Tabs.Content value="table" className="pt-1">
              <PanelContent />
            </Tabs.Content>
            <Tabs.Content value="raw" className="pt-1">
              <PanelContent />
            </Tabs.Content>
          </Tabs>
        </Example>

        <Example
          title={tcs("Selection the caller owns")}
          description={tcs(
            "Pass `value` and `onValueChange` and the strip reports the switch — which is how a tab becomes part of the URL, of a saved view, or of a query.",
          )}
          layout="block"
          code={`const [view, setView] = useState("metrics");

<Tabs value={view} onValueChange={setView}>
  <Tabs.List>
    <Tabs.Trigger value="metrics">Metrics</Tabs.Trigger>
    <Tabs.Trigger value="trades">Trades</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="metrics">…</Tabs.Content>
  <Tabs.Content value="trades">…</Tabs.Content>
</Tabs>`}
        >
          <div className="flex w-full flex-col gap-3">
            <Tabs value={view} onValueChange={setView}>
              <Tabs.List>
                <Tabs.Trigger value="metrics">Metrics</Tabs.Trigger>
                <Tabs.Trigger value="trades">Trades</Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="metrics" className="pt-1">
                <PanelContent />
              </Tabs.Content>
              <Tabs.Content value="trades" className="pt-1">
                <PanelContent />
              </Tabs.Content>
            </Tabs>
            <Inline gap="sm" align="center">
              <Text variant="caption" tone="muted">
                {tcs("Reported value")}
              </Text>
              <Code>{view}</Code>
            </Inline>
          </div>
        </Example>

        <Example
          title={tcs("In a chart panel header")}
          description={tcs(
            "The shape a product actually uses: a title, a badge and a small surface strip sharing one line, with the panel's own body underneath.",
          )}
          layout="block"
          code={`<Panel>
  <Inline justify="between" className="w-full">
    <Inline gap="sm">
      <Text variant="label">BTC/USD · 1d</Text>
      <Badge size="sm" tone="positive" dot>
        +2.1%
      </Badge>
    </Inline>
    <Tabs defaultValue="price" variant="surface" size="sm">
      <Tabs.List>
        <Tabs.Trigger value="price">Price</Tabs.Trigger>
        <Tabs.Trigger value="volume">Volume</Tabs.Trigger>
        <Tabs.Trigger value="volatility">Volatility</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="price">…</Tabs.Content>
    </Tabs>
  </Inline>
</Panel>`}
        >
          <Panel className="flex w-full flex-col gap-3 p-4">
            <Inline justify="between" className="w-full" wrap>
              <Inline gap="sm">
                <Text variant="label" tone="primary" as="p">
                  BTC/USD · 1d
                </Text>
                <Badge size="sm" tone="positive" dot>
                  +2.1%
                </Badge>
              </Inline>
              <Tabs defaultValue="price" variant="surface" size="sm">
                <Tabs.List>
                  <Tabs.Trigger value="price">Price</Tabs.Trigger>
                  <Tabs.Trigger value="volume">Volume</Tabs.Trigger>
                  <Tabs.Trigger value="volatility">Volatility</Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="price" className="pt-1">
                  <PanelContent />
                </Tabs.Content>
                <Tabs.Content value="volume" className="pt-1">
                  <PanelContent />
                </Tabs.Content>
                <Tabs.Content value="volatility" className="pt-1">
                  <PanelContent />
                </Tabs.Content>
              </Tabs>
            </Inline>
          </Panel>
        </Example>
      </section>

      <section className="flex flex-col gap-3">
        <Heading size="title" as="h2" id="usage">
          {tcs("Usage")}
        </Heading>
        <ImportLine line={`import { Tabs } from "@luc/ui";`} />
        {notes?.usage?.code ? (
          <CodeBlock code={notes.usage.code} label={tcs("Copy the minimal call")} />
        ) : null}
        {notes?.usage?.note ? (
          <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
            {tcs(notes.usage.note)}
          </Text>
        ) : null}
      </section>

      {apiSection}

      <section className="flex flex-col gap-4">
        <Heading size="title" as="h2" id="guidelines">
          {tcs("Guidelines")}
        </Heading>
        <GuidanceCards use={notes?.guidance?.use ?? []} avoid={notes?.guidance?.avoid ?? []} tcs={tcs} />
        {notes?.accessibility?.detail ? (
          <div className="flex flex-col gap-1.5">
            <Heading size="title" as="h3">
              {tcs("Accessibility")}
            </Heading>
            <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
              {tcs(notes.accessibility.detail)}
            </Text>
          </div>
        ) : null}
      </section>

      <EntryFooter entryId="tabs" />
    </DocPage>
  );
}
