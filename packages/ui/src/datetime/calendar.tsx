"use client";

import {
  Calendar as RacCalendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  CalendarStateContext,
  Button as RacButton,
  RangeCalendar as RacRangeCalendar,
  RangeCalendarStateContext,
  type CalendarProps as RacCalendarProps,
  type RangeCalendarProps as RacRangeCalendarProps,
} from "react-aria-components";
import { CalendarDate, type DateValue } from "@internationalized/date";
import { useContext, useState, type ReactNode } from "react";
import { PopoverContent, PopoverRoot, PopoverTrigger } from "../components/popover";
import { LocaleProvider } from "../providers/locale-provider";
import { cn } from "../utils/cn";
import { formatMonthSpan, formatMonthYear, type DateRange } from "./format";
import { Chevron, MonthPicker, YearPicker } from "./month-year-picker";

/*
 * LUC Calendar and RangeCalendar.
 *
 * React Aria Components owns the behaviour that is genuinely hard: day-grid
 * semantics, roving focus, arrow/Page/Home/End navigation, locale (first day of
 * week, month and weekday names, non-Gregorian calendars), min/max, unavailable
 * dates and the range anchor model. LUC owns every pixel: the header, the cell
 * states, the range band and the month/year jump.
 *
 * Values are `CalendarDate`: a calendar date with no clock and no time zone, so
 * 2026-09-27 is 27 September wherever it is rendered.
 * See docs/DATE_TIME_GUIDE.md.
 */

const cellClass = cn(
  "relative grid size-8 place-items-center rounded-sm text-label text-fg-secondary luc-numeric",
  "cursor-default select-none luc-transition",
  "data-[hovered]:bg-surface-interactive-hover data-[hovered]:text-fg-primary",
  "data-[outside-month]:text-fg-muted",
  // Today is a ring, not a fill: it has to stay legible beside a selection.
  "data-[today]:text-fg-primary data-[today]:shadow-[inset_0_0_0_1px_var(--calendar-today-ring)]",
  // Unavailable days stay focusable, so they must stay readable.
  "data-[unavailable]:text-calendar-unavailable data-[unavailable]:line-through",
  "data-[disabled]:pointer-events-none data-[disabled]:text-fg-disabled",
  "focus-visible:outline-none focus-visible:text-fg-primary focus-visible:shadow-[var(--glow-focus)]",
);

const rangeCellClass = cn(
  cellClass,
  // A range is a band, not a row of pills: middle days are squared off so the
  // selection reads as one continuous span.
  "data-[selected]:rounded-none data-[selected]:bg-calendar-range",
  "data-[selection-start]:rounded-l-sm data-[selection-start]:bg-calendar-range-edge",
  "data-[selection-end]:rounded-r-sm data-[selection-end]:bg-calendar-range-edge",
  "data-[selection-start]:text-fg-primary data-[selection-end]:text-fg-primary",
);

const navButtonClass = cn(
  "grid size-7 place-items-center rounded-sm text-fg-muted luc-transition luc-focus",
  "hover:bg-surface-interactive-hover hover:text-fg-primary",
  "disabled:pointer-events-none disabled:opacity-40",
);

const weekdayClass = "pb-1.5 text-center text-micro font-medium text-fg-muted uppercase";

