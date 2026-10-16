import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Combobox, type ComboboxOption } from "./combobox";

const OPTIONS: ComboboxOption[] = [
  { value: "btc", label: "Bitcoin", description: "BTC", group: "Crypto" },
  { value: "eth", label: "Ethereum", description: "ETH", group: "Crypto" },
  { value: "aapl", label: "Apple", description: "AAPL", group: "Equities" },
  { value: "spx", label: "S&P 500", description: "SPX", group: "Equities", disabled: true },
];

describe("Combobox", () => {
  it("filters as the user types and reports no results", async () => {
    render(<Combobox options={OPTIONS} aria-label="Instrument" />);
    const input = screen.getByRole("combobox", { name: "Instrument" });

    await userEvent.click(input);
    expect(await screen.findByRole("listbox")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(4);

    await userEvent.type(input, "eth");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option", { name: /Ethereum/ })).toBeInTheDocument();

    await userEvent.clear(input);
    await userEvent.type(input, "zzzz");
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByText("No matches")).toBeInTheDocument();
  });

  it("selects the top match with Enter right after typing", async () => {
    const onValueChange = vi.fn();
    render(<Combobox options={OPTIONS} aria-label="Instrument" onValueChange={onValueChange} />);
    const input = screen.getByRole("combobox", { name: "Instrument" });

    await userEvent.click(input);
    await userEvent.type(input, "eth");
    // Typing highlights the first match, so Enter is a single extra keystroke.
    await userEvent.keyboard("{Enter}");

    expect(onValueChange).toHaveBeenCalledWith(expect.objectContaining({ value: "eth" }));
    expect(input).toHaveValue("Ethereum");
  });

  it("navigates with the arrow keys and selects on Enter", async () => {
    const onValueChange = vi.fn();
    render(<Combobox options={OPTIONS} aria-label="Instrument" onValueChange={onValueChange} />);
    const input = screen.getByRole("combobox", { name: "Instrument" });

    await userEvent.click(input);
    await screen.findByRole("listbox");
    // Opening highlights the first option; one ArrowDown lands on Ethereum.
    await userEvent.keyboard("{ArrowDown}{Enter}");

    expect(onValueChange).toHaveBeenCalledWith(expect.objectContaining({ value: "eth" }));
    await waitFor(() => expect(input).toHaveValue("Ethereum"));
  });

  it("closes on Escape without changing the selection", async () => {
    render(<Combobox options={OPTIONS} aria-label="Instrument" />);
    const input = screen.getByRole("combobox", { name: "Instrument" });
    await userEvent.click(input);
    await screen.findByRole("listbox");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(input).toHaveAttribute("aria-expanded", "false"));
  });

  it("clears the query and the selection", async () => {
    const onValueChange = vi.fn();
    render(<Combobox options={OPTIONS} aria-label="Instrument" value={OPTIONS[0]!} onValueChange={onValueChange} />);
    const input = screen.getByRole("combobox", { name: "Instrument" });
    expect(input).toHaveValue("Bitcoin");

    await userEvent.click(screen.getByRole("button", { name: "Clear selection" }));
    expect(onValueChange).toHaveBeenCalledWith(null);
    await waitFor(() => expect(input).toHaveValue(""));
  });

  it("renders groups when options carry one", async () => {
    render(<Combobox options={OPTIONS} aria-label="Instrument" />);
    await userEvent.click(screen.getByRole("combobox", { name: "Instrument" }));
    expect(await screen.findByText("Crypto")).toBeInTheDocument();
    expect(screen.getByText("Equities")).toBeInTheDocument();
  });

  it("shows a loading row and does not offer disabled options", async () => {
    render(<Combobox options={[]} aria-label="Instrument" loading />);
    await userEvent.click(screen.getByRole("combobox", { name: "Instrument" }));
    expect(await screen.findByText("Searching…")).toBeInTheDocument();

    render(<Combobox options={OPTIONS} aria-label="Second" />);
    await userEvent.click(screen.getByRole("combobox", { name: "Second" }));
    expect(screen.getByRole("option", { name: /S&P 500/ })).toHaveAttribute("aria-disabled", "true");
  });

  it("supports a fully controlled query for async search", async () => {
    function Controlled() {
      const [query, setQuery] = useState("");
      const [loading, setLoading] = useState(false);
      return (
        <>
          <span data-testid="query">{query}</span>
          <Combobox
            options={OPTIONS}
            aria-label="Instrument"
            inputValue={query}
            loading={loading}
            onInputValueChange={(next) => {
              setQuery(next);
              setLoading(true);
              window.setTimeout(() => setLoading(false), 0);
            }}
          />
        </>
      );
    }
    render(<Controlled />);
    await userEvent.type(screen.getByRole("combobox", { name: "Instrument" }), "app");
    expect(screen.getByTestId("query")).toHaveTextContent("app");
    await waitFor(() => expect(screen.queryByText("Searching…")).not.toBeInTheDocument());
  });

  /*
   * A predefined value is a value, not a search.
   *
   * The defect this pins: the uncontrolled query used to be seeded from
   * `value.label`, and Downshift writes the selected label into the input value
   * whenever the menu opens — so a combobox that started with a choice opened
   * showing exactly that one row. The field must still *show* the label; what
   * must not happen is the list being filtered by it.
   */
  it("opens the whole list when a value is already selected", async () => {
    render(<Combobox options={OPTIONS} aria-label="Instrument" value={OPTIONS[2] ?? null} />);
    const input = screen.getByRole("combobox", { name: "Instrument" });

    expect(input).toHaveValue("Apple");

    await userEvent.click(input);
    expect(await screen.findByRole("listbox")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(4);

    /* Escape abandons the search: the field shows the selection again and the
     * next open is the whole list, not the query the reader left behind. */
    await userEvent.type(input, "bit");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    await userEvent.keyboard("{Escape}");
    expect(input).toHaveValue("Apple");

    await userEvent.click(input);
    expect(screen.getAllByRole("option")).toHaveLength(4);
  });

  it("lets a reader browse away from a selection and choose another option", async () => {
    const onValueChange = vi.fn();
    render(
      <Combobox
        options={OPTIONS}
        aria-label="Instrument"
        value={OPTIONS[2] ?? null}
        onValueChange={onValueChange}
      />,
    );
    const input = screen.getByRole("combobox", { name: "Instrument" });

    /* Clicking into the field selects the text, so the first keystroke starts a
     * new search rather than extending the label. */
    await userEvent.click(input);
    await userEvent.type(input, "bit");
    expect(screen.getAllByRole("option")).toHaveLength(1);

    await userEvent.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith(OPTIONS[0]);
    expect(input).toHaveValue("Bitcoin");

    /* And the menu is still a menu: opening it again offers everything. */
    await userEvent.click(input);
    expect(screen.getAllByRole("option")).toHaveLength(4);
  });

  it("applies a custom filter", async () => {
    render(
      <Combobox
        options={OPTIONS}
        aria-label="Instrument"
        filter={(option, query) => (option.description ?? "").toLowerCase().startsWith(query.toLowerCase())}
      />,
    );
    await userEvent.type(screen.getByRole("combobox", { name: "Instrument" }), "aa");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option", { name: /Apple/ })).toBeInTheDocument();
  });

  /*
   * V0.6 bug fix. The leading slot used to carry `size-4` on itself with no
   * rule for the glyph inside it, so Remix Icon's 24px `width`/`height`
   * attributes won and the magnifier rendered 24px, 4px below the field's
   * centre. jsdom has no layout, so this asserts the contract the geometry
   * depends on; `visual-qa.mjs` measures the rendered boxes in a real browser.
   */
  it("sizes the leading glyph from its slot instead of the provider's default", () => {
    render(<Combobox options={OPTIONS} aria-label="Instrument" />);
    const shell = document.querySelector('[data-slot="combobox-shell"]');
    const slot = shell?.querySelector('span[aria-hidden="true"]');
    expect(slot).not.toBeNull();
    expect(slot?.className).toContain("size-4");
    expect(slot?.className).toContain("place-items-center");
    expect(slot?.className).toContain("[&_svg]:size-full");
    expect(slot?.querySelector("svg")).not.toBeNull();
  });

  it("keeps the small and large slots on the same contract", () => {
    const { rerender } = render(<Combobox options={OPTIONS} aria-label="Instrument" size="sm" />);
    const slotOf = () => document.querySelector('[data-slot="combobox-shell"] span[aria-hidden="true"]');
    expect(slotOf()?.className).toContain("size-3.5");
    rerender(<Combobox options={OPTIONS} aria-label="Instrument" size="lg" />);
    expect(slotOf()?.className).toContain("size-[18px]");
    expect(slotOf()?.className).toContain("[&_svg]:size-full");
  });
});
