import { NumericFormatOptions } from "../utils/format.js";
import { MetricSize } from "./metric.js";
//#region src/data/stat-card.d.ts
export interface StatCardProps extends Omit<React.ComponentPropsWithRef<"div">, "children"> {
  label: React.ReactNode;
  value: number | null | undefined;
  /** Period-over-period change, rendered as a `Delta`. */
  delta?: number | null;
  deltaLabel?: React.ReactNode;
  invertDelta?: boolean;
  /** Small leading slot: icon, status dot, or asset mark. */
  icon?: React.ReactNode;
  /** Right-aligned slot on the header row. */
  aside?: React.ReactNode;
  /** Chart or visualisation slot under the value. */
  visual?: React.ReactNode;
  /** Footer line: freshness, provenance, unit. */
  footer?: React.ReactNode;
  size?: MetricSize;
  kind?: NumericFormatOptions["kind"];
  currency?: string;
  suffix?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  selected?: boolean;
  interactive?: boolean;
}
export declare function StatCard({ className, label, value, delta, deltaLabel, invertDelta, icon, aside, visual, footer, size, kind, currency, suffix, minimumFractionDigits, maximumFractionDigits, selected, interactive, ...props }: StatCardProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=stat-card.d.ts.map