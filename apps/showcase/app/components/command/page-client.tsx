"use client";

import { useState, type ReactNode } from "react";
import {
  Button,
  Card,
  Code,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandMenu,
  CommandSeparator,
  Kbd,
  Panel,
  Section,
  Text,
  toast,
  useCommandPages,
} from "@luc/ui";
import {
  RiArrowLeftLine,
  RiComputerLine,
  RiFlashlightLine,
  RiMoonLine,
  RiNotification3Line,
  RiSearchLine,
  RiSunLine,
} from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { Demo } from "@/components/docs/demo";
import { ImportLine } from "@/components/docs/family-imports";
import { useI18n } from "@/lib/i18n/provider";
import { EntryFooter } from "@/components/docs/entry-footer";

const COMMANDS = [
  { id: "nav-overview", group: "Navigate", label: "Go to overview", shortcut: "G O" },
  { id: "nav-charts", group: "Navigate", label: "Go to chart system", shortcut: "G C" },
  { id: "nav-table", group: "Navigate", label: "Go to data table", shortcut: "G T" },
  { id: "act-refresh", group: "Actions", label: "Refresh every pane", shortcut: "R" },
  { id: "act-export", group: "Actions", label: "Export the workspace as PNG", shortcut: "E" },
  { id: "act-invite", group: "Actions", label: "Invite a collaborator" },
];

