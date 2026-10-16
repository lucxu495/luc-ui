/*
 * The reference adapters' own contract.
 *
 * `playground-engine.test.ts` proves the *light* registry's promise (defaults
 * write nothing, every changed control shows up in the code). The chart half is
 * deliberately outside that registry — importing it pulls a rendering engine —
 * so it is outside that test too. These are the checks that apply to every
 * adapter, charts included, and the ones the engine cannot make:
 *
 *  1. an adapter may not claim a component its import path does not publish;
 *  2. a fixture is deterministic — serializing twice gives byte-identical code,
 *     and a chart's fixture values are finite numbers (a `NaN` in a chart is a
 *     chart that draws nothing and reports no error);
 *  3. the generated element names its component;
 *  4. a control the reader changes reaches the code — as an attribute, as the
 *     element's body, or (for a composed slot) as a visibly different snippet;
 *  5. the generated element has no duplicated attribute, which is a compile
 *     error a reader only discovers when their editor refuses the paste;
 *  6. the panel's own vocabulary (labels, option labels, reasons) is printable
 *     and translatable.
 */

import { describe, expect, it } from "vitest";
import catalog from "../../../../docs/component-catalog.json";
import { defaultsOf, normalizeValues, placementOf } from "@/components/playground/engine";
import { lineChartRows, lineChartSeries } from "@/components/playground/adapters/line-chart";
import { violinChartGroups } from "@/components/playground/adapters/violin-chart";
import { chartPlaygroundFor, chartPlaygroundIds } from "@/components/playground/registry.charts";
import { playgroundFor, playgroundIds } from "@/components/playground/registry";
import type { Control, ControlValues, PlaygroundSpec } from "@/components/playground/types";

const allIds = [...playgroundIds, ...chartPlaygroundIds];
const specs: readonly PlaygroundSpec[] = allIds.flatMap((id) => {
  const spec = chartPlaygroundFor(id) ?? playgroundFor(id);
  return spec ? [spec] : [];
});

/** Named exports of each public entry point, from the generated catalogue. */
const published = new Map(
  Object.values(catalog.entries).map((entry) => [
    (entry as { import: string }).import,
    ((entry as { exports?: { name: string }[] }).exports ?? []).map((item) => item.name),
  ]),
);

/** Values that differ from the control's declared default, in a stable order. */
function alternatives(control: Control): unknown[] {
  switch (control.kind) {
    case "boolean":
      return [!control.default];
    case "number":
      return [control.max ?? control.default + (control.step ?? 1) * 3];
    case "enum":
    case "fixture":
    case "slot":
      return control.options
        .filter((option) => option.value !== control.default)
        .map((option) => option.value);
    case "list":
      return [control.options.slice(0, 1).map((option) => option.value)];
    case "text":
      return [`${control.default} (edited)`];
    case "color":
      return [control.default === "#000000" ? "#ffffff" : "#000000"];
  }
}

/** Remove JSX expression values, so a nested element cannot donate attributes. */
function stripExpressions(source: string): string {
  let next = source;
  for (let pass = 0; pass < 6; pass += 1) {
    const reduced = next.replace(/\{[^{}]*\}/g, '""');
    if (reduced === next) break;
    next = reduced;
  }
  return next;
}

/** Attribute names inside an element's opening tag, in source order. */
function attributeNames(element: string): string[] {
  const tag = stripExpressions(element);
  /* An element may sit under a `const rows = […]` line (the chart adapters write
   * their fixture out), so the opening tag starts at the last `<` before the
   * first `>` rather than at the start of the snippet. */
  const firstClose = tag.indexOf(">");
  const openTag = tag.slice(tag.lastIndexOf("<", firstClose), firstClose + 1);
  const inside = openTag
    .replace(/^<[A-Za-z][A-Za-z0-9.]*/, "")
    .replace(/"[^"]*"/g, '""')
    .replace(/\/?>$/, "");
  return [...inside.matchAll(/(?:^|\s)([A-Za-z][A-Za-z0-9-]*)(?==|\s|>|$)/g)].map(
    (match) => match[1] as string,
  );
}

