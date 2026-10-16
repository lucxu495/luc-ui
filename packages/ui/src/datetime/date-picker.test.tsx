import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendarDate, CalendarDateTime, parseZonedDateTime } from "@internationalized/date";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Field } from "../components/field";
import { DateField, DatePicker, DateRangePicker, type DateRangePreset } from "./date-picker";
import { DateTimePicker, ZonedDateTimePicker } from "./datetime-picker";
import { formatDateOnly } from "./format";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** A day cell is a pressable whose accessible name carries its state suffix. */
function dayButton(name: string) {
  return screen.getByRole("button", { name: new RegExp(escapeRegExp(name)) });
}

describe("DateField", () => {
  it("edits a date through locale-ordered segments", () => {
    render(<DateField aria-label="Start" locale="en-GB" defaultValue={new CalendarDate(2026, 9, 27)} />);
    const segments = screen.getAllByRole("spinbutton");
    // en-GB order is day / month / year.
    expect(segments[0]).toHaveAttribute("aria-valuenow", "27");
    expect(segments[1]).toHaveAttribute("aria-valuenow", "9");
    expect(segments[2]).toHaveAttribute("aria-valuenow", "2026");
  });

  it("changes the order with the locale, not with a hard-coded format", () => {
    const { unmount } = render(
      <DateField aria-label="Start" locale="en-US" defaultValue={new CalendarDate(2026, 9, 27)} />,
    );
    const american = screen.getAllByRole("spinbutton").map((segment) => segment.getAttribute("aria-valuenow"));
    unmount();
    render(<DateField aria-label="Start" locale="en-GB" defaultValue={new CalendarDate(2026, 9, 27)} />);
    const british = screen.getAllByRole("spinbutton").map((segment) => segment.getAttribute("aria-valuenow"));
    expect(american).toEqual(["9", "27", "2026"]);
    expect(british).toEqual(["27", "9", "2026"]);
  });
});

describe("DatePicker", () => {
  it("opens a calendar and reports the chosen day as a CalendarDate", async () => {
    const onValueChange = vi.fn();
    render(<DatePicker aria-label="Report date" locale="en-US" onValueChange={onValueChange} />);

    await userEvent.click(screen.getByRole("button", { name: /calendar/i }));
    await userEvent.click(await screen.findByRole("button", { name: /15, 2026/ }));
    await waitFor(() => expect(onValueChange).toHaveBeenCalled());
    expect(onValueChange.mock.calls[0]?.[0]).toBeInstanceOf(CalendarDate);
  });

  it("clears back to null", async () => {
    const onValueChange = vi.fn();
    render(
      <DatePicker
        aria-label="Report date"
        locale="en-US"
        defaultValue={new CalendarDate(2026, 9, 27)}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /calendar/i }));
    await userEvent.click(await screen.findByRole("button", { name: "Clear" }));
    expect(onValueChange).toHaveBeenCalledWith(null);
  });

  it("uses an injected today for the Today action", async () => {
    const onValueChange = vi.fn();
    render(
      <DatePicker
        aria-label="Report date"
        locale="en-US"
        todayValue={new CalendarDate(2026, 3, 1)}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /calendar/i }));
    await userEvent.click(await screen.findByRole("button", { name: "Today" }));
    expect(onValueChange).toHaveBeenCalledWith(new CalendarDate(2026, 3, 1));
  });

  it("wires the field label, description and error to the segmented control", () => {
    const { rerender } = render(
      <Field label="Settlement date" description="Value date, not trade date.">
        <DatePicker locale="en-US" />
      </Field>,
    );
    const group = screen.getByRole("group", { name: /Settlement date/ });
    expect(document.getElementById(group.getAttribute("aria-describedby")!)).toHaveTextContent(
      "Value date, not trade date.",
    );

    rerender(
      <Field label="Settlement date" error="Pick a weekday">
        <DatePicker locale="en-US" />
      </Field>,
    );
    const invalidGroup = screen.getByRole("group", { name: /Settlement date/ });
    expect(invalidGroup).toHaveAttribute("data-invalid", "true");
    // React Aria reports invalidity on the editable segments themselves.
    expect(screen.getAllByRole("spinbutton")[0]).toHaveAttribute("aria-invalid", "true");
  });

  it("keeps a controlled value in the consumer's hands", async () => {
    function Fixture() {
      const [value, setValue] = useState<CalendarDate | null>(new CalendarDate(2026, 1, 5));
      return (
        <>
          <DatePicker aria-label="Controlled" locale="en-US" value={value} onValueChange={setValue} />
          <output data-testid="value">{value ? formatDateOnly(value, { locale: "en-US" }) : "empty"}</output>
        </>
      );
    }
    render(<Fixture />);
    const segments = screen.getAllByRole("spinbutton");
    segments[0]!.focus();
    await userEvent.keyboard("{ArrowUp}");
    // en-US order is month / day / year, so the first segment is the month.
    await waitFor(() => expect(screen.getByTestId("value")).toHaveTextContent("Feb 5, 2026"));
  });
});

