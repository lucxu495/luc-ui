/*
 * The Playground's standing contract.
 *
 * The promise a Playground makes is narrow and testable: *the code shows the
 * state you see*. That is exactly what these tests check — for every registered
 * adapter, every control in its declaration is either reflected in the
 * generated element or explicitly declared as body/composed, and a value set
 * back to its default disappears from the code again.
 *
 * They also check the things that make the tool honest rather than decorative:
 * that a control's domain is enforced, that unsupported props are stated, and
 * that no adapter claims a prop the component does not have.
 */

import { describe, expect, it } from "vitest";
import catalog from "../../../../docs/component-catalog.json";
import {
  buildSnippet,
  defaultsOf,
  expectedPropNames,
  isDirty,
  activePreset,
  controlsInGroup,
  disabledReasons,
  normalizeValue,
  normalizeValues,
  placementOf,
  presetsOf,
  propsInElement,
  serializeAttribute,
} from "@/components/playground/engine";
import { forgetSticky, rememberSticky, stickyValue } from "@/components/playground/state";
import { playgroundIds, playgroundFor } from "@/components/playground/registry";
import { chartPlaygroundFor, chartPlaygroundIds } from "@/components/playground/registry.charts";
import type { Control, PlaygroundSpec } from "@/components/playground/types";

const specs = playgroundIds.flatMap((id) => {
  const spec = playgroundFor(id);
  return spec ? [spec] : [];
});

/*
 * Both halves, for the checks that are about the *contract* rather than about one
 * adapter's props.
 *
 * The light registry is what a component page carries, so most of this file uses
 * `specs`. WB-004 is the exception: the only invalid combination declared in the
 * light half lived in the Card adapter, and the Navigation review removed that
 * panel — so the assertion that keeps "an invalid combination is explained" from
 * becoming decorative has to read the chart adapters, which declare two reasons
 * of their own. They are safe to import here: this file already pulls
 * `registry.charts` for the sticky-value check below, which is the same reason.
 */
const chartSpecs = chartPlaygroundIds.flatMap((id) => {
  const spec = chartPlaygroundFor(id);
  return spec ? [spec] : [];
});

const everySpec = [...specs, ...chartSpecs];

/** Props each import path really publishes, from the generated catalogue. */
const publishedExports = new Map(
  Object.values(catalog.entries).map((entry) => [
    (entry as { import: string }).import,
    (entry as { exports?: { name: string }[] }).exports ?? [],
  ]),
);

/** A value that is guaranteed to differ from the control's declared default. */
function alternativeValue(control: Control): Control[keyof Control] | string[] {
  switch (control.kind) {
    case "boolean":
      return !control.default;
    case "number":
      return control.max ?? control.default + (control.step ?? 1) * 3;
    case "enum":
      return control.options.find((option) => option.value !== control.default)?.value ?? control.default;
    case "list":
      return control.options.slice(0, 2).map((option) => option.value);
    case "text":
      return `${control.default} (edited)`;
    case "color":
      return control.default === "#000000" ? "#ffffff" : "#000000";
    case "fixture":
    case "slot":
      return control.options.find((option) => option.value !== control.default)?.value ?? control.default;
  }
}

describe("playground registry", () => {
  it("registers at least one adapter and gives each one a unique id", () => {
    expect(playgroundIds.length).toBeGreaterThan(0);
    expect(new Set(playgroundIds).size).toBe(playgroundIds.length);
  });

  it("matches the id the documentation registry looks up", () => {
    for (const spec of specs) {
      expect(spec.id, `${spec.id} is not a registered playground id`).toBeTruthy();
      expect(spec.importPath.startsWith("@luc/ui")).toBe(true);
    }
  });

  it("only claims exports its import path publishes", () => {
    for (const spec of specs) {
      const published = publishedExports.get(spec.importPath);
      expect(published, `${spec.id}: ${spec.importPath} is not a public entry point`).toBeDefined();
      expect(
        published?.some((item) => item.name === spec.component),
        `${spec.id}: ${spec.importPath} does not export ${spec.component}`,
      ).toBe(true);
    }
  });

  it("declares an honest domain for every control", () => {
    for (const spec of specs) {
      const names = spec.controls.map((control) => control.name);
      expect(new Set(names).size, `${spec.id} declares a duplicate control name`).toBe(names.length);
      for (const control of spec.controls) {
        if (control.kind === "enum" || control.kind === "list") {
          expect(control.options.length, `${spec.id}.${control.name} has no options`).toBeGreaterThan(1);
          const values = control.options.map((option) => option.value);
          expect(new Set(values).size).toBe(values.length);
          expect(values, `${spec.id}.${control.name} default is not an option`).toContain(control.default);
        }
        if (control.kind === "number") {
          if (control.min !== undefined) expect(control.default).toBeGreaterThanOrEqual(control.min);
          if (control.max !== undefined) expect(control.default).toBeLessThanOrEqual(control.max);
        }
      }
    }
  });
});

