//#region src/components/timeline.d.ts
/**
 * LUC Timeline — a vertical sequence of dated events.
 *
 * The shape is deliberately data-first: a `Timeline` takes `items` and owns the
 * rail, the dots and the rhythm, because that is the part everyone re-implements
 * slightly differently (and gets wrong at the last item, where the rail must
 * stop). The consumer owns the content of each row.
 *
 * It is an ordered list — `<ol>` — not a `<div>` tree. A sequence has order, and
 * a screen reader should be told so.
 *
 *   Changelog        releases and their notes
 *   Activity feed    who changed what, when
 *   Agent trace      tool calls, states and durations
 *   Run history      job runs with a tone per outcome
 */
export type TimelineTone = "neutral" | "accent" | "positive" | "negative" | "warning" | "info";
export interface TimelineItem {
  id: string;
  /** Primary line. */
  title: React.ReactNode;
  /** Secondary line under the title. */
  description?: React.ReactNode;
  /** Right-aligned timestamp or duration. Any node. */
  meta?: React.ReactNode;
  /** Content opened under the row (kept in the DOM; disclosure is the caller's). */
  detail?: React.ReactNode;
  /** Marker colour. */
  tone?: TimelineTone;
  /** Replaces the default dot. */
  icon?: React.ReactNode;
  /** Dim the row: it has not happened yet, or it was skipped. */
  muted?: boolean;
}
export interface TimelineProps extends Omit<React.ComponentPropsWithRef<"ol">, "children"> {
  items: readonly TimelineItem[];
  /** `rail` draws the connector; `plain` is a bare sequence. Default `rail`. */
  variant?: "rail" | "plain";
  /** Dense rows for a log surface. */
  density?: "default" | "compact";
}
export declare function Timeline({ className, items, variant, density, ...props }: TimelineProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=timeline.d.ts.map