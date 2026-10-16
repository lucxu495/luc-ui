"use client";

import { useState } from "react";
import {
  CalendarHeatmap,
  Code,
  CorrelationMatrix,
  HeatmapChart,
  Section,
  SegmentedControl,
  SegmentedItem,
  type MatrixLabelMode,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ChartPanel } from "@/components/charts/chart-panel";
import { ASSET_LABELS, calendarData, correlationMatrix, heatmapGrid } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n/provider";

const GRID = heatmapGrid();
const CORRELATION = correlationMatrix(ASSET_LABELS);
const SMALL = correlationMatrix(["BTC", "ETH", "GOLD", "SPX"], 7);
const DENSE = correlationMatrix(
  Array.from({ length: 20 }, (_, index) => `S${String(index + 1).padStart(2, "0")}`),
  99,
);
const YEAR = 2026;
const CALENDAR = calendarData(YEAR);

export default function MatrixPage() {
  const { tcs } = useI18n();
  const [denseMode, setDenseMode] = useState<MatrixLabelMode>("auto");

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Charts · Matrix")}
        title="Heatmap, correlation, calendar"
        lead="Matrices are the densest charts in the system and the fastest to ruin. Cells stay square-ish, labels truncate rather than rotate into each other, and every matrix carries a legend that says what the colour means."
      />

      <Section
        title={tcs("Categorical matrix")}
        description={tcs("Sequential intensity, generous cell separation and a bottom legend.")}
      >
        <ChartPanel
          title={tcs("Session intensity by weekday")}
          description={tcs("Values prepared per cell; empty cells stay empty.")}
          height={330}
          render={({ height }) => (
            <HeatmapChart
              xLabels={GRID.xLabels}
              yLabels={GRID.yLabels}
              values={GRID.values}
              min={GRID.min}
              max={GRID.max}
              format={{ kind: "decimal", decimals: 2 }}
              showCellValues
              height={height}
              ariaLabel={tcs("Heatmap of session intensity by weekday")}
            />
          )}
        />
      </Section>

      <Section
        title={tcs("Correlation matrix")}
        description={tcs("Diverging palette anchored at zero, symmetric grid, and a coefficient in every cell the reader can actually read. Ink is chosen per cell from the colour underneath it.")}
      >
        <ChartPanel
          title={tcs("Asset correlation")}
          description={tcs("Ten assets. Past twelve labels the matrix rotates and truncates instead of overlapping.")}
          height={420}
          render={({ height }) => (
            <CorrelationMatrix
              labels={CORRELATION.labels}
              values={CORRELATION.values}
              height={height}
              ariaLabel={tcs("Correlation matrix across ten assets")}
            />
          )}
        />
      </Section>

      <Section
        title={tcs("Small matrix")}
        description={tcs("Four series in a wide card: the cells are huge, so every coefficient including the diagonal is printed in full.")}
      >
        <ChartPanel
          title={tcs("Cross-asset correlation")}
          description={tcs("A 4×4 matrix at the same card width as the ten-asset case.")}
          height={300}
          render={({ height }) => (
            <CorrelationMatrix
              labels={SMALL.labels}
              values={SMALL.values}
              height={height}
              ariaLabel={tcs("Correlation matrix across four assets")}
            />
          )}
        />
      </Section>

      <Section
        title={tcs("Label policy")}
        description={tcs("Values are a policy, not a constant. auto prints a coefficient while the cell can hold it — measured from the rendered cell, not the row count — so the same matrix gains and loses its numbers as the card is resized. Hover always carries the pair and the coefficient.")}
      >
        <div className="flex flex-col gap-3">
          <SegmentedControl
            size="sm"
            value={denseMode}
            onValueChange={(next) => next && setDenseMode(next as MatrixLabelMode)}
            aria-label="Coefficient label policy"
          >
            {(["auto", "always", "never"] as const).map((mode) => (
              <SegmentedItem size="sm" key={mode} value={mode}>
                {mode}
              </SegmentedItem>
            ))}
          </SegmentedControl>
          <div className="max-w-md">
            <ChartPanel
              title={tcs("Twenty series, narrow card")}
              description={tcs("400 cells in a 28rem column — the case auto exists for.")}
              height={420}
              render={({ height }) => (
                <CorrelationMatrix
                  labels={DENSE.labels}
                  values={DENSE.values}
                  labelMode={denseMode}
                  height={height}
                  ariaLabel={tcs("Correlation matrix across twenty series")}
                />
              )}
            />
          </div>
        </div>
      </Section>

      <Section
        title={tcs("Calendar")}
        description={tcs("One cell per day. Useful for activity and cadence, not for magnitude comparisons.")}
      >
        <ChartPanel
          title={`Daily data coverage · ${YEAR}`}
          height={300}
          render={({ height }) => (
            <CalendarHeatmap
              year={YEAR}
              data={CALENDAR}
              format={{ kind: "integer" }}
              height={height}
              ariaLabel={`Daily coverage for ${YEAR}`}
            />
          )}
        />
      </Section>

      <Section
        title={tcs("Current cell")}
        description={tcs("A period matrix has a newest cell, and a reader should not have to count columns to find it. `highlight` marks the cells a caller names as current — the fill keeps saying what the value is, the edge says where the series is now.")}
      >
        <ChartPanel
          title={tcs("Quarterly returns with the current quarter marked")}
          description={tcs("The empty cell is the quarter still running; it is marked so it cannot read as a completed historical period.")}
          height={300}
          render={({ height }) => (
            <HeatmapChart
              xLabels={["Q1", "Q2", "Q3", "Q4"]}
              yLabels={["2023", "2024", "2025", "2026"]}
              values={[
                [44, 7, -12, 57],
                [68, -12, 2, 48],
                [3, 31, 6, -10],
                [-22, -14, null, null],
              ]}
              palette="diverging"
              midpoint={0}
              robustDomain
              labelMode="auto"
              highlight={[
                [1, 3],
                [2, 3],
              ]}
              format={{ kind: "percent", decimals: 1 }}
              height={height}
              showCellValues
              ariaLabel={tcs("Quarterly returns, current quarter marked")}
            />
          )}
        />
      </Section>

      <Section title={tcs("Usage")} description={tcs("Both matrix components take prepared values, never a dataframe.")}>
        <Code block>{`<HeatmapChart xLabels={sessions} yLabels={days} values={matrix} />

// Default: coefficients appear while the cell can hold them.
<CorrelationMatrix labels={assets} values={correlations} />

// Force the policy when the answer must not depend on the viewport.
<CorrelationMatrix labels={assets} values={correlations} labelMode="never" />
<CorrelationMatrix labels={assets} values={correlations} labelMode="always" />
<CorrelationMatrix labels={assets} values={correlations} formatValue={(v) => v.toFixed(1)} />

// Sequential vs diverging: a diverging scale must be centred on zero.
<HeatmapChart min={-1} max={1} values={zScores} />`}</Code>
      </Section>
    </DocPage>
  );
}