/** The month/year jump, driven by whichever calendar state is around it. */
function CalendarViewSwitch({ locale }: { locale?: string }) {
  const calendarState = useContext(CalendarStateContext);
  const rangeState = useContext(RangeCalendarStateContext);
  const state = calendarState ?? rangeState;
  const [view, setView] = useState<"months" | "years">("months");
  const [open, setOpen] = useState(false);

  if (!state) return null;
  const visible = state.visibleRange.start;

  const close = () => {
    setOpen(false);
    setView("months");
  };

  return (
    <PopoverRoot open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-7 items-center gap-1.5 rounded-sm px-2 text-label font-medium text-fg-primary luc-transition luc-focus",
            "hover:bg-surface-interactive-hover",
          )}
        >
          {formatMonthYear(visible, { locale })}
          <Chevron direction="down" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="p-2.5">
        {view === "months" ? (
          <MonthPicker
            locale={locale}
            value={visible}
            year={visible.year}
            minValue={state.minValue ?? undefined}
            maxValue={state.maxValue ?? undefined}
            onYearChange={(next) => state.setFocusedDate(new CalendarDate(next, visible.month, 1))}
            onValueChange={(next) => {
              state.setFocusedDate(next);
              close();
            }}
            footer={
              <div className="flex items-center justify-between gap-2 border-t border-line-subtle pt-2">
                <button
                  type="button"
                  onClick={() => setView("years")}
                  className="rounded-xs px-1.5 py-1 text-caption text-fg-muted luc-transition luc-focus hover:bg-surface-interactive-hover hover:text-fg-primary"
                >
                  Choose year…
                </button>
              </div>
            }
          />
        ) : (
          <YearPicker
            locale={locale}
            value={visible}
            minValue={state.minValue ?? undefined}
            maxValue={state.maxValue ?? undefined}
            onValueChange={(next) => {
              state.setFocusedDate(new CalendarDate(next.year, visible.month, 1));
              setView("months");
            }}
          />
        )}
      </PopoverContent>
    </PopoverRoot>
  );
}

function CalendarHeader({ locale, viewSwitch }: { locale?: string; viewSwitch: boolean }) {
  return (
    <header className="flex items-center justify-between gap-1 pb-2">
      <RacButton slot="previous" className={navButtonClass}>
        <Chevron direction="left" />
      </RacButton>
      {viewSwitch ? (
        <CalendarViewSwitch locale={locale} />
      ) : (
        <span className="text-label font-medium text-fg-primary">
          <CalendarViewSwitchLabel locale={locale} />
        </span>
      )}
      <RacButton slot="next" className={navButtonClass}>
        <Chevron direction="right" />
      </RacButton>
    </header>
  );
}

/** Static month label, for calendars that do not offer the jump. */
function CalendarViewSwitchLabel({ locale }: { locale?: string }) {
  const calendarState = useContext(CalendarStateContext);
  const rangeState = useContext(RangeCalendarStateContext);
  const state = calendarState ?? rangeState;
  if (!state) return null;
  return <>{formatMonthYear(state.visibleRange.start, { locale })}</>;
}

function DayGrid({
  variant,
  offset,
  weekdayStyle = "short",
}: {
  variant: "single" | "range";
  offset?: { months?: number };
  weekdayStyle?: "narrow" | "short" | "long";
}) {
  return (
    <CalendarGrid offset={offset} weekdayStyle={weekdayStyle} className="border-separate border-spacing-y-0.5">
      <CalendarGridHeader>
        {(day) => <CalendarHeaderCell className={weekdayClass}>{day}</CalendarHeaderCell>}
      </CalendarGridHeader>
      <CalendarGridBody>
        {(date) => (
          <CalendarCell date={date} className={variant === "range" ? rangeCellClass : cellClass} />
        )}
      </CalendarGridBody>
    </CalendarGrid>
  );
}

export interface CalendarProps<T extends DateValue = CalendarDate>
  extends Omit<RacCalendarProps<T>, "className" | "children" | "style"> {
  /** BCP-47 locale. Pass it to keep server and client output identical. */
  locale?: string;
  /** The clickable month/year jump in the header. Default `true`. */
  viewSwitch?: boolean;
  /** The selected date, or `null` when the calendar is cleared. */
  onValueChange?: (value: T | null) => void;
  /** Rendered under the grid — quick actions belong here, not in the grid. */
  footer?: ReactNode;
  className?: string;
}

/**
 * A single-date calendar. Compose it under a `Popover` for a DatePicker, or use
 * it inline for a scheduling surface.
 */
export function Calendar<T extends DateValue = CalendarDate>({
  locale,
  viewSwitch = true,
  onValueChange,
  footer,
  className,
  ...props
}: CalendarProps<T>) {
  return (
    <LocaleProvider locale={locale}>
      <RacCalendar
        {...props}
        onChange={(next) => onValueChange?.(next as unknown as T | null)}
        className={cn(
          "flex w-fit flex-col rounded-lg border border-line-default bg-surface-overlay p-2.5 text-fg-primary luc-float",
          className,
        )}
      >
        <CalendarHeader locale={locale} viewSwitch={viewSwitch} />
        <DayGrid variant="single" />
        {footer}
      </RacCalendar>
    </LocaleProvider>
  );
}

