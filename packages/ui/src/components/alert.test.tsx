import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Alert, AlertActions, AlertDescription, AlertTitle, Callout } from "./alert";
import { Button } from "./button";

describe("Alert", () => {
  it("is static by default: no live role is forced on page content", () => {
    render(<Alert title="Ingestion paused" description="No new candles since 04:00 UTC." />);
    const alert = screen.getByText("Ingestion paused").closest("[data-slot=alert]")!;
    expect(alert).not.toHaveAttribute("role");
  });

  it("opts into polite and assertive announcements explicitly", () => {
    const { rerender } = render(<Alert live="polite" title="Saved" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    rerender(<Alert live="assertive" tone="danger" title="Connection lost" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("carries the tone as data and renders the matching icon", () => {
    const { rerender } = render(<Alert tone="warning" title="Delayed data" />);
    const warning = screen.getByText("Delayed data").closest("[data-slot=alert]")!;
    expect(warning).toHaveAttribute("data-tone", "warning");
    expect(warning.querySelector("svg")).not.toBeNull();

    rerender(<Alert tone="warning" icon={null} title="Delayed data" />);
    expect(warning.querySelector("svg")).toBeNull();
  });

  it("keeps actions and dismissal opt-in", async () => {
    const onDismiss = vi.fn();
    const onClick = vi.fn();
    render(
      <Alert
        tone="danger"
        title="Widget unavailable"
        actions={<Button onClick={onClick}>Retry</Button>}
        onDismiss={onDismiss}
        dismissLabel="Dismiss market widget error"
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onClick).toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Dismiss market widget error" }));
    expect(onDismiss).toHaveBeenCalled();
  });

  it("supports composed bodies for rich content", () => {
    render(
      <Alert tone="info">
        <AlertTitle>Third-party data</AlertTitle>
        <AlertDescription>
          This widget loads resources from <a href="https://www.tradingview.com">TradingView</a>.
        </AlertDescription>
        <AlertActions>
          <Button size="sm">Read the policy</Button>
        </AlertActions>
      </Alert>,
    );
    expect(screen.getByRole("link", { name: "TradingView" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Read the policy" })).toBeInTheDocument();
  });
});

describe("Callout", () => {
  it("defaults to the quiet, non-live treatment", () => {
    render(<Callout tone="neutral" title="Runs are stored locally" />);
    const callout = screen.getByText("Runs are stored locally").closest("[data-slot=alert]")!;
    expect(callout).toHaveAttribute("data-emphasis", "quiet");
    expect(callout).not.toHaveAttribute("role");
  });
});
