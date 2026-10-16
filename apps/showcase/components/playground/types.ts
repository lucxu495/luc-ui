/*
 * The Playground's contracts.
 *
 * The Playground is a *documentation* tool, so its job is to be honest about
 * what a component's props can express. Two decisions follow from that and
 * shape every type here:
 *
 *  1. **A control is data, not code.** Each one declares its kind, its default
 *     and its domain, so the same declaration renders the control, validates
 *     the value, writes the code and describes the state to an AI agent. A
 *     hand-written panel per component would drift from all four.
 *  2. **Some props cannot be controlled, and that is stated rather than
 *     faked.** A callback, a ref, an arbitrary `ReactNode` or a structured
 *     fixture has no honest slider. Those are listed in `unsupported` with a
 *     reason, and the page says so.
 *
 * The Playground lives in the Showcase and is never exported from `@luc/ui`:
 * an application demo is not part of a component library's public API.
 */

import type { ReactNode } from "react";

/** The values a control set can hold, keyed by control name. */
export type ControlValues = Record<string, string | number | boolean | readonly string[]>;

export interface ControlOption {
  value: string;
  /** Shown in the control and used in the generated code. */
  label?: string;
}

/**
 * Which band of the panel a control belongs to (`03_SHOWCASE_DESIGN_SPEC.md`
 * §6.1).
 *
 * | group | meaning |
 * |---|---|
 * | `essential` | what the reader came for — the decision the component exists to make |
 * | `variant` | the family's declared variants and states: real choices, but second-order |
 * | `advanced` | what only a maintainer reaches for, and therefore collapsed |
 *
 * The default is `essential`, so an adapter that says nothing keeps its controls
 * visible: a silent default that hides a control is worse than a mislabelled one.
 */
export type ControlGroup = "essential" | "variant" | "advanced";

export const CONTROL_GROUPS: readonly ControlGroup[] = ["essential", "variant", "advanced"];

/**
 * Why a control cannot take effect *right now*.
 *
 * WB-004 / §6.2 rule 7: a control that cannot combine is disabled with a
 * one-line reason, never silently ignored. A control whose value the specimen
 * ignores while the generated code still writes it is the worst kind of
 * playground bug — the reader changes something, nothing moves, and they
 * conclude the component is broken. Declaring the condition turns that silence
 * into a sentence.
 */
export interface DisabledWhen {
  when: (values: ControlValues) => boolean;
  /** One line, in the reader's language, saying what has to change first. */
  reason: string;
}

interface ControlBase {
  /** Stable key in `ControlValues`, and the prop name by default. */
  name: string;
  /** The control's visible label. */
  label: string;
  /** One sentence of guidance, shown under the control. */
  help?: string;
  /** Where the value lands in the generated code, when it is not a same-named prop. */
  placement?: Placement;
  /**
   * A prop the element needs to be *correct*, not merely different.
   *
   * The engine omits a value equal to the declared default, because that is what
   * a developer writes: the library's default is the library's business. That
   * rule is wrong for an attribute the element cannot be honest without — the
   * accessible name of a field, the string a headline animates, the sender of a
   * message. Omitting those produced snippets that compiled and were unusable:
   * `<Input />` with no name is an accessibility defect, and `<KineticHeadline
   * />` with no text renders nothing.
   *
   * A required control is written into the code even at its default, and the
   * equivalence test expects it there.
   */
  required?: boolean;
  /** Panel band. Defaults to `essential`; see `ControlGroup`. */
  group?: ControlGroup;
  /** Present when the control is only meaningful in some states (`WB-004`). */
  disabledWhen?: DisabledWhen;
  /**
   * Presentation with one meaning everywhere, so the value follows the reader
   * to the next specimen (`WB-005`).
   *
   * A height of 320px means the same thing on every chart; a title does not, and
   * neither does a fixture choice. Only mark a control sticky when carrying its
   * value onto a sibling page would be *correct* rather than merely convenient.
   */
  sticky?: boolean;
}

export type Placement =
  | { kind: "prop"; name: string }
  /** Consumed by the element's children, which the adapter writes itself. */
  | { kind: "body" }
  /** Used inside the adapter's markup in a way the checker cannot name. */
  | { kind: "composed" };

export type Control = ControlBase &
  (
    | { kind: "boolean"; default: boolean }
    | { kind: "enum"; default: string; options: readonly ControlOption[] }
    | {
        kind: "number";
        default: number;
        min?: number;
        max?: number;
        step?: number;
        /** Rendered after the value, e.g. `ms` or `%`. */
        unit?: string;
      }
    | { kind: "text"; default: string; placeholder?: string }
    | { kind: "color"; default: string }
    /** A multi-select over a closed set, serialised as an array literal. */
    | {
        kind: "list";
        default: readonly string[];
        options: readonly ControlOption[];
        /**
         * How many entries must stay selected.
         *
         * An empty selection is a combination that cannot render — a chart with
         * no series is not a chart — so the last checked box is disabled with a
         * reason rather than letting the reader tick themselves into a blank
         * stage (`WB-004`).
         */
        minSelected?: number;
      }
    /**
     * A structured data fixture, chosen by key from a registry the adapter
     * declares. The value is the key; the adapter resolves it to real data, so
     * no user-supplied text is ever evaluated.
     */
    | { kind: "fixture"; default: string; options: readonly ControlOption[] }
    /** A `ReactNode` slot, chosen by key from a registry the adapter declares. */
    | { kind: "slot"; default: string; options: readonly ControlOption[] }
  );

/** A prop the Playground cannot honestly control, and why. */
export interface UnsupportedProp {
  name: string;
  reason: string;
}

export interface PlaygroundSpec {
  /** Matches `DocEntry.playground`. */
  id: string;
  /** The element's tag name in the generated code, e.g. `Button`. */
  component: string;
  /** The subpath the import comes from. */
  importPath: string;
  /**
   * Additional import lines the generated snippet needs.
   *
   * A slot control that resolves to another LUC component (a `Spinner` inside a
   * button) has to import it, or the code a reader copies does not compile.
   */
  extraImports?: readonly string[];
  controls: readonly Control[];
  /**
   * The control whose declared options *are* the preset row (§6.2 rule 6).
   *
   * Presets are derived from the adapter's own option list, never hand-typed,
   * so adding a variant to a component cannot leave the preset row behind. A
   * preset applies that one value and returns every other control to its
   * default, which is what "show me Outline" means.
   */
  presetSource?: string;
  /**
   * Presets a page declares itself, for combinations the option list cannot
   * express. Takes precedence over `presetSource`.
   */
  presets?: readonly Preset[];
  unsupported?: readonly UnsupportedProp[];
  /** One sentence per page about what the preview demonstrates. */
  stageNote?: string;
  /** The live preview. Pure function of the values. */
  render: (values: ControlValues) => ReactNode;
  /**
   * The element as a developer would write it.
   *
   * Adapters build this with `serializeProps(spec, values)` rather than string
   * concatenation, which is what makes the escaping and the type of each value
   * consistent across every adapter — and what lets the tests compare the props
   * in the code with the controls the reader actually changed.
   */
  serialize: (values: ControlValues) => string;
}

/** A named starting point, shown as a button above the controls. */
export interface Preset {
  id: string;
  label: string;
  /** One line on what the preset is for, used as the button's title. */
  description?: string;
  /** The values to apply; anything omitted returns to its default. */
  values: ControlValues;
}

/** The minimum an adapter needs to declare, used by the registry's type. */
export type PlaygroundSpecMap = Record<string, PlaygroundSpec>;
