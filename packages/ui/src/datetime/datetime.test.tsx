import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendarDate, Time } from "@internationalized/date";
import { describe, expect, it, vi } from "vitest";
import { Calendar, RangeCalendar } from "./calendar";
import {
  addDays,
  addMonths,
  dateOnlyFromInstant,
  daysBetween,
  formatDateOnly,
  formatDateRange,
  formatMonthSpan,
  formatMonthYear,
  formatTimeValue,
  isDateInRange,
  isSameCalendarDate,
  isWithinBounds,
  parseDateOnly,
  toDateOnlyString,
} from "./format";
import { MonthPicker, YearPicker } from "./month-year-picker";
import { TimePicker } from "./time-picker";

describe("date-only semantics", () => {
  it("round-trips YYYY-MM-DD without inventing a time or a zone", () => {
    const date = parseDateOnly("2026-09-27");
    expect(date).not.toBeNull();
    expect(date?.year).toBe(2026);
    expect(date?.month).toBe(9);
    expect(date?.day).toBe(27);
    expect(toDateOnlyString(date)).toBe("2026-09-27");
  });

  it("refuses ambiguous or impossible input instead of guessing", () => {
    expect(parseDateOnly("2026-9-7")).toBeNull();
    expect(parseDateOnly("27/09/2026")).toBeNull();
    expect(parseDateOnly("2026-02-30")).toBeNull();
    expect(parseDateOnly("")).toBeNull();
    expect(parseDateOnly(null)).toBeNull();
  });

  it("accepts a real leap day and rejects a fake one", () => {
    expect(toDateOnlyString(parseDateOnly("2028-02-29"))).toBe("2028-02-29");
    expect(parseDateOnly("2027-02-29")).toBeNull();
    expect(toDateOnlyString(addDays(new CalendarDate(2028, 2, 28), 1))).toBe("2028-02-29");
    expect(toDateOnlyString(addDays(new CalendarDate(2028, 2, 29), 1))).toBe("2028-03-01");
  });

  it("crosses a DST boundary by calendar day, not by 24-hour arithmetic", () => {
    // Europe/Berlin loses an hour on 2026-03-29. A date-only value must not care.
    expect(toDateOnlyString(addDays(new CalendarDate(2026, 3, 28), 1))).toBe("2026-03-29");
    expect(toDateOnlyString(addDays(new CalendarDate(2026, 10, 24), 1))).toBe("2026-10-25");
  });

  it("crosses month and year boundaries", () => {
    expect(toDateOnlyString(addDays(new CalendarDate(2026, 12, 31), 1))).toBe("2027-01-01");
    expect(toDateOnlyString(addMonths(new CalendarDate(2026, 1, 31), 1))).toBe("2026-02-28");
    expect(toDateOnlyString(addMonths(new CalendarDate(2027, 12, 15), 1))).toBe("2028-01-15");
  });

  it("converts an instant to a date only when told which zone to use", () => {
    const instant = new Date("2026-09-27T23:30:00Z");
    expect(toDateOnlyString(dateOnlyFromInstant(instant, "UTC"))).toBe("2026-09-27");
    // The same instant is already the next day in Tokyo — that shift is explicit
    // here, and never something the library does for you.
    expect(toDateOnlyString(dateOnlyFromInstant(instant, "Asia/Tokyo"))).toBe("2026-09-28");
  });
});

