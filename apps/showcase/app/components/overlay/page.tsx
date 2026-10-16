"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Field,
  IconButton,
  Inline,
  Input,
  Kbd,
  Panel,
  PopoverContent,
  PopoverRoot,
  PopoverTrigger,
  Section,
  Separator,
  Switch,
  Text,
  Tooltip,
} from "@luc/ui";
import { RiInformationLine, RiMoreLine, RiQuestionLine, RiSettings3Line } from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { EntryFooter } from "@/components/docs/entry-footer";
import { ImportLine } from "@/components/docs/family-imports";
import { Example } from "@/components/docs/example";
import { PropsTable } from "@/components/docs/tables";
import { useI18n } from "@/lib/i18n/provider";

export default function OverlayPage() {
  const { tcs } = useI18n();
  const [pending, setPending] = useState(true);

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Components")}
        title="Tooltip and popover"
        lead="Both arrive from their trigger, not from nowhere: the tooltip slides 3px from the side it opens on, the popover scales up from its anchor. Positioning, collision and focus behaviour come from Radix."
      />

      <ImportLine line={'import {\n  Button,\n  Checkbox,\n  Field,\n  IconButton,\n  Input,\n  Kbd,\n  PopoverContent,\n  PopoverRoot,\n  PopoverTrigger,\n  Switch,\n  Tooltip,\n} from "@luc/ui";'} />

      <Example
        title={tcs("Tooltip")}
        description={tcs("Hover or focus a trigger. Tooltips are for clarification — never the only place an essential label lives.")}
        code={`<Tooltip content="Run the backtest" hint="⌘↵">
  <Button>Run</Button>
</Tooltip>`}
      >

        <Tooltip content={tcs("Opens on top by default")}>
          <Button variant="secondary">Top</Button>
        </Tooltip>
        <Tooltip content={tcs("Bottom placement")} side="bottom">
          <Button variant="secondary">Bottom</Button>
        </Tooltip>
        <Tooltip content={tcs("Right placement")} side="right">
          <Button variant="secondary">Right</Button>
        </Tooltip>
        <Tooltip content={tcs("Includes a shortcut hint")} hint={tcs("⌘K")}>
          <Button variant="secondary">With hint</Button>
        </Tooltip>
        <Tooltip content={tcs("No arrow")} arrow={false}>
          <Button variant="secondary">No arrow</Button>
        </Tooltip>
        <Tooltip content={tcs("Icon buttons need a label, and the tooltip repeats it")}>
          <IconButton label="Settings" icon={<RiSettings3Line />} />
        </Tooltip>
      </Example>

      <Example
        title={tcs("Popover")}
        description={tcs("A small floating surface for filters, quick settings and menus. Collision handling flips it when there is no room.")}
        layout="inline"
        code={`<PopoverRoot>
  <PopoverTrigger asChild><Button>Filters</Button></PopoverTrigger>
  <PopoverContent width="sm">…</PopoverContent>
</PopoverRoot>`}
      >

        <PopoverRoot>
          <PopoverTrigger asChild>
            <Button variant="secondary">Chart filters</Button>
          </PopoverTrigger>
          <PopoverContent width="sm" align="start" className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <Text variant="label" tone="primary" as="p">
                Series
              </Text>
              <Text variant="caption" tone="muted">
                {tcs("Applies to every chart in this group.")}</Text>
            </div>
            <Separator />
            <div className="flex flex-col gap-3">
              <Checkbox defaultChecked label={tcs("Close price")} />
              <Checkbox defaultChecked label={tcs("SMA 50")} />
              <Checkbox label={tcs("SMA 200")} />
              <Checkbox label={tcs("Realized volatility")} description={tcs("Rolling 30d window.")} />
            </div>
            <Separator />
            <Field label={tcs("Range")} orientation="horizontal">
              <Inline gap="xs">
                <Badge size="sm" tone="outline">
                  30d
                </Badge>
              </Inline>
            </Field>
          </PopoverContent>
        </PopoverRoot>

        <PopoverRoot>
          <PopoverTrigger asChild>
            <IconButton label="Row actions" icon={<RiMoreLine />} variant="solid" />
          </PopoverTrigger>
          <PopoverContent width="sm" align="end" className="flex flex-col gap-1 p-1.5">
            {["Open run", "Duplicate", "Copy run id", "Export artifacts"].map((item) => (
              <button
                key={item}
                type="button"
                className="luc-transition luc-focus flex h-8 items-center rounded-sm px-2.5 text-left text-label text-fg-secondary hover:bg-surface-interactive-hover hover:text-fg-primary"
              >
                {item}
              </button>
            ))}
            <Separator className="my-0.5" />
            <button
              type="button"
              className="luc-transition luc-focus flex h-8 items-center rounded-sm px-2.5 text-left text-label text-fg-negative hover:bg-negative-soft"
            >
              Delete run
            </button>
          </PopoverContent>
        </PopoverRoot>

        <PopoverRoot>
          <PopoverTrigger asChild>
            <Button variant="ghost" leadingIcon={<RiQuestionLine />}>
              {tcs("Why is this value different?")}</Button>
          </PopoverTrigger>
          <PopoverContent width="md" sideOffset={8} className="flex flex-col gap-3">
            <Inline gap="xs">
              <RiInformationLine className="size-4 text-fg-info" />
              <Text variant="label" tone="primary" as="p">
                Alignment note
              </Text>
            </Inline>
            <Text variant="caption" tone="muted">
              {tcs("The daily aggregation uses UTC midnight while the hourly view uses the exchange close, so totals can differ by a partial session.")}</Text>
            <Inline gap="sm">
              <Kbd>Esc</Kbd>
              <Text variant="caption" tone="muted">
                {tcs("closes this popover and returns focus")}</Text>
            </Inline>
          </PopoverContent>
        </PopoverRoot>
      </Example>

      <Section title={tcs("Inside a filter bar")} description={tcs("The composition these components exist for.")}>
        <Panel className="flex flex-wrap items-center gap-2 p-3">
          <Input size="sm" placeholder="Search runs…" className="w-56" />
          <PopoverRoot>
            <PopoverTrigger asChild>
              <Button size="sm" variant="secondary">
                Status
              </Button>
            </PopoverTrigger>
            <PopoverContent width="sm" align="start">
              <div className="flex flex-col gap-3">
                <Checkbox defaultChecked label={tcs("Completed")} />
                <Checkbox defaultChecked label={tcs("Running")} />
                <Checkbox label={tcs("Failed")} />
              </div>
            </PopoverContent>
          </PopoverRoot>
          <Tooltip content={tcs("Include runs whose artifacts are still being written")}>
            <span className="inline-flex items-center gap-2 rounded-md border border-line-subtle px-2.5 py-1.5">
              <Text variant="caption" tone="secondary">
                Pending
              </Text>
              <Switch size="sm" checked={pending} onCheckedChange={setPending} aria-label={tcs("Include pending runs")} />
            </span>
          </Tooltip>
        </Panel>
      </Section>

      <Section title={tcs("API")}>
        <PropsTable
          rows={[
            { name: "Tooltip content", type: "ReactNode", description: tcs("Short clarifying text — one line, no interactive content.") },
            { name: "Tooltip side", type: '"top" | "right" | "bottom" | "left"', default: '"top"', description: tcs("Placement preference; Radix flips it when space runs out.") },
            { name: "Tooltip hint", type: "ReactNode", description: tcs("Renders a keyboard hint chip next to the label.") },
            { name: "PopoverContent width", type: '"auto" | "sm" | "md" | "lg"', default: '"auto"', description: "Common floating-surface widths." },
            { name: "PopoverContent align / sideOffset", type: '"start" | "center" | "end" / number', default: '"center" / 6', description: tcs("Anchored to the trigger.") },
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
              <li>{tcs("Keep tooltips to a single short sentence.")}</li>
              <li>{tcs("Use a popover for anything with a control inside it.")}</li>
              <li>{tcs("Return focus to the trigger when a popover closes.")}</li>
            </ul>
          </Card>
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="micro" tone="negative" as="p">
              Don&apos;t
            </Text>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-label text-fg-secondary">
              <li>{tcs("Hide required information in a tooltip.")}</li>
              <li>{tcs("Put a form that needs scrolling in a tooltip.")}</li>
              <li>{tcs("Open a popover on hover only — it must be keyboard reachable.")}</li>
            </ul>
          </Card>
        </div>
      </Section>
          <EntryFooter />
    </DocPage>
  );
}