describe("playground engine", () => {
  it("clamps, filters and falls back rather than trusting a caller", () => {
    const number: Control = { kind: "number", name: "n", label: "N", default: 10, min: 0, max: 20 };
    expect(normalizeValue(number, 999)).toBe(20);
    expect(normalizeValue(number, -5)).toBe(0);
    expect(normalizeValue(number, Number.NaN)).toBe(10);

    const enumerated: Control = {
      kind: "enum",
      name: "e",
      label: "E",
      default: "a",
      options: [{ value: "a" }, { value: "b" }],
    };
    expect(normalizeValue(enumerated, "zzz")).toBe("a");

    const list: Control = {
      kind: "list",
      name: "l",
      label: "L",
      default: [],
      options: [{ value: "a" }, { value: "b" }],
    };
    expect(normalizeValue(list, ["a", "nope"])).toEqual(["a"]);
  });

  it("writes JSX exactly as a developer would", () => {
    const text: Control = { kind: "text", name: "label", label: "Label", default: "Save" };
    expect(serializeAttribute(text, "label", "Save")).toBeNull();
    expect(serializeAttribute(text, "label", 'Say "hi"')).toBe('label="Say &quot;hi&quot;"');

    const flag: Control = { kind: "boolean", name: "loading", label: "Loading", default: false };
    expect(serializeAttribute(flag, "loading", true)).toBe("loading");
    expect(serializeAttribute(flag, "loading", false)).toBeNull();
    expect(serializeAttribute({ ...flag, default: true }, "disabled", false)).toBe("disabled={false}");

    const size: Control = { kind: "number", name: "size", label: "Size", default: 12 };
    expect(serializeAttribute(size, "size", 16)).toBe("size={16}");
  });

  it("keeps the code and the preview in step for every registered adapter", () => {
    for (const spec of specs) {
      const defaults = defaultsOf(spec);
      const defaultCode = spec.serialize(defaults);
      /*
       * A configuration at its defaults writes only the props the element
       * cannot omit — `required: true`. The library's own defaults are not the
       * caller's business, but an accessible name, a headline's text and a
       * message's sender are not defaults: they are what makes the element
       * correct, and the phase that shipped `<Input />` with no name proved the
       * difference.
       */
      const requiredNames = spec.controls
        .flatMap((control) => {
          const placement = placementOf(control);
          return control.required === true && placement.kind === "prop" ? [placement.name] : [];
        })
        .sort();
      expect(expectedPropNames(spec, defaults)).toEqual(requiredNames);
      expect(propsInElement(defaultCode)).toEqual(requiredNames);
      expect(defaultCode).toContain(`<${spec.component}`);

      for (const control of spec.controls) {
        const placement = placementOf(control);
        if (placement.kind !== "prop") continue;
        const changed = normalizeValues(spec, {
          ...defaults,
          [control.name]: alternativeValue(control) as never,
        });
        if (!isDirty(spec, changed)) continue;
        const code = spec.serialize(changed);
        const expected = expectedPropNames(spec, changed);
        const actual = propsInElement(code);
        expect(
          actual,
          `${spec.id}: changing ${control.name} does not show ${placement.name} in the code\n${code}`,
        ).toContain(placement.name);
        for (const name of expected) {
          expect(actual, `${spec.id}: ${name} missing from the generated element`).toContain(name);
        }
      }
    }
  });

  it("never leaves an enumerated value outside its domain, even from a hand-edited set", () => {
    for (const spec of specs) {
      for (const control of spec.controls) {
        const normalized = normalizeValue(control, { not: "a value" });
        if (control.kind === "enum" || control.kind === "fixture" || control.kind === "slot") {
          expect(normalized, `${spec.id}.${control.name} kept an unknown option`).toBe(control.default);
        }
        if (control.kind === "boolean") {
          expect(normalized, `${spec.id}.${control.name} accepted a non-boolean`).toBe(control.default);
        }
        if (control.kind === "number") {
          expect(normalized, `${spec.id}.${control.name} accepted a non-number`).toBe(control.default);
        }
        if (control.kind === "list") {
          /* A list is filtered rather than replaced: an unknown member is
           * dropped, which is what makes a hand-edited value safe. */
          expect(normalized).toEqual([]);
        }
        if (control.kind === "text" || control.kind === "color") {
          /* Text has no domain, so it is taken as written. Stated here so the
           * asymmetry between a free field and a closed set is deliberate. */
          expect(normalized, `${spec.id}.${control.name} rejected free text`).toBe(
            control.default,
          );
        }
      }
    }
  });

  it("produces a snippet that can be pasted as-is", () => {
    for (const spec of specs) {
      const values = normalizeValues(spec, {});
      const snippet = buildSnippet(spec, values);
      expect(snippet.imports).toContain(spec.importPath);
      expect(snippet.imports).toContain(spec.component);
      expect(snippet.full).toBe(`${snippet.imports}\n\n${snippet.code}`);
      /* Balanced angle brackets: an unterminated element is the classic way for
       * a hand-built snippet to be invalid JSX. */
      expect(snippet.code.split("<").length).toBe(snippet.code.split(">").length);
    }
  });

  it("states what it cannot control instead of faking a control", () => {
    for (const spec of specs) {
      const controlled = new Set(spec.controls.map((control) => control.name));
      for (const item of spec.unsupported ?? []) {
        expect(
          controlled.has(item.name),
          `${spec.id}: ${item.name} is both controlled and declared unsupported`,
        ).toBe(false);
        expect(item.reason.length, `${spec.id}.${item.name} has no reason`).toBeGreaterThan(10);
      }
    }
  });

  it("serializes a real adapter's configured state for a reader to check by eye", () => {
    /*
     * Any adapter, and the checks are derived from it rather than hard-coded:
     * the invariant is "the snippet shows the state you see", and the strongest
     * available statement of it is that the code reproduces every value a preset
     * set — for whichever adapter is registered first.
     */
    const spec: PlaygroundSpec | undefined = playgroundIds.length > 0 ? playgroundFor(playgroundIds[0]!) : undefined;
    expect(spec, "no light adapter is registered").toBeDefined();
    if (!spec) return;
    const preset = presetsOf(spec)[0];
    expect(preset, `${spec.id} exposes no preset`).toBeDefined();
    if (!preset) return;
    const values = normalizeValues(spec, { ...defaultsOf(spec), ...preset.values });
    const snippet = buildSnippet(spec, values);
    expect(snippet.code).toContain(`<${spec.component}`);
    for (const [name, value] of Object.entries(preset.values)) {
      const printed = typeof value === "string" ? `"${value}"` : String(value);
      expect(snippet.code, `${spec.id}: ${name} is not in the generated code`).toContain(printed);
    }
  });
});

