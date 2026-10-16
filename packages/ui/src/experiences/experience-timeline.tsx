import { cn } from "../utils/cn";

/**
 * LUC ExperienceTimeline — a career, in order.
 *
 * `Timeline` already draws a sequence. This draws the *career* one, and the
 * difference is the data contract rather than the pixels: a role has an
 * organisation, a period with two ends that may not both be known, and a current
 * flag that has to be visible at a glance without colour alone. Publishing it
 * means four personal sites stop each inventing their own date format, their own
 * "present" wording and their own way of marking the job you are still in.
 *
 * The period is rendered inside a `<time>` element with a machine-readable
 * `dateTime` range, so an assistive technology — or an agent reading the page —
 * gets the interval rather than the prose.
 */

export interface ExperienceEntry {
  id: string;
  /** Job title, degree, tenure. */
  role: string;
  /** Employer, institution or client. */
  org: string;
  /** Start, `YYYY` or `YYYY-MM`. */
  from: string;
  /** End, or `undefined` while the role is current. */
  to?: string;
  /** One or two sentences on what the role was. */
  summary?: React.ReactNode;
  /** Concrete outcomes. Keep each to one line. */
  highlights?: readonly string[];
  /** Skills, tools or remit. Rendered as plain labels, not verdicts. */
  tags?: readonly string[];
  /** Renders the open-ended end of the period and the marker. */
  current?: boolean;
  /** Overrides the wording of the open end. Default "Present". */
  currentLabel?: string;
  /** Location or arrangement: "Remote", "Berlin", "Hybrid". */
  location?: string;
}

export interface ExperienceTimelineProps extends Omit<React.ComponentPropsWithRef<"ol">, "children"> {
  items: readonly ExperienceEntry[];
  /** `rail` draws the connector; `plain` is a bare sequence. Default `rail`. */
  variant?: "rail" | "plain";
  /** `summary` hides highlights and tags for a compact CV. */
  density?: "default" | "summary";
  /** Default wording for an entry that is still current. Override to localise. */
  currentLabel?: string;
}

export function ExperienceTimeline({
  items,
  variant = "rail",
  density = "default",
  currentLabel = "Present",
  className,
  ...props
}: ExperienceTimelineProps) {
  return (
    <ol
      data-slot="experience-timeline"
      data-variant={variant}
      className={cn("flex list-none flex-col", className)}
      {...props}
    >
      {items.map((entry, index) => {
        const last = index === items.length - 1;
        return (
          <li key={entry.id} className="relative flex gap-4 pb-8 last:pb-0 sm:gap-6">
            {variant === "rail" ? (
              <div aria-hidden="true" className="relative flex w-4 shrink-0 flex-col items-center">
                <span
                  className={cn(
                    "mt-1.5 size-2.5 shrink-0 rounded-full border",
                    entry.current
                      ? "border-line-accent bg-accent-default"
                      : "border-line-strong bg-surface-raised",
                  )}
                />
                {!last ? <span className="mt-1 w-px flex-1 bg-line-subtle" /> : null}
              </div>
            ) : null}
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-heading-sm font-semibold text-fg-primary text-balance">
                  {entry.role}
                </h3>
                {entry.current ? (
                  <span className="rounded-full border border-line-accent bg-accent-soft px-2 py-0.5 text-micro font-medium text-fg-accent">
                    {entry.currentLabel ?? currentLabel}
                  </span>
                ) : null}
              </div>
              <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-label text-fg-secondary">
                <span className="font-medium">{entry.org}</span>
                {entry.location ? (
                  <>
                    <span aria-hidden="true" className="text-fg-muted">
                      ·
                    </span>
                    <span className="text-fg-muted">{entry.location}</span>
                  </>
                ) : null}
                <span aria-hidden="true" className="text-fg-muted">
                  ·
                </span>
                <time
                  dateTime={entry.to ? `${entry.from}/${entry.to}` : entry.from}
                  className="text-fg-muted luc-numeric tabular-nums"
                >
                  {entry.from} — {entry.to ?? (entry.currentLabel ?? currentLabel)}
                </time>
              </p>
              {entry.summary ? (
                <div className="max-w-[68ch] text-body text-fg-secondary text-pretty">
                  {entry.summary}
                </div>
              ) : null}
              {density === "default" && entry.highlights && entry.highlights.length > 0 ? (
                <ul className="flex list-disc flex-col gap-1 pl-5 text-body text-fg-secondary marker:text-fg-muted">
                  {entry.highlights.map((highlight) => (
                    <li key={highlight} className="text-pretty">
                      {highlight}
                    </li>
                  ))}
                </ul>
              ) : null}
              {density === "default" && entry.tags && entry.tags.length > 0 ? (
                <ul className="flex list-none flex-wrap gap-1.5 pt-1">
                  {entry.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-xs border border-line-subtle bg-surface-interactive px-2 py-0.5 text-micro text-fg-muted"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
