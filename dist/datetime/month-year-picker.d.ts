import { ReactNode } from "react";
import { CalendarDate, DateValue } from "@internationalized/date";
//#region src/datetime/month-year-picker.d.ts
export interface MonthPickerProps {
  /** Selected month. The day is ignored. */
  value?: CalendarDate | null;
  onValueChange?: (value: CalendarDate) => void;
  /** Year on display. Controlled or `defaultYear`. */
  year?: number;
  defaultYear?: number;
  onYearChange?: (year: number) => void;
  minValue?: DateValue | null;
  maxValue?: DateValue | null;
  /** A month is unavailable when its first day is. */
  isMonthUnavailable?: (firstDayOfMonth: CalendarDate) => boolean;
  locale?: string;
  /** Year navigation row. Hidden inside a calendar that already has one. */
  withYearNavigation?: boolean;
  /** Rendered under the grid — a "today" or "clear" affordance. */
  footer?: ReactNode;
  className?: string;
  "aria-label"?: string;
}
/** Twelve months in a 3×4 grid, with a year strip above it. */
export declare function MonthPicker({ value, onValueChange, year, defaultYear, onYearChange, minValue, maxValue, isMonthUnavailable, locale, withYearNavigation, footer, className, ...props }: MonthPickerProps): import("react").JSX.Element;
export interface YearPickerProps {
  value?: CalendarDate | null;
  onValueChange?: (value: CalendarDate) => void;
  /** First year of the visible page. */
  pageStart?: number;
  defaultPageStart?: number;
  onPageStartChange?: (year: number) => void;
  /** Years per page. Default 10, aligned to the decade — "2020–2029". */
  yearsPerPage?: number;
  minValue?: DateValue | null;
  maxValue?: DateValue | null;
  locale?: string;
  className?: string;
  "aria-label"?: string;
}
/** Years in a page, with fast page navigation across a wide range. */
export declare function YearPicker({ value, onValueChange, pageStart, defaultPageStart, onPageStartChange, yearsPerPage, minValue, maxValue, locale, className, ...props }: YearPickerProps): import("react").JSX.Element;
export declare function Chevron({ direction }: {
  direction: "left" | "right" | "down";
}): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=month-year-picker.d.ts.map