import { NumericFormatOptions } from "../utils/format.js";
//#region src/data/metric.d.ts
export type MetricSize = "sm" | "md" | "lg" | "xl";
export interface MetricProps extends React.ComponentPropsWithRef<"div"> {
  label: React.ReactNode;
  /** Secondary line under the value: a delta, a timestamp, a unit note. */
  meta?: React.ReactNode;
  /** Right-aligned slot for a comparison, status or timeframe control. */
  aside?: React.ReactNode;
}
export declare function Metric({ className, label, meta, aside, children, ...props }: MetricProps): import("react").JSX.Element;
export interface MetricValueProps extends Omit<React.ComponentPropsWithRef<"span">, "children"> {
  value: number | null | undefined;
  size?: MetricSize;
  kind?: NumericFormatOptions["kind"];
  currency?: string;
  suffix?: string;
  signed?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  locale?: string;
  /** Roll to the new value instead of snapping. Default `true`. */
  animate?: boolean;
  /**
   * How the roll works. `digits` (default) moves only the digits that changed;
   * `count` rolls the whole number, which is calmer on very long values.
   */
  variant?: "count" | "digits";
  /** Use the display face for headline numbers. Default `true`. */
  display?: boolean;
  /** Replace the built-in formatter entirely. */
  format?: (value: number) => string;
}
export declare function MetricValue({ className, value, size, kind, currency, suffix, signed, minimumFractionDigits, maximumFractionDigits, locale, animate, variant, display, format, ...props }: MetricValueProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=metric.d.ts.map