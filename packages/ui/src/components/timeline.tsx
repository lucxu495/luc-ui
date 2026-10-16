import { cn } from "../utils/cn";

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

const dotClass: Record<TimelineTone, string> = {
  neutral: "border-line-default bg-surface-raised text-fg-muted",
  accent: "border-line-accent bg-accent-soft text-fg-accent",
  positive: "border-positive-line bg-positive-soft text-fg-positive",
  negative: "border-negative-line bg-negative-soft text-fg-negative",
  warning: "border-warning-line bg-warning-soft text-fg-warning",
  info: "border-info-line bg-info-soft text-fg-info",
};

export function Timeline({
  className,
  items,
  variant = "rail",
  density = "default",
  ...props
}: TimelineProps) {
  return (
    <ol
      data-slot="timeline"
      data-variant={variant}
      className={cn("relative flex flex-col", className)}
      {...props}
    >
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <li
            key={item.id}
            data-slot="timeline-item"
            data-tone={item.tone ?? "neutral"}
            className={cn(
              "relative flex gap-3",
              density === "compact" ? "pb-3" : "pb-5",
              last && "pb-0",
              item.muted && "text-fg-muted",
            )}
          >
            <div className="relative flex shrink-0 flex-col items-center">
              <span
                aria-hidden="true"
                data-slot="timeline-marker"
                className={cn(
                  "z-[1] grid shrink-0 place-items-center rounded-full border",
                  "shadow-rest",
                  item.icon ? "size-7" : "size-3",
                  density === "compact" && !item.icon && "size-2.5",
                  dotClass[item.tone ?? "neutral"],
                  "[&_svg]:size-3.5",
                )}
              >
                {item.icon}
              </span>
              {variant === "rail" && !last ? (
                <span
                  aria-hidden="true"
                  data-slot="timeline-rail"
                  className="w-px grow bg-line-subtle"
                />
              ) : null}
            </div>
            <div className={cn("min-w-0 flex-1", !item.icon && "pt-0.5")}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span
                  className={cn(
                    "text-label font-medium",
                    item.muted ? "text-fg-muted" : "text-fg-primary",
                  )}
                >
                  {item.title}
                </span>
                {item.meta ? (
                  <span className="text-micro text-fg-muted luc-numeric">{item.meta}</span>
                ) : null}
              </div>
              {item.description ? (
                <p className="mt-1 text-caption text-fg-secondary">{item.description}</p>
              ) : null}
              {item.detail ? <div className="mt-2">{item.detail}</div> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
