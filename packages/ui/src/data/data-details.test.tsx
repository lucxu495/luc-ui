import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DataDetails } from "./data-details";

/**
 * The exact-rows control.
 *
 * Two things matter and both are pinned here: the rows are *not* in the reading
 * flow until the reader asks for them, and asking for them opens a real,
 * labelled panel — a screen reader has to be able to name it, and Escape has to
 * close it.
 */
function renderControl() {
  return render(
    <DataDetails slot="indicator-table" title="Rolling 30-day return" description="The exact served rows.">
      <table>
        <tbody>
          <tr>
            <td>2026-09-29</td>
            <td>1.5%</td>
          </tr>
        </tbody>
      </table>
    </DataDetails>,
  );
}

describe("DataDetails", () => {
  it("keeps the rows behind a labelled trigger, then opens a named panel", async () => {
    const user = userEvent.setup();
    const { container } = renderControl();
    expect(container.querySelector('[data-slot="indicator-table"]')).not.toBeNull();
    expect(screen.queryByText("2026-09-29")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Data" }));
    expect(await screen.findByText("Rolling 30-day return")).toBeInTheDocument();
    expect(screen.getByText("The exact served rows.")).toBeInTheDocument();
    expect(screen.getByText("2026-09-29")).toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    renderControl();
    await user.click(screen.getByRole("button", { name: "Data" }));
    await screen.findByText("Rolling 30-day return");

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Rolling 30-day return")).not.toBeInTheDocument());
  });
});
