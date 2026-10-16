"use client";

/*
 * ViolinChart — a distribution per category.
 *
 * The component's own contract is what makes this adapter small: the density
 * outline is *supplied*, because a bandwidth is a modelling decision and a chart
 * library that picks one silently is a library that lies quietly. So the fixture
 * below is a pre-computed outline (the same thing a bootstrap or a histogram
 * would hand the chart), and the controls are the presentation around it:
 * height, state, the value format and the accessible name.
 *
 * It shares `registry.charts.ts` with the line chart, because importing either
 * one pulls the same rendering engine.
 */

import { ViolinChart } from "@luc/ui/charts";
import type { ChartFormat, ViolinGroup } from "@luc/ui/charts";
import { serializeProps } from "../engine";
import type { ControlValues, PlaygroundSpec } from "../types";

type ChartState = "ready" | "loading" | "empty" | "error";

const STATES = ["ready", "loading", "empty", "error"] as const;
const FORMATS = ["auto", "percent", "ratio"] as const;

/** Two supplied outlines, both symmetric around their own median. */
export const violinChartGroups: readonly ViolinGroup[] = [
  {
    label: "1D",
    tone: "accent",
    marker: { value: 0.02, label: "median" },
    bins: [
      { value: 0, density: 0.1 },
      { value: 0.01, density: 0.6 },
      { value: 0.02, density: 1 },
      { value: 0.03, density: 0.55 },
      { value: 0.04, density: 0.12 },
    ],
  },
  {
    label: "20D",
    tone: "neutral",
    marker: { value: 0.06, label: "median" },
    bins: [
      { value: 0.02, density: 0.1 },
      { value: 0.04, density: 0.55 },
      { value: 0.06, density: 1 },
      { value: 0.08, density: 0.6 },
      { value: 0.1, density: 0.15 },
    ],
  },
];

function groupsCode(): string {
  const groups = violinChartGroups.map((group) => {
    const bins = group.bins
      .map((bin) => `      { value: ${bin.value}, density: ${bin.density} },`)
      .join("\n");
    const marker = group.marker ? `,\n    marker: { value: ${group.marker.value} }` : "";
    return [
      "  {",
      `    label: "${group.label}",`,
      `    tone: "${String(group.tone)}",`,
      "    bins: [",
      bins,
      `    ]${marker},`,
      "  },",
    ].join("\n");
  });
  return `const groups = [\n${groups.join("\n")}\n];`;
}

function formatCode(key: string): string {
  return key === "auto" ? "" : ` valueFormat={{ kind: "${key}" }}`;
}

export const violinChartPlayground: PlaygroundSpec = {
  id: "violin-chart",
  component: "ViolinChart",
  importPath: "@luc/ui/charts",
  stageNote: "The outline is supplied, never fitted: this fixture is the caller's own density estimate.",
  presetSource: "state",
  controls: [
    {
      kind: "text",
      name: "title",
      label: "Title",
      default: "",
      help: "Also the chart's accessible name when no `ariaLabel` is given.",
    },
    {
      kind: "number",
      name: "height",
      label: "Height",
      default: 260,
      min: 180,
      max: 420,
      step: 20,
      unit: "px",
      sticky: true,
    },
    {
      kind: "enum",
      name: "state",
      label: "State",
      default: "ready",
      group: "variant",
      sticky: true,
      options: STATES.map((value) => ({ value })),
    },
    {
      kind: "enum",
      name: "valueFormat",
      label: "Value format",
      default: "auto",
      placement: { kind: "composed" },
      options: FORMATS.map((value) => ({ value })),
      help: "Presentation only: the chart formats what it is given and never converts a unit.",
    },
    {
      kind: "text",
      name: "ariaLabel",
      label: "Accessible name",
      default: "",
      group: "variant",
      help: "Leave it empty and the chart names itself from the title and the family.",
    },
  ],
  unsupported: [
    {
      name: "groups",
      reason: "The density outline is the caller's model output; the preview supplies a fixed outline and the copied code writes it out.",
    },
    {
      name: "onReady",
      reason: "A callback is your application's behaviour, not a previewable value.",
    },
    {
      name: "className",
      reason: "Layout and width belong to the page that places the chart.",
    },
  ],
  render: (values: ControlValues) => {
    const format = String(values.valueFormat);
    return (
      <ViolinChart
        groups={violinChartGroups}
        title={values.title === "" ? undefined : String(values.title)}
        height={typeof values.height === "number" ? values.height : 260}
        state={String(values.state) as ChartState}
        ariaLabel={values.ariaLabel === "" ? undefined : String(values.ariaLabel)}
        {...(format === "auto" ? {} : { valueFormat: { kind: format } as ChartFormat })}
      />
    );
  },
  serialize: (values: ControlValues) => {
    const attributes = serializeProps(violinChartPlayground, values);
    return `${groupsCode()}\n\n<ViolinChart${attributes} groups={groups}${formatCode(String(values.valueFormat))} />`;
  },
};
