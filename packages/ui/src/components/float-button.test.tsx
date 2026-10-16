import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FloatButton, FloatButtonGroup } from "./float-button";

describe("FloatButton", () => {
  it("is a named control, not a floating glyph", () => {
    render(<FloatButton icon={<svg />} label="New run" />);
    expect(screen.getByRole("button", { name: "New run" })).toBeInTheDocument();
  });

  it("pins to the corner it was given, below the overlay layer", () => {
    render(<FloatButton icon={<svg />} label="New run" />);
    const host = screen.getByRole("button", { name: "New run" }).closest("[data-slot=float-button]")!;
    expect(host).toHaveAttribute("data-side", "bottom-right");
    expect(host.className).toContain("fixed");
    /* A floating action must lose to a dialog, never cover it. */
    expect(host.className).toContain("--z-sticky");
    render(<FloatButton icon={<svg />} label="Export" side="top-left" fixed={false} />);
    const placed = screen.getByRole("button", { name: "Export" }).closest("[data-slot=float-button]")!;
    expect(placed).toHaveAttribute("data-side", "top-left");
    expect(placed.className).toContain("absolute");
  });

  it("shows a count without putting a bare number in the accessible name", () => {
    const { unmount } = render(<FloatButton icon={<svg />} label="Notifications, 3 unread" badge={3} />);
    expect(screen.getByRole("button", { name: "Notifications, 3 unread" })).toBeInTheDocument();
    expect(screen.getByText("3")).toHaveAttribute("aria-hidden", "true");
    unmount();
    render(<FloatButton icon={<svg />} label="Notifications, many" badge={128} />);
    expect(screen.getByText("99+")).toBeInTheDocument();
  });
});

describe("FloatButtonGroup", () => {
  const actions = [
    { id: "export", icon: <svg />, label: "Export" },
    { id: "share", icon: <svg />, label: "Share" },
  ];

  it("is closed until the trigger is pressed, and says so", async () => {
    const user = userEvent.setup();
    render(<FloatButtonGroup label="Quick actions" actions={actions} />);
    const trigger = screen.getByRole("button", { name: "Quick actions" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Export" })).not.toBeInTheDocument();

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("aria-controls");
    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
  });

  it("moves focus to the first action it revealed", async () => {
    const user = userEvent.setup();
    render(<FloatButtonGroup label="Quick actions" actions={actions} />);
    await user.click(screen.getByRole("button", { name: "Quick actions" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Export" })).toHaveFocus());
  });

  it("closes on Escape and hands focus back to the trigger", async () => {
    const user = userEvent.setup();
    render(<FloatButtonGroup label="Quick actions" actions={actions} />);
    const trigger = screen.getByRole("button", { name: "Quick actions" });
    await user.click(trigger);
    await waitFor(() => expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument());
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("button", { name: "Share" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes when the reader presses somewhere else", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button type="button">Elsewhere</button>
        <FloatButtonGroup label="Quick actions" actions={actions} />
      </div>,
    );
    await user.click(screen.getByRole("button", { name: "Quick actions" }));
    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Elsewhere" }));
    expect(screen.queryByRole("button", { name: "Export" })).not.toBeInTheDocument();
  });

  it("runs the action it was given, and keeps a disabled one out of reach", async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    render(
      <FloatButtonGroup
        label="Quick actions"
        actions={[
          { id: "export", icon: <svg />, label: "Export", onClick: onExport },
          { id: "share", icon: <svg />, label: "Share", disabled: true },
        ]}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Quick actions" }));
    await user.click(screen.getByRole("button", { name: "Export" }));
    expect(onExport).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Share" })).toBeDisabled();
  });
});