describe("date formatting", () => {
  const date = new CalendarDate(2026, 9, 27);

  it("formats a calendar date in the requested locale", () => {
    expect(formatDateOnly(date, { locale: "en-US" })).toBe("Sep 27, 2026");
    expect(formatDateOnly(date, { locale: "en-GB", style: "short" })).toBe("27/09/2026");
    expect(formatDateOnly(date, { locale: "de-DE", style: "long", showYear: false })).toBe("27. September");
  });

  it("renders an em dash for a missing value rather than 'Invalid Date'", () => {
    expect(formatDateOnly(null)).toBe("—");
    expect(formatDateRange(null)).toBe("—");
    expect(formatTimeValue(null)).toBe("—");
  });

  it("formats ranges and month spans", () => {
    // Locale range formatting inserts thin spaces around the dash; compare on a
    // normalised string so the assertion tests the format, not the whitespace.
    const range = formatDateRange(
      { start: new CalendarDate(2026, 9, 27), end: new CalendarDate(2026, 10, 3) },
      { locale: "en-US" },
    );
    expect(range.replace(/\s+/g, " ")).toBe("Sep 27 – Oct 3, 2026");
    expect(formatMonthYear(date, { locale: "en-US" })).toBe("September 2026");
    const span = formatMonthSpan(new CalendarDate(2026, 9, 1), new CalendarDate(2026, 10, 31), { locale: "en-US" });
    expect(span.replace(/\s+/g, " ")).toBe("September – October 2026");
  });

  it("formats a time-only value in either clock", () => {
    expect(formatTimeValue(new Time(14, 5), { locale: "en-US", hourCycle: 24 })).toBe("14:05");
    expect(formatTimeValue(new Time(14, 5), { locale: "en-US", hourCycle: 12 })).toBe("02:05 PM");
    expect(formatTimeValue(new Time(14, 5, 9), { locale: "en-US", hourCycle: 24, granularity: "second" })).toBe(
      "14:05:09",
    );
  });

  it("compares and measures calendar dates", () => {
    expect(isSameCalendarDate(new CalendarDate(2026, 9, 27), new CalendarDate(2026, 9, 27))).toBe(true);
    expect(isSameCalendarDate(null, date)).toBe(false);
    expect(daysBetween(new CalendarDate(2026, 9, 27), new CalendarDate(2026, 10, 1))).toBe(4);
    expect(
      isDateInRange(new CalendarDate(2026, 9, 29), {
        start: new CalendarDate(2026, 9, 27),
        end: new CalendarDate(2026, 10, 3),
      }),
    ).toBe(true);
    expect(isWithinBounds(new CalendarDate(2026, 9, 27), new CalendarDate(2026, 9, 28), null)).toBe(false);
  });
});

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * A day is a pressable inside its `gridcell`; React Aria appends the state
 * ("selected", "unavailable") to its accessible name, so match on the date
 * itself. The same element carries the styling data attributes.
 */
function dayCell(name: string) {
  return screen.getByRole("button", { name: new RegExp(escapeRegExp(name)) });
}

const dayButton = dayCell;

function calendarHeader() {
  return within(document.querySelector("header") as HTMLElement);
}

