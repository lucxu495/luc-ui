import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * The ECharts runtime registers its components modularly.
 *
 * A component that is **not** registered is a silent no-op: ECharts accepts the
 * option, merges it, and draws nothing. That is exactly how the series legend
 * behaved — `ChartSpec.legend` produced a correct `legend` fragment and the
 * chart rendered without it, because `LegendComponent` was never registered.
 *
 * The registration list is therefore pinned here: whoever adds a component to
 * the option builders has to add it to the runtime, and the legend (the control
 * that hides and restores a series) can never regress to silence again.
 */
describe("the ECharts runtime registration", () => {
  const source = readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), "runtime.ts"),
    "utf8",
  );

  it("registers the legend components the option builders emit", () => {
    expect(source).toContain("components.LegendComponent");
    expect(source).toContain("components.LegendScrollComponent");
  });

  it("registers the cartesian components every chart family needs", () => {
    for (const component of [
      "components.GridComponent",
      "components.TooltipComponent",
      "components.DataZoomComponent",
      "renderers.CanvasRenderer",
    ]) {
      expect(source).toContain(component);
    }
  });
});
