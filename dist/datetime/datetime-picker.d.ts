import { DatePickerProps } from "../date-picker.js";
import { CalendarDateTime, ZonedDateTime } from "@internationalized/date";
//#region src/datetime/datetime-picker.d.ts
export type DateTimePickerProps = Omit<DatePickerProps<CalendarDateTime>, "granularity"> & {
  /** `minute` (default) or `second`. */
  granularity?: "minute" | "second";
};
/**
 * A local date and time: "2026-09-27 09:30", no time zone attached. Two people
 * in different zones see the same wall clock, which is exactly what a local
 * schedule (a market session, a meeting time) means.
 */
export declare function DateTimePicker({ granularity, ...props }: DateTimePickerProps): import("react").JSX.Element;
export interface ZonedDateTimePickerProps extends Omit<DatePickerProps<ZonedDateTime>, "granularity"> {
  granularity?: "minute" | "second";
}
export declare function ZonedDateTimePicker({ granularity, ...props }: ZonedDateTimePickerProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=datetime-picker.d.ts.map