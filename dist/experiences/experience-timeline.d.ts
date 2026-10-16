//#region src/experiences/experience-timeline.d.ts
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
export declare function ExperienceTimeline({ items, variant, density, currentLabel, className, ...props }: ExperienceTimelineProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=experience-timeline.d.ts.map