/*
 * A heading must not be able to break its container.
 *
 * The defect this pins, measured in the Showcase before it was a library test:
 * `ParallelCoordinatesChart` at `text-display` is wider than a 390 px phone, and
 * with `overflow-wrap: normal` that single token became the heading's min-content
 * width. The width then propagated through the flex parents and made the whole
 * page scroll sideways — nine routes, one cause. The Showcase fixed its own
 * titles; this asserts the fix is in the component every consumer uses.
 *
 * `overflow-wrap: anywhere` is the value that matters, not `break-word`: only
 * `anywhere` participates in intrinsic sizing, which is what stops the ancestor
 * from growing. jsdom computes no layout, so the class is the assertion — plus a
 * check that the component still renders the requested element, tone and text, so
 * the wrap cannot have been added by reshaping the component.
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Heading } from "./typography";

describe("Heading", () => {
  it("carries the wrap strategy at every size", () => {
    for (const size of ["display", "display-sm", "heading", "heading-sm", "title"] as const) {
      const { container, unmount } = render(<Heading size={size}>{size}</Heading>);
      expect(container.querySelector("h2")?.className).toContain("wrap-anywhere");
      unmount();
    }
  });

  it("keeps an unbreakable identifier on one element and in its own text", () => {
    const { getByRole } = render(
      <Heading as="h1" size="display">
        ParallelCoordinatesChart
      </Heading>,
    );
    const heading = getByRole("heading", { level: 1 });
    expect(heading.className).toContain("wrap-anywhere");
    expect(heading.className).toContain("text-display");
    expect(heading.textContent).toBe("ParallelCoordinatesChart");
  });

  it("does not turn the heading into a block of separate children", () => {
    /* The wrap is a CSS property, not a rewrite of the tree: a heading with an
     * icon and an inline badge still has to render them in order. */
    const { container } = render(
      <Heading as="h2" size="heading">
        Market <strong>depth</strong> <span aria-hidden="true">→</span>
      </Heading>,
    );
    const heading = container.querySelector("h2");
    expect(heading?.children.length).toBe(2);
    expect(heading?.textContent).toBe("Market depth →");
  });
});
