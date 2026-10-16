import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NumberTicker } from "./number-ticker";

describe("NumberTicker", () => {
  it("renders the formatted value for assistive technology", () => {
    const { container } = render(<NumberTicker value={128431} kind="currency" />);
    expect(container.querySelector(".sr-only")).toHaveTextContent("$128,431");
  });

  it("reserves width with an invisible copy of the final value", () => {
    const { container } = render(<NumberTicker value={128431} />);
    const ticker = container.querySelector('[data-slot="number-ticker"]');
    expect(ticker?.querySelector(".invisible")?.textContent).toBe("128,431");
  });

  it("renders an em dash for missing data", () => {
    const { container } = render(<NumberTicker value={null} />);
    expect(container.querySelector(".sr-only")).toHaveTextContent("—");
  });

  it("accepts a custom formatter", () => {
    const { container } = render(
      <NumberTicker value={0.42} format={(value) => `${(value * 100).toFixed(0)} bps`} />,
    );
    expect(container.querySelector(".sr-only")).toHaveTextContent("42 bps");
  });
});
