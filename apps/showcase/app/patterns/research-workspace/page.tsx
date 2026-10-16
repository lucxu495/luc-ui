"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useQueryStates } from "nuqs";
import {
  AppShellContent,
  Button,
  ChartInspectionProvider,
  ChartInspectionArea,
  ChartLegend,
  ChartPinButton,
  ChartPinStatus,
  ChartSyncGroup,
  ColumnVisibilityMenu,
  DataTableSelectionCount,
  DataTableToolbar,
  DataTable,
  DateRangePicker,
  FacetFilter,
  FinancialChart,
  InspectorPane,
  InspectorRow,
  InspectorSection,
  InspectorToggle,
  LineChart,
  PageHeader,
  PageHeaderMeta,
  Skeleton,
  SegmentedControl,
  SegmentedItem,
  StatusBadge,
  Text,
  Tooltip,
  Workspace,
  WorkspaceGroup,
  WorkspacePane,
  WorkspacePaneBody,
  WorkspacePaneHeader,
  WorkspaceResizeHandle,
  cn,
  dateOnlyFromInstant,
  formatDateOnly,
  formatNumber,
  toast,
  useChartInspectionContext,
} from "@luc/ui";
import {
  RiExternalLinkLine,
  RiLineChartLine,
  RiShareLine,
  RiTableLine,
} from "@remixicon/react";
import { runColumns } from "@/components/tables/run-columns";
import { candlesFrom, type MarketRow } from "@/lib/mock-data";
import type { ResearchRun } from "@/lib/table-data";
import { nuqsParser } from "@/lib/luc-nuqs";
import {
  DATASET_END,
  DEFAULT_SERIES,
  SERIES_OPTIONS,
  WINDOW_CHIPS,
  chipForWindow,
  dateOnlyFromMilliseconds,
  instantFromDateOnly,
  researchParams,
  rowAtCursor,
  rowsInWindow,
  runsInWindow,
  windowForChip,
  type ResearchView,
} from "@/lib/research-view";
import { useI18n } from "@/lib/i18n/provider";

/**
 * The flagship: one generic research workspace.
 *
 * It is a *system integration demo*, not a product. Every part is prepared by
 * this file; nothing fetches, nothing computes a metric, and nothing knows what
 * an asset is. What it proves is that the pieces compose:
 *
 *   AppShell + PageHeader + DateRangePicker + ChartSyncGroup + DataTable +
 *   Workspace panes + Inspector + CommandMenu + Toast + URL state + pinning
 *
 * State is split by the V0.5 rule: the window, the visible series, the table's
 * filter and sort, the view mode and the pinned cursor are shareable and live in
 * the URL. Pane sizes and the inspector's open state are personal and live in
 * local storage. The hovered crosshair is ephemeral and lives nowhere.
 */

export default function ResearchWorkspacePage() {
  // `useSearchParams` (through the nuqs adapter) requires a Suspense boundary
  // during a prerender: the view depends on the address bar, which the server
  // cannot read.
  return (
    <Suspense fallback={<WorkspaceFallback />}>
      <ResearchWorkspace />
    </Suspense>
  );
}

