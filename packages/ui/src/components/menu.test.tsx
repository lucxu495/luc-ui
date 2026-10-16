import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "./context-menu";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";

function DropdownFixture({ onSelect = () => {} }: { onSelect?: (value: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>Row actions</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Run</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => onSelect("open")}>
          Open report
          <DropdownMenuShortcut>⌘O</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem inset onSelect={() => onSelect("duplicate")}>
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => onSelect("delete")}>
          Delete run
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

describe("DropdownMenu", () => {
  it("opens from the trigger, lists its items and closes after choosing one", async () => {
    const onSelect = vi.fn();
    render(<DropdownFixture onSelect={onSelect} />);
    const trigger = screen.getByRole("button", { name: "Row actions" });

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    await userEvent.click(trigger);
    const menu = await screen.findByRole("menu");
    expect(within(menu).getAllByRole("menuitem")).toHaveLength(3);

    await userEvent.click(screen.getByRole("menuitem", { name: /Open report/ }));
    expect(onSelect).toHaveBeenCalledWith("open");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("opens with the keyboard and closes on Escape, restoring focus", async () => {
    render(<DropdownFixture />);
    const trigger = screen.getByRole("button", { name: "Row actions" });

    await userEvent.tab();
    expect(trigger).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await screen.findByRole("menu");
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("renders a shortcut hint inside the row without stealing its name", async () => {
    render(<DropdownFixture />);
    await userEvent.click(screen.getByRole("button", { name: "Row actions" }));
    const item = await screen.findByRole("menuitem", { name: /Open report/ });
    expect(within(item).getByText("⌘O")).toBeInTheDocument();
  });

  /*
   * Regression: `asChild` gives Radix's `Slot` exactly one child.
   *
   * The row used to append `{shortcut ? … : null}` beside the caller's child, so
   * `React.Children.count` was 2 even with no shortcut and `Slot` threw
   * "Primitive.div failed to slot onto its children". Luc Web's locale switch is
   * a `<Link asChild>` item, so opening the menu crashed the page.
   */
  it("slots a single anchor child onto the row when asChild is set", async () => {
    const onSelect = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Language</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem asChild onSelect={onSelect}>
            <a href="/zh/assets/btc/overview">简体中文</a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Language" }));
    const item = await screen.findByRole("menuitem", { name: "简体中文" });
    // The anchor *is* the row: the item's props are merged onto it, not wrapped.
    expect(item.tagName).toBe("A");
    expect(item).toHaveAttribute("href", "/zh/assets/btc/overview");
    expect(item).toHaveAttribute("data-slot", "dropdown-menu-item");
  });

  it("keeps a shortcut inside the slotted anchor when asChild carries one", async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Row actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem asChild shortcut="⌘O">
            <a href="/en/run">Run</a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Row actions" }));
    const item = await screen.findByRole("menuitem", { name: /Run/ });
    expect(within(item).getByText("⌘O")).toBeInTheDocument();
  });

  it("marks a destructive action by tone, not by hiding it from the menu", async () => {
    render(<DropdownFixture />);
    await userEvent.click(screen.getByRole("button", { name: "Row actions" }));
    const item = await screen.findByRole("menuitem", { name: "Delete run" });
    expect(item).toHaveAttribute("data-slot", "dropdown-menu-item");
    expect(item.className).toContain("text-fg-negative");
  });

  it("toggles a checkbox item and reports the new state", async () => {
    const onCheckedChange = vi.fn();
    function Fixture() {
      const [checked, setChecked] = useState(true);
      return (
        <DropdownMenu>
          <DropdownMenuTrigger>Columns</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem
              checked={checked}
              onCheckedChange={(next) => {
                setChecked(next);
                onCheckedChange(next);
              }}
            >
              Volume
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    render(<Fixture />);
    await userEvent.click(screen.getByRole("button", { name: "Columns" }));
    const item = await screen.findByRole("menuitemcheckbox", { name: "Volume" });
    expect(item).toHaveAttribute("aria-checked", "true");

    await userEvent.click(item);
    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });

  it("keeps one radio choice selected in a group", async () => {
    function Fixture() {
      const [value, setValue] = useState("daily");
      return (
        <DropdownMenu>
          <DropdownMenuTrigger>Interval</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value={value} onValueChange={setValue}>
              <DropdownMenuRadioItem value="hourly">Hourly</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="daily">Daily</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    render(<Fixture />);
    await userEvent.click(screen.getByRole("button", { name: "Interval" }));
    expect(await screen.findByRole("menuitemradio", { name: "Daily" })).toHaveAttribute("aria-checked", "true");

    await userEvent.click(screen.getByRole("menuitemradio", { name: "Hourly" }));
    await userEvent.click(screen.getByRole("button", { name: "Interval" }));
    expect(await screen.findByRole("menuitemradio", { name: "Hourly" })).toHaveAttribute("aria-checked", "true");
  });

  it("opens a submenu from the keyboard", async () => {
    const onSelect = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Export</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Overview</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Download</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onSelect={() => onSelect("csv")}>CSV</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onSelect("parquet")}>Parquet</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Export" }));
    const subTrigger = await screen.findByRole("menuitem", { name: "Download" });
    subTrigger.focus();
    await userEvent.keyboard("{ArrowRight}");

    const csv = await screen.findByRole("menuitem", { name: "CSV" });
    expect(screen.getAllByRole("menu").length).toBeGreaterThan(1);
    await userEvent.click(csv);
    expect(onSelect).toHaveBeenCalledWith("csv");
  });
});

describe("ContextMenu", () => {
  it("opens on right click against the target and runs its action", async () => {
    const onSelect = vi.fn();
    render(
      <ContextMenu>
        <ContextMenuTrigger>
          <div data-testid="chart-surface">Chart</div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={() => onSelect("pin")}>Pin timestamp</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive" onSelect={() => onSelect("reset")}>
            Reset zoom
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    fireEvent.contextMenu(screen.getByTestId("chart-surface"));
    const menu = await screen.findByRole("menu");
    expect(within(menu).getAllByRole("menuitem")).toHaveLength(2);

    await userEvent.click(screen.getByRole("menuitem", { name: "Pin timestamp" }));
    expect(onSelect).toHaveBeenCalledWith("pin");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });

  it("closes on Escape", async () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>
          <div data-testid="target">Target</div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Copy</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    fireEvent.contextMenu(screen.getByTestId("target"));
    await screen.findByRole("menu");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });
});