export interface RangeCalendarProps<T extends DateValue = CalendarDate>
  extends Omit<RacRangeCalendarProps<T>, "className" | "children" | "style"> {
  locale?: string;
  viewSwitch?: boolean;
  /** The selected range, or `null` when the calendar is cleared. */
  onValueChange?: (value: DateRange<T> | null) => void;
  /**
   * How many months are visible. One on narrow screens, two on desktop — the
   * Showcase switches this with a media query rather than forcing two everywhere.
   */
  months?: 1 | 2;
  footer?: ReactNode;
  className?: string;
}

/**
 * A date-range calendar. Both ends are inclusive; nothing is rounded to the end
 * of a day, because a range of *dates* has no clock.
 */
export function RangeCalendar<T extends DateValue = CalendarDate>({
  locale,
  viewSwitch = true,
  months = 1,
  onValueChange,
  footer,
  className,
  ...props
}: RangeCalendarProps<T>) {
  const isMultiMonth = months > 1;
  return (
    <LocaleProvider locale={locale}>
      <RacRangeCalendar
        {...props}
        visibleDuration={{ months }}
        onChange={(next) => onValueChange?.(next as unknown as DateRange<T> | null)}
        className={cn(
          "flex w-fit flex-col rounded-lg border border-line-default bg-surface-overlay p-2.5 text-fg-primary luc-float",
          className,
        )}
      >
      {/* Two visible months keep one shared header, so the pair reads as one
          surface rather than two stacked calendars. */}
      {isMultiMonth ? (
        <header className="flex items-center justify-between gap-1 pb-2">
          <RacButton slot="previous" className={navButtonClass}>
            <Chevron direction="left" />
          </RacButton>
          <span className="text-label font-medium text-fg-primary">
            <MonthSpanLabel locale={locale} />
          </span>
          <RacButton slot="next" className={navButtonClass}>
            <Chevron direction="right" />
          </RacButton>
        </header>
      ) : (
        <CalendarHeader locale={locale} viewSwitch={viewSwitch} />
      )}
      <div className={cn("flex gap-6", !isMultiMonth && "flex-col")}>
        {Array.from({ length: months }, (_, index) => (
          <div key={index} className="flex flex-col">
            <DayGrid variant="range" offset={index === 0 ? undefined : { months: index }} />
          </div>
        ))}
      </div>
        {footer}
      </RacRangeCalendar>
    </LocaleProvider>
  );
}

/** One heading for a multi-month range: "September – October 2026". */
function MonthSpanLabel({ locale }: { locale?: string }) {
  const state = useContext(RangeCalendarStateContext);
  if (!state) return null;
  return <>{formatMonthSpan(state.visibleRange.start, state.visibleRange.end, { locale })}</>;
}

export interface CalendarFooterProps extends React.ComponentPropsWithRef<"div"> {
  children: ReactNode;
}

/** The action strip under a calendar grid. */
export function CalendarFooter({ className, ...props }: CalendarFooterProps) {
  return (
    <div
      data-slot="calendar-footer"
      className={cn(
        "mt-2 flex items-center justify-between gap-2 border-t border-line-subtle pt-2",
        className,
      )}
      {...props}
    />
  );
}

/**
 * A quiet action inside a calendar footer.
 *
 * It is a plain `<button>` on purpose: everything rendered inside `<Calendar>`
 * shares React Aria's *calendar button slots* (`previous` / `next`), so a
 * react-aria `Button` here would need a slot it does not have. A native button
 * keeps the date semantics intact and still gets the dialog's focus handling.
 */
export function CalendarActionButton({
  className,
  type = "button",
  ...props
}: React.ComponentPropsWithRef<"button">) {
  return (
    <button
      data-slot="calendar-action"
      type={type}
      className={cn(
        "rounded-xs px-1.5 py-1 text-caption text-fg-muted luc-transition luc-focus",
        "hover:bg-surface-interactive-hover hover:text-fg-primary",
        "disabled:pointer-events-none disabled:opacity-45",
        className,
      )}
      {...props}
    />
  );
}
