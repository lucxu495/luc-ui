import { ControlSize } from "./components/input.js";
import { DateRange } from "./datetime/format.js";
import { DateFieldProps as DateFieldProps$1, DatePickerProps as DatePickerProps$1, DateRangePickerProps as DateRangePickerProps$1 } from "react-aria-components";
import { ReactNode } from "react";
import { CalendarDate, DateValue } from "@internationalized/date";
//#region src/datetime/date-picker.d.ts
export interface DateFieldProps<T extends DateValue = DateValue> extends Omit<DateFieldProps$1<T>, "className" | "children" | "isInvalid" | "isDisabled" | "isReadOnly"> {
  size?: ControlSize;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** BCP-47 locale for segment order, weekday names and the visible month. */
  locale?: string;
  className?: string;
  /** Rendered after the segments — a suffix, a clear button, an icon. */
  trailingAction?: ReactNode;
}
/**
 * A date (or date-and-time) field with segmented editing and no popover. Use it
 * in a dense filter bar where a calendar would be too much surface.
 */
export declare function DateField<T extends DateValue = DateValue>({ size, invalid, disabled, readOnly, className, trailingAction, ...props }: DateFieldProps<T>): import("react").JSX.Element;
export interface DatePickerProps<T extends DateValue = DateValue> extends Omit<DatePickerProps$1<T>, "className" | "children" | "isInvalid" | "isDisabled" | "isReadOnly" | "isRequired" | "onChange"> {
  /** Called with the new date, or `null` when the field is cleared. */
  onValueChange?: (value: T | null) => void;
  size?: ControlSize;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  locale?: string;
  /** Month/year jump inside the calendar. Default `true`. */
  viewSwitch?: boolean;
  /** "Today" action in the calendar footer. Default `true`. */
  showTodayAction?: boolean;
  /** "Clear" action in the calendar footer. Default `true`. */
  showClearAction?: boolean;
  /** Accessible name for the calendar button. Localized by React Aria by default. */
  calendarButtonLabel?: string;
  /** Extra footer content beside the quick actions. */
  footer?: ReactNode;
  className?: string;
  /**
   * The calendar date the "Today" action should mean. Inject it in demos and
   * tests so a screenshot does not change at midnight.
   */
  todayValue?: CalendarDate;
}
/** One date, chosen from a calendar or typed segment by segment. */
export declare function DatePicker<T extends DateValue = DateValue>({ onValueChange, size, invalid, disabled, readOnly, required, locale, viewSwitch, showTodayAction, showClearAction, calendarButtonLabel, footer, className, todayValue, value, ...props }: DatePickerProps<T>): import("react").JSX.Element;
export interface DateRangePreset {
  id: string;
  label: string;
  /**
   * A fixed range of calendar dates, or a factory evaluated against the current
   * day. Presets are calendar-date based on purpose — "last 7 days" is a date
   * range, not an instant range.
   */
  range: DateRange | ((context: {
    today: CalendarDate;
  }) => DateRange);
}
export interface DateRangePickerProps<T extends DateValue = DateValue> extends Omit<DateRangePickerProps$1<T>, "className" | "children" | "isInvalid" | "isDisabled" | "isReadOnly" | "isRequired" | "onChange" | "startName" | "endName"> {
  onValueChange?: (value: DateRange<T> | null) => void;
  size?: ControlSize;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  locale?: string;
  /** Months shown at once. Default `2`; the caller drops to 1 on mobile. */
  months?: 1 | 2;
  /** Consumer-defined quick ranges. LUC hard-codes no business windows. */
  presets?: DateRangePreset[];
  showTodayAction?: boolean;
  showClearAction?: boolean;
  calendarButtonLabel?: string;
  footer?: ReactNode;
  className?: string;
  /**
   * The calendar date the "Today" action should mean. Inject it in demos and
   * tests so a screenshot does not change at midnight.
   */
  todayValue?: CalendarDate;
}
/**
 * A start/end date range. Both ends are inclusive and neither is nudged to
 * 23:59:59 — a range of dates is a pair of dates, and what it means to a query
 * is the consumer's decision.
 */
export declare function DateRangePicker<T extends DateValue = DateValue>({ onValueChange, size, invalid, disabled, readOnly, required, locale, months, presets, showTodayAction, showClearAction, calendarButtonLabel, footer, className, todayValue, value, defaultValue, ...props }: DateRangePickerProps<T>): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=date-picker.d.ts.map