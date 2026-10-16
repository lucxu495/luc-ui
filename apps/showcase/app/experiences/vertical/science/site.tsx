"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  ContourChart,
  DataTable,
  HistogramChart,
  ScatterRegressionChart,
  SegmentedControl,
  SegmentedItem,
  Slider,
  type DataTableColumn,
  numericColumn,
  textColumn,
} from "@luc/ui";
import { useI18n } from "@/lib/i18n/provider";

// Bench — a measurement instrument.
//
// The rule this page exists to demonstrate: the library renders supplied data
// and never estimates it. The sliders move a *display* parameter — the bin
// count, the contour level count, the marker size — and the page recomputes the
// histogram from the samples it was given, which is arithmetic a demo is allowed
// to do. What the charts receive is always a finished array of numbers.
//
// Everything is deterministic: the sample is a fixed pseudo-random walk seeded
// from a constant, so two reviewers see the same figure.

function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648;
    return state / 2_147_483_648;
  };
}

const SAMPLES = (() => {
  const random = seeded(41);
  return Array.from({ length: 420 }, () => {
    const a = random();
    const b = random();
    return { x: 40 + a * 22, y: 0.6 * a * 22 + b * 6, group: a > 0.55 ? "treated" : "control" };
  });
})();

// The sampled surface, and the iso lines drawn on it.
//
// Both are prepared here because `Bench` *is* the analysis layer for this page:
// the library draws the rings at the level it is told and prints that level on
// the line. For the saddle z = x^2 - y^2 the level sets are hyperbolas, so they
// can be written down exactly rather than traced.
const SURFACE = (() => {
  const rows: Array<{ x: number; y: number; z: number }> = [];
  for (let i = 0; i < 41; i += 1) {
    for (let j = 0; j < 41; j += 1) {
      const x = (i / 40) * 4 - 2;
      const y = (j / 40) * 4 - 2;
      rows.push({
        x: Number(x.toFixed(3)),
        y: Number(y.toFixed(3)),
        z: Number((x * x - y * y).toFixed(3)),
      });
    }
  }
  return rows;
})();

const CONTOUR_LEVELS = [-3, -1.5, 0, 1.5, 3].map((level) => {
  const points: Array<[number, number]> = [];
  if (level === 0) {
    for (let t = -2; t <= 2.0001; t += 0.1) points.push([Number(t.toFixed(3)), Number(t.toFixed(3))]);
    for (let t = -2; t <= 2.0001; t += 0.1) points.push([Number(t.toFixed(3)), Number((-t).toFixed(3))]);
  } else if (level > 0) {
    for (let y = -2; y <= 2.0001; y += 0.08) points.push([Number(Math.sqrt(level + y * y).toFixed(3)), Number(y.toFixed(3))]);
    for (let y = 2; y >= -2.0001; y -= 0.08) points.push([Number((-Math.sqrt(level + y * y)).toFixed(3)), Number(y.toFixed(3))]);
  } else {
    for (let x = -2; x <= 2.0001; x += 0.08) points.push([Number(x.toFixed(3)), Number(Math.sqrt(x * x - level).toFixed(3))]);
    for (let x = 2; x >= -2.0001; x -= 0.08) points.push([Number(x.toFixed(3)), Number((-Math.sqrt(x * x - level)).toFixed(3))]);
  }
  // Two branches per hyperbola, so each level carries two rings.
  const half = Math.round(points.length / 2);
  return { level, rings: [points.slice(0, half), points.slice(half)] };
});

function bin(values: number[], count: number) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const width = (max - min) / count;
  const bins = Array.from({ length: count }, (_, index) => ({
    from: Number((min + index * width).toFixed(2)),
    to: Number((min + (index + 1) * width).toFixed(2)),
    count: 0,
  }));
  for (const value of values) {
    const index = Math.min(count - 1, Math.floor((value - min) / width));
    bins[index]!.count += 1;
  }
  return bins;
}

function leastSquares(points: ReadonlyArray<{ x: number; y: number }>) {
  const n = points.length;
  const meanX = points.reduce((sum, row) => sum + row.x, 0) / n;
  const meanY = points.reduce((sum, row) => sum + row.y, 0) / n;
  const covariance = points.reduce((sum, row) => sum + (row.x - meanX) * (row.y - meanY), 0);
  const variance = points.reduce((sum, row) => sum + (row.x - meanX) ** 2, 0);
  const slope = covariance / variance;
  return { slope, intercept: meanY - slope * meanX };
}

