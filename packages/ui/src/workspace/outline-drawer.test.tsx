import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { OutlineDrawer, type OutlineNavGroup } from "./outline-drawer";

const GROUPS: OutlineNavGroup[] = [
  { id: "d1", label: "Market", index: "01", href: "/assets/btc?domain=market" },
  {
    id: "d2",
    label: "Trend",
    index: "02",
    href: "/assets/btc?domain=trend",
    items: [
      { id: "sec-trend", label: "Trend stack" },
      { id: "blk-price", label: "Price" },
    ],
  },
  { id: "d3", label: "Risk", index: "03", href: "/assets/btc?domain=risk" },
];

describe("OutlineDrawer", () => {
  it("expands only the requested group and anchors its items", () => {
    render(<OutlineDrawer label="Contents" groups={GROUPS} expandedGroupId="d2" activeItemId="blk-price" />);
    // Only the expanded group's items are in the document.
    expect(screen.getByRole("link", { name: "Trend stack" })).toHaveAttribute("href", "#sec-trend");
    const price = screen.getByRole("link", { name: "Price" });
    expect(price).toHaveAttribute("href", "#blk-price");
    expect(price).toHaveAttribute("aria-current", "true");
    // A collapsed group's items are absent, not merely hidden.
    expect(screen.queryByRole("link", { name: "Market performance" })).toBeNull();
  });

  it("marks the active group and keeps a single expanded group", () => {
    render(<OutlineDrawer label="Contents" groups={GROUPS} expandedGroupId="d2" />);
    expect(screen.getByRole("link", { name: "Trend" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Market" })).not.toHaveAttribute("aria-current");
  });

  it("navigates a group through the caller (a router push)", async () => {
    const onSelectGroup = vi.fn();
    render(<OutlineDrawer label="Contents" groups={GROUPS} onSelectGroup={onSelectGroup} />);
    await userEvent.click(screen.getByRole("link", { name: "Risk" }));
    expect(onSelectGroup).toHaveBeenCalledTimes(1);
    expect(onSelectGroup.mock.calls[0]?.[0]?.id).toBe("d3");
  });

  it("does not double-navigate when the caller handles a group click", async () => {
    const onSelectGroup = vi.fn(() => false as const);
    const { container } = render(
      <OutlineDrawer label="Contents" groups={GROUPS} onSelectGroup={onSelectGroup} />,
    );
    const link = screen.getByRole("link", { name: "Risk" });
    const event = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    link.dispatchEvent(event);
    // The caller said "handled", so the browser must not also follow the href.
    expect(event.defaultPrevented).toBe(true);
    expect(container).toBeTruthy();
  });

  it("collapses to a rail and reopens from it", async () => {
    function Harness() {
      const [open, setOpen] = useState(true);
      return <OutlineDrawer label="Contents" groups={GROUPS} open={open} onOpenChange={setOpen} expandedGroupId="d2" />;
    }
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Contents" }));
    const nav = screen.getByRole("navigation", { name: "Contents" });
    expect(nav).toHaveAttribute("data-state", "collapsed");
    // The rail keeps every group reachable by its ordinal.
    await userEvent.click(screen.getByRole("link", { name: "01" }));
    expect(screen.getByRole("navigation", { name: "Contents" })).toHaveAttribute("data-state", "expanded");
  });

  it("renders nothing when there are no groups", () => {
    const { container } = render(<OutlineDrawer label="Contents" groups={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
