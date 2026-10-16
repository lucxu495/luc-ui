"use client";

import { useMemo } from "react";
import { cn } from "../utils/cn";
import { useControllableState } from "../hooks/use-controllable-state";

/**
 * LUC PublicationList — a bibliography you can narrow.
 *
 * An academic page has one job a CV does not: a visitor arrives looking for the
 * work on one topic, in one year, of one kind, and the page has to let them get
 * there without scrolling forty entries. So filtering is built in and derived
 * from the data — the type and topic facets are the values actually present, not
 * a list the author has to keep in sync.
 *
 * Two rules are deliberate. Nothing is invented: an entry without a DOI prints
 * no DOI, and the component never guesses a citation count. And nothing is sorted
 * behind the caller's back — entries render in the order given, because a
 * bibliography's order is a claim.
 *
 *   Faculty page      publications, filtered by year and type
 *   Lab site          the same list, grouped by year
 *   Research log      preprints and talks in one filterable stream
 */

export type PublicationKind = string;

export interface Publication {
  id: string;
  title: string;
  /** Author line, in the order the venue prints it. */
  authors: string;
  /** Journal, conference, preprint server or publisher. */
  venue: string;
  year: number;
  /** "Journal article", "Conference paper", "Preprint", "Talk". */
  kind?: PublicationKind;
  topics?: readonly string[];
  /** Digital object identifier, without the URL. Rendered as a link when present. */
  doi?: string;
  url?: string;
  /** Where the entry was cited — shown only when the caller supplies it. */
  citations?: number;
  /** Free-form note: award, equal contribution, under review. */
  note?: string;
}

export interface PublicationListProps
  extends Omit<React.ComponentPropsWithRef<"div">, "defaultValue"> {
  publications: readonly Publication[];
  value?: { year?: number | "all"; kind?: string | "all"; topic?: string | "all" };
  defaultValue?: { year?: number | "all"; kind?: string | "all"; topic?: string | "all" };
  onValueChange?: (next: { year?: number | "all"; kind?: string | "all"; topic?: string | "all" }) => void;
  /** Hide the facet bar and render everything. */
  filters?: boolean;
  /** Accessible name for the filter group. Default "Filter publications". */
  filterLabel?: string;
  /** Wording for the empty result. */
  emptyText?: string;
  /** Heading level of each entry's title. Default 3. */
  headingLevel?: 3 | 4;
}

const ALL = "all" as const;

function facets(publications: readonly Publication[]) {
  const years = Array.from(new Set(publications.map((entry) => entry.year))).sort((a, b) => b - a);
  const kinds = Array.from(
    new Set(publications.map((entry) => entry.kind).filter((kind): kind is string => !!kind)),
  ).sort();
  const topics = Array.from(new Set(publications.flatMap((entry) => entry.topics ?? []))).sort();
  return { years, kinds, topics };
}

export function PublicationList({
  publications,
  value,
  defaultValue,
  onValueChange,
  filters = true,
  filterLabel = "Filter publications",
  emptyText = "No publications match these filters.",
  headingLevel = 3,
  className,
  ...props
}: PublicationListProps) {
  const [selection, setSelection] = useControllableState<{
    year?: number | "all";
    kind?: string | "all";
    topic?: string | "all";
  }>({
    value,
    defaultValue: defaultValue ?? { year: ALL, kind: ALL, topic: ALL },
    onChange: onValueChange,
  });

  const options = useMemo(() => facets(publications), [publications]);
  const year = selection.year ?? ALL;
  const kind = selection.kind ?? ALL;
  const topic = selection.topic ?? ALL;

  const visible = publications.filter(
    (entry) =>
      (year === ALL || entry.year === year) &&
      (kind === ALL || entry.kind === kind) &&
      (topic === ALL || (entry.topics ?? []).includes(topic)),
  );
  const Heading = (headingLevel === 4 ? "h4" : "h3") as "h3" | "h4";

  return (
    <div data-slot="publication-list" className={cn("flex flex-col gap-5", className)} {...props}>
      {filters ? (
        <div
          role="group"
          aria-label={filterLabel}
          className="flex flex-wrap items-end gap-x-6 gap-y-3 rounded-md border border-line-subtle bg-surface-raised p-4"
        >
          <Facet
            label="Year"
            value={String(year)}
            onChange={(next) => setSelection({ ...selection, year: next === ALL ? ALL : Number(next) })}
            options={[
              { value: ALL, label: "All years" },
              ...options.years.map((option) => ({ value: String(option), label: String(option) })),
            ]}
          />
          {options.kinds.length > 1 ? (
            <Facet
              label="Type"
              value={kind}
              onChange={(next) => setSelection({ ...selection, kind: next })}
              options={[
                { value: ALL, label: "All types" },
                ...options.kinds.map((option) => ({ value: option, label: option })),
              ]}
            />
          ) : null}
          {options.topics.length > 1 ? (
            <Facet
              label="Topic"
              value={topic}
              onChange={(next) => setSelection({ ...selection, topic: next })}
              options={[
                { value: ALL, label: "All topics" },
                ...options.topics.map((option) => ({ value: option, label: option })),
              ]}
            />
          ) : null}
          <p aria-live="polite" className="ml-auto text-caption text-fg-muted luc-numeric">
            {visible.length} of {publications.length}
          </p>
        </div>
      ) : null}

      {visible.length === 0 ? (
        <p className="rounded-md border border-dashed border-line-default bg-surface-sunken p-6 text-center text-body text-fg-muted">
          {emptyText}
        </p>
      ) : (
        <ol className="flex list-none flex-col">
          {visible.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-col gap-2 border-t border-line-subtle py-5 first:border-t-0 first:pt-0"
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <Heading className="max-w-[70ch] text-title font-semibold text-fg-primary text-balance">
                  {entry.title}
                </Heading>
                {entry.kind ? (
                  <span className="rounded-xs border border-line-subtle bg-surface-interactive px-2 py-0.5 text-micro text-fg-muted">
                    {entry.kind}
                  </span>
                ) : null}
              </div>
              <p className="max-w-[80ch] text-body text-fg-secondary text-pretty">{entry.authors}</p>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-fg-muted">
                <cite className="not-italic">{entry.venue}</cite>
                <span aria-hidden="true">·</span>
                <span className="luc-numeric">{entry.year}</span>
                {entry.citations !== undefined ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="luc-numeric">{entry.citations} citations</span>
                  </>
                ) : null}
              </p>
              {entry.note ? (
                <p className="text-caption text-fg-accent">{entry.note}</p>
              ) : null}
              {entry.doi || entry.url ? (
                <p className="flex flex-wrap gap-4 pt-1">
                  {entry.doi ? (
                    <a
                      href={`https://doi.org/${entry.doi}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="luc-focus rounded-xs text-caption font-medium text-fg-accent underline decoration-line-accent underline-offset-4"
                      aria-label={`DOI ${entry.doi} — opens in a new tab`}
                    >
                      DOI {entry.doi}
                    </a>
                  ) : null}
                  {entry.url ? (
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="luc-focus rounded-xs text-caption font-medium text-fg-accent underline decoration-line-accent underline-offset-4"
                    >
                      Read
                    </a>
                  ) : null}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function Facet({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
}) {
  const id = `publication-facet-${label.toLowerCase()}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-micro text-fg-muted">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "luc-well luc-focus h-8 min-w-[9rem] rounded-sm border border-line-default",
          "bg-surface-sunken px-2 text-label text-fg-primary",
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
