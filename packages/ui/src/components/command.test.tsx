import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RiSearchLine } from "@remixicon/react";
import { describe, expect, it, vi } from "vitest";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandMenu,
  CommandSeparator,
} from "./command";

function Fixture({ onOpenChange = vi.fn(), onRun = vi.fn() }) {
  return (
    <CommandMenu open onOpenChange={onOpenChange} label="Command menu">
      <Command label="Command menu">
        <CommandInput placeholder="Search commands" />
        <CommandList>
          <CommandEmpty>Nothing matches</CommandEmpty>
          <CommandGroup heading="Navigate">
            <CommandItem icon={<RiSearchLine />} shortcut="⌘K" onSelect={() => onRun("overview")}>
              Go to overview
            </CommandItem>
            <CommandItem onSelect={() => onRun("charts")}>Go to charts</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem disabled onSelect={() => onRun("disabled")}>
              Disabled command
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandMenu>
  );
}

describe("CommandMenu", () => {
  it("renders groups, shortcuts and a search field", async () => {
    render(<Fixture />);
    expect(await screen.findByRole("option", { name: /Go to overview/ })).toBeInTheDocument();
    expect(screen.getByText("Navigate")).toBeInTheDocument();
    expect(screen.getByText("⌘K")).toBeInTheDocument();
    // cmdk labels the field from the palette's own `label`, which is the
    // correct accessible name for a command input.
    expect(screen.getByRole("combobox")).toHaveAccessibleName(/Command menu/);
  });

  it("filters items and shows the empty state", async () => {
    render(<Fixture />);
    await userEvent.type(screen.getByRole("combobox"), "charts");
    await waitFor(() => expect(screen.getByRole("option", { name: /Go to charts/ })).toBeInTheDocument());
    expect(screen.queryByRole("option", { name: /Go to overview/ })).not.toBeInTheDocument();

    await userEvent.clear(screen.getByRole("combobox"));
    await userEvent.type(screen.getByRole("combobox"), "zzzz");
    expect(await screen.findByText("Nothing matches")).toBeInTheDocument();
  });

  it("runs the highlighted action with Enter", async () => {
    const onRun = vi.fn();
    render(<Fixture onRun={onRun} />);
    await screen.findByRole("option", { name: /Go to overview/ });
    await userEvent.keyboard("{Enter}");
    expect(onRun).toHaveBeenCalledWith("overview");
  });

  it("does not run a disabled item", async () => {
    const onRun = vi.fn();
    render(<Fixture onRun={onRun} />);
    await screen.findByRole("option", { name: /Go to overview/ });
    await userEvent.click(screen.getByRole("option", { name: /Disabled command/ }));
    expect(onRun).not.toHaveBeenCalledWith("disabled");
  });

  it("closes on Escape", async () => {
    const onOpenChange = vi.fn();
    render(<Fixture onOpenChange={onOpenChange} />);
    await screen.findByRole("option", { name: /Go to overview/ });
    await userEvent.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
