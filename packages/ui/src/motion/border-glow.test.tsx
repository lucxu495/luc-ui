import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BorderGlow } from "./border-glow";
import { SpotlightSurface } from "./spotlight-surface";

describe("BorderGlow", () => {
  it("renders its children inside a labelled ring container", () => {
    render(
      <BorderGlow radius="lg" selected>
        <p>Featured run</p>
      </BorderGlow>,
    );
    expect(screen.getByText("Featured run")).toBeInTheDocument();
    const root = screen.getByText("Featured run").closest("[data-slot='border-glow']");
    expect(root).toHaveAttribute("data-selected", "true");
  });

  it("keeps decorative layers out of the accessibility tree", () => {
    const { container } = render(<BorderGlow>content</BorderGlow>);
    for (const layer of container.querySelectorAll("[data-slot^='border-glow-']")) {
      expect(layer).toHaveAttribute("aria-hidden", "true");
    }
  });
});

describe("SpotlightSurface", () => {
  it("renders a surface with a hidden light layer", () => {
    const { container } = render(
      <SpotlightSurface surface="raised">
        <p>Portfolio</p>
      </SpotlightSurface>,
    );
    expect(screen.getByText("Portfolio")).toBeInTheDocument();
    expect(container.querySelector('[data-slot="spotlight-layer"]')).toHaveAttribute("aria-hidden", "true");
  });
});
