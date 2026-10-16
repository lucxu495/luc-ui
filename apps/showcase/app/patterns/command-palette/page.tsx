"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Code,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandMenu,
  DataTable,
  DataTablePagination,
  DataTableToolbar,
  Kbd,
  Panel,
  Section,
  Text,
  toast,
  useCommandHotkey,
  type DataTableColumn,
} from "@luc/ui";
import {
  RiAddLine,
  RiFilterOffLine,
  RiLayoutColumnLine,
  RiSortDesc,
  RiSortAsc,
} from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { Demo } from "@/components/docs/demo";
import { runColumns } from "@/components/tables/run-columns";
import { researchRuns, type ResearchRun } from "@/lib/table-data";
import { useI18n } from "@/lib/i18n/provider";

const RUNS = researchRuns(48);

/**
 * The composition: a table whose quick actions live in a command palette.
 *
 * The palette is scoped to this page (it is not the global one) and every
 * command talks to the table through the same public state the toolbar uses.
 * Nothing here reaches into TanStack directly, which is the point.
 */
export default function CommandPalettePatternPage() {
  const { tcs } = useI18n();
  const baseColumns = useMemo(() => runColumns(), []);
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [sorting, setSorting] = useState([{ id: "sharpe", desc: true }]);
  const [visibility, setVisibility] = useState<Record<string, boolean>>({
    regime: false,
    maxDrawdown: false,
    trades: false,
    exposure: false,
  });
  const [globalFilter, setGlobalFilter] = useState("");
  // TanStack v9 records selection as present-true keys, not booleans.
  const [rowSelection, setRowSelection] = useState<Record<string, true>>({});

  useCommandHotkey(() => setOpen(true));

  const columns = baseColumns as Array<DataTableColumn<ResearchRun>>;

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Patterns · Command palette")}
        title="Table quick actions"
        lead="⌘K over a dense table. The palette sorts, reveals columns, clears filters and acts on the selection — each command is a few lines of ordinary table state, because the palette is just another consumer of the same public API the toolbar uses."
      />

      <Section
        title={tcs("Press ⌘K")}
        description={tcs("This palette is scoped to the page, so it can also be opened from a button. The global palette in the header stays available.")}
        actions={
          <Button variant="secondary" onClick={() => setOpen(true)}>
            {tcs("Open quick actions")}
          </Button>
        }
      >
        <Demo bare>
          <DataTable<ResearchRun>
            ariaLabel={tcs("Research runs with quick actions")}
            columns={columns}
            data={RUNS}
            getRowId={(row) => row.id}
            density={compact ? "compact" : "comfortable"}
            stickyHeader
            maxHeight={460}
            enableRowSelection
            pageSize={10}
            sorting={sorting}
            onSortingChange={setSorting}
            columnVisibility={visibility}
            onColumnVisibilityChange={setVisibility}
            globalFilter={globalFilter}
            onGlobalFilterChange={setGlobalFilter}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            toolbar={
              <DataTableToolbar
                search={{ label: "Search runs", placeholder: "Search runs…" }}
                actions={
                  <Text variant="caption" tone="muted">
                    <Kbd>⌘K</Kbd> for quick actions
                  </Text>
                }
              />
            }
            footer={<DataTablePagination rowLabel="runs" />}
          />
          <Text variant="caption" tone="muted" className="mt-3 block">
            {Object.keys(rowSelection).length} selected ·{" "}
            {sorting.length ? `sorted by ${sorting[0]?.id} ${sorting[0]?.desc ? "desc" : "asc"}` : "unsorted"} ·{" "}
            {compact ? "compact" : "comfortable"} density
          </Text>
        </Demo>
      </Section>

      <Section title={tcs("The commands")} description={tcs("Each one is table state, not a table hack.")}>
        <Panel className="flex flex-col gap-3 p-5">
          <ul className="flex flex-col gap-2 text-caption text-fg-muted">
            <li>{tcs("Sort by Sharpe, sort by trades, or clear sorting.")}</li>
            <li>{tcs("Reveal the hidden columns, or hide them again.")}</li>
            <li>{tcs("Clear every filter in one action.")}</li>
            <li>{tcs("Switch density, and act on the current selection.")}</li>
          </ul>
          <Code block>{`<DataTable
  sorting={sorting} onSortingChange={setSorting}
  columnVisibility={visibility} onColumnVisibilityChange={setVisibility}
  rowSelection={selection} onRowSelectionChange={setSelection}
  globalFilter={query} onGlobalFilterChange={setQuery}
  columns={columns} data={rows} ariaLabel="Research runs"
/>`}</Code>
        </Panel>
      </Section>

      <CommandMenu
        open={open}
        onOpenChange={setOpen}
        label={tcs("Table quick actions")}
        description={tcs("Sorting, columns and selection.")}
        footer={
          <span className="flex items-center gap-2">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> move <Kbd>↵</Kbd> run
          </span>
        }
      >
        <Command>
          <CommandInput placeholder={tcs("Run a quick action…")} />
          <CommandList>
            <CommandEmpty>{tcs("No action matches that.")}</CommandEmpty>
            <CommandGroup heading="Sort">
              <CommandItem
                value="sort sharpe descending"
                icon={<RiSortDesc />}
                onSelect={() => {
                  setSorting([{ id: "sharpe", desc: true }]);
                  setOpen(false);
                }}
              >
                {tcs("Sort by Sharpe, best first")}</CommandItem>
              <CommandItem
                value="sort trades ascending"
                icon={<RiSortAsc />}
                onSelect={() => {
                  setSorting([{ id: "trades", desc: false }]);
                  setVisibility((current) => ({ ...current, trades: true }));
                  setOpen(false);
                }}
              >
                {tcs("Sort by trades, fewest first")}</CommandItem>
            </CommandGroup>
            <CommandGroup heading="Columns">
              <CommandItem
                value="show all columns reveal"
                icon={<RiLayoutColumnLine />}
                onSelect={() => {
                  setVisibility({});
                  setOpen(false);
                }}
              >
                Reveal every column
              </CommandItem>
              <CommandItem
                value="hide optional columns"
                icon={<RiLayoutColumnLine />}
                onSelect={() => {
                  setVisibility({ regime: false, maxDrawdown: false, trades: false, exposure: false });
                  setOpen(false);
                }}
              >
                Hide optional columns
              </CommandItem>
              <CommandItem
                value="compact density rows"
                icon={<RiLayoutColumnLine />}
                onSelect={() => {
                  setCompact((current) => !current);
                  setOpen(false);
                }}
              >
                Toggle compact density
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Filters">
              <CommandItem
                value="clear filters reset"
                icon={<RiFilterOffLine />}
                onSelect={() => {
                  setGlobalFilter("");
                  setOpen(false);
                  toast.info("Filters cleared");
                }}
              >
                Clear every filter
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Selection">
              <CommandItem
                value="add selection to comparison"
                icon={<RiAddLine />}
                disabled={Object.keys(rowSelection).length === 0}
                onSelect={() => {
                  toast.success("Added to comparison", {
                    description: `${Object.keys(rowSelection).length} runs`,
                  });
                  setOpen(false);
                }}
              >
                {tcs("Add selection to comparison")}</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandMenu>
    </DocPage>
  );
}
