import { cn } from "../utils/cn";

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

/**
 * `YYYY-MM-DD` in, a locale-formatted date out, without `Date` drift.
 *
 * `new Date("2026-03-01")` is parsed as UTC midnight and then printed in the
 * visitor's zone, so a reader in Auckland sees 1 March and a reader in Los
 * Angeles sees 28 February — a hydration mismatch on the server and a wrong date
 * everywhere else. Parsing the parts and formatting in UTC removes both.
 */
function formatUpdatedAt(iso: string, locale: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }).format(date);
  } catch {
    return iso;
  }
}

export function NowSection({
  updatedAt,
  items,
  title = "Now",
  lead,
  updatedLabel = "Updated {date}",
  locale = "en-US",
  className,
  ...props
}: NowSectionProps) {
  const formatted = formatUpdatedAt(updatedAt, locale);
  return (
    <section
      data-slot="now-section"
      className={cn(
        "luc-rest flex flex-col gap-5 rounded-md border border-line-subtle bg-surface-raised p-6",
        className,
      )}
      {...props}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-heading-sm font-semibold text-fg-primary">{title}</h2>
        <p className="text-micro text-fg-muted">
          <time dateTime={updatedAt} className="luc-numeric">
            {updatedLabel.replace("{date}", formatted)}
          </time>
        </p>
      </header>
      {lead ? <p className="max-w-[68ch] text-body text-fg-secondary text-pretty">{lead}</p> : null}
      <dl className="flex flex-col gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="grid gap-1 border-t border-line-subtle pt-4 first:border-t-0 first:pt-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6"
          >
            <dt className="text-micro font-medium text-fg-muted sm:pt-0.5">{item.label}</dt>
            <dd className="min-w-0 text-body text-fg-secondary text-pretty">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
