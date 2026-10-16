import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import * as fieldModule from "../components/field";
import { Input } from "../components/input";
import * as forms from "./index";

// The generated catalog derives its names from the public TypeScript barrel.
// Keep the forms entry's historical Field/Fieldset/FieldGroup regression guard
// without requiring a second hand-maintained list in PUBLIC_API.md.

const docsPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../docs/component-catalog.json",
);

function documentedExports(): string[] {
  const catalog = JSON.parse(readFileSync(docsPath, "utf8")) as {
    entries: Record<string, { exports?: Array<{ name: string; kind: string }> }>;
  };
  const entry = catalog.entries["./forms"];
  if (!entry?.exports) throw new Error("generated catalog has no @luc/ui/forms entry");
  return entry.exports.filter((item) => item.kind === "value").map((item) => item.name);
}

describe("@luc/ui/forms public API", () => {
  it("exports every name the generated catalog lists", () => {
    const documented = documentedExports();
    expect(documented).toContain("Field");
    expect(documented).toContain("Fieldset");
    expect(documented).toContain("FieldGroup");

    const missing = documented.filter((name) => !(name in forms));
    expect(missing).toEqual([]);
  });

  it("re-exports the field family from its single implementation", () => {
    // Identity, not just presence: a re-implementation would be a second source
    // of truth for label/ARIA wiring.
    expect(forms.Field).toBe(fieldModule.Field);
    expect(forms.Fieldset).toBe(fieldModule.Fieldset);
    expect(forms.FieldGroup).toBe(fieldModule.FieldGroup);
    expect(forms.useField).toBe(fieldModule.useField);
  });

  it("wires a label to its control when imported from the subpath", () => {
    render(
      <forms.Field label="Slug" description="Stable id">
        <Input />
      </forms.Field>,
    );
    expect(screen.getByLabelText("Slug")).toBeDefined();
  });

  it("keeps the rest of the family on the same entry", () => {
    for (const name of ["Form", "FormSection", "FieldArray", "NumberInput", "DropZone", "TagInput"]) {
      expect(forms).toHaveProperty(name);
    }
  });
});
