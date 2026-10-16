import { DateRange } from "./datetime/format.js";
import { CalendarProps as CalendarProps$1, RangeCalendarProps as RangeCalendarProps$1 } from "react-aria-components";
import { ReactNode } from "react";
import { CalendarDate, DateValue } from "@internationalized/date";
//#region src/datetime/calendar.d.ts
export interface CalendarProps<T extends DateValue = CalendarDate> extends Omit<CalendarProps$1<T>, "className" | "children" | "style"> {
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
export declare function Calendar<T extends DateValue = CalendarDate>({ locale, viewSwitch, onValueChange, footer, className, ...props }: CalendarProps<T>): import("react").JSX.Element;
export interface RangeCalendarProps<T extends DateValue = CalendarDate> extends Omit<RangeCalendarProps$1<T>, "className" | "children" | "style"> {
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
export declare function RangeCalendar<T extends DateValue = CalendarDate>({ locale, viewSwitch, months, onValueChange, footer, className, ...props }: RangeCalendarProps<T>): import("react").JSX.Element;
export interface CalendarFooterProps extends React.ComponentPropsWithRef<"div"> {
  children: ReactNode;
}
/** The action strip under a calendar grid. */
export declare function CalendarFooter({ className, ...props }: CalendarFooterProps): import("react").JSX.Element;
/**
 * A quiet action inside a calendar footer.
 *
 * It is a plain `<button>` on purpose: everything rendered inside `<Calendar>`
 * shares React Aria's *calendar button slots* (`previous` / `next`), so a
 * react-aria `Button` here would need a slot it does not have. A native button
 * keeps the date semantics intact and still gets the dialog's focus handling.
 */
export declare function CalendarActionButton({ className, type, ...props }: React.ComponentPropsWithRef<"button">): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=calendar.d.ts.map