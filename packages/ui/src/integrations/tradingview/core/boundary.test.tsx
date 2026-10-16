import { fireEvent, render, screen } from "@testing-library/react";
import { Fragment, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { TradingViewBoundary } from "./boundary";

function Thrower({ when }: { when: boolean }) {
  if (when) throw new Error("construction failed");
  return <span>widget</span>;
}

describe("TradingViewBoundary", () => {
  it("contains a construction throw and keeps the rest of the page mounted", () => {
    const onError = vi.fn();
    render(
      <>
        <TradingViewBoundary onError={onError}>
          <Thrower when />
        </TradingViewBoundary>
        <p>sibling content</p>
      </>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/market widget unavailable/i);
    expect(screen.getByText("sibling content")).toBeInTheDocument();
    expect(onError).toHaveBeenCalledTimes(1);
    // The thrown message is internal; it must never reach the DOM.
    expect(screen.getByRole("alert")).not.toHaveTextContent(/construction failed/i);
  });

  it("renders its children when nothing throws", () => {
    render(
      <TradingViewBoundary>
        <Thrower when={false} />
      </TradingViewBoundary>,
    );
    expect(screen.getByText("widget")).toBeInTheDocument();
  });

  it("clears the error when resetKey changes", () => {
    function Host() {
      const [key, setKey] = useState(0);
      return (
        <Fragment>
          <button type="button" onClick={() => setKey((value) => value + 1)}>
            change
          </button>
          <TradingViewBoundary resetKey={key}>
            <Thrower when={key === 0} />
          </TradingViewBoundary>
        </Fragment>
      );
    }
    render(<Host />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "change" }));
    expect(screen.getByText("widget")).toBeInTheDocument();
  });
});