/*
 * WB-003 — control bands and derived presets.
 *
 * The panel's shape is a product decision, so it is asserted rather than
 * reviewed once: a band that no adapter declares, or a preset row derived from a
 * control that does not exist, is a silent regression otherwise.
 */
describe("WB-003 — control bands and presets", () => {
  it("puts every control in a declared band", () => {
    for (const spec of specs) {
      for (const control of spec.controls) {
        expect(
          ["essential", "variant", "advanced", undefined],
          `${spec.id}.${control.name} has an unknown band`,
        ).toContain(control.group);
      }
    }
  });

  it("derives a preset row for every adapter, from a control it actually has", () => {
    for (const spec of specs) {
      const presets = presetsOf(spec);
      expect(presets.length, `${spec.id} exposes no preset row`).toBeGreaterThanOrEqual(2);
      if (spec.presetSource) {
        const source = spec.controls.find((control) => control.name === spec.presetSource);
        expect(source, `${spec.id}.presetSource names "${spec.presetSource}", which it does not declare`).toBeDefined();
      }
      /* Every preset must be applicable: a value the control cannot hold would
       * be dropped by `normalizeValue` and the button would do nothing. */
      for (const preset of presets) {
        const applied = normalizeValues(spec, { ...defaultsOf(spec), ...preset.values });
        for (const [name, value] of Object.entries(preset.values)) {
          expect(applied[name], `${spec.id}: preset "${preset.id}" cannot set ${name}`).toEqual(value);
        }
      }
    }
  });

  it("marks a preset as active only when the panel is exactly in that state", () => {
    for (const spec of specs) {
      const presets = presetsOf(spec);
      const first = presets[0];
      if (!first) continue;
      const applied = normalizeValues(spec, { ...defaultsOf(spec), ...first.values });
      expect(activePreset(spec, applied), `${spec.id}: ${first.id} not reported active`).toBe(first.id);
      /* A state the presets do not describe must report none, rather than
       * falling back to the first one. */
      const off = { ...applied };
      const listControl = spec.controls.find((control) => control.kind === "list");
      const textControl = spec.controls.find((control) => control.kind === "text");
      if (listControl) off[listControl.name] = [];
      else if (textControl) off[textControl.name] = "not a preset";
      else continue;
      expect(activePreset(spec, off), `${spec.id}: a non-preset state matched a preset`).not.toBe(first.id);
    }
  });

  it("collapses at least one band behind the advanced disclosure", () => {
    for (const spec of specs) {
      const advanced = controlsInGroup(spec, "advanced");
      const visible = [...controlsInGroup(spec, "essential"), ...controlsInGroup(spec, "variant")];
      expect(advanced.length + visible.length, `${spec.id} loses a control`).toBe(spec.controls.length);
      /* The panel is never allowed to be entirely advanced or entirely open:
       * both would be a configuration a reader cannot use. */
      expect(visible.length, `${spec.id} has nothing visible`).toBeGreaterThan(0);
    }
  });
});

