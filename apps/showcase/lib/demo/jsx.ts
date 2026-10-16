/*
 * Turning a fixture into the JSX that reproduces it.
 *
 * The one invariant this file exists to keep: **the snippet a reader copies is
 * printed from the same object the specimen was rendered from.** A demo that
 * renders one thing and shows the code for another is the failure mode of every
 * "playground" that concatenates strings by hand, and it is invisible until a
 * reader pastes the code and gets something else.
 *
 * So there is a small, typed printer here rather than template literals in 200
 * demo modules:
 *
 *   demo({ component: "Delta", props: { value: 2.4 }, render: (props) => <Delta {...props} /> })
 *
 * `render` receives the very object whose literal is printed, which is why the
 * two cannot drift. The printer refuses anything it cannot express as data — a
 * function, a `ReactNode`, a class instance — instead of printing `[object
 * Object]`, because a demo that needs one of those has to say so (see
 * `composition` in `registry.tsx`).
 */

import type { ReactNode } from "react";
import type { DemoExample, DemoLayout, DemoSpec } from "./types";

/** Attributes that JSX writes bare when true rather than as `={true}`. */
function isBareBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/**
 * One value, as a JavaScript literal a reader could paste.
 *
 * Objects and arrays stay on one line while they are short, and break onto
 * several when they are not — a chart fixture printed as one 400-character
 * line is technically correct and useless to read. `indent` is the column the
 * continuation lines start at, so a nested value lines up under its key.
 */
export function literal(value: unknown, indent = 0): string {
  const pad = " ".repeat(indent);
  const inner = " ".repeat(indent + 2);

  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (Number.isNaN(value)) return "NaN";
    if (!Number.isFinite(value)) return value > 0 ? "Infinity" : "-Infinity";
    return String(value);
  }
  if (typeof value === "boolean") return String(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const parts = value.map((item) => literal(item, indent + 2));
    const oneLine = `[${parts.join(", ")}]`;
    if (!oneLine.includes("\n") && oneLine.length + indent <= 92) return oneLine;
    return `[\n${parts.map((part) => `${inner}${part},`).join("\n")}\n${pad}]`;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const entries = Object.entries(record).filter(([, item]) => item !== undefined);
    if (entries.length === 0) return "{}";
    const parts = entries.map(([key, item]) => {
      const name = IDENTIFIER.test(key) ? key : JSON.stringify(key);
      return `${name}: ${literal(item, indent + 2)}`;
    });
    const oneLine = `{ ${parts.join(", ")} }`;
    if (!oneLine.includes("\n") && oneLine.length + indent <= 92) return oneLine;
    return `{\n${parts.map((part) => `${inner}${part},`).join("\n")}\n${pad}}`;
  }

  throw new Error(
    `demo: a ${typeof value} cannot be printed as JSX. Use composition() and write the snippet by hand.`,
  );
}

/** One attribute: `name`, `name="text"` or `name={...}`. */
function attribute(name: string, value: unknown, indent: number): string {
  if (isBareBoolean(value)) return value ? name : `${name}={false}`;
  if (typeof value === "string") return `${name}=${JSON.stringify(value)}`;
  return `${name}={${literal(value, indent)}}`;
}

/**
 * The element, as a developer writes it.
 *
 * Props are printed in declaration order because that order is the demo
 * author's judgement about what matters (`data` first, cosmetic props after),
 * and alphabetical order would throw that away.
 */
export function jsxElement(
  component: string,
  props: Record<string, unknown>,
  children?: string,
): string {
  const entries = Object.entries(props).filter(([, value]) => value !== undefined);
  const selfClosing = children === undefined;
  const printed = entries.map(([name, value]) => attribute(name, value, 2));

  /* Keep short elements on one line; a tag with two or fewer short attributes
   * reads better inline, and a reader comparing it with the fixture above
   * follows it faster. */
  const inline = `<${component}${printed.map((part) => ` ${part}`).join("")}${
    children === undefined ? " />" : `>${children}</${component}>`
  }`;
  if (inline.length <= 88 && !inline.includes("\n")) return inline;

  const head = `<${component}`;
  const attrLines = printed.map((part) => `  ${part}`);
  if (selfClosing) return [head, ...attrLines, "/>"].join("\n");
  return [head, ...attrLines, `>`, `  ${children}`, `</${component}>`].join("\n");
}

