import { StatusBadgeProps } from "./status-badge.js";
//#region src/data/timestamp.d.ts
export interface TimestampProps extends Omit<React.ComponentPropsWithRef<"time">, "dateTime" | "style"> {
  value: Date | number | string | null | undefined;
  /** `relative` (3m ago) or `absolute` (Sep 25, 14:05 UTC). */
  display?: "relative" | "absolute";
  style?: "date" | "time" | "datetime";
  locale?: string;
  timeZone?: string;
  /** Fixed "now" for deterministic rendering (tests, screenshots). */
  now?: Date | number;
}
export declare function Timestamp({ className, value, display, style, locale, timeZone, now, ...props }: TimestampProps): import("react").JSX.Element;
export interface FreshnessBadgeProps extends Omit<StatusBadgeProps, "status" | "label"> {
  updatedAt: Date | number | string | null | undefined;
  freshSeconds?: number;
  staleSeconds?: number;
  now?: Date | number;
  /** Render the age next to the level, e.g. "Fresh · 42s". */
  showAge?: boolean;
  locale?: string;
}
export declare function FreshnessBadge({ className, updatedAt, freshSeconds, staleSeconds, now, showAge, locale, ...props }: FreshnessBadgeProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=timestamp.d.ts.map