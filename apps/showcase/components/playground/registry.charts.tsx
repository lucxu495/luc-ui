/*
 * The chart half of the Playground registry.
 *
 * Split from `registry.ts` for one reason: a chart adapter imports a rendering
 * engine. The client boundary resolves a spec from an id, so every adapter a
 * page *could* resolve is in that page's bundle — which means a chart adapter
 * registered in the light file would put ECharts on a Button documentation page.
 *
 * So the two halves are separate modules with the same shape: `registry.ts` is
 * primitives, composites, motion and AI; this file is charts. A chart entry page
 * mounts `ChartPlayground` from `chart-boundary.tsx`; every other page mounts
 * `Playground` from `boundary.tsx`. `pnpm qa:isolation` is the standing evidence
 * that a page with no chart in it loads no engine.
 */

import { lineChartPlayground } from "./adapters/line-chart";
import { violinChartPlayground } from "./adapters/violin-chart";
import * as chartModule from "@luc/ui/charts";
import type { ReactNode } from "react";
import { chartDemoFor } from "@/lib/demo/registry.charts";
import { jsxElement } from "@/lib/demo/jsx";
import type { Control, ControlValues, PlaygroundSpec } from "./types";

/** Adapters that pull a chart engine, and are therefore loaded only by charts. */
const registry: readonly PlaygroundSpec[] = [lineChartPlayground, violinChartPlayground];

export const chartPlaygroundSpecs: ReadonlyMap<string, PlaygroundSpec> = new Map(
  registry.map((spec) => [spec.id, spec]),
);

/**
 * The chart catalogue, indexed by the export name the documentation registry
 * recorded.
 *
 * This is the one place a cast is used instead of a type, and the reason is
 * worth stating: the name comes from the generated catalogue, so the compiler
 * cannot know which component it names at the call site, and the *props* are not
 * typed here either — they are the fixture object the demo module already
 * type-checked against its own component (`demo<CandlestickChartProps>(…)`).
 * What the cast gives up in compile-time checking is bought back by two tests:
 * every chart demo's `source.component` must resolve in this map, and the chart
 * panel may only set props the fixture already declares.
 */
type LooseChart = (props: Record<string, unknown>) => ReactNode;
const chartComponents = chartModule as unknown as Record<string, LooseChart | undefined>;

const CHART_STATES = ["ready", "loading", "empty", "error"] as const;

/**
 * The standard panel for a chart that has a Live Demo but no hand-written
 * adapter.
 *
 * It exists so that "controls where the public API permits them" is true for the
 * whole chart catalogue rather than for two charts. The controls are exactly the
 * ones every chart in the family declares in `FamilyCommonProps` — the height,
 * the state the surface is in, and the accessible name — and it is *built from
 * the demo's own fixture*, so the panel never invents data and its code always
 * reproduces the picture beside it.
 *
 * The gate is the fixture itself: a component that declares no `height` is not
 * given a height control, because passing one would be the exact fabrication
 * this phase is meant to remove.
 */
function generatedChartPlayground(id: string): PlaygroundSpec | undefined {
  const demo = chartDemoFor(id);
  const source = demo?.source;
  if (!source || !demo) return undefined;
  const Component = chartComponents[source.component];
  if (!Component) return undefined;
  const fixture = source.props;
  if (typeof fixture.height !== "number" || typeof fixture.ariaLabel !== "string") return undefined;

  const controls: Control[] = [
    {
      kind: "number",
      name: "height",
      label: "Height",
      default: fixture.height,
      min: 200,
      max: 480,
      step: 20,
      unit: "px",
      help: "A chart measures its container, so it always needs a definite height.",
    },
    {
      kind: "enum",
      name: "state",
      label: "State",
      default: "ready",
      options: CHART_STATES.map((value) => ({ value })),
      help: "The surface the chart is in — loading, empty and error are drawn by the component.",
    },
    {
      kind: "text",
      name: "ariaLabel",
      label: "Accessible name",
      default: fixture.ariaLabel,
      help: "A drawing is not readable by a screen reader, so it needs a name that states what it shows.",
      required: true,
    },
  ];

  const spec: PlaygroundSpec = {
    id,
    component: source.component,
    importPath: "@luc/ui/charts",
    controls,
    stageNote: "The same fixture as the live preview above; the controls change how it is drawn, not what it measures.",
    unsupported: [
      { name: "series / rows", reason: "The numbers are the caller's; the fixture above is the example." },
    ],
    render: (values: ControlValues) => (
      <Component
        {...fixture}
        height={typeof values.height === "number" ? values.height : fixture.height}
        state={typeof values.state === "string" ? values.state : "ready"}
        ariaLabel={typeof values.ariaLabel === "string" ? values.ariaLabel : fixture.ariaLabel}
      />
    ),
    /* Printed from the same merged object the stage renders, so the code cannot
     * describe a different chart. */
    serialize: (values: ControlValues) =>
      jsxElement(
        source.component,
        {
          ...fixture,
          height: typeof values.height === "number" ? values.height : fixture.height,
          state: typeof values.state === "string" ? values.state : "ready",
          ariaLabel: typeof values.ariaLabel === "string" ? values.ariaLabel : fixture.ariaLabel,
        },
        undefined,
      ),
  };
  return spec;
}

/**
 * The panel for a chart entry, or `undefined` when the chart has none.
 *
 * `id` is the adapter id from the registry, which for charts is the chart's own
 * entry id. A hand-written adapter wins; otherwise the standard panel is built
 * from the Live Demo.
 */
export function chartPlaygroundFor(id: string | undefined): PlaygroundSpec | undefined {
  if (!id) return undefined;
  return chartPlaygroundSpecs.get(id) ?? generatedChartPlayground(id);
}

export const chartPlaygroundIds: readonly string[] = [...chartPlaygroundSpecs.keys()].sort();
