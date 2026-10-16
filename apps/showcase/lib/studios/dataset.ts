/*
 * Chart Studio data logic — pure, so it can be tested without a browser.
 *
 * The Studio exists so a reader can see what a chart does with *their* shape of
 * data, then take the code away. That puts three rules on this module:
 *
 *  1. **It never guesses a unit.** Ratio, percent, basis points and currency
 *     are different things that look identical once they are numbers, so the
 *     unit is a control the reader sets and it travels into the generated code
 *     as a `valueFormat`. The chart renders what it is given; so does the
 *     Studio.
 *  2. **It refuses rather than draws a hole.** A missing cell, an empty string,
 *     `NaN` or `Infinity` is an error with a row number, not a silent gap.
 *  3. **It is deterministic.** Fixtures are literals; nothing here reads the
 *     clock, the locale or a random seed, so the server and the client agree.
 */

export const STUDIO_FAMILIES = ["timeseries", "distribution"] as const;
export type StudioFamily = (typeof STUDIO_FAMILIES)[number];

/**
 * The value semantics a reader can declare. Each maps to a `ChartFormat` kind —
 * a *rendering* instruction, never a conversion (see `charts/core/formatters.ts`).
 */
export const STUDIO_UNITS = ["number", "integer", "percent", "ratio", "bps", "currency"] as const;
export type StudioUnit = (typeof STUDIO_UNITS)[number];

export interface TimeseriesPoint {
  time: string;
  value: number;
}

export interface DensityPoint {
  /** Position on the value axis. */
  value: number;
  /** Density at that position, in any consistent unit. */
  density: number;
}

export interface TimeseriesDataset {
  kind: "timeseries";
  label: string;
  unit: StudioUnit;
  points: readonly TimeseriesPoint[];
}

export interface DistributionDataset {
  kind: "distribution";
  label: string;
  unit: StudioUnit;
  bins: readonly DensityPoint[];
  /** A median or mean the caller already computed. Never fitted here. */
  marker?: number;
}

export type StudioDataset = TimeseriesDataset | DistributionDataset;

/** Deterministic fixtures: the same numbers on the server, the client and CI. */
export const FIXTURES: Record<StudioFamily, StudioDataset> = {
  timeseries: {
    kind: "timeseries",
    label: "Monthly close",
    unit: "number",
    points: [
      { time: "2024-01", value: 41.2 },
      { time: "2024-02", value: 43.8 },
      { time: "2024-03", value: 42.1 },
      { time: "2024-04", value: 46.4 },
      { time: "2024-05", value: 45.9 },
      { time: "2024-06", value: 49.3 },
      { time: "2024-07", value: 52.7 },
      { time: "2024-08", value: 51.4 },
      { time: "2024-09", value: 55.1 },
      { time: "2024-10", value: 58.6 },
      { time: "2024-11", value: 57.2 },
      { time: "2024-12", value: 61.9 },
    ],
  },
  distribution: {
    kind: "distribution",
    label: "Return distribution",
    unit: "ratio",
    marker: 0.0021,
    bins: [
      { value: -0.06, density: 0.4 },
      { value: -0.05, density: 0.9 },
      { value: -0.04, density: 1.8 },
      { value: -0.03, density: 3.1 },
      { value: -0.02, density: 5.2 },
      { value: -0.01, density: 7.4 },
      { value: 0, density: 8.1 },
      { value: 0.01, density: 7.2 },
      { value: 0.02, density: 4.9 },
      { value: 0.03, density: 2.7 },
      { value: 0.04, density: 1.4 },
      { value: 0.05, density: 0.7 },
      { value: 0.06, density: 0.3 },
    ],
  },
};

export type ParseFormat = "csv" | "json";

export type ParseResult =
  | { ok: true; dataset: StudioDataset }
  | { ok: false; error: string };

function finite(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function cells(line: string): string[] {
  return line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
}

/**
 * Parse a pasted dataset into the shape the Studio draws.
 *
 * The two accepted shapes are deliberately the two the library accepts: a
 * time series (`time,value`) and a supplied density (`value,density`). Anything
 * else is refused with the reason, because a chart drawn from a mis-read column
 * is worse than no chart.
 */
export function parseDataset(input: string, kind: StudioFamily, unit: StudioUnit): ParseResult {
  const text = input.trim();
  if (text === "") return { ok: false, error: "Paste a dataset first." };
  const format: ParseFormat = text.startsWith("[") || text.startsWith("{") ? "json" : "csv";

  if (format === "json") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { ok: false, error: "That is not valid JSON." };
    }
    if (!Array.isArray(parsed)) return { ok: false, error: "JSON must be an array of objects." };
    return fromRecords(parsed as Record<string, unknown>[], kind, unit);
  }

  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length < 2) return { ok: false, error: "CSV needs a header row and at least one row of data." };
  const header = cells(lines[0] ?? "").map((cell) => cell.toLowerCase());
  const rows = lines.slice(1).map((line) => cells(line));
  const records = rows.map((row, index) => {
    const record: Record<string, unknown> = {};
    header.forEach((key, column) => {
      record[key] = row[column];
    });
    /* Row numbers are 1-based and count the header, so they match a spreadsheet. */
    record.__row = index + 2;
    return record;
  });
  return fromRecords(records, kind, unit, header);
}

