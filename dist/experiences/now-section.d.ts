//#region src/experiences/now-section.d.ts
/**
 * LUC NowSection — what someone is doing at the moment.
 *
 * The `/now` page is a small convention with a large failure mode: without a
 * date it is a claim about the present that may be three years old, and a reader
 * cannot tell. So the component requires `updatedAt` and renders it as a real
 * `<time>` element, and the wording makes the staleness legible rather than
 * hiding it behind "currently".
 *
 *   Personal site    the /now page
 *   Team page        what the group is working on this quarter
 *   Lab notebook     current instruments, datasets and questions
 */
export interface NowItem {
  id: string;
  /** One word or short phrase: "Building", "Reading", "Location". */
  label: string;
  /** The content. A sentence, a link, a list — anything. */
  value: React.ReactNode;
}
export interface NowSectionProps extends React.ComponentPropsWithRef<"section"> {
  /** ISO date (`YYYY-MM-DD`) the section was last true. Required. */
  updatedAt: string;
  items: readonly NowItem[];
  /** Heading. Default "Now". */
  title?: string;
  /** Sentence under the heading. */
  lead?: React.ReactNode;
  /** Wording of the timestamp. `{date}` is replaced. */
  updatedLabel?: string;
  /** Rendered locale for the date. Pass the app's locale for a stable string. */
  locale?: string;
}
export declare function NowSection({ updatedAt, items, title, lead, updatedLabel, locale, className, ...props }: NowSectionProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=now-section.d.ts.map