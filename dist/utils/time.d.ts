//#region src/utils/time.d.ts
/**
 * Time formatting for data UI. Timestamps are always rendered from an explicit
 * `now` so output is deterministic in tests and screenshots.
 */
export interface RelativeTimeOptions {
  locale?: string;
  now?: Date | number;
  /** Short form ("3m ago") instead of the verbose one ("3 minutes ago"). */
  short?: boolean;
}
export declare function formatRelativeTime(value: Date | number | string | null | undefined, options?: RelativeTimeOptions): string;
export interface AbsoluteTimeOptions {
  locale?: string;
  /** `date` (Sep 25, 2026), `time` (14:05 UTC), `datetime` (Sep 25, 14:05 UTC) */
  style?: "date" | "time" | "datetime";
  timeZone?: string;
}
export declare function formatAbsoluteTime(value: Date | number | string | null | undefined, options?: AbsoluteTimeOptions): string;
export type FreshnessLevel = "live" | "fresh" | "stale" | "expired";
export interface FreshnessInput {
  /** Age in seconds beyond which data is considered stale/expired. */
  freshSeconds?: number;
  staleSeconds?: number;
}
export declare function resolveFreshness(updatedAt: Date | number | string | null | undefined, { freshSeconds, staleSeconds }?: FreshnessInput, now?: Date | number): FreshnessLevel;
//#endregion
//# sourceMappingURL=time.d.ts.map