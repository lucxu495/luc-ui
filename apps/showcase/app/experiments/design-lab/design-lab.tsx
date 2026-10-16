"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AppShellContent,
  Button,
  ChartInspectionArea,
  ChartInspectionProvider,
  DataTable,
  InspectorPane,
  InspectorRow,
  InspectorSection,
  InspectorToggle,
  LineChart,
  Text,
  Workspace,
  WorkspaceGroup,
  WorkspacePane,
  numericColumn,
  textColumn,
} from "@luc/ui";
import { observations, type Observation } from "./data";
import styles from "./design-lab.module.css";
import { useI18n } from "@/lib/i18n/provider";

export type Treatment = "precision" | "editorial" | "focused";

const treatmentCopy: Record<Treatment, { label: string; premise: string; className: string }> = {
  precision: {
    label: "Precision Instrument",
    premise: "Calibrated lines and exact feedback put the measurements first.",
    className: styles.precision!,
  },
  editorial: {
    label: "Editorial Research",
    premise: "A clear question and a readable finding lead into the evidence.",
    className: styles.editorial!,
  },
  focused: {
    label: "Focused Workspace",
    premise: "Select an observation to link its row, chart cursor and context.",
    className: styles.focused!,
  },
};

const chartSeries = [
  { key: "responseMs", label: "Observed", type: "line" as const, tone: "accent" as const, symbol: true, lineWidth: 2 },
  { key: "referenceMs", label: "Reference", type: "line" as const, tone: "neutral" as const, symbol: false, lineWidth: 1.2 },
];

export function DesignLab({ treatment }: { treatment: Treatment }) {
  const { tcs, href } = useI18n();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const selected = observations.find((item) => item.id === selectedId) ?? null;
  const copy = treatmentCopy[treatment];
  const columns = useMemo(
    () => [
      textColumn<Observation, "sample">("sample", {
        header: "Observation",
        locked: true,
        size: 190,
        cell: (value, row) => (
          <span className="inline-flex min-w-0 items-center gap-2 font-medium text-fg-primary">
            <span aria-hidden="true" className={row.id === selectedId ? styles.selectedGlyph : styles.idleGlyph}>
              {row.id === selectedId ? "▸" : "·"}
            </span>
            <span>{value}</span>
            {row.id === selectedId ? <span className={styles.selectedWord}>Selected</span> : null}
          </span>
        ),
      }),
      textColumn<Observation, "dateLabel">("dateLabel", { header: "Date", size: 90 }),
      textColumn<Observation, "channel">("channel", { header: "Channel", size: 100 }),
      numericColumn<Observation, "responseMs">("responseMs", { header: "Observed", unit: " ms", decimals: 0, size: 110 }),
    ],
    [selectedId],
  );

  const select = (item: Observation | null) => {
    setSelectedId(item?.id ?? null);
    if (item) setInspectorOpen(true);
  };

  return (
    <AppShellContent width="bleed" className="min-h-screen bg-surface-canvas">
      <div data-testid="design-lab" data-treatment={treatment} className={`${styles.lab} ${copy.className}`}>
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>{tcs("LUC UI / DESIGN LAB / 01")}</p>
            <h1 className={styles.title}>{tcs(copy.label)}</h1>
            <p className={styles.premise}>{tcs(copy.premise)}</p>
          </div>
          <div className={styles.headerActions}>
            <Link className={styles.backLink} href={href("/experiments/design-lab")}>{tcs("All treatments")}</Link>
            <InspectorToggle open={inspectorOpen} onOpenChange={setInspectorOpen} />
          </div>
        </header>

        <div className={styles.metaStrip} aria-label="Study context">
          <span>Eight prepared observations</span>
          <span>01–15 Sep 2026</span>
          <span>{tcs("Milliseconds · lower is shorter")}</span>
        </div>

        <div className={styles.story}>
          <div>
            <p className={styles.storyLabel}>Question</p>
            <h2>{tcs("Where does the response depart from its reference?")}</h2>
          </div>
          <p>{tcs("Two rises appear in the prepared sequence. Select any observation to inspect its exact value and context.")}</p>
        </div>

        <ChartInspectionProvider
          groupId={`design-lab-${treatment}`}
          isolated
          pinned={selected?.time.getTime() ?? null}
          onPinnedChange={(time) => select(observations.find((item) => item.time.getTime() === time) ?? null)}
        >
          <Workspace className={styles.workspace} density="compact">
            <WorkspaceGroup orientation="horizontal" locked>
              <WorkspacePane id="evidence" minSize="28rem" defaultSize="72%" className={styles.evidencePane}>
                <div className={styles.chartHeading}>
                  <div>
                    <p className={styles.sectionKicker}>{tcs("01 / Prepared series")}</p>
                    <h3>Response over time</h3>
                  </div>
                  <span className={styles.chartState} aria-live="polite">
                    {selected ? `Selected: ${selected.sample}, ${selected.responseMs} milliseconds` : "No observation selected"}
                  </span>
                </div>

                <div className={styles.chartFrame}>
                  <ChartInspectionArea
                    xValues={observations.map((item) => item.time.getTime())}
                    format={(time) => observations.find((item) => item.time.getTime() === time)?.sample ?? "Observation"}
                    aria-label={tcs("Response series. Use arrow keys to select an observation, Enter to toggle selection, Escape to clear.")}
                    className={styles.chartArea}
                  >
                    <LineChart<Observation>
                      data={observations}
                      xKey="time"
                      syncGroup={`design-lab-${treatment}`}
                      series={chartSeries}
                      annotations={selected ? { markers: [{ at: selected.time, label: selected.sample, tone: "accent", shape: "pin", line: true }] } : undefined}
                      axes={[{ id: "primary", format: { kind: "decimal", suffix: " ms" } }]}
                      height="100%"
                      animation="subtle"
                      ariaLabel={tcs("Observed response and reference, eight prepared observations")}
                    />
                  </ChartInspectionArea>
                  <div className={styles.chartKey} aria-hidden="true">
                    <span><i className={styles.keyObserved} /> Observed</span>
                    <span><i className={styles.keyReference} /> Reference</span>
                    {selected ? <span className={styles.keySelected}>▸ {selected.dateLabel} selected</span> : null}
                  </div>
                </div>

                <div className={styles.tableHeading}>
                  <div>
                    <p className={styles.sectionKicker}>02 / Inspection</p>
                    <h3>Observation log</h3>
                  </div>
                  {selected ? <Button size="sm" variant="ghost" onClick={() => select(null)}>Clear selection</Button> : null}
                </div>
                <p className={styles.mobileTableHint}>{tcs("Scroll the table sideways to read every column.")}</p>
                <DataTable<Observation>
                  ariaLabel={tcs("Prepared response observations")}
                  ariaDescription={tcs("Choose a row to highlight its time in the chart and show details in the inspector.")}
                  data={[...observations]}
                  columns={columns}
                  getRowId={(item) => item.id}
                  density="compact"
                  enableRowSelection="single"
                  rowSelection={selectedId ? { [selectedId]: true } : {}}
                  onRowSelectionChange={(next) => select(observations.find((item) => next[item.id]) ?? null)}
                  onRowClick={select}
                  rowClassName={(row) => row.id === selectedId ? styles.selectedRow : undefined}
                  className={styles.table}
                  footer={<Text variant="caption" tone="muted">{tcs("Prepared display values; no calculations or network requests.")}</Text>}
                />
              </WorkspacePane>

              <InspectorPane
                id="context"
                open={inspectorOpen}
                onOpenChange={setInspectorOpen}
                minSize="19rem"
                defaultSize="28%"
                title={tcs("Context")}
                description={selected ? `${selected.sample} · ${selected.dateLabel}` : "Choose an observation"}
                className={styles.inspector}
              >
                {selected ? (
                  <div className={styles.inspectorContent} data-testid="selected-detail">
                    <p className={styles.inspectorCue}>▸ SELECTED OBSERVATION</p>
                    <p className={styles.heroValue}>{selected.responseMs}<span> ms</span></p>
                    <InspectorSection label={tcs("Recorded context")}>
                      <InspectorRow label={tcs("Date")} value={selected.dateLabel} />
                      <InspectorRow label={tcs("Channel")} value={selected.channel} />
                      <InspectorRow label={tcs("Reference")} value={`${selected.referenceMs} ms`} numeric />
                    </InspectorSection>
                    <div className={styles.note}><strong>Reading note</strong><p>{selected.note}</p></div>
                  </div>
                ) : (
                  <div className={styles.emptyInspector} data-testid="empty-detail">
                    <span aria-hidden="true">↗</span>
                    <p>{tcs("Select a table row or inspect the chart with the keyboard.")}</p>
                    <small>{tcs("Row, chart cursor and context will share one selected identity.")}</small>
                  </div>
                )}
              </InspectorPane>
            </WorkspaceGroup>
          </Workspace>
        </ChartInspectionProvider>
      </div>
    </AppShellContent>
  );
}