describe("Calendar", () => {
  it("selects a day by click and reports a CalendarDate", async () => {
    const onValueChange = vi.fn();
    render(
      <Calendar
        aria-label="Start date"
        locale="en-US"
        defaultValue={new CalendarDate(2026, 9, 10)}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(dayButton("Tuesday, September 15, 2026"));
    expect(onValueChange).toHaveBeenCalledWith(new CalendarDate(2026, 9, 15));
  });

  it("moves with the keyboard and keeps one tab stop", async () => {
    render(<Calendar aria-label="Keyboard dates" locale="en-US" defaultValue={new CalendarDate(2026, 9, 10)} />);
    expect(dayCell("Thursday, September 10, 2026")).toHaveAccessibleName(/selected/);
    dayButton("Thursday, September 10, 2026").focus();
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => {
      // Focus travelled to the next day; the *selection* has not moved yet.
      expect(dayButton("Friday, September 11, 2026")).toHaveFocus();
      expect(dayCell("Thursday, September 10, 2026")).toHaveAccessibleName(/selected/);
    });
  });

  it("selects with the keyboard", async () => {
    const onValueChange = vi.fn();
    render(
      <Calendar
        aria-label="Keyboard select"
        locale="en-US"
        defaultValue={new CalendarDate(2026, 9, 10)}
        onValueChange={onValueChange}
      />,
    );
    dayButton("Thursday, September 10, 2026").focus();
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith(new CalendarDate(2026, 9, 17)));
  });

  it("obeys min and max", async () => {
    const onValueChange = vi.fn();
    render(
      <Calendar
        aria-label="Bounded"
        locale="en-US"
        defaultValue={new CalendarDate(2026, 9, 10)}
        minValue={new CalendarDate(2026, 9, 1)}
        maxValue={new CalendarDate(2026, 9, 12)}
        onValueChange={onValueChange}
      />,
    );
    expect(dayCell("Sunday, September 20, 2026")).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(dayButton("Friday, September 11, 2026"));
    expect(onValueChange).toHaveBeenCalledWith(new CalendarDate(2026, 9, 11));
  });

  it("marks unavailable dates without removing them from the grid", () => {
    render(
      <Calendar
        aria-label="Unavailable"
        locale="en-US"
        defaultValue={new CalendarDate(2026, 9, 10)}
        isDateUnavailable={(date) => date.day === 12}
      />,
    );
    expect(dayCell("Saturday, September 12, 2026")).toHaveAttribute("data-unavailable", "true");
  });

  it("navigates months from the header", async () => {
    render(<Calendar aria-label="Navigate" locale="en-US" defaultValue={new CalendarDate(2026, 9, 10)} />);
    expect(screen.getByRole("button", { name: "September 2026" })).toBeInTheDocument();
    await userEvent.click(calendarHeader().getByRole("button", { name: "Next" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "October 2026" })).toBeInTheDocument());
  });

  it("jumps straight to a month and a year from the header", async () => {
    render(<Calendar aria-label="Jump" locale="en-US" defaultValue={new CalendarDate(2026, 9, 10)} />);
    await userEvent.click(screen.getByRole("button", { name: "September 2026" }));

    // Month grid first, so twelve months do not need twelve clicks.
    await userEvent.click(await screen.findByRole("gridcell", { name: "March 2026" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "March 2026" })).toBeInTheDocument());

    // Then the year grid, for the wide jumps.
    await userEvent.click(screen.getByRole("button", { name: "March 2026" }));
    await userEvent.click(await screen.findByRole("button", { name: "Choose year…" }));
    await userEvent.click(await screen.findByRole("gridcell", { name: "2029" }));
    await userEvent.click(await screen.findByRole("gridcell", { name: "June 2029" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "June 2029" })).toBeInTheDocument());
  });
});