export interface StructuredDemoOptions<T extends object> {
  id: string;
  /** What this specimen shows, in a phrase: "Variants", "Three sizes". */
  title?: string;
  /** The exported component's name, exactly as it is imported. */
  component: string;
  /** The fixture, and the props the snippet is printed from. */
  props: T;
  /** Text the element wraps, when it has children. */
  children?: string;
  /** Builds the specimen from the same props. Written as a spread, normally. */
  render: (props: T) => ReactNode;
  note?: string;
  layout?: DemoLayout;
  height?: number;
  bare?: boolean;
  /**
   * Other configurations of the same component.
   *
   * Declared here rather than in a second registry so a variant cannot be a
   * fixture the page's own `render` does not know how to draw: each variant's
   * props go through the same function, and its snippet through the same
   * printer. The code beside a variant is therefore the code that produced it,
   * exactly as for the main specimen.
   */
  examples?: readonly StructuredDemoExample<T>[];
}

export interface StructuredDemoExample<T extends object> {
  title: string;
  /** The complete fixture for this configuration — not a patch over the base. */
  props: T;
  note?: string;
}

/**
 * A demo whose snippet is printed from its own props.
 *
 * `render` is a function of the props rather than a node so the two cannot
 * disagree: there is one object, it is used twice.
 *
 * **Pass the component's props type explicitly** — `demo<StatCardProps>({ … })`.
 * Without it TypeScript widens `{ kind: "decimal" }` to `{ kind: string }` and
 * the spread stops type-checking, which is the compiler telling the truth: a
 * string is not a `NumericFormatKind`. Naming the type is also what makes the
 * fixture reviewable — the props object is checked against the same interface
 * the component declares.
 */
export function demo<T extends object>(options: StructuredDemoOptions<T>): DemoSpec {
  const { id, title, component, props, children, render, note, layout, height, bare, examples } =
    options;
  return {
    id,
    origin: "structured",
    node: render(props),
    code: jsxElement(component, props as Record<string, unknown>, children),
    source: { component, props: props as Record<string, unknown> },
    ...(title === undefined ? {} : { title }),
    ...(note === undefined ? {} : { note }),
    ...(layout === undefined ? {} : { layout }),
    ...(height === undefined ? {} : { height }),
    ...(bare === undefined ? {} : { bare }),
    ...(examples === undefined
      ? {}
      : {
          examples: examples.map<DemoExample>((example) => ({
            title: example.title,
            node: render(example.props),
            code: jsxElement(component, example.props as Record<string, unknown>, children),
            ...(example.note === undefined ? {} : { note: example.note }),
          })),
        }),
  };
}

export interface CompositionDemoOptions {
  id: string;
  /** What this specimen shows, in a phrase: "Variants", "Three sizes". */
  title?: string;
  /** The specimen, assembled from real components. */
  node: ReactNode;
  /** The snippet, written by hand because it is not a function of one props object. */
  code: string;
  note?: string;
  layout?: DemoLayout;
  height?: number;
  bare?: boolean;
  /** Other configurations, each with its own hand-written snippet. */
  examples?: readonly DemoExample[];
}

/** A demo for a composition the printer cannot derive. */
export function composition(options: CompositionDemoOptions): DemoSpec {
  const { id, title, node, code, note, layout, height, bare, examples } = options;
  return {
    id,
    origin: "composition",
    node,
    code: code.trim(),
    ...(title === undefined ? {} : { title }),
    ...(note === undefined ? {} : { note }),
    ...(layout === undefined ? {} : { layout }),
    ...(height === undefined ? {} : { height }),
    ...(bare === undefined ? {} : { bare }),
    ...(examples === undefined
      ? {}
      : { examples: examples.map((example) => ({ ...example, code: example.code.trim() })) }),
  };
}