function ResearchWorkspace() {
  const { tcs } = useI18n();
  const [view, setView] = useQueryStates(
    {
      from: nuqsParser(researchParams.from.codec, researchParams.from.default),
      to: nuqsParser(researchParams.to.codec, researchParams.to.default),
      series: nuqsParser(researchParams.series.codec, DEFAULT_SERIES as string[]),
      mode: nuqsParser(researchParams.view.codec, researchParams.view.default),
      status: nuqsParser(researchParams.status.codec, researchParams.status.default),
      sort: nuqsParser(researchParams.sort.codec, researchParams.sort.default),
      q: nuqsParser(researchParams.q.codec, researchParams.q.default),
      cursor: nuqsParser(researchParams.cursor.codec, researchParams.cursor.default),
    },
    { history: "replace", shallow: true, scroll: false, clearOnDefault: true },
  );

  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(true);

  const preparedRows = useMemo(() => rowsInWindow(view), [view]);
  const candles = useMemo(() => candlesFrom(preparedRows), [preparedRows]);
  const runs = useMemo(() => runsInWindow(view), [view]);
  const columns = useMemo(() => runColumns(), []);

  const visibleSeries = useMemo(
    () => SERIES_OPTIONS.filter((option) => view.series.includes(option.id)),
    [view.series],
  );
  const seriesSpec = useMemo(
    () =>
      visibleSeries.map((option) => ({
        key: option.id,
        label: option.label,
        type: "line" as const,
        tone: option.tone,
        symbol: false,
        lineWidth: option.id === "close" ? 1.8 : 1.4,
        connectNulls: false,
      })),
    [visibleSeries],
  );

  const activeChip = chipForWindow(view.from, view.to);
  const pinnedMs = view.cursor ? instantFromDateOnly(view.cursor) : null;
  const pinnedRow = useMemo(() => rowAtCursor(view), [view]);
  const selectedRun = runs.find((run) => run.id === selectedRunId) ?? null;

  const toggleSeries = (id: string) => {
    const next = view.series.includes(id)
      ? view.series.filter((entry) => entry !== id)
      : [...view.series, id];
    // Never leave the chart with nothing to draw.
    setView({ series: next.length > 0 ? next : [id] });
  };

  const applyChip = (id: string) => {
    const chip = WINDOW_CHIPS.find((entry) => entry.id === id);
    if (!chip) return;
    const window = windowForChip(chip.id);
    // A range chip is a meaningful navigation: it earns a history entry, so
    // Back returns to the previous window. Typing in the search box does not.
    setView({ from: window.start, to: window.end, cursor: null }, { history: "push" });
  };

  const share = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("View link copied", { description: tcs("The whole window is in the URL.") });
    } catch {
      toast.info("Copy this view link", { description: url });
    }
  };

  // Escape unpins, but only when nothing higher owns Escape. The precedence is
  // stated once, here: overlay (Radix closes itself), then workspace focus, then
  // the pin.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || view.cursor === null) return;
      const overlay = document.querySelector(
        '[data-slot="command-menu"], [data-slot="sheet"], [data-slot="dialog"], [data-slot="popover"]',
      );
      if (overlay) return;
      setView({ cursor: null });
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [setView, view.cursor]);

  const columnFilters = useMemo(
    () => (view.status === "all" ? [] : [{ id: "status", value: [view.status] }]),
    [view.status],
  );

  const presets = useMemo(
    () =>
      WINDOW_CHIPS.map((chip) => ({
        id: chip.id,
        label: PRESET_LABELS[chip.id],
        range: () => windowForChip(chip.id),
      })),
    [],
  );

  return (
    <AppShellContent width="bleed" className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        density="dense"
        eyebrow={tcs("Research · Prepared series")}
        title="Momentum study — BTC-USD"
        description={tcs("A generic research view. Every number is prepared by the page; the chart draws it, the table formats it, and the URL describes it.")}
        meta={
          <>
            <PageHeaderMeta>{preparedRows.length} samples</PageHeaderMeta>
            <PageHeaderMeta>
              {formatDateOnly(view.from, { locale: "en-GB" })} → {formatDateOnly(view.to, { locale: "en-GB" })}
            </PageHeaderMeta>
            <PageHeaderMeta>
              <StatusBadge status="live" label="Prepared" size="sm" />
            </PageHeaderMeta>
            {activeChip === "custom" ? <PageHeaderMeta>Custom window</PageHeaderMeta> : null}
          </>
        }
        actions={
          <>
            <Tooltip content={tcs("Copy a link to this exact view")} side="bottom">
              <Button
                size="sm"
                variant="outline"
                leadingIcon={<RiShareLine />}
                onClick={share}
                data-testid="share-view"
              >
                Share view
              </Button>
            </Tooltip>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2 border-b border-line-subtle bg-surface-canvas px-4 py-2.5 sm:px-6">
        <DateRangePicker
          size="sm"
          months={1}
          locale="en-GB"
          todayValue={DATASET_END}
          aria-label="Visible window"
          value={{ start: view.from, end: view.to }}
          onValueChange={(range) => {
            if (!range) return;
            setView({ from: range.start, to: range.end, cursor: null });
          }}
          presets={presets}
          showTodayAction={false}
        />

        <div className="flex items-center gap-1">
          {WINDOW_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              aria-pressed={activeChip === chip.id}
              onClick={() => applyChip(chip.id)}
              className={cn(
                "luc-transition luc-focus h-control-sm rounded-sm px-2.5 text-label uppercase",
                activeChip === chip.id
                  ? "bg-surface-selected text-fg-primary"
                  : "text-fg-muted hover:bg-surface-interactive-hover hover:text-fg-primary",
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <SegmentedControl
          size="sm"
          aria-label="View mode"
          value={view.mode}
          onValueChange={(next) =>
            next && setView({ mode: next as "both" | "chart" | "table" }, { history: "push" })
          }
        >
          <SegmentedItem size="sm" value="both">
            Chart + table
          </SegmentedItem>
          <SegmentedItem size="sm" value="chart">
            Chart
          </SegmentedItem>
          <SegmentedItem size="sm" value="table">
            Table
          </SegmentedItem>
        </SegmentedControl>

        <div className="ml-auto flex items-center gap-2">
          <ChartPinStatus format={(ms) => formatDateOnly(dateOnlyFromMilliseconds(ms), { locale: "en-GB" })} />
          <InspectorToggle open={inspectorOpen} onOpenChange={setInspectorOpen} />
        </div>
      </div>

      <ChartInspectionProvider
        groupId="research-stack"
        pinned={pinnedMs}
        onPinnedChange={(ms) => setView({ cursor: ms === null ? null : dateOnlyFromMilliseconds(ms) })}
      >
        {/*
         * No `mode="panes"`.
         *
         * Forcing the desktop mode defeated the library's own responsive
         * default: below 64rem `Workspace` stacks its panes, and this page was
         * overriding that. At 390 px the two horizontal panes could not honour
         * their own minimum sizes inside the viewport, so the inspector
         * collapsed to a 24 px column whose body still overflowed — a 24 px
         * scroll container holding 76 px of content, which is both unreadable
         * and a keyboard trap. The default gives panes at ≥64rem (the same
         * design) and a stacked, full-width column below it.
         */}
        <Workspace className="min-h-0 flex-1 px-4 pb-4 sm:px-6">
          <WorkspaceGroup
            orientation="horizontal"
            persistKey="showcase:research-workspace"
            persistVersion={1}
          >
            <WorkspacePane id="stack" minSize="22rem">
              <WorkspaceGroup orientation="vertical" persistKey="showcase:research-stack" persistVersion={1}>
                {view.mode === "table" ? null : (
                  <WorkspacePane id="chart" minSize="20rem" defaultSize="62%">
                    <WorkspacePaneHeader
                      icon={<RiLineChartLine />}
                      title={tcs("Prepared series")}
                      description={tcs("Crosshair and window are shared across both engines")}
                      paneId="chart"
                      actions={
                        <>
                          <ChartLegend
                            series={SERIES_OPTIONS.map((option) => ({
                              id: option.id,
                              label: option.label,
                              tone: option.tone,
                            }))}
                            visible={view.series}
                            onToggle={toggleSeries}
                          />
                          <ChartPinButton />
                        </>
                      }
                    />
                    <WorkspacePaneBody flush>
                      <PinOnClickArea xValues={candles.map((candle) => candle.time.getTime())}>
                        <ChartSyncGroup groupId="research-stack" className="h-full gap-0">
                          <div className="min-h-0 flex-1 basis-0">
                            <FinancialChart
                              candles={candles}
                              mode="candlestick"
                              syncGroup="research-stack"
                              priceFormat={{ kind: "currency", currency: "USD", decimals: 0 }}
                              height="100%"
                              ariaLabel="Prepared price series"
                            />
                          </div>
                          <div className="min-h-0 flex-1 basis-0 border-t border-line-subtle">
                            <LineChart
                              data={preparedRows}
                              xKey="time"
                              syncGroup="research-stack"
                              axes={[{ id: "primary", format: { kind: "currency", currency: "USD", decimals: 0 } }]}
                              series={seriesSpec}
                              interaction={{ zoom: "inside" }}
                              height="100%"
                              ariaLabel="Selected prepared series"
                            />
                          </div>
                        </ChartSyncGroup>
                      </PinOnClickArea>
                    </WorkspacePaneBody>
                  </WorkspacePane>
                )}

                {view.mode === "both" ? <WorkspaceResizeHandle label={tcs("Resize chart and table")} /> : null}

                {view.mode === "chart" ? null : (
                  <WorkspacePane id="table" minSize="16rem" defaultSize="42%">
                    <WorkspacePaneHeader
                      icon={<RiTableLine />}
                      title={tcs("Research runs")}
                      description={`${runs.length} in the window`}
                      paneId="table"
                      showReset
                    />
                    <WorkspacePaneBody flush>
                      <DataTable<ResearchRun>
                        ariaLabel={tcs("Research runs in the selected window")}
                        ariaDescription={tcs("Prepared rows. The table formats, filters and sorts; it never computes.")}
                        data={runs}
                        columns={columns}
                        getRowId={(row) => row.id}
                        density="compact"
                        stickyHeader
                        maxHeight="100%"
                        enableRowSelection="single"
                        rowSelection={selectedRunId ? { [selectedRunId]: true } : {}}
                        onRowSelectionChange={(next) =>
                          setSelectedRunId(Object.keys(next).find((key) => next[key]) ?? null)
                        }
                        sorting={view.sort}
                        onSortingChange={(next) => setView({ sort: next })}
                        globalFilter={view.q}
                        onGlobalFilterChange={(value) => setView({ q: value })}
                        columnFilters={columnFilters}
                        onColumnFiltersChange={(next) => {
                          const status = next.find((filter) => filter.id === "status")?.value;
                          const first = Array.isArray(status) ? (status[0] as string | undefined) : undefined;
                          setView({ status: (first ?? "all") as ResearchView["status"] });
                        }}
                        onRowClick={(row) => {
                          setSelectedRunId(row.id);
                          setInspectorOpen(true);
                        }}
                        toolbar={<RunToolbar />}
                        footer={<Text variant="caption" tone="muted">{tcs("Sorting, the status facet and the search box are all in the URL.")}</Text>}
                      />
                    </WorkspacePaneBody>
                  </WorkspacePane>
                )}
              </WorkspaceGroup>
            </WorkspacePane>

            <WorkspaceResizeHandle label="Resize inspector" />

            <InspectorPane
              id="inspector"
              open={inspectorOpen}
              onOpenChange={setInspectorOpen}
              title={tcs("Inspector")}
              description={pinnedRow ? "Pinned timestamp" : selectedRun ? "Selected run" : "Nothing selected"}
              minSize="17rem"
              defaultSize="22rem"
            >
              <InspectorBody pinnedRow={pinnedRow} selectedRun={selectedRun} />
            </InspectorPane>
          </WorkspaceGroup>
        </Workspace>
      </ChartInspectionProvider>
    </AppShellContent>
  );
}

const PRESET_LABELS: Record<(typeof WINDOW_CHIPS)[number]["id"], string> = {
  "3m": "Last 3 months",
  "6m": "Last 6 months",
  "1y": "Last year",
  "2y": "Last 2 years",
};

/** Shown while the client resolves the address bar. Shape, not a spinner. */
function WorkspaceFallback() {
  return (
    <AppShellContent width="bleed" className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-6">
      <Skeleton variant="text" className="h-6 w-64" />
      <Skeleton variant="text" className="w-96" />
      <div className="flex min-h-0 flex-1 gap-3">
        <Skeleton className="min-h-0 flex-1" />
        <Skeleton className="w-72 shrink-0" />
      </div>
    </AppShellContent>
  );
}

/**
 * Click anywhere in the plot area to pin the current crosshair. The pin is
 * published to the sync group, so both engines hold the same timestamp.
 */
function PinOnClickArea({ xValues, children }: { xValues: readonly number[]; children: React.ReactNode }) {
  const inspection = useChartInspectionContext();
  return (
    <ChartInspectionArea
      data-testid="pin-area"
      xValues={xValues}
      format={(ms) => formatDateOnly(dateOnlyFromMilliseconds(ms), { locale: "en-GB" })}
      className="h-full min-h-0 cursor-crosshair"
      onClick={() => inspection?.pin()}
    >
      {children}
    </ChartInspectionArea>
  );
}

function RunToolbar() {
  return (
    <DataTableToolbar
      search={{ label: "Search runs", placeholder: "Search runs…" }}
      actions={
        <>
          <ColumnVisibilityMenu />
          <DataTableSelectionCount label="selected" />
        </>
      }
    >
      <FacetFilter columnId="status" label="Status" />
    </DataTableToolbar>
  );
}

function InspectorBody({
  pinnedRow,
  selectedRun,
}: {
  pinnedRow: MarketRow | undefined;
  selectedRun: ResearchRun | null;
}) {
  const { tcs, href } = useI18n();
  if (!pinnedRow && !selectedRun) {
    return (
      <div className="flex flex-col gap-2">
        <Text variant="caption" tone="muted">
          {tcs("Click the chart to pin a timestamp, or focus the plot and step it with the arrow keys (Enter pins, Escape clears). Selecting a row in the table does the same thing. All three write shareable state.")}</Text>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-5">
      {pinnedRow ? (
        <InspectorSection label={tcs("Pinned sample")}>
          <InspectorRow
            label={tcs("Date")}
            value={formatDateOnly(dateOnlyFromInstant(pinnedRow.time, "UTC"), { locale: "en-GB" })}
          />
          <InspectorRow label={tcs("Close")} value={formatNumber(pinnedRow.close, { kind: "currency" })} numeric />
          <InspectorRow
            label={tcs("SMA 50")}
            value={formatNumber(pinnedRow.sma50, { kind: "currency" })}
            numeric
          />
          <InspectorRow
            label={tcs("SMA 200")}
            value={formatNumber(pinnedRow.sma200, { kind: "currency" })}
            numeric
          />
          <InspectorRow label={tcs("RV 30d")} value={formatNumber(pinnedRow.rv30, { kind: "percent" })} numeric />
          <InspectorRow label={tcs("Funding")} value={formatNumber(pinnedRow.funding, { kind: "percent" })} numeric />
          <InspectorRow
            label={tcs("Drawdown")}
            value={formatNumber(pinnedRow.drawdown, { kind: "percent" })}
            numeric
          />
        </InspectorSection>
      ) : null}

      {selectedRun ? (
        <InspectorSection label={tcs("Selected run")}>
          <InspectorRow label={tcs("Symbol")} value={selectedRun.symbol} />
          <InspectorRow label={tcs("Strategy")} value={selectedRun.strategy} />
          <InspectorRow label={tcs("Status")} value={selectedRun.status} />
          <InspectorRow label={tcs("Regime")} value={selectedRun.regime} />
          <InspectorRow label={tcs("Sharpe")} value={selectedRun.sharpe.toFixed(2)} numeric />
          <InspectorRow label={tcs("CAGR")} value={formatNumber(selectedRun.cagr, { kind: "percent" })} numeric />
          <InspectorRow label={tcs("Trades")} value={formatNumber(selectedRun.trades)} numeric />
          <Link
            href={href(`/data/table?q=${encodeURIComponent(selectedRun.symbol)}`)}
            className="luc-focus inline-flex items-center gap-1.5 text-caption text-fg-accent hover:underline"
          >
            {tcs("Open in the data table")}<RiExternalLinkLine aria-hidden="true" className="size-3.5" />
          </Link>
        </InspectorSection>
      ) : null}

      {!selectedRun ? (
        <Text variant="caption" tone="muted">
          {tcs("Select a run in the table to see its prepared metrics.")}</Text>
      ) : null}
    </div>
  );
}
