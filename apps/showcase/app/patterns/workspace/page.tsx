"use client";

import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  ChartCard,
  ChartHeader,
  ChartLegend,
  ChartPlot,
  Code,
  Combobox,
  DataTable,
  DataTablePagination,
  DataTableToolbar,
  Field,
  Input,
  LineChart,
  Panel,
  Section,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  StatCard,
  Switch,
  Text,
  toast,
  type ComboboxOption,
} from "@luc/ui";
import { RiSettings3Line, RiSparklingLine } from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { Demo } from "@/components/docs/demo";
import { runColumns } from "@/components/tables/run-columns";
import { instruments, researchRuns, type ResearchRun } from "@/lib/table-data";
import { marketSeries } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n/provider";

const RUNS = researchRuns(24);
const MARKET = marketSeries({ days: 200 });

const ASSET_OPTIONS: ComboboxOption[] = instruments.map((item) => ({
  value: item.value,
  label: item.label,
  description: item.description,
  group: item.group,
  disabled: item.disabled,
}));

const SERIES = [
  { id: "close", label: "Close", tone: "accent" as const },
  { id: "sma50", label: "SMA 50", tone: "info" as const },
  { id: "sma200", label: "SMA 200", tone: "warning" as const },
];

/**
 * The cross-component composition.
 *
 * Everything in V0.3 in one small, generic screen: a Sheet for settings, Select
 * and Combobox in the controls, a DataTable, a chart, and toasts for feedback.
 * There is no product logic here on purpose — the point is that the parts
 * belong to one system.
 */
