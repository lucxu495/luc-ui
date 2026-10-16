"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  IconButton,
  Panel,
  Section,
  Text,
  toast,
} from "@luc/ui";
import {
  RiArrowDownSLine,
  RiDownloadLine,
  RiFileCopyLine,
  RiMore2Line,
  RiPencilLine,
  RiPushpinLine,
  RiRefreshLine,
  RiShareLine,
  RiTableLine,
} from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ImportLine } from "@/components/docs/family-imports";
import { Example } from "@/components/docs/example";
import { PropsTable } from "@/components/docs/tables";
import { useI18n } from "@/lib/i18n/provider";
import { EntryFooter } from "@/components/docs/entry-footer";

const runs = [
  { id: "btc-sma-2026-09", status: "Complete" },
  { id: "eth-momentum-2026-09", status: "Running" },
  { id: "macro-regime-2026-08", status: "Failed" },
];

export default function MenusPage() {
  const { tcs } = useI18n();
  const [columns, setColumns] = useState({ volume: true, drawdown: true, signals: false });
  const [sort, setSort] = useState("sharpe");

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Components")}
        title="Menus"
        lead="DropdownMenu and ContextMenu are two triggers for one menu language: actions and options attached to a trigger, or to a target. Radix owns focus, typeahead, submenus and Escape; LUC owns the surface."
      />

      <ImportLine line={'import {\n  Button,\n  ContextMenu,\n  ContextMenuCheckboxItem,\n  ContextMenuContent,\n  ContextMenuItem,\n  ContextMenuLabel,\n  ContextMenuRadioGroup,\n  ContextMenuRadioItem,\n  ContextMenuSeparator,\n  ContextMenuShortcut,\n  ContextMenuSub,\n  ContextMenuSubContent,\n  ContextMenuSubTrigger,\n  ContextMenuTrigger,\n  DropdownMenu,\n  DropdownMenuCheckboxItem,\n  DropdownMenuContent,\n  DropdownMenuItem,\n  DropdownMenuLabel,\n  DropdownMenuRadioGroup,\n  DropdownMenuRadioItem,\n  DropdownMenuSeparator,\n  DropdownMenuShortcut,\n  DropdownMenuSub,\n  DropdownMenuSubContent,\n  DropdownMenuSubTrigger,\n  DropdownMenuTrigger,\n  IconButton,\n} from "@luc/ui";'} />

      <Example
        title={tcs("Dropdown menu")}
        code={`<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="secondary" trailingIcon={<RiArrowDownSLine />}>Run actions</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="start">
    <DropdownMenuLabel>This run</DropdownMenuLabel>
    <DropdownMenuItem onSelect={openReport}>
      <RiTableLine aria-hidden="true" />
      Open report
      <DropdownMenuShortcut>⌘O</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem tone="danger">Delete run</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`}
        description={tcs("Icons lead, shortcuts trail, and a destructive action is a negative label rather than a filled red row — nothing implies the click already happened.")}
        layout="inline"
      >

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" trailingIcon={<RiArrowDownSLine />}>
              Run actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>This run</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => toast("Opening the report")}>
              <RiTableLine aria-hidden="true" />
              Open report
              <DropdownMenuShortcut>⌘O</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast("Pinned")}>
              <RiPushpinLine aria-hidden="true" />
              Pin to inspector
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <RiRefreshLine aria-hidden="true" />
              Re-run (queued)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <RiShareLine aria-hidden="true" />
                Share
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onSelect={() => toast("Link copied")}>
                  <RiFileCopyLine aria-hidden="true" />
                  Copy link
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => toast("Exported")}>
                  <RiDownloadLine aria-hidden="true" />
                  Export CSV
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => toast.error("Run deleted")}>
              Delete run
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton label="More actions" icon={<RiMore2Line />} variant="ghost" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <RiPencilLine aria-hidden="true" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive">Archive</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Example>

      <Example
        title={tcs("Choices inside a menu")}
        code={`<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Columns</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="start">
    <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
    <DropdownMenuCheckboxItem
      checked={columns.volume}
      onCheckedChange={(next) => setColumns((prev) => ({ ...prev, volume: Boolean(next) }))}
    >
      Volume
    </DropdownMenuCheckboxItem>
    <DropdownMenuCheckboxItem checked={columns.drawdown} onCheckedChange={setDrawdown}>
      Drawdown
    </DropdownMenuCheckboxItem>
  </DropdownMenuContent>
</DropdownMenu>`}
        description={tcs("Checkbox and radio items are for options you are toggling in place, not for picking a value a form should own — that is Select or Combobox.")}
        layout="inline"
      >

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Columns</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={columns.volume}
              onCheckedChange={(next) => setColumns((prev) => ({ ...prev, volume: Boolean(next) }))}
            >
              Volume
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columns.drawdown}
              onCheckedChange={(next) => setColumns((prev) => ({ ...prev, drawdown: Boolean(next) }))}
            >
              Drawdown
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columns.signals}
              onCheckedChange={(next) => setColumns((prev) => ({ ...prev, signals: Boolean(next) }))}
            >
              Signals
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Sort by</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
              <DropdownMenuRadioItem value="sharpe">Sharpe</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="calmar">Calmar</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="drawdown">Max drawdown</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Text variant="caption" tone="muted">
          Sorted by{" "}
          <Text as="span" variant="caption">
            {sort}
          </Text>
          .
        </Text>
      </Example>

      <Example
        title={tcs("Context menu on a row")}
        code={`<ContextMenu>
  <ContextMenuTrigger asChild>
    <tr className="border-b border-line-subtle">
      <td className="px-3 py-2">Run 128</td>
      <td className="px-3 py-2">Momentum</td>
    </tr>
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Open</ContextMenuItem>
    <ContextMenuItem>Duplicate</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem tone="danger">Delete</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`}
        description={tcs("The same actions, attached to the object itself. Right click, or press Shift+F10 / the context-menu key with the row focused. Every row is a fair target — the menu is not a replacement for a visible action when one action dominates.")}
        layout="block"
      >

        <Panel className="overflow-hidden">
          <table className="w-full text-left text-caption">
            <caption className="sr-only">{tcs("Research runs, with a context menu on each row")}</caption>
            <thead>
              <tr className="border-b border-line-subtle bg-surface-sunken">
                <th scope="col" className="px-3 py-2 text-micro font-medium text-fg-muted uppercase">
                  Run
                </th>
                <th scope="col" className="px-3 py-2 text-micro font-medium text-fg-muted uppercase">
                  Status
                </th>
                <th scope="col" className="px-3 py-2 text-micro font-medium text-fg-muted uppercase">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <ContextMenu key={run.id}>
                  <ContextMenuTrigger asChild>
                    <tr tabIndex={0} className="border-b border-line-subtle last:border-b-0 hover:bg-surface-interactive-hover">
                      <td className="px-3 py-2 font-mono text-fg-primary">{run.id}</td>
                      <td className="px-3 py-2">
                        <Badge tone={run.status === "Failed" ? "negative" : run.status === "Running" ? "accent" : "positive"}>
                          {run.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <IconButton label={`Actions for ${run.id}`} icon={<RiMore2Line />} variant="ghost" size="sm" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => toast(`Opening ${run.id}`)}>Open</DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onSelect={() => toast.error(`Deleted ${run.id}`)}>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuLabel>{run.id}</ContextMenuLabel>
                    <ContextMenuItem onSelect={() => toast("Pinned to inspector")}>
                      <RiPushpinLine aria-hidden="true" />
                      Pin to inspector
                      <ContextMenuShortcut>P</ContextMenuShortcut>
                    </ContextMenuItem>
                    <ContextMenuItem onSelect={() => toast("Link copied")}>
                      <RiFileCopyLine aria-hidden="true" />
                      Copy link
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuSub>
                      <ContextMenuSubTrigger>Export</ContextMenuSubTrigger>
                      <ContextMenuSubContent>
                        <ContextMenuItem>CSV</ContextMenuItem>
                        <ContextMenuItem>Parquet</ContextMenuItem>
                      </ContextMenuSubContent>
                    </ContextMenuSub>
                    <ContextMenuSeparator />
                    <ContextMenuCheckboxItem checked={columns.drawdown} onCheckedChange={() => toast("Drawdown column toggled")}>
                      Show drawdown column
                    </ContextMenuCheckboxItem>
                    <ContextMenuRadioGroup value={sort} onValueChange={setSort}>
                      <ContextMenuRadioItem value="sharpe">Sort by Sharpe</ContextMenuRadioItem>
                      <ContextMenuRadioItem value="calmar">Sort by Calmar</ContextMenuRadioItem>
                    </ContextMenuRadioGroup>
                    <ContextMenuSeparator />
                    <ContextMenuItem variant="destructive" onSelect={() => toast.error(`Deleted ${run.id}`)}>
                      Delete run
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </tbody>
          </table>
        </Panel>
      </Example>

      <Section
        title={tcs("Which control?")}
        description={tcs("Four components look similar in a screenshot and behave completely differently. Pick by the question being answered.")}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { name: "Select", body: tcs("Choose one value from a known, short list. Reads like a form field and reports a value.") },
            { name: "Combobox", body: tcs("Search, then choose. Use when the list is long, remote or free-text filtered.") },
            { name: "DropdownMenu", body: tcs("Run an action, or toggle options, attached to a trigger. Nothing is submitted.") },
            { name: "ContextMenu", body: tcs("The same actions, attached to the object the pointer is on.") },
            { name: "CommandMenu", body: tcs("Global navigation and search across the application.") },
          ].map((item) => (
            <Card key={item.name} variant="outline" className="gap-1 p-4">
              <Text variant="label">{item.name}</Text>
              <Text variant="caption" tone="muted">
                {tcs(item.body)}
              </Text>
            </Card>
          ))}
        </div>
      </Section>

      <Section title={tcs("API")}>
        <PropsTable
          rows={[
            { name: "DropdownMenu*", type: "Radix DropdownMenu parts", description: tcs("Root, Trigger, Content, Item, CheckboxItem, RadioGroup, RadioItem, Sub/SubTrigger/SubContent, Label, Separator.") },
            { name: "ContextMenu*", type: "Radix ContextMenu parts", description: tcs("Identical surface and row rhythm; the trigger is a target instead of a button.") },
            { name: "shortcut", type: "ReactNode", description: tcs("Trailing keyboard hint on an item. Purely presentational.") },
            { name: "variant", type: '"default" | "destructive"', default: '"default"', description: tcs("Destructive is a negative label, not a filled red row.") },
            { name: "inset", type: "boolean", default: "false", description: tcs("Aligns a row without a leading indicator with rows that have one.") },
            { name: "sideOffset", type: "number", default: "6", description: tcs("Distance from the trigger; menu sections use 4.") },
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
              <li>{tcs("Keep the first action visible on the row and put the rest in the menu.")}</li>
              <li>{tcs("Name the trigger for what it acts on — “Actions for btc-sma-2026-09”.")}</li>
              <li>{tcs("Group with labels and separators once there are more than about five items.")}</li>
            </ul>
          </Card>
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="micro" tone="negative" as="p">
              Don&apos;t
            </Text>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-label text-fg-secondary">
              <li>{tcs("Use a menu to pick a form value.")}</li>
              <li>{tcs("Hide the only route to a primary action inside a context menu.")}</li>
              <li>{tcs("Colour a whole row red — the label carries the tone.")}</li>
            </ul>
          </Card>
        </div>
      </Section>
      <EntryFooter />
    </DocPage>
  );
}