/*
 * WB-004 — invalid combinations are explained, never silent.
 */
describe("WB-004 — disabled combinations state their reason", () => {
  it("gives every declared reason a full sentence", () => {
    const declared = everySpec.flatMap((spec) =>
      spec.controls
        .filter((control) => control.disabledWhen)
        .map((control) => ({ id: `${spec.id}.${control.name}`, reason: control.disabledWhen!.reason })),
    );
    expect(declared.length, "no adapter declares an invalid combination, so the rule is decorative").toBeGreaterThan(0);
    for (const { id, reason } of declared) {
      expect(reason.length, `${id} reason is too short to explain anything`).toBeGreaterThan(30);
      expect(reason.trim().endsWith("."), `${id} reason is not a sentence`).toBe(true);
    }
  });

  it("never leaves the panel without a working control", () => {
    for (const spec of everySpec) {
      const defaults = defaultsOf(spec);
      const inert = disabledReasons(spec, defaults);
      expect(inert.size, `${spec.id} ships every control disabled`).toBeLessThan(spec.controls.length);
    }
  });

  it("protects a required minimum list selection with a default that satisfies it", () => {
    for (const spec of specs) {
      for (const control of spec.controls) {
        if (control.kind !== "list" || !control.minSelected) continue;
        expect(
          control.default.length,
          `${spec.id}.${control.name} declares minSelected ${control.minSelected} but defaults to ${control.default.length}`,
        ).toBeGreaterThanOrEqual(control.minSelected);
        expect(control.options.length).toBeGreaterThanOrEqual(control.minSelected);
      }
    }
  });

  /*
   * WB-005 — the values that follow the reader. The store is module state, so
   * the same control name is the whole mechanism: two adapters that declare
   * `height` must be able to hand a value to each other, and the reader must be
   * able to take it back.
   */
  it("remembers a sticky value and forgets it on request", () => {
    rememberSticky("height", 380);
    expect(stickyValue("height")).toBe(380);
    forgetSticky(["height"]);
    expect(stickyValue("height")).toBeUndefined();
  });

  it("shares a sticky control name between sibling adapters", () => {
    /*
     * Both halves, for this assertion only.
     *
     * The rest of this file stays on the light registry because importing the
     * chart half pulls a rendering engine. Stickiness, though, is module state
     * that the two halves share by construction — a chart adapter's `height` and
     * `state` follow the reader from one chart to the next — and since the Forms
     * review removed the Input Playground the light registry alone declares only
     * one sticky control name (`button.size`), so this check would have passed by
     * accident on a single adapter and stopped proving that the value travels
     * between two.
     */
    const withCharts = [...specs, ...chartPlaygroundIds.flatMap((id) => {
      const spec = chartPlaygroundFor(id);
      return spec ? [spec] : [];
    })];
    const stickyBySpec = withCharts.map((spec) => ({
      id: spec.id,
      names: spec.controls.filter((control) => control.sticky).map((control) => control.name),
    }));
    /*
     * At least two adapters must declare the *same* sticky name, or "persists
     * across sibling specimens" describes nothing.
     *
     * Counted per name rather than intersected across every adapter: the old
     * `reduce` formulation only worked while every sticky adapter happened to
     * declare a name the others also had, so one adapter with a name of its own
     * (`button.size`) was enough to make the intersection empty and the check
     * fail for a reason that had nothing to do with stickiness. What matters is
     * that some name is declared twice.
     */
    const declaredBy = new Map<string, number>();
    for (const entry of stickyBySpec) {
      for (const name of new Set(entry.names)) {
        declaredBy.set(name, (declaredBy.get(name) ?? 0) + 1);
      }
    }
    const shared = [...declaredBy.entries()].filter(([, count]) => count >= 2).map(([name]) => name);
    expect(
      shared.length,
      `no sticky control name is declared by two adapters (declared: ${[...declaredBy.keys()].join(", ")})`,
    ).toBeGreaterThan(0);
  });
});
