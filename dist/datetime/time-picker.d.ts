import { ControlSize } from "../components/input.js";
import { TimeFieldProps } from "react-aria-components";
import { Time } from "@internationalized/date";
//#region src/datetime/time-picker.d.ts
export interface TimePickerProps extends Omit<TimeFieldProps<Time>, "className" | "children" | "isInvalid" | "isDisabled" | "isReadOnly"> {
  onValueChange?: (value: Time | null) => void;
  size?: ControlSize;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  locale?: string;
  /** Minute granularity in the coarse picker. Default `5`. */
  minuteStep?: number;
  /** Also pick seconds; the field then shows a seconds segment. */
  granularity?: "minute" | "second";
  secondStep?: number;
  /** "Now" action in the popover footer. Default `true`. */
  showNowAction?: boolean;
  className?: string;
  "aria-label"?: string;
}
export declare function TimePicker({ onValueChange, size, invalid, disabled, readOnly, locale, minuteStep, granularity, secondStep, showNowAction, className, value, ...props }: TimePickerProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=time-picker.d.ts.map