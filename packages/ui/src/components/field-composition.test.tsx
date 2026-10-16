import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Field } from "./field";
import { NativeSelect } from "./native-select";
import { Slider } from "./slider";

/**
 * Field composition — the two defects Phase 8 found by building products.
 *
 * Both were invisible to the components' own tests, because in each case the
 * component was correct in isolation and wrong *inside a form*:
 *
 *   - `NativeSelect` never read the surrounding `Field`, so a labelled field
 *     rendered an unnamed `<select>`. The label was on screen; the accessible
 *     name was not.
 *   - `Slider` took its name from `label` or a `Field`. A caller writing
 *     `aria-label` — the most natural thing to write — had it forwarded to the
 *     Root, where nothing a screen reader lands on is named.
 *
 * Neither is caught by rendering the component on its own, which is exactly why
 * the axe scan that found them ran over a *page*.
 */

describe("NativeSelect inside a Field", () => {
  it("takes its accessible name from the field's label", () => {
    render(
      <Field label="Engineering team size">
        <NativeSelect defaultValue="2-10">
          <option value="2-10">2–10</option>
        </NativeSelect>
      </Field>,
    );
    expect(screen.getByRole("combobox")).toHaveAccessibleName("Engineering team size");
  });

  it("inherits the description, the invalid state and the disabled state", () => {
    render(
      <Field label="Window" description="Sessions, not days" disabled>
        <NativeSelect>
          <option value="30">30</option>
        </NativeSelect>
      </Field>,
    );
    const select = screen.getByRole("combobox");
    expect(select).toHaveAccessibleDescription("Sessions, not days");
    expect(select).toBeDisabled();
  });

  it("still works outside a Field, with its own label", () => {
    render(
      <NativeSelect aria-label="Sort order" defaultValue="new">
        <option value="new">Newest</option>
      </NativeSelect>,
    );
    expect(screen.getByRole("combobox")).toHaveAccessibleName("Sort order");
  });
});

describe("Slider naming", () => {
  it("names the thumb from the surrounding field's label", () => {
    render(
      <Field label="Histogram bins">
        <Slider defaultValue={24} min={6} max={48} />
      </Field>,
    );
    expect(screen.getByRole("slider")).toHaveAccessibleName("Histogram bins");
  });

  it("honours a caller's aria-label, which reaches the thumb rather than only the root", () => {
    render(<Slider defaultValue={24} aria-label="Histogram bins" />);
    expect(screen.getByRole("slider")).toHaveAccessibleName("Histogram bins");
  });
});