describe("DateRangePicker", () => {
  const presets: DateRangePreset[] = [
    {
      id: "last-7",
      label: "Last 7 days",
      range: ({ today }) => ({ start: today.subtract({ days: 6 }), end: today }),
    },
    {
      id: "q3",
      label: "Q3 2026",
      range: { start: new CalendarDate(2026, 7, 1), end: new CalendarDate(2026, 9, 30) },
    },
  ];

  it("resolves a preset factory against the injected today and selects it", async () => {
    const onValueChange = vi.fn();
    render(
      <DateRangePicker
        aria-label="Reporting period"
        locale="en-US"
        months={1}
        todayValue={new CalendarDate(2026, 9, 30)}
        presets={presets}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /calendar/i }));
    await userEvent.click(await screen.findByRole("button", { name: "Last 7 days" }));
    expect(onValueChange).toHaveBeenCalledWith({
      start: new CalendarDate(2026, 9, 24),
      end: new CalendarDate(2026, 9, 30),
    });
  });

  it("marks the matching preset as selected", async () => {
    render(
      <DateRangePicker
        aria-label="Reporting period"
        locale="en-US"
        months={1}
        presets={presets}
        defaultValue={{ start: new CalendarDate(2026, 7, 1), end: new CalendarDate(2026, 9, 30) }}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /calendar/i }));
    const preset = await screen.findByRole("button", { name: "Q3 2026" });
    expect(preset.className).toContain("bg-accent-soft");
  });

  it("selects a range from the calendar and shows both ends", async () => {
    const onValueChange = vi.fn();
    render(
      <DateRangePicker
        aria-label="Reporting period"
        locale="en-US"
        months={1}
        defaultValue={{ start: new CalendarDate(2026, 9, 8), end: new CalendarDate(2026, 9, 10) }}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /calendar/i }));
    await userEvent.click(dayButton("Monday, September 14, 2026"));
    await userEvent.click(dayButton("Friday, September 18, 2026"));
    await waitFor(() =>
      expect(onValueChange).toHaveBeenLastCalledWith({
        start: new CalendarDate(2026, 9, 14),
        end: new CalendarDate(2026, 9, 18),
      }),
    );
  });

  it("clears to null", async () => {
    const onValueChange = vi.fn();
    render(
      <DateRangePicker
        aria-label="Reporting period"
        locale="en-US"
        months={1}
        defaultValue={{ start: new CalendarDate(2026, 9, 8), end: new CalendarDate(2026, 9, 10) }}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /calendar/i }));
    await userEvent.click(await screen.findByRole("button", { name: "Clear" }));
    expect(onValueChange).toHaveBeenCalledWith(null);
  });

  it("reports both ends to the form as calendar dates", () => {
    render(
      <Field label="Window">
        <DateRangePicker
          locale="en-US"
          months={1}
          defaultValue={{ start: new CalendarDate(2026, 9, 8), end: new CalendarDate(2026, 9, 10) }}
        />
      </Field>,
    );
    const group = screen.getByRole("group", { name: /Window/ });
    const values = Array.from(group.querySelectorAll('[role="spinbutton"]')).map((segment) =>
      segment.getAttribute("aria-valuenow"),
    );
    expect(values).toEqual(["9", "8", "2026", "9", "10", "2026"]);
  });
});

describe("DateTimePicker", () => {
  it("edits a local date and time with no zone attached", () => {
    render(
      <DateTimePicker
        aria-label="Session start"
        locale="en-US"
        hourCycle={24}
        defaultValue={new CalendarDateTime(2026, 9, 27, 9, 30)}
      />,
    );
    const segments = screen.getAllByRole("spinbutton");
    // day, month, year, hour, minute — and no time zone segment anywhere.
    expect(segments).toHaveLength(5);
    expect(segments[3]).toHaveAttribute("aria-valuenow", "9");
    expect(segments[4]).toHaveAttribute("aria-valuenow", "30");
  });

  it("keeps a zoned value in its own zone", () => {
    render(
      <ZonedDateTimePicker
        aria-label="Market open"
        locale="en-US"
        hourCycle={24}
        defaultValue={parseZonedDateTime("2026-09-27T09:30[Europe/Berlin]")}
      />,
    );
    // The zone is part of the value, so it shows up in the field's own label.
    expect(screen.getAllByText(/GMT\+2|CEST/).length).toBeGreaterThan(0);
  });
});
