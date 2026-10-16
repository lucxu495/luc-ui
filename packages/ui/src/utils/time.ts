/**
 * Time formatting for data UI. Timestamps are always rendered from an explicit
 * `now` so output is deterministic in tests and screenshots.
 */

const DIVISIONS: ReadonlyArray<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.34524, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
];

export interface RelativeTimeOptions {
  locale?: string;
  now?: Date | number;
  /** Short form ("3m ago") instead of the verbose one ("3 minutes ago"). */
  short?: boolean;
}

function shorten(part: string): string {
  return part
    .replace(/\bseconds?\b|\bsec\.?/g, "s")
    .replace(/\bminutes?\b|\bmin\.?/g, "m")
    .replace(/\bhours?\b|\bhrs?\.?/g, "h")
    .replace(/\bdays?\b/g, "d")
    .replace(/\bweeks?\b|\bwks?\.?/g, "w")
    .replace(/\bmonths?\b|\bmos?\.?/g, "mo")
    .replace(/\byears?\b|\byrs?\.?/g, "y")
    // "42 s ago" -> "42s ago"
    .replace(/(\d)\s+(s|m|h|d|w|mo|y)\b/g, "$1$2");
}

export function formatRelativeTime(
  value: Date | number | string | null | undefined,
  options: RelativeTimeOptions = {},
): string {
  if (value === null || value === undefined) return "—";
  const { locale = "en-US", now = Date.now(), short = true } = options;
  const target = value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (Number.isNaN(target)) return "—";

  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: short ? "short" : "long" });
  let duration = (target - (now instanceof Date ? now.getTime() : now)) / 1000;

  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      const rendered = formatter.format(Math.round(duration), division.unit);
      return short ? shorten(rendered) : rendered;
    }
    duration /= division.amount;
  }
  return "—";
}

export interface AbsoluteTimeOptions {
  locale?: string;
  /** `date` (Sep 25, 2026), `time` (14:05 UTC), `datetime` (Sep 25, 14:05 UTC) */
  style?: "date" | "time" | "datetime";
  timeZone?: string;
}

export function formatAbsoluteTime(
  value: Date | number | string | null | undefined,
  options: AbsoluteTimeOptions = {},
): string {
  if (value === null || value === undefined) return "—";
  const { locale = "en-US", style = "date", timeZone = "UTC" } = options;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  if (style === "time") {
    return `${new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hour12: false, timeZone }).format(date)} ${timeZone}`;
  }
  if (style === "datetime") {
    const day = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone }).format(date);
    const time = new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone,
    }).format(date);
    return `${day}, ${time} ${timeZone}`;
  }
  const sameYear = date.getUTCFullYear() === new Date().getUTCFullYear();
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
    timeZone,
  }).format(date);
}

export type FreshnessLevel = "live" | "fresh" | "stale" | "expired";

export interface FreshnessInput {
  /** Age in seconds beyond which data is considered stale/expired. */
  freshSeconds?: number;
  staleSeconds?: number;
}

export function resolveFreshness(
  updatedAt: Date | number | string | null | undefined,
  { freshSeconds = 300, staleSeconds = 3600 }: FreshnessInput = {},
  now: Date | number = Date.now(),
): FreshnessLevel {
  if (updatedAt === null || updatedAt === undefined) return "expired";
  const target = updatedAt instanceof Date ? updatedAt.getTime() : new Date(updatedAt).getTime();
  if (Number.isNaN(target)) return "expired";
  const ageSeconds = Math.abs((now instanceof Date ? now.getTime() : now) - target) / 1000;
  if (ageSeconds <= 60) return "live";
  if (ageSeconds <= freshSeconds) return "fresh";
  if (ageSeconds <= staleSeconds) return "stale";
  return "expired";
}