export function ResearchBench() {
  const { tcs } = useI18n();
  const [bins, setBins] = useState(24);
  const [level, setLevel] = useState(3);
  const [view, setView] = useState("density");

  const histogram = useMemo(() => bin(SAMPLES.map((row) => row.x), bins), [bins]);

  const columns = useMemo<Array<DataTableColumn<(typeof SAMPLES)[number]>>>(
    () => [
      textColumn<(typeof SAMPLES)[number], "group">("group", { header: tcs("Cohort"), locked: true }),
      numericColumn<(typeof SAMPLES)[number], "x">("x", { header: tcs("Magnitude"), decimals: 2 }),
      numericColumn<(typeof SAMPLES)[number], "y">("y", { header: tcs("Response"), decimals: 2 }),
    ],
    [tcs],
  );

  return (
    <div data-slot="research-bench" className="grid gap-6 p-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="flex flex-col gap-5">
        <Card variant="default">
          <CardContent className="flex flex-col gap-5 p-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-label font-semibold text-fg-primary">{tcs("Instrument")}</h2>
              <p className="text-caption text-fg-muted text-pretty">
                {tcs(
                  "Parameters change the display only. The observations are the ones loaded, and no value is interpolated anywhere.",
                )}
              </p>
            </div>
            <label className="flex flex-col gap-2">
              <span className="flex items-center justify-between text-caption text-fg-secondary">
                {tcs("Histogram bins")}
                <span className="luc-numeric text-fg-muted">{bins}</span>
              </span>
              <Slider
                value={bins}
                min={6}
                max={48}
                step={1}
                onValueChange={setBins}
                aria-label={tcs("Histogram bins")}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="flex items-center justify-between text-caption text-fg-secondary">
                {tcs("Contour levels")}
                <span className="luc-numeric text-fg-muted">{level}</span>
              </span>
              <Slider
                value={level}
                min={1}
                max={5}
                step={1}
                onValueChange={setLevel}
                aria-label={tcs("Contour levels")}
              />
            </label>
            <SegmentedControl
              value={view}
              onValueChange={setView}
              aria-label={tcs("Figure")}
            >
              <SegmentedItem value="density">{tcs("Density")}</SegmentedItem>
              <SegmentedItem value="field">{tcs("Field")}</SegmentedItem>
              <SegmentedItem value="table">{tcs("Table")}</SegmentedItem>
            </SegmentedControl>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardContent className="flex flex-col gap-2 p-4">
            <h3 className="text-label font-semibold text-fg-primary">{tcs("Sample")}</h3>
            <dl className="grid grid-cols-2 gap-3">
              {[
                { id: "n", label: tcs("Observations"), value: String(SAMPLES.length) },
                { id: "cohorts", label: tcs("Cohorts"), value: "2" },
                {
                  id: "range",
                  label: tcs("Magnitude"),
                  value: `${Math.min(...SAMPLES.map((row) => row.x)).toFixed(1)} – ${Math.max(
                    ...SAMPLES.map((row) => row.x),
                  ).toFixed(1)}`,
                },
                { id: "missing", label: tcs("Missing"), value: "0" },
              ].map((fact) => (
                <div key={fact.id} className="flex flex-col gap-0.5">
                  <dt className="text-micro text-fg-muted">{fact.label}</dt>
                  <dd className="text-label text-fg-primary luc-numeric">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </aside>

      <div className="flex min-w-0 flex-col gap-6">
        <Card variant="default">
          <CardContent className="p-4">
            <HistogramChart
              title={tcs("Magnitude distribution")}
              description={tcs("Bins recomputed from the loaded observations")}
              ariaLabel={tcs("Histogram of the magnitude of every observation")}
              bins={histogram}
              height={280}
            />
          </CardContent>
        </Card>

        {view === "density" ? (
          <Card variant="default">
            <CardContent className="p-4">
              <ScatterRegressionChart
                title={tcs("Response against magnitude")}
                description={tcs("Two cohorts, one fitted line supplied by the caller")}
                ariaLabel={tcs("Scatter plot of response against magnitude with a fitted line")}
                points={SAMPLES.map((row) => ({ x: row.x, y: row.y }))}
                regression={leastSquares(SAMPLES)}
                height={320}
              />
            </CardContent>
          </Card>
        ) : null}

        {view === "field" ? (
          <Card variant="default">
            <CardContent className="p-4">
              <ContourChart
                title={tcs("Error surface")}
                description={tcs("A saddle, evaluated on a 40 × 40 grid before rendering")}
                ariaLabel={tcs("Contour plot of a saddle-shaped error surface")}
                levels={CONTOUR_LEVELS.slice(0, level)}
                surface={SURFACE}
                height={360}
              />
            </CardContent>
          </Card>
        ) : null}

        {view === "table" ? (
          <Card variant="default">
            <CardContent className="p-4">
              <DataTable
                ariaLabel={tcs("Every observation in the sample")}
                data={[...SAMPLES]}
                columns={columns}
                getRowId={(row, index) => `${row.group}-${index}`}
                density="compact"
                maxHeight="24rem"
                stickyHeader
              />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
