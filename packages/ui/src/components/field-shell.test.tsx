/*
 * The field shell's state selectors.
 *
 * `inputShellClass` decides read-only, disabled and invalid presentation with
 * `:has()`. The trap this file guards is that `:has(:read-only)` does not mean
 * "the field is read-only" — `:read-only` matches *every* element that is not
 * `:read-write`, which includes a tag chip's `<span>`, a clear `<button>` and
 * an increment `<button>`. The rule therefore fired on any shell holding one of
 * those, so a filled `TagInput`, a `NumberInput` with its steppers and a
 * `SearchInput` with a value all rendered in the read-only dashed style while
 * remaining fully editable, in the wrong surface colour.
 *
 * jsdom has no style engine strong enough to assert the painted result, so the
 * contract pinned here is the selector itself plus the DOM fact it depends on:
 * the shell matches on an explicit read-only signal and never on `:read-only`.
 */

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { inputShellClass } from "./input";
import { Input } from "./input";
import { SearchInput } from "./search-input";
import { TagInput } from "../forms/inputs/tag-input";

describe("input shell read-only selector", () => {
  it("keys read-only on the attribute, never on `:read-only`", () => {
    expect(inputShellClass).not.toContain(":read-only");
    expect(inputShellClass).toContain("has-[[readonly]]");
    expect(inputShellClass).toContain("has-[[aria-readonly=true]]");
    expect(inputShellClass).toContain("has-[[contenteditable=false]]");
  });

  it("marks a readOnly Input so the selector can match it", () => {
    const { container } = render(<Input readOnly defaultValue="locked" aria-label="Locked" />);
    expect(container.querySelector("input")).toHaveAttribute("readonly");
  });

  it("leaves a filled TagInput without any read-only signal", () => {
    const { container } = render(<TagInput defaultValue={["BTC-USD", "ETH-USD"]} aria-label="Watchlist" />);
    const shell = container.querySelector('[data-slot="tag-input"]');
    expect(shell).not.toBeNull();
    /* The chips are the reason the old selector matched. */
    expect(shell!.querySelectorAll("span").length).toBeGreaterThan(0);
    expect(shell!.querySelector("input")).not.toHaveAttribute("readonly");
    expect(shell!.querySelector("[aria-readonly='true']")).toBeNull();
    expect(shell!.querySelector("[contenteditable='false']")).toBeNull();
  });

  it("leaves a SearchInput with a clear button without any read-only signal", () => {
    const { container } = render(<SearchInput defaultValue="runs" aria-label="Search" />);
    const shell = container.querySelector('[data-slot="input-shell"]');
    expect(shell).not.toBeNull();
    expect(shell!.querySelector("button")).not.toBeNull();
    expect(shell!.querySelector("input")).not.toHaveAttribute("readonly");
  });
});
