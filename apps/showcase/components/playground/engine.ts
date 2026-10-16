/*
 * The Playground engine: defaults, validation and code generation.
 *
 * Everything in this file is a pure function of `(spec, values)`. That is not
 * a style preference — it is what makes preview/code equivalence testable
 * without a browser. The panel calls `render(values)` for the stage and
 * `buildSnippet(spec, values)` for the code pane, from the *same* object, so
 * the two cannot disagree. The tests then assert the one thing that could
 * still drift: that every control the reader changed is visible in the code.
 */

import type { Control, ControlValues, PlaygroundSpec, Placement, Preset } from "./types";

/**
 * The controls in one panel band, in declaration order.
 *
 * `group` is metadata about *emphasis*, never about validity: an `advanced`
 * control is still a real prop, it is just collapsed by default (§6.1).
 */
export function controlsInGroup(
  spec: Pick<PlaygroundSpec, "controls">,
  group: "essential" | "variant" | "advanced",
): Control[] {
  return spec.controls.filter((control) => (control.group ?? "essential") === group);
}

/**
 * The preset row, derived from the adapter's own options (§6.2 rule 6).
 *
 * Derivation is the point: the presets *are* the variant control's domain, so a
 * component that gains a variant gains a preset without anyone editing a list,
 * and the two can never disagree. `spec.presets` wins when a page has a
 * combination to offer that a single option cannot express.
 */
export function presetsOf(spec: PlaygroundSpec): Preset[] {
  if (spec.presets?.length) return [...spec.presets];
  if (!spec.presetSource) return [];
  const control = spec.controls.find((candidate) => candidate.name === spec.presetSource);
  if (!control || (control.kind !== "enum" && control.kind !== "fixture" && control.kind !== "slot"))
    return [];
  return control.options.map((option) => ({
    id: `${control.name}:${option.value}`,
    label: option.label ?? option.value,
    values: { [control.name]: option.value },
  }));
}

/** The preset whose values are exactly what the panel currently holds, if any. */
export function activePreset(spec: PlaygroundSpec, values: ControlValues): string | null {
  for (const preset of presetsOf(spec)) {
    const candidate = normalizeValues(spec, { ...defaultsOf(spec), ...preset.values });
    const same = Object.keys(candidate).every((key) => {
      const a = candidate[key];
      const b = values[key];
      return Array.isArray(a) && Array.isArray(b) ? a.join("\u0000") === b.join("\u0000") : a === b;
    });
    if (same) return preset.id;
  }
  return null;
}

/**
 * Why each control is currently inert, keyed by control name.
 *
 * Two sources, deliberately unified: a control may declare `disabledWhen`
 * (the combination is not meaningful), and a `list` may declare `minSelected`
 * (the combination cannot render). Both end up as one sentence next to the
 * control, which is what §6.2 rule 7 asks for.
 */
export function disabledReasons(
  spec: Pick<PlaygroundSpec, "controls">,
  values: ControlValues,
): Map<string, string> {
  const reasons = new Map<string, string>();
  for (const control of spec.controls) {
    if (control.disabledWhen?.when(values)) reasons.set(control.name, control.disabledWhen.reason);
  }
  return reasons;
}

/**
 * The options of a `list` control that must stay checked, so the last one
 * cannot be unticked.
 */
export function lockedListMin(control: Control, selected: readonly string[]): boolean {
  return control.kind === "list" && (control.minSelected ?? 0) >= selected.length;
}

/** The declared defaults, as a fresh object. */
export function defaultsOf(spec: Pick<PlaygroundSpec, "controls">): ControlValues {
  const values: ControlValues = {};
  for (const control of spec.controls) {
    values[control.name] = Array.isArray(control.default)
      ? [...(control.default as readonly string[])]
      : control.default;
  }
  return values;
}

/**
 * Make a value legal for its control.
 *
 * A control is a promise about a domain; a value outside it is a bug in the
 * caller, not something to pass through. Numbers are clamped, enums fall back
 * to the default when the option is unknown, lists are filtered, and text is
 * taken as-is because text has no domain.
 */
export function normalizeValue(control: Control, value: unknown): ControlValues[string] {
  switch (control.kind) {
    case "boolean":
      return typeof value === "boolean" ? value : control.default;
    case "number": {
      const numeric = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(numeric)) return control.default;
      const clamped =
        control.min !== undefined && numeric < control.min
          ? control.min
          : control.max !== undefined && numeric > control.max
            ? control.max
            : numeric;
      return clamped;
    }
    case "enum":
      return typeof value === "string" && control.options.some((option) => option.value === value)
        ? value
        : control.default;
    case "list": {
      const list = Array.isArray(value) ? value : [];
      const allowed = new Set(control.options.map((option) => option.value));
      return list.filter((item): item is string => typeof item === "string" && allowed.has(item));
    }
    case "fixture":
    case "slot":
      return typeof value === "string" && control.options.some((option) => option.value === value)
        ? value
        : control.default;
    case "text":
    case "color":
      return typeof value === "string" ? value : control.default;
  }
}

/** The whole set, normalized. Used on every change, so a value can never leave
 * its control's domain even with a hand-edited URL. */
export function normalizeValues(spec: Pick<PlaygroundSpec, "controls">, values: ControlValues): ControlValues {
  const normalized: ControlValues = {};
  for (const control of spec.controls) {
    normalized[control.name] = normalizeValue(control, values[control.name]);
  }
  return normalized;
}

function sameValue(a: ControlValues[string] | undefined, b: ControlValues[string] | undefined): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => item === b[index]);
  }
  return a === b;
}

