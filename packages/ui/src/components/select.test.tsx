import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./select";

function Fixture(props: { disabledOption?: boolean } = {}) {
  return (
    <Select defaultValue="1m">
      <SelectTrigger aria-label="Timeframe">
        <SelectValue placeholder="Choose a range" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Short</SelectLabel>
          <SelectItem value="1d">1 day</SelectItem>
          <SelectItem value="1w">1 week</SelectItem>
        </SelectGroup>
        <SelectItem value="1m">1 month</SelectItem>
        <SelectItem value="1y" disabled={props.disabledOption}>
          1 year
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

describe("Select", () => {
  it("renders the selected value and opens with keyboard", async () => {
    render(<Fixture />);
    const trigger = screen.getByRole("combobox", { name: "Timeframe" });
    expect(trigger).toHaveTextContent("1 month");

    await userEvent.tab();
    expect(trigger).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(await screen.findByRole("listbox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "1 month" })).toHaveAttribute("aria-selected", "true");
  });

  it("selects with the keyboard and closes", async () => {
    const onValueChange = vi.fn();
    render(
      <Select defaultValue="1m" onValueChange={onValueChange}>
        <SelectTrigger aria-label="Timeframe">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1d">1 day</SelectItem>
          <SelectItem value="1m">1 month</SelectItem>
        </SelectContent>
      </Select>,
    );

    await userEvent.click(screen.getByRole("combobox", { name: "Timeframe" }));
    await screen.findByRole("listbox");
    await userEvent.keyboard("{ArrowUp}");
    await userEvent.keyboard("{Enter}");

    expect(onValueChange).toHaveBeenCalledWith("1d");
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
  });

  it("closes on Escape and restores focus to the trigger", async () => {
    render(<Fixture />);
    const trigger = screen.getByRole("combobox", { name: "Timeframe" });
    await userEvent.click(trigger);
    await screen.findByRole("listbox");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("marks disabled options as unavailable", async () => {
    render(<Fixture disabledOption />);
    await userEvent.click(screen.getByRole("combobox", { name: "Timeframe" }));
    const option = await screen.findByRole("option", { name: "1 year" });
    expect(option).toHaveAttribute("data-disabled");
  });

  it("shows the placeholder and never opens while disabled", async () => {
    render(
      <Select>
        <SelectTrigger aria-label="Status" disabled>
          <SelectValue placeholder="Any status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="live">Live</SelectItem>
        </SelectContent>
      </Select>,
    );
    const trigger = screen.getByRole("combobox", { name: "Status" });
    expect(trigger).toHaveTextContent("Any status");
    expect(trigger).toBeDisabled();
  });

  it("works as a controlled component", async () => {
    function Controlled() {
      const [value, setValue] = useState("1w");
      return (
        <>
          <span data-testid="current">{value}</span>
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger aria-label="Range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1w">1 week</SelectItem>
              <SelectItem value="1m">1 month</SelectItem>
            </SelectContent>
          </Select>
        </>
      );
    }
    render(<Controlled />);
    await userEvent.click(screen.getByRole("combobox", { name: "Range" }));
    await userEvent.click(await screen.findByRole("option", { name: "1 month" }));
    await waitFor(() => expect(screen.getByTestId("current")).toHaveTextContent("1m"));
  });
});
