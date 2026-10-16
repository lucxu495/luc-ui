import { NumericFormatOptions } from "../utils/format.js";
//#region src/motion/number-ticker.d.ts
export interface NumberTickerProps extends Omit<React.ComponentPropsWithRef<"span">, "children"> {
  value: number | null | undefined;
  kind?: NumericFormatOptions["kind"];
  currency?: string;
  suffix?: string;
  signed?: boolean;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  /** Roll duration in seconds. 0.45–0.7 reads as quick and confident. */
  duration?: number;
  /** Count up from this value on first paint. Omit to start at `value`. */
  startFrom?: number;
  align?: "left" | "right" | "center";
  /**
   * `count` rolls the whole number (the V1.1 behaviour).
   * `digits` rolls each digit column independently, so changing the hundreds
   * place never disturbs the units — the premium treatment for a headline
   * number that updates in place.
   */
  variant?: "count" | "digits";
  /** Replace the built-in formatter entirely. */
  format?: (value: number) => string;
}
export declare function NumberTicker({ className, value, kind, currency, suffix, signed, locale, minimumFractionDigits, maximumFractionDigits, duration, startFrom, align, variant, format, ...props }: NumberTickerProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=number-ticker.d.ts.map