"use client";

/*
 * Chart Studio.
 *
 * The point of the Studio is the part a documentation page cannot show: what a
 * chart does with *your* data. So it is one dataset, two families, and a
 * generated snippet that is built from exactly the state on screen.
 *
 * Two honest limits are stated in the UI rather than hidden: the Studio exposes
 * only the props that a reader can reason about from the picture, and it draws
 * supplied values only — the library computes no statistic, so a distribution
 * arrives as a density the caller already estimated.
 */

import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Code,
  Inline,
  Panel,
  SegmentedControl,
  SegmentedItem,
  Stack,
  Text,
  Textarea,
} from "@luc/ui";
import { LineChart, ViolinChart } from "@luc/ui/charts";
import { CopyButton } from "@/components/docs/copy-button";
import { useI18n } from "@/lib/i18n/provider";
import {
  FIXTURES,
  FAMILY_COMPONENT,
  STUDIO_UNITS,
  chartSnippet,
  distributionGroups,
  parseDataset,
  timeseriesRows,
  type StudioDataset,
  type StudioFamily,
  type StudioUnit,
} from "@/lib/studios/dataset";

const HEIGHTS = [260, 320, 400] as const;

const UNIT_LABEL: Record<StudioUnit, string> = {
  number: "Number",
  integer: "Integer",
  percent: "Percent",
  ratio: "Ratio",
  bps: "Basis points",
  currency: "Currency",
};

export function ChartStudio() {
  const { tcs } = useI18n();
  const [family, setFamily] = useState<StudioFamily>("timeseries");
  const [unit, setUnit] = useState<StudioUnit>("number");
  const [height, setHeight] = useState<number>(320);
  const [pasted, setPasted] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dataset, setDataset] = useState<StudioDataset>(FIXTURES.timeseries);

  const snippet = useMemo(
    () =>
      chartSnippet(
        dataset,
        { height, lineWidth: 2, smooth: false },
        FAMILY_COMPONENT[dataset.kind],
      ),
    [dataset, height],
  );

  function chooseFamily(next: StudioFamily) {
    setFamily(next);
    setError(null);
    setDataset(FIXTURES[next]);
    setUnit(FIXTURES[next].unit);
  }

  function applyPasted() {
    const result = parseDataset(pasted, family, unit);
    if (result.ok) {
      setDataset(result.dataset);
      setError(null);
      return;
    }
    setError(result.error);
  }

  return (
    <Stack gap="lg">
      {/*
       * `minmax(0,1fr)` on the single-column case, not just the two-column one.
       *
       * A bare `grid` sizes its implicit column from the largest `min-content`
       * contribution in it, so on a narrow screen one wide control could push
       * the whole track — and therefore the page — past the viewport. Fixing
       * the track makes the width a decision rather than a side effect.
       */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <Panel tone="sunken" className="h-fit min-w-0">
          <Stack gap="md" className="p-4">
            <Inline justify="between" align="center">
              <Text variant="label" as="span">
                {tcs("Family")}
              </Text>
              <SegmentedControl
                size="sm"
                value={family}
                onValueChange={(next) => chooseFamily(next as StudioFamily)}
              >
                <SegmentedItem value="timeseries">{tcs("Time series")}</SegmentedItem>
                <SegmentedItem value="distribution">{tcs("Distribution")}</SegmentedItem>
              </SegmentedControl>
            </Inline>

            <Inline justify="between" align="center">
              <Text variant="label" as="span">
                {tcs("Unit")}
              </Text>
              <SegmentedControl size="sm" value={unit} onValueChange={(next) => setUnit(next as StudioUnit)}>
                {STUDIO_UNITS.slice(0, 4).map((id) => (
                  <SegmentedItem key={id} value={id}>
                    {tcs(UNIT_LABEL[id])}
                  </SegmentedItem>
                ))}
              </SegmentedControl>
            </Inline>

            <Inline justify="between" align="center">
              <Text variant="label" as="span">
                {tcs("Height")}
              </Text>
              <SegmentedControl
                size="sm"
                value={String(height)}
                onValueChange={(next) => setHeight(Number(next))}
              >
                {HEIGHTS.map((value) => (
                  <SegmentedItem key={value} value={String(value)}>
                    {value}
                  </SegmentedItem>
                ))}
              </SegmentedControl>
            </Inline>

            <Stack gap="xs">
              <Text variant="label" as="p">
                {tcs("Your data")}
              </Text>
              <Textarea
                rows={6}
                value={pasted}
                onChange={(event) => setPasted(event.target.value)}
                placeholder={tcs("Paste CSV (time,value) or JSON")}
                aria-label={tcs("Dataset to chart")}
              />
              <Inline gap="sm" align="center">
                <Button size="sm" variant="secondary" onClick={applyPasted}>
                  {tcs("Draw it")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => chooseFamily(family)}>
                  {tcs("Reset to the fixture")}
                </Button>
              </Inline>
            </Stack>

            {error ? (
              <Alert tone="danger" title={tcs("That dataset was refused")}>
                {error}
              </Alert>
            ) : null}
          </Stack>
        </Panel>

        <Stack gap="md" className="min-w-0">
          <div className="rounded-lg border border-line-subtle bg-surface-canvas p-4">
            {dataset.kind === "timeseries" ? (
              <LineChart
                data={timeseriesRows(dataset)}
                xKey="time"
                series={[
                  {
                    key: "value",
                    label: dataset.label,
                    type: "line",
                    tone: "accent",
                    lineWidth: 2,
                  },
                ]}
                axes={[{ id: "primary", format: { kind: dataset.unit } }]}
                height={height}
                ariaLabel={dataset.label}
              />
            ) : (
              <ViolinChart
                groups={distributionGroups(dataset)}
                valueFormat={{ kind: dataset.unit }}
                height={height}
                ariaLabel={dataset.label}
              />
            )}
          </div>
          <Inline justify="between" align="center">
            <Text variant="caption" tone="muted" as="p">
              {tcs(
                "The value axis is formatted from the unit you declared. A chart renders what it is given and never converts a unit.",
              )}
            </Text>
            <CopyButton value={snippet} label={tcs("Copy the chart")} />
          </Inline>
          {/* A generated snippet is wider than the panel; it scrolls, so it takes a tab stop. */}
          <Code block>{snippet}</Code>
        </Stack>
      </div>
    </Stack>
  );
}