function fromRecords(
  records: readonly Record<string, unknown>[],
  kind: StudioFamily,
  unit: StudioUnit,
  header?: readonly string[],
): ParseResult {
  if (records.length === 0) return { ok: false, error: "The dataset is empty." };

  if (kind === "timeseries") {
    const timeKey = header?.includes("time") ? "time" : "time";
    const valueKey = header?.includes("value") ? "value" : "value";
    const points: TimeseriesPoint[] = [];
    for (const record of records) {
      const where = typeof record.__row === "number" ? `row ${record.__row}` : "entry";
      const rawTime = record[timeKey];
      if (rawTime === undefined || String(rawTime).trim() === "") {
        return { ok: false, error: `Missing \`time\` at ${where}.` };
      }
      const value = finite(record[valueKey]);
      if (value === null) {
        return {
          ok: false,
          error: `\`value\` at ${where} is not a finite number — the chart will not draw a hole for it.`,
        };
      }
      points.push({ time: String(rawTime), value });
    }
    return { ok: true, dataset: { kind, label: "Pasted data", unit, points } };
  }

  const bins: DensityPoint[] = [];
  for (const record of records) {
    const where = typeof record.__row === "number" ? `row ${record.__row}` : "entry";
    const value = finite(record.value);
    const density = finite(record.density);
    if (value === null || density === null) {
      return {
        ok: false,
        error: `No finite \`value\`/\`density\` at ${where} — a distribution chart draws a supplied outline, it does not fit one.`,
      };
    }
    bins.push({ value, density });
  }
  return { ok: true, dataset: { kind, label: "Pasted data", unit, bins } };
}

/** Rows for the cartesian family: one object per point, keyed as the series expect. */
export function timeseriesRows(dataset: TimeseriesDataset): Array<{ time: string; value: number }> {
  return dataset.points.map((point) => ({ time: point.time, value: point.value }));
}

/** One group for the distribution family, from the supplied outline. */
export function distributionGroups(dataset: DistributionDataset): Array<{
  label: string;
  bins: readonly DensityPoint[];
  marker?: { value: number };
}> {
  return [
    {
      label: dataset.label,
      bins: dataset.bins,
      ...(typeof dataset.marker === "number" ? { marker: { value: dataset.marker } } : {}),
    },
  ];
}

export interface ChartOptions {
  height: number;
  /** `lineWidth` is the only mark styling this Studio exposes. */
  lineWidth: number;
  smooth: boolean;
}

/**
 * The snippet a reader copies.
 *
 * It is generated from the state on screen — the same dataset, unit and options
 * the preview was drawn from — so the code and the picture cannot disagree.
 */
export function chartSnippet(
  dataset: StudioDataset,
  options: ChartOptions,
  component: "LineChart" | "ViolinChart",
): string {
  const format = `{ kind: "${dataset.unit}" }`;
  if (dataset.kind === "timeseries") {
    return [
      `const rows = [`,
      ...dataset.points.map((point) => `  { time: "${point.time}", value: ${point.value} },`),
      `];`,
      ``,
      FAMILY_IMPORT.timeseries,
      ``,
      `<${component}`,
      `  data={rows}`,
      `  xKey="time"`,
      `  series={[{ key: "value", label: "${dataset.label}", type: "line", tone: "accent", lineWidth: ${options.lineWidth}${options.smooth ? `, smooth: true` : ``} }]}`,
      `  axes={[{ id: "primary", format: ${format} }]}`,
      `  height={${options.height}}`,
      `  ariaLabel="${dataset.label}"`,
      `/>`,
    ].join("\n");
  }
  return [
    `const groups = [`,
    `  {`,
    `    label: "${dataset.label}",`,
    `    bins: [`,
    ...dataset.bins.map((bin) => `      { value: ${bin.value}, density: ${bin.density} },`),
    `    ],`,
    ...(typeof dataset.marker === "number" ? [`    marker: { value: ${dataset.marker} },`] : []),
    `  },`,
    `];`,
    ``,
    FAMILY_IMPORT.distribution,
    ``,
    `<${component} groups={groups} valueFormat={${format}} height={${options.height}} ariaLabel="${dataset.label}" />`,
  ].join("\n");
}

/** Which chart documents which family. One family, one component — no menu of alternatives. */
export const FAMILY_COMPONENT: Record<StudioFamily, "LineChart" | "ViolinChart"> = {
  timeseries: "LineChart",
  distribution: "ViolinChart",
};

export const FAMILY_IMPORT: Record<StudioFamily, string> = {
  timeseries: `import { LineChart } from "@luc/ui/charts";`,
  distribution: `import { ViolinChart } from "@luc/ui/charts";`,
};
