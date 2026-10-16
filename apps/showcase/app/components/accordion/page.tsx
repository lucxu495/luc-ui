"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Card,
  Collapsible,
  CollapsibleContent,
  CollapsibleTriggerRow,
  Section,
  Switch,
  Text,
} from "@luc/ui";
import { RiArrowDownSLine } from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ImportLine } from "@/components/docs/family-imports";
import { Example } from "@/components/docs/example";
import { PropsTable } from "@/components/docs/tables";
import { useI18n } from "@/lib/i18n/provider";
import { EntryFooter } from "@/components/docs/entry-footer";

export default function AccordionPage() {
  const { tc, tcs } = useI18n();
  return (
    <DocPage>
      <PageHeader eyebrow={tcs("Components")} title="Accordion and Collapsible" lead={tc("components.accordion.lead")} />

      <ImportLine line={'import {\n  Accordion,\n  AccordionContent,\n  AccordionItem,\n  AccordionTrigger,\n  Collapsible,\n  CollapsibleContent,\n  CollapsibleTriggerRow,\n} from "@luc/ui";'} />

      <Example
        title={tc("components.accordion.when.title")}
        description={tc("components.accordion.when.lead")}
        layout="block"
        code={'<Accordion type="single" collapsible defaultValue="ingestion">\n  <AccordionItem value="ingestion">\n    <AccordionTrigger>Ingestion</AccordionTrigger>\n    <AccordionContent>…</AccordionContent>\n  </AccordionItem>\n</Accordion>'}
      >

        <Accordion type="single" collapsible defaultValue="ingestion" className="flex flex-col gap-2">
          <AccordionItem value="ingestion">
            <AccordionTrigger aside={<Badge tone="positive" size="sm">ok</Badge>}>Ingestion</AccordionTrigger>
            <AccordionContent>
              {tcs("Every provider wrote inside its window. 1,284 bars landed for BTCUSDT 1h and the 1d rollup matched the hourly sum to the tick.")}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="analytics">
            <AccordionTrigger aside={<Badge tone="info" size="sm">7</Badge>}>Analytics</AccordionTrigger>
            <AccordionContent>{tcs("Seven domains validated against their expected row counts.")}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="serving">
            <AccordionTrigger>Serving</AccordionTrigger>
            <AccordionContent>
              {tcs("A new generation was published. The previous one stays readable until retention walks it.")}</AccordionContent>
          </AccordionItem>
        </Accordion>
      </Example>

      <Example
        title={tc("components.accordion.flush.title")}
        description={tc("components.accordion.flush.lead")}
        layout="block"
        code={`<Accordion type="multiple">
  <AccordionItem value="a" variant="flush">
    <AccordionTrigger>Is the panel animated?</AccordionTrigger>
    <AccordionContent>Radix measures the panel; LUC animates to that height.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="b" variant="flush">
    <AccordionTrigger>Does collapsing unmount the content?</AccordionTrigger>
    <AccordionContent>It does — state that must survive belongs above it, or behind forceMount.</AccordionContent>
  </AccordionItem>
</Accordion>`}
      >

        <Card variant="outline" className="px-4">
          <Accordion type="multiple" className="flex flex-col">
            <AccordionItem value="a" variant="flush">
              <AccordionTrigger>{tcs("Is the panel animated?")}</AccordionTrigger>
              <AccordionContent>
                {tcs("Yes — Radix measures the panel and LUC animates to that height. Under reduced motion the panel is simply open or closed.")}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="b" variant="flush">
              <AccordionTrigger>{tcs("Does collapsing unmount the content?")}</AccordionTrigger>
              <AccordionContent>
                {tcs("It does. State that must survive a collapse belongs above the accordion, or behind")}{" "}
                <code>
                  forceMount
                </code>
                .
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      </Example>

      <Example
        title={tc("components.accordion.row.title")}
        description={tc("components.accordion.row.lead")}
        layout="block"
        code={`<Collapsible>
  <CollapsibleTriggerRow aside={<Badge tone="info" size="sm">daily</Badge>}>
    Advanced pipeline settings
  </CollapsibleTriggerRow>
  <CollapsibleContent>
    <label className="flex items-center justify-between gap-4">
      Retry failed partitions
      <Switch defaultChecked />
    </label>
    <label className="flex items-center justify-between gap-4">
      Publish on partial data
      <Switch />
    </label>
  </CollapsibleContent>
</Collapsible>`}
      >

        <Collapsible>
          <CollapsibleTriggerRow
            aside={<Badge tone="info" size="sm">daily</Badge>}
          >
            Advanced pipeline settings
          </CollapsibleTriggerRow>
          <CollapsibleContent>
            <div className="flex flex-col gap-3 rounded-md border border-line-subtle bg-surface-sunken p-3">
              <label className="flex items-center justify-between gap-4 text-label text-fg-secondary">
                Retry failed partitions
                <Switch defaultChecked />
              </label>
              <label className="flex items-center justify-between gap-4 text-label text-fg-secondary">
                {tcs("Publish on partial data")}<Switch />
              </label>
              <div className="flex items-center gap-2">
                <Text variant="caption" tone="muted" className="flex items-center gap-1">
                  <RiArrowDownSLine className="size-3.5" aria-hidden="true" />
                  {tcs("Collapsible is the same disclosure without the item wrapper.")}</Text>
                <Button size="sm" variant="ghost">
                  Docs
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Example>

      <Section title={tcs("API")}>
        <PropsTable
          rows={[
            { name: "Accordion type", type: '"single" | "multiple"', description: tcs("Radix's own contract: how many sections may be open.") },
            { name: "Accordion collapsible", type: "boolean", description: tcs("In single mode, allow closing the open item.") },
            { name: "AccordionItem variant", type: '"card" | "flush"', default: '"card"', description: tcs("Own surface, or one surface with hairlines.") },
            { name: "AccordionTrigger icon / aside", type: "ReactNode", description: tcs("Leading and right-aligned slots before the chevron.") },
            { name: "AccordionContent padded", type: "boolean", default: "true", description: tcs("Inner padding; off for a list or a table.") },
            { name: "Collapsible", type: "Radix Root", description: tcs("One region, no item and no roving focus.") },
          ]}
        />
      </Section>
      <EntryFooter />
    </DocPage>
  );
}