export default function WorkspacePatternPage() {
  const { tcs } = useI18n();
  const columns = useMemo(() => runColumns(), []);
  const [asset, setAsset] = useState<ComboboxOption | null>(ASSET_OPTIONS[0] ?? null);
  const [range, setRange] = useState("6m");
  const [visible, setVisible] = useState<string[]>(["close", "sma50", "sma200"]);
  const [thresholds, setThresholds] = useState(true);

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Patterns · Workspace")}
        title="Research workspace"
        lead="A generic composition: settings in a Sheet, controls in a toolbar, a chart above a table, feedback through toasts. No product logic and no Luc Quant navigation — just the V0.3 components working as one system."
      />

      <Section
        title={tcs("One screen, six components")}
        description={tcs("The Sheet, Select and Combobox configure the view; the chart and the table read the same prepared data; the toast confirms an action.")}
      >
        <Demo bare>
          <div className="flex flex-col gap-4">
            <Panel className="flex flex-wrap items-center gap-3 p-4">
              <div className="w-[15rem]">
                <Combobox
                  options={ASSET_OPTIONS}
                  aria-label="Instrument"
                  placeholder="Choose an instrument"
                  size="sm"
                  value={asset}
                  onValueChange={setAsset}
                />
              </div>
              <Select value={range} onValueChange={setRange}>
                <SelectTrigger size="sm" aria-label="Range" className="w-[9rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent size="sm">
                  <SelectItem value="1m">Last month</SelectItem>
                  <SelectItem value="3m">Last quarter</SelectItem>
                  <SelectItem value="6m">Last 6 months</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Badge tone="info" size="sm">
                {asset?.value ?? "No instrument"}
              </Badge>
              <div className="ml-auto flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  leadingIcon={<RiSparklingLine />}
                  onClick={() =>
                    toast.success("Study queued", {
                      description: `${asset?.label ?? "Instrument"} · ${range}`,
                    })
                  }
                >
                  Queue study
                </Button>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button size="sm" variant="ghost" leadingIcon={<RiSettings3Line />}>
                      Settings
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" size="md">
                    <SheetHeader icon={<RiSettings3Line />}>
                      <SheetTitle>Workspace settings</SheetTitle>
                    </SheetHeader>
                    <SheetBody className="flex flex-col gap-5">
                      <Field label={tcs("Study name")} description={tcs("Shown in the run list below.")}>
                        <Input defaultValue="Momentum sweep" />
                      </Field>
                      <Field label={tcs("Benchmark")}>
                        <Select defaultValue="spx">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="spx">S&amp;P 500</SelectItem>
                            <SelectItem value="btc">Bitcoin</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Switch
                        checked={thresholds}
                        onCheckedChange={setThresholds}
                        label={tcs("Show threshold bands")}
                        description={tcs("Reference levels drawn behind the series.")}
                      />
                      <Separator />
                      <Text variant="caption" tone="muted">
                        {tcs("The Sheet is the same component used on the Sheet page: header, scrolling body and sticky footer.")}</Text>
                    </SheetBody>
                    <SheetFooter>
                      <Button variant="ghost">Cancel</Button>
                      <Button
                        onClick={() =>
                          toast.success("Settings applied", { description: "The workspace re-rendered." })
                        }
                      >
                        Apply
                      </Button>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </div>
            </Panel>

            <ChartCard height={280}>
              <ChartHeader
                title={asset?.label ?? "Instrument"}
                description={`Apache ECharts · ${range} window · prepared overlays supplied by the caller`}
              />
              <ChartPlot className="px-1.5 pt-2 pb-1">
                <LineChart
                  data={MARKET}
                  xKey="time"
                  height="100%"
                  visibleSeries={visible}
                  ariaLabel={`${asset?.label ?? "Instrument"} price with moving averages`}
                  axes={[{ id: "primary", format: { kind: "currency", currency: "USD" } }]}
                  annotations={{
                    referenceLines: thresholds ? [{ value: 100_000, tone: "neutral", label: "100k" }] : undefined,
                  }}
                  series={[
                    { key: "close", label: "Close", type: "line", tone: "accent", symbol: false },
                    { key: "sma50", label: "SMA 50", type: "line", tone: "info", symbol: false, lineWidth: 1.5 },
                    { key: "sma200", label: "SMA 200", type: "line", tone: "warning", symbol: false, lineWidth: 1.5 },
                  ]}
                />
              </ChartPlot>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-subtle px-4 py-3">
                <ChartLegend
                  series={SERIES}
                  visible={visible}
                  onToggle={(id) =>
                    setVisible((current) =>
                      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
                    )
                  }
                />
                <Text variant="caption" tone="muted">
                  {tcs("Legend toggles drive the chart through LUC state, not the engine.")}</Text>
              </div>
            </ChartCard>

            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Runs" value={RUNS.length} footer="Prepared rows" />
              <StatCard
                label="Best Sharpe"
                value={Math.max(...RUNS.map((row) => row.sharpe))}
                maximumFractionDigits={2}
              />
              <StatCard label="Median trades" value={RUNS.map((row) => row.trades).sort((a, b) => a - b)[12] ?? 0} />
            </div>

            <DataTable<ResearchRun>
              ariaLabel={tcs("Workspace runs")}
              columns={columns}
              data={RUNS}
              getRowId={(row) => row.id}
              stickyHeader
              maxHeight={420}
              pageSize={8}
              defaultSorting={[{ id: "sharpe", desc: true }]}
              defaultColumnVisibility={{ regime: false, maxDrawdown: false, trades: false, exposure: false }}
              toolbar={<DataTableToolbar search={{ label: "Search runs", placeholder: "Search runs…" }} />}
              footer={<DataTablePagination rowLabel="runs" pageSizeOptions={[8, 16, 24]} />}
            />
          </div>
        </Demo>
      </Section>

      <Section title={tcs("Why this is the pattern, not a product")} description={tcs("Everything here is generic.")}>
        <Panel className="flex flex-col gap-3 p-5">
          <ul className="flex flex-col gap-2 text-caption text-fg-muted">
            <li>{tcs("No route in this composition belongs to a product.")}</li>
            <li>{tcs("The chart reads prepared values; no metric is computed in a component.")}</li>
            <li>{tcs("The table and the chart share no state beyond the visible-series list.")}</li>
            <li>{tcs("Every feedback path is a toast, not a bespoke banner.")}</li>
          </ul>
          <Code block>{`<Sheet>...</Sheet>          {/* settings */}
<Select/> <Combobox/>      {/* known vs searchable */}
<LineChart/>                {/* prepared series */}
<DataTable/>                {/* prepared rows */}
toast.success(...)          {/* one feedback language */}`}</Code>
        </Panel>
      </Section>
    </DocPage>
  );
}
