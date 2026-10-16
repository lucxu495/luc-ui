import { cn } from "../utils/cn";
import { StatusBadge, type StatusBadgeProps } from "./status-badge";
import { formatAbsoluteTime, formatRelativeTime, resolveFreshness, type FreshnessLevel } from "../utils/time";

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

// LUC Timestamp. The machine-readable `dateTime` is always present; humans get
// a relative label and the exact value on hover.
export function Timestamp({
  className,
  value,
  display = "relative",
  style = "datetime",
  locale,
  timeZone,
  now,
  ...props
}: TimestampProps) {
  if (value === null || value === undefined) {
    return (
      <span data-slot="timestamp" className={cn("text-fg-disabled", className)} {...props}>
        —
      </span>
    );
  }

  const date = value instanceof Date ? value : new Date(value);
  const isValid = !Number.isNaN(date.getTime());
  const relative = formatRelativeTime(date, { locale, now });
  const absolute = formatAbsoluteTime(date, { locale, style, timeZone });

  return (
    <time
      data-slot="timestamp"
      dateTime={isValid ? date.toISOString() : undefined}
      title={isValid ? date.toISOString() : undefined}
      className={cn("luc-numeric text-fg-muted", className)}
      {...props}
    >
      {display === "relative" ? relative : absolute}
    </time>
  );
}

export interface FreshnessBadgeProps extends Omit<StatusBadgeProps, "status" | "label"> {
  updatedAt: Date | number | string | null | undefined;
  freshSeconds?: number;
  staleSeconds?: number;
  now?: Date | number;
  /** Render the age next to the level, e.g. "Fresh · 42s". */
  showAge?: boolean;
  locale?: string;
}

const freshnessMap: Record<FreshnessLevel, { status: "live" | "healthy" | "stale" | "down"; label: string }> = {
  live: { status: "live", label: "Live" },
  fresh: { status: "healthy", label: "Fresh" },
  stale: { status: "stale", label: "Stale" },
  expired: { status: "down", label: "Outdated" },
};

// LUC FreshnessBadge — for data pipelines where "how old is this?" is part of
// the meaning. Thresholds are explicit props so behaviour is never a mystery.
export function FreshnessBadge({
  className,
  updatedAt,
  freshSeconds = 300,
  staleSeconds = 3600,
  now,
  showAge = false,
  locale,
  ...props
}: FreshnessBadgeProps) {
  const level = resolveFreshness(updatedAt, { freshSeconds, staleSeconds }, now);
  const preset = freshnessMap[level];
  const age = showAge ? formatRelativeTime(updatedAt, { locale, now }) : null;

  return (
    <StatusBadge
      data-slot="freshness-badge"
      data-freshness={level}
      status={preset.status}
      label={age ? `${preset.label} · ${age}` : preset.label}
      className={cn("luc-numeric", className)}
      {...props}
    />
  );
}
