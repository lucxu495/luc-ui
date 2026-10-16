/**
 * Tests for the parts of the release pipeline that are logic rather than I/O.
 *
 * `canonicalDeclarations` is the one piece of the release check that can be
 * wrong in a way nobody notices: if it normalises too little, the check fails
 * on every rebuild and gets ignored; if it normalises too much, a real
 * declaration change passes the check. Both directions are asserted here.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { canonicalDeclarations } from "../packages/ui/scripts/lib/release.mjs";

const A = `export interface BadgeProps {
  tone?: "outline" | "neutral" | "accent" | null | undefined;
  size?: "sm" | "md" | "lg";
}
`;

/** The same declarations with two unions emitted in another order. */
const B = `export interface BadgeProps {
  tone?: "neutral" | "accent" | "outline" | null | undefined;
  size?: "lg" | "sm" | "md";
}
`;

test("union member order is not a difference", () => {
  assert.notEqual(A, B);
  assert.equal(canonicalDeclarations(A, "a.d.ts"), canonicalDeclarations(B, "b.d.ts"));
});

test("a changed member, a changed comment and a changed name are differences", () => {
  const canonical = canonicalDeclarations(A, "a.d.ts");
  assert.notEqual(canonicalDeclarations(A.replace('"accent"', '"danger"'), "a.d.ts"), canonical);
  assert.notEqual(canonicalDeclarations(A.replace("BadgeProps", "BadgeProps2"), "a.d.ts"), canonical);
  assert.notEqual(canonicalDeclarations(`${A}\n// a note\n`, "a.d.ts"), canonical);
});

test("everything outside a union type survives verbatim", () => {
  const source = `import type { VariantProps } from "class-variance-authority";
export declare function Badge({ className }: { className?: string }): import("react").JSX.Element;
export type T = { a: 1 } | { b: 2 };
`;
  const canonical = canonicalDeclarations(source, "a.d.ts");
  assert.match(canonical, /import type \{ VariantProps \} from "class-variance-authority";/);
  assert.match(canonical, /import\("react"\)\.JSX\.Element/);
  assert.match(canonical, /\{ a: 1 \} \| \{ b: 2 \}/);
});

/*
 * A parenthesised member is normalised inside its own parentheses and sorted
 * among its siblings as one member. `"b" | ("a" | "c")` is therefore not
 * flattened into `"a" | "b" | "c"` — a limitation, and one the declaration
 * emitter never exercises: it prints unions flat. What must hold is that the
 * order of the members *and* of the inner union stops mattering.
 */
test("nested unions are normalised in place and reorder-insensitively", () => {
  const canonical = canonicalDeclarations(`export type T = "b" | ("c" | "a");\n`, "a.d.ts");
  assert.equal(canonical, `export type T = "b" | ("a" | "c");\n`);
  assert.equal(canonicalDeclarations(`export type T = ("c" | "a") | "b";\n`, "a.d.ts"), canonical);
});

test("the union-member order the bundler varies is the order this ignores", () => {
  // The real pair, taken from two builds of `src/components/badge.tsx`.
  const wrap = (tone) => `export interface BadgeProps {\n  tone?: ${tone};\n}\n`;
  const first = wrap('"outline" | "neutral" | "accent" | "positive" | "negative" | "warning" | "info" | null | undefined');
  const second = wrap('"accent" | "outline" | "neutral" | "positive" | "negative" | "warning" | "info" | null | undefined');
  assert.notEqual(first, second);
  assert.equal(canonicalDeclarations(first, "a.d.ts"), canonicalDeclarations(second, "a.d.ts"));
});