export function CommandPage({ apiSection }: { apiSection?: ReactNode }) {
  const { tcs } = useI18n();
  const [open, setOpen] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const pages = useCommandPages();

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Components · Command")}
        title="Command menu"
        lead="A palette for running things: navigate, act, toggle. cmdk owns filtering, ranking, the active-descendant model and scroll-into-view; LUC owns the palette layout, the search field, the grouping rhythm, the active row language and the shortcut column."
      />

      <ImportLine line={'import {\n  Command,\n  CommandEmpty,\n  CommandGroup,\n  CommandInput,\n  CommandItem,\n  CommandList,\n  CommandMenu,\n  CommandSeparator,\n  useCommandPages,\n} from "@luc/ui";'} />

      <Section
        title={tcs("Open it")}
        description={tcs("The Showcase registers the hotkey globally and the header carries a visible affordance — a shortcut nobody can discover is not a feature.")}
        actions={
          /* The palette is a dialog: say so. A button that opens one without
           * `aria-haspopup` announces itself as an ordinary button. */
          <Button aria-haspopup="dialog" onClick={() => setOpen(true)} leadingIcon={<RiSearchLine />}>
            {tcs("Open palette")}
          </Button>
        }
      >
        <Demo
          layout="grid"
          code={`useCommandHotkey(() => setOpen(true));
<CommandMenu open={open} onOpenChange={setOpen} label="Command menu">
  <Command>
    <CommandInput placeholder="Search commands…" />
    <CommandList>
      <CommandGroup heading="Navigate">
        <CommandItem shortcut="G C" onSelect={() => router.push("/charts")}>Go to charts</CommandItem>
      </CommandGroup>
    </CommandList>
  </Command>
</CommandMenu>`}
        >
          <Card variant="outline" className="gap-1.5 p-4">
            <Text variant="label" as="p">
              Trigger
            </Text>
            <Text variant="caption" tone="muted" as="p">
              <Kbd>⌘K</Kbd> on macOS, <Kbd>Ctrl</Kbd> <Kbd>K</Kbd> {tcs("elsewhere. The hook lives in")}<span className="font-mono"> @luc/ui</span>{tcs("; a product decides when to enable it.")}</Text>
          </Card>
          <Card variant="outline" className="gap-1.5 p-4">
            <Text variant="label" as="p">
              Last action
            </Text>
            <Text variant="caption" tone="muted" as="p">
              {lastRun ?? tcs("Nothing yet — open the palette and run something.")}
            </Text>
          </Card>
          <Card variant="outline" className="gap-1.5 p-4">
            <Text variant="label" as="p">
              Filtering
            </Text>
            <Text variant="caption" tone="muted" as="p">
              {tcs("Type to filter across labels and keywords. Ranking is cmdk's; the markup is ours.")}</Text>
          </Card>
        </Demo>
      </Section>

      <Section title={tcs("Semantics")} description={tcs("A command menu runs things. It is not a dropdown.")}>
        <Panel className="flex flex-col gap-3 p-5">
          <ul className="flex flex-col gap-2 text-caption text-fg-muted">
            <li>{tcs("Use Select to pick a known value; the choice is the outcome.")}</li>
            <li>{tcs("Use Combobox when the list is long or comes from a server.")}</li>
            <li>{tcs("Use CommandMenu when the user is invoking behaviour, not choosing a field.")}</li>
            <li>{tcs("Never wire Select to navigation: a select that redirects is a trap.")}</li>
          </ul>
          <Code block>{`Command + Dialog:
role="dialog" shell with role="listbox" results inside,
role="option" rows, aria-activedescendant on the input,
Escape closes, Enter runs the highlighted command.`}</Code>
        </Panel>
      </Section>

      <Section title={tcs("Nested pages")} description={tcs("One palette can hold sub-pages: push a page, clear the search, pop with Backspace.")}>
        <Panel className="flex flex-col gap-3 p-5">
          <Text variant="caption" tone="muted">
            {tcs("Open the palette below and choose “Switch theme”. The page stack is a hook, not a router:")}<span className="font-mono"> useCommandPages()</span> {tcs("returns push, pop, reset and the keydown handler.")}</Text>
          <Button variant="secondary" onClick={() => setOpen(true)}>
            {tcs("Try the nested page")}</Button>
        </Panel>
      </Section>

      <CommandMenu
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) pages.reset();
        }}
        label={tcs("Command menu")}
        description={tcs("Navigate, act or change a setting.")}
        footer={
          <>
            <span className="flex items-center gap-2">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> move
              <Kbd>↵</Kbd> run
            </span>
            <span className="flex items-center gap-2">
              <Kbd>esc</Kbd> close
            </span>
          </>
        }
      >
        <Command onKeyDown={pages.onKeyDown}>
          <CommandInput placeholder="Search commands…" value={pages.search} onValueChange={pages.setSearch} />
          <CommandList>
            <CommandEmpty>{tcs("No command matches that.")}</CommandEmpty>

            {pages.page === undefined ? (
              <>
                <CommandGroup heading="Navigate">
                  {COMMANDS.filter((command) => command.group === "Navigate").map((command) => (
                    <CommandItem
                      key={command.id}
                      value={`${command.label} ${command.id}`}
                      icon={<RiFlashlightLine />}
                      shortcut={command.shortcut}
                      onSelect={() => {
                        setLastRun(command.label);
                        setOpen(false);
                      }}
                    >
                      {command.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Actions">
                  {COMMANDS.filter((command) => command.group === "Actions").map((command) => (
                    <CommandItem
                      key={command.id}
                      value={`${command.label} ${command.id}`}
                      icon={<RiFlashlightLine />}
                      shortcut={command.shortcut}
                      onSelect={() => {
                        setLastRun(command.label);
                        setOpen(false);
                      }}
                    >
                      {command.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Settings">
                  <CommandItem value="switch theme" icon={<RiSunLine />} onSelect={() => pages.push("theme")}>
                    Switch theme
                  </CommandItem>
                  <CommandItem
                    value="fire toast"
                    icon={<RiNotification3Line />}
                    onSelect={() => {
                      toast.success("Command ran", { description: tcs("Triggered from the palette.") });
                      setOpen(false);
                    }}
                  >
                    {tcs("Fire a test toast")}</CommandItem>
                </CommandGroup>
              </>
            ) : null}

            {pages.page === "theme" ? (
              <CommandGroup heading="Theme">
                <CommandItem value="back" icon={<RiArrowLeftLine />} shortcut="⌫" onSelect={() => pages.pop()}>
                  Back
                </CommandItem>
                <CommandItem value="light" icon={<RiSunLine />} onSelect={() => setOpen(false)}>
                  Light
                </CommandItem>
                <CommandItem value="dark" icon={<RiMoonLine />} onSelect={() => setOpen(false)}>
                  Dark
                </CommandItem>
                <CommandItem value="system" icon={<RiComputerLine />} onSelect={() => setOpen(false)}>
                  System
                </CommandItem>
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </CommandMenu>
      {apiSection}
      <EntryFooter />
    </DocPage>
  );
}
