import { NumericFormatOptions } from "../utils/format.js";
//#region src/data/delta.d.ts
export interface DeltaProps extends Omit<React.ComponentPropsWithRef<"span">, "children"> {
  value: number | null | undefined;
  /** Percent change (default), absolute change, or fully custom. */
  variant?: "percent" | "absolute";
  /** Treat a decrease as good — latency, error rate, drawdown. */
  invert?: boolean;
  /** Append the unit for absolute deltas. */
  suffix?: string;
  kind?: NumericFormatOptions["kind"];
  currency?: string;
  /** Show the arrow glyph. Default `true`. */
  arrow?: boolean;
  size?: "sm" | "md" | "lg";
}
export declare function Delta({ className, value, variant, invert, suffix, kind, currency, arrow, size, ...props }: DeltaProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=delta.d.ts.map