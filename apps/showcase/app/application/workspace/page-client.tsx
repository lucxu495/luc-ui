"use client";

import { useState, type ReactNode } from "react";
import {
  Badge,
  Button,
  Card,
  Code,
  DataTable,
  DataTableToolbar,
  FacetFilter,
  InspectorPane,
  InspectorRow,
  InspectorSection,
  InspectorToggle,
  Section,
  Text,
  Workspace,
  WorkspaceGroup,
  WorkspacePane,
  WorkspacePaneBody,
  WorkspacePaneFooter,
  WorkspacePaneHeader,
  WorkspaceResizeHandle,
} from "@luc/ui";
import { RiDatabase2Line, RiLineChartLine, RiTableLine } from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { EntryFooter } from "@/components/docs/entry-footer";
import { Example } from "@/components/docs/example";
import { ImportLine } from "@/components/docs/family-imports";
import { runColumns } from "@/components/tables/run-columns";
import { researchRuns, type ResearchRun } from "@/lib/table-data";
import { useI18n } from "@/lib/i18n/provider";

const RUNS = researchRuns(48);
const COLUMNS = runColumns();

/**
 * Workspace.
 *
 * A structured resizable layout for data-heavy screens: panes in JSX, sizes in
 * local storage, an inspector that collapses to nothing without unmounting.
 * The engine (`react-resizable-panels`) supplies dragging, keyboard resizing,
 * constraints and accessibility; LUC supplies the frame, the handle and the
 * fallbacks.
 */
export function WorkspacePage({ apiSection }: { apiSection?: ReactNode }) {
  const { tcs } = useI18n();
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(RUNS[0]?.id ?? null);
  const selected = RUNS.find((run) => run.id === selectedId) ?? null;

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Application")}
        title="Workspace"
        lead="Resizable panes, a focus mode, an inspector and a local layout that survives a reload. Not a drag-and-drop dashboard: the layout is the component tree, so a pane cannot be moved somewhere the code does not describe."
      />

      <ImportLine line={'import {\n  InspectorPane,\n  InspectorRow,\n  InspectorSection,\n  InspectorToggle,\n  Workspace,\n  WorkspaceGroup,\n  WorkspacePane,\n  WorkspacePaneBody,\n  WorkspacePaneFooter,\n  WorkspacePaneHeader,\n  WorkspaceResizeHandle,\n} from "@luc/ui/workspace";'} />

      {/*
        * The specimen is the live composite and the snippet is an *excerpt* of
        * the same tree — the pane structure plus the props that carry the
        * behaviour (the persist key, the minimums, the handles' names). Labelled
        * as an excerpt rather than pretending a 30rem application fits in a
        * fenced block: the honest thing is to show the shape and say so.
        */}
      <Example
        title={tcs("Table, inspector, persistence")}
        description={tcs("Drag the divider, or focus it with Tab and resize with the arrow keys. Sizes persist under this demo's key; Reset returns to the defaults. Below 64rem the panes stack and the handles disappear.")}
        layout="stage"
        padding="none"
        stageClassName="gap-5 p-5"
        code={`/* Excerpt of the live specimen: the tree and the props that carry behaviour.
   The full table configuration (columns, toolbar, facets) is elided. */
<Workspace className="h-[30rem] overflow-hidden rounded-lg border border-line-subtle bg-surface-canvas">
  <WorkspaceGroup orientation="horizontal" persistKey="product:research" persistVersion={1}>
    <WorkspacePane id="results" minSize="20rem">
      <WorkspaceGroup orientation="vertical" persistKey="product:research-notes" persistVersion={1}>
        <WorkspacePane id="runs" minSize="12rem">
          <WorkspacePaneHeader icon={<RiTableLine />} title="Research runs" paneId="runs" showReset />
          <WorkspacePaneBody flush>
            <DataTable
              ariaLabel="Research runs"
              data={runs}
              columns={columns}
              getRowId={(row) => row.id}
              enableRowSelection="single"
              rowSelection={selectedId ? { [selectedId]: true } : {}}
              onRowSelectionChange={…}
              onRowClick={(row) => { setSelectedId(row.id); setInspectorOpen(true); }}
            />
          </WorkspacePaneBody>
        </WorkspacePane>

        <WorkspaceResizeHandle label="Resize notes" />

        <WorkspacePane id="notes" minSize="8rem" defaultSize="30%">…</WorkspacePane>
      </WorkspaceGroup>
    </WorkspacePane>

    <WorkspaceResizeHandle label="Resize inspector" />

    <InspectorPane
      id="inspector"
      open={inspectorOpen}
      onOpenChange={setInspectorOpen}
      minSize="16rem"
      defaultSize="20rem"
    >…</InspectorPane>
  </WorkspaceGroup>
</Workspace>`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge size="sm" tone="neutral">
              {tcs("three panes")}
            </Badge>
            <Badge size="sm" tone="neutral">
              {tcs("nested split")}
            </Badge>
          </div>
          <InspectorToggle open={inspectorOpen} onOpenChange={setInspectorOpen} />
        </div>

        <Workspace className="h-[30rem] overflow-hidden rounded-lg border border-line-subtle bg-surface-canvas">
          <WorkspaceGroup
            orientation="horizontal"
            persistKey="showcase:workspace-demo"
            persistVersion={1}
          >
            <WorkspacePane id="results" minSize="20rem">
              <WorkspaceGroup orientation="vertical" persistKey="showcase:workspace-demo-inner" persistVersion={1}>
                <WorkspacePane id="runs" minSize="12rem">
                  <WorkspacePaneHeader
                    icon={<RiTableLine />}
                    title={tcs("Research runs")}
                    description={tcs("{count} prepared rows").replace("{count}", String(RUNS.length))}
                    paneId="runs"
                    showReset
                  />
                  <WorkspacePaneBody flush>
                    <DataTable<ResearchRun>
                      ariaLabel={tcs("Research runs")}
                      data={RUNS}
                      columns={COLUMNS}
                      getRowId={(row) => row.id}
                      density="compact"
                      stickyHeader
                      maxHeight="100%"
                      enableRowSelection="single"
                      rowSelection={selectedId ? { [selectedId]: true } : {}}
                      onRowSelectionChange={(next) =>
                        setSelectedId(Object.keys(next).find((key) => next[key]) ?? null)
                      }
                      onRowClick={(row) => {
                        setSelectedId(row.id);
                        setInspectorOpen(true);
                      }}
                      toolbar={
                        <DataTableToolbar
                          search={{ label: tcs("Search runs") }}
                          actions={<Text variant="caption" tone="muted">{tcs("Selection is not in the URL; it is not shareable state.")}</Text>}
                        >
                          <FacetFilter columnId="status" label={tcs("Status")} />
                        </DataTableToolbar>
                      }
                    />
                  </WorkspacePaneBody>
                </WorkspacePane>

                <WorkspaceResizeHandle label={tcs("Resize notes")} />

                <WorkspacePane id="notes" minSize="8rem" defaultSize="30%">
                  <WorkspacePaneHeader
                    icon={<RiDatabase2Line />}
                    title={tcs("Notes")}
                    description={tcs("A second pane in a nested split")}
                  />
                  <WorkspacePaneBody>
                    <Text variant="caption" tone="muted">
                      {tcs("Vertical splits are ordinary groups inside a pane. A pane may hold a chart, a table, a form, an editor or another workspace — the layout engine only knows about boxes.")}</Text>
                  </WorkspacePaneBody>
                  <WorkspacePaneFooter>
                    <span>{tcs("3 fields")}</span>
                  </WorkspacePaneFooter>
                </WorkspacePane>
              </WorkspaceGroup>
            </WorkspacePane>

            <WorkspaceResizeHandle label={tcs("Resize inspector")} />

            <InspectorPane
              id="inspector"
              open={inspectorOpen}
              onOpenChange={setInspectorOpen}
              title={tcs("Inspector")}
              description={selected ? selected.symbol : tcs("Nothing selected")}
              minSize="16rem"
              defaultSize="20rem"
            >
              {selected ? (
                <InspectorSection label={tcs("Selected run")}>
                  <InspectorRow label={tcs("Symbol")} value={selected.symbol} />
                  <InspectorRow label={tcs("Strategy")} value={selected.strategy} />
                  <InspectorRow label={tcs("Status")} value={selected.status} />
                  <InspectorRow label={tcs("Sharpe")} value={selected.sharpe.toFixed(2)} numeric />
                  <InspectorRow label={tcs("Trades")} value={String(selected.trades)} numeric />
                </InspectorSection>
              ) : (
                <Text variant="caption" tone="muted">
                  {tcs("Select a row.")}
                </Text>
              )}
            </InspectorPane>
          </WorkspaceGroup>
        </Workspace>
      </Example>

      <Section
        title={tcs("Panes, handles, focus mode")}
        description={tcs("A handle is a real separator with a value, a name and arrow-key resizing; the visible line is a hairline while the hit area is wide. Focus mode expands one pane to fill its group and Escape leaves it.")}
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card variant="raised" className="flex flex-col gap-3">
            <Text variant="label">{tcs("Sizes are personal state")}</Text>
            <Text variant="caption" tone="muted">
              {tcs("A layout is stored per pane set, versioned, and validated on read: an incompatible shape is discarded rather than migrated. Sizes are never written to the URL — a shared link describes a view, not your window.")}</Text>
            <Code block>{`<WorkspaceGroup
  orientation="horizontal"
  persistKey="product:research"
  persistVersion={1}
>
  <WorkspacePane id="chart" minSize="18rem">…</WorkspacePane>
  <WorkspaceResizeHandle label="Resize inspector" />
  <InspectorPane id="inspector" open={open} onOpenChange={setOpen}>
    …
  </InspectorPane>
</WorkspaceGroup>`}</Code>
          </Card>
          <Card variant="raised" className="flex flex-col gap-3">
            <Text variant="label">{tcs("When not to use a workspace")}</Text>
            <ul className="flex flex-col gap-1.5 text-caption text-fg-secondary">
              <li>{tcs("A document: use the page and the shell.")}</li>
              <li>{tcs("Two fixed columns: use the grid primitives.")}</li>
              <li>{tcs("A phone: it stacks, so design the stacked order first.")}</li>
              <li>{tcs("Anything a reader must not resize: pass locked.")}</li>
            </ul>
            <div className="mt-auto flex items-center gap-2">
              <Button size="sm" variant="ghost" leadingIcon={<RiLineChartLine />} disabled>
                {tcs("Chart panes use the same primitives")}</Button>
            </div>
          </Card>
        </div>
      </Section>
          {apiSection}
          <EntryFooter />
    </DocPage>
  );
}