/** True when the reader has changed anything from the declared defaults. */
export function isDirty(spec: Pick<PlaygroundSpec, "controls">, values: ControlValues): boolean {
  return spec.controls.some((control) => !sameValue(values[control.name], control.default));
}

export function placementOf(control: Control): Placement {
  return control.placement ?? { kind: "prop", name: control.name };
}

/** Quote a string for a JSX attribute, escaping what has to be escaped. */
function attributeString(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, "&quot;").replace(/\n/g, "\\n")}"`;
}

/**
 * One attribute as JSX, or `null` when it should be omitted.
 *
 * A value equal to the declared default is omitted, because that is what a
 * developer writes: the library's default is the library's business. Booleans
 * follow JSX, not HTML: `true` is the bare-name shorthand (which is also the
 * only way to say it — `prop="true"` would be the string), and `false` is
 * `={false}`, because omitting a boolean prop does not write it.
 */
export function serializeAttribute(
  control: Control,
  name: string,
  value: ControlValues[string] | undefined,
): string | null {
  if (value === undefined) return null;
  /*
   * A default is omitted, except when the control declares that the element
   * cannot honestly omit it (`required`). See `ControlBase.required`.
   */
  if (sameValue(value, control.default) && control.required !== true) return null;
  if (control.kind === "boolean") {
    if (value === true) return name;
    return value === false ? `${name}={false}` : null;
  }
  switch (control.kind) {
    case "number":
      return `${name}={${String(value)}}`;
    case "list": {
      const list = Array.isArray(value) ? value : [];
      if (list.length === 0) return `${name}={[]}`;
      return `${name}={[${list.map((item) => attributeString(item)).join(", ")}]}`;
    }
    case "enum":
    case "text":
    case "color":
    case "fixture":
    case "slot":
      return `${name}=${attributeString(String(value))}`;
  }
}

/**
 * The props markup for a configuration, in the order the controls declare.
 *
 * Adapters call this instead of building attribute strings by hand, so that
 * quoting, boolean handling and default-omission are identical everywhere.
 */
export function serializeProps(
  spec: Pick<PlaygroundSpec, "controls">,
  values: ControlValues,
): string {
  const parts: string[] = [];
  for (const control of spec.controls) {
    const placement = placementOf(control);
    if (placement.kind !== "prop") continue;
    const attribute = serializeAttribute(control, placement.name, values[control.name]);
    if (attribute !== null) parts.push(attribute);
  }
  return parts.length ? ` ${parts.join(" ")}` : "";
}

export interface Snippet {
  /** The import line(s), already formatted. */
  imports: string;
  /** The element, as a developer would write it. */
  code: string;
  /** imports + blank line + code: what the copy button puts on the clipboard. */
  full: string;
}

/** Collapse a multi-line element's indentation so it can be re-indented safely. */
function normalizeIndent(code: string): string {
  const lines = code.replace(/\t/g, "  ").split("\n");
  while (lines.length && lines[0]?.trim() === "") lines.shift();
  while (lines.length && lines[lines.length - 1]?.trim() === "") lines.pop();
  const indents = lines
    .slice(1)
    .filter((line) => line.trim().length > 0)
    .map((line) => line.match(/^ */)?.[0].length ?? 0);
  const shared = indents.length ? Math.min(...indents) : 0;
  return lines
    .map((line, index) => (index === 0 || shared === 0 ? line : line.slice(shared)))
    .join("\n");
}

/** The import line for a spec — the package path and the symbols it needs. */
export function importStatement(spec: Pick<PlaygroundSpec, "component" | "importPath">): string {
  return `import { ${spec.component} } from "${spec.importPath}";`;
}

export function buildSnippet(spec: PlaygroundSpec, values: ControlValues): Snippet {
  const imports = [importStatement(spec), ...(spec.extraImports ?? [])].join("\n");
  const code = normalizeIndent(spec.serialize(values));
  return { imports, code, full: `${imports}\n\n${code}` };
}

/* ---------------------------------------------------------------- inspection */

/**
 * The prop names a configuration *must* show up in the generated element.
 *
 * This is the invariant the equivalence test checks. It ignores controls whose
 * placement is `body` or `composed` (the adapter writes those itself), and
 * ignores values still at their default (the code omits them on purpose).
 */
export function expectedPropNames(spec: PlaygroundSpec, values: ControlValues): string[] {
  const names: string[] = [];
  for (const control of spec.controls) {
    const placement = placementOf(control);
    if (placement.kind !== "prop") continue;
    if (sameValue(values[control.name], control.default) && control.required !== true) continue;
    names.push(placement.name);
  }
  return names.sort();
}

/**
 * Prop names found in an element's opening tag.
 *
 * Deliberately a small, explicit scan rather than a JSX parser: it only has to
 * understand the output of `serializeProps`, and the test compares names it
 * generated with names it can see. A false positive here is impossible without
 * a false positive in `serializeProps` too.
 */
export function propsInElement(element: string): string[] {
  const openTag = element.slice(0, element.indexOf(">") + 1);
  /* Attribute values may contain spaces and words; removing the quoted strings
   * first means only real attribute names are left to find. */
  const inside = openTag
    .replace(/^<[A-Za-z][A-Za-z0-9.]*/, "")
    .replace(/"[^"]*"/g, '""')
    .replace(/\/?>$/, "");
  const names: string[] = [];
  for (const match of inside.matchAll(/(?:^|\s)([A-Za-z][A-Za-z0-9-]*)(?==|\s|>|$)/g)) {
    const name = match[1];
    if (name && !names.includes(name)) names.push(name);
  }
  return names.sort();
}