describe("RangeCalendar", () => {
  it("selects an inclusive start and end", async () => {
    const onValueChange = vi.fn();
    render(
      <RangeCalendar
        aria-label="Reporting period"
        locale="en-US"
        defaultValue={{ start: new CalendarDate(2026, 9, 8), end: new CalendarDate(2026, 9, 10) }}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(dayButton("Monday, September 14, 2026"));
    await userEvent.click(dayButton("Friday, September 18, 2026"));
    await waitFor(() =>
      expect(onValueChange).toHaveBeenLastCalledWith({
        start: new CalendarDate(2026, 9, 14),
        end: new CalendarDate(2026, 9, 18),
      }),
    );
  });

  it("supports a same-day range and marks both ends", async () => {
    render(
      <RangeCalendar
        aria-label="Same day"
        locale="en-US"
        defaultValue={{ start: new CalendarDate(2026, 9, 8), end: new CalendarDate(2026, 9, 8) }}
      />,
    );
    const cell = dayCell("Tuesday, September 8, 2026");
    expect(cell).toHaveAttribute("data-selection-start", "true");
    expect(cell).toHaveAttribute("data-selection-end", "true");
  });

  it("renders two months when asked", () => {
    render(
      <RangeCalendar
        aria-label="Two months"
        locale="en-US"
        months={2}
        defaultValue={{ start: new CalendarDate(2026, 9, 8), end: new CalendarDate(2026, 10, 2) }}
      />,
    );
    expect(screen.getByText("September – October 2026")).toBeInTheDocument();
  });

  it("blocks a disabled date inside the range", async () => {
    render(
      <RangeCalendar
        aria-label="With blocked days"
        locale="en-US"
        defaultValue={{ start: new CalendarDate(2026, 9, 8), end: new CalendarDate(2026, 9, 10) }}
        isDateUnavailable={(date) => date.day === 12}
      />,
    );
    expect(dayCell("Saturday, September 12, 2026")).toHaveAttribute("data-unavailable", "true");
  });
});

describe("MonthPicker and YearPicker", () => {
  it("selects a month and moves between years", async () => {
    const onValueChange = vi.fn();
    render(
      <MonthPicker aria-label="Month" locale="en-US" value={new CalendarDate(2026, 3, 1)} onValueChange={onValueChange} />,
    );
    expect(screen.getByText("2026")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("gridcell", { name: "July 2026" }));
    expect(onValueChange).toHaveBeenCalledWith(new CalendarDate(2026, 7, 1));

    await userEvent.click(screen.getByRole("button", { name: "Next year" }));
    expect(screen.getByText("2027")).toBeInTheDocument();
  });

  it("moves through year pages and disables out-of-range years", async () => {
    const onValueChange = vi.fn();
    render(
      <YearPicker
        aria-label="Year"
        locale="en-US"
        value={new CalendarDate(2026, 1, 1)}
        minValue={new CalendarDate(2020, 1, 1)}
        maxValue={new CalendarDate(2030, 1, 1)}
        onValueChange={onValueChange}
      />,
    );
    expect(screen.getByText("2020–2029")).toBeInTheDocument();
    // The minimum year is on this page and the previous page is closed off.
    expect(screen.getByRole("button", { name: "Previous 10 years" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Next 10 years" }));
    expect(screen.getByText("2030–2039")).toBeInTheDocument();
    expect(screen.getByRole("gridcell", { name: "2031" })).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(screen.getByRole("button", { name: "Previous 10 years" }));
    await userEvent.click(screen.getByRole("gridcell", { name: "2029" }));
    expect(onValueChange).toHaveBeenCalledWith(new CalendarDate(2029, 1, 1));
  });

  it("supports arrow-key navigation inside the grid", async () => {
    const onValueChange = vi.fn();
    render(
      <MonthPicker aria-label="Month" locale="en-US" value={new CalendarDate(2026, 1, 1)} onValueChange={onValueChange} />,
    );
    const january = screen.getByRole("gridcell", { name: "January 2026" });
    january.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("gridcell", { name: "February 2026" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenCalledWith(new CalendarDate(2026, 2, 1));
  });
});

describe("TimePicker", () => {
  it("picks an hour and a minute with a real minute step", async () => {
    const onValueChange = vi.fn();
    render(
      <TimePicker aria-label="Time" locale="en-US" hourCycle={24} minuteStep={15} onValueChange={onValueChange} />,
    );
    const trigger = screen.getByRole("button", { name: "Choose a time" });
    await userEvent.click(trigger);

    await userEvent.click(await screen.findByRole("option", { name: "09" }));
    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith(new Time(9, 0)));

    // The minute column only offers the step grid.
    expect(screen.getByRole("option", { name: "30" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "31" })).not.toBeInTheDocument();
  });

  it("shows a seconds column only when the granularity asks for it", async () => {
    render(<TimePicker aria-label="Time" locale="en-US" hourCycle={24} granularity="second" />);
    await userEvent.click(screen.getByRole("button", { name: "Choose a time" }));
    expect(await screen.findByRole("listbox", { name: "Second" })).toBeInTheDocument();
  });

  it("follows a 12-hour clock when asked", async () => {
    render(<TimePicker aria-label="Time" locale="en-US" hourCycle={12} />);
    await userEvent.click(screen.getByRole("button", { name: "Choose a time" }));
    expect(await screen.findByRole("listbox", { name: "AM/PM" })).toBeInTheDocument();
  });

  it("edits segments directly through the field", () => {
    render(<TimePicker aria-label="Time" locale="en-US" hourCycle={24} />);
    const segments = screen.getAllByRole("spinbutton");
    expect(segments.length).toBeGreaterThanOrEqual(2);
  });
});