describe("playground adapters", () => {
  it("registers the reference set exactly once, in one half each", () => {
    /*
     * Seven, and the count is a decision rather than an accident.
     *
     * It was nine until three reviews removed a panel: `docs/COMPONENTS_V2.md` §5
     * rejects a property panel beside an ordinary control, and none of a text
     * field's, a card's or a button's prop space needs one — all three are
     * demonstrable with examples. The Forms review took Input, the Navigation
     * review took Card, and the Feedback review took the two that were *wired but
     * never mounted* (Button and ProfileHero: their pages mount no
     * `PlaygroundSection`, so the rows promised a panel that no page rendered).
     * Every one of them was deleted rather than merely unwired, because the wiring
     * test below ("no registered adapter is unreachable") is what stops a forgotten
     * adapter from sitting in the registry forever.
     *
     * The remaining four are the two chart adapters with hand-written controls and
     * the two component adapters whose surfaces are genuinely configurable
     * (KineticHeadline, ChatMessage).
     */
    expect(allIds.length).toBe(4);
    expect(new Set(allIds).size).toBe(allIds.length);
    for (const id of allIds) {
      const inLight = playgroundFor(id) !== undefined;
      const inCharts = chartPlaygroundFor(id) !== undefined;
      expect(inLight !== inCharts, `${id} is registered in both halves`).toBe(true);
    }
  });

  it("only claims a component its own import path publishes", () => {
    for (const spec of specs) {
      const exports = published.get(spec.importPath);
      expect(exports, `${spec.id}: ${spec.importPath} is not a public entry point`).toBeDefined();
      expect(
        exports ?? [],
        `${spec.id}: ${spec.importPath} does not export ${spec.component}`,
      ).toContain(spec.component);
    }
  });

  it("serializes deterministically, from constants only", () => {
    for (const spec of specs) {
      const defaults = defaultsOf(spec);
      expect(spec.serialize(defaults), `${spec.id} is not deterministic`).toBe(spec.serialize(defaults));
      for (const control of spec.controls) {
        for (const value of alternatives(control)) {
          const changed = normalizeValues(spec, { ...defaults, [control.name]: value as never });
          expect(spec.serialize(changed)).toBe(spec.serialize(changed));
          /* Free of the two functions that would make the server render and the
           * client hydration disagree. */
          expect(spec.serialize(changed)).not.toMatch(/Math\.random|Date\.now/);
        }
      }
    }
  });

  it("keeps every chart fixture value finite", () => {
    expect(lineChartRows.length).toBeGreaterThan(2);
    for (const row of lineChartRows) {
      expect(row.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isFinite(row.close)).toBe(true);
      expect(Number.isFinite(row.trend)).toBe(true);
    }
    expect(lineChartSeries.length).toBeGreaterThan(1);
    expect(violinChartGroups.length).toBeGreaterThan(1);
    for (const group of violinChartGroups) {
      expect(group.bins.length).toBeGreaterThan(2);
      for (const bin of group.bins) {
        expect(Number.isFinite(bin.value)).toBe(true);
        expect(Number.isFinite(bin.density)).toBe(true);
      }
      if (group.marker) expect(Number.isFinite(group.marker.value)).toBe(true);
    }
  });

  it("names its component in the generated element", () => {
    for (const spec of specs) {
      expect(spec.serialize(defaultsOf(spec)), `${spec.id}`).toContain(`<${spec.component}`);
    }
  });

  it("reaches the code whenever a control changes", () => {
    for (const spec of specs) {
      const defaults = defaultsOf(spec);
      const defaultCode = spec.serialize(defaults);
      for (const control of spec.controls) {
        const values = alternatives(control);
        expect(values.length, `${spec.id}.${control.name} has no alternative value`).toBeGreaterThan(0);
        const changed = values.map((value) =>
          normalizeValues(spec, { ...defaults, [control.name]: value as never }),
        );
        const placement = placementOf(control);
        if (placement.kind === "prop") {
          for (const state of changed) {
            expect(
              spec.serialize(state),
              `${spec.id}: changing ${control.name} does not write ${placement.name}`,
            ).toContain(placement.name);
          }
        } else if (placement.kind === "body") {
          for (const state of changed) {
            expect(
              spec.serialize(state),
              `${spec.id}: changing ${control.name} does not write it into the element body`,
            ).toContain(String(state[control.name]));
          }
        } else {
          /* A composed control writes its own JSX, so the engine cannot name it.
           * What it can require is that the choice is visible at all. */
          expect(
            changed.some((state) => spec.serialize(state) !== defaultCode),
            `${spec.id}: ${control.name} has no effect on the code`,
          ).toBe(true);
        }
      }
    }
  });

  it("never emits the same attribute twice", () => {
    for (const spec of specs) {
      const defaults = defaultsOf(spec);
      const everything: ControlValues = Object.fromEntries(
        spec.controls.map((control) => [control.name, alternatives(control)[0]]),
      );
      for (const values of [defaults, normalizeValues(spec, everything)]) {
        const names = attributeNames(spec.serialize(values));
        expect(
          new Set(names).size,
          `${spec.id} emits a duplicate attribute: ${names.join(", ")}`,
        ).toBe(names.length);
      }
    }
  });

  it("keeps the panel's own vocabulary printable and translatable", () => {
    for (const spec of specs) {
      for (const control of spec.controls) {
        expect(control.label.length, `${spec.id}.${control.name} has no label`).toBeGreaterThan(1);
        for (const option of "options" in control ? control.options : []) {
          if (option.label !== undefined) expect(option.label.length).toBeGreaterThan(1);
        }
      }
      for (const item of spec.unsupported ?? []) {
        expect(item.reason.length, `${spec.id}.${item.name} has no reason`).toBeGreaterThan(10);
      }
    }
  });
});
