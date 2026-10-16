"use client";

import { Children, type ReactNode } from "react";
import { IconButton } from "../components/icon-button";
import { cn } from "../utils/cn";

/**
 * Form composition. These are layout and semantics, never state: a section does
 * not know what a form engine is, and a repeating group does not know how the
 * rows are stored. See docs/FORM_GUIDE.md.
 */

export interface FormSectionProps extends Omit<React.ComponentPropsWithRef<"section">, "title"> {
  title: ReactNode;
  description?: ReactNode;
  /** Trailing content in the heading row — a toggle, a link, a count. */
  actions?: ReactNode;
  /** Column count for the fields inside, from the `sm` breakpoint up. */
  columns?: 1 | 2 | 3;
}

/**
 * A named block of fields. The heading is a real `<h3>` inside a `<section>`, so
 * a long settings page keeps a navigable document outline.
 */
export function FormSection({
  title,
  description,
  actions,
  columns = 2,
  children,
  className,
  ...props
}: FormSectionProps) {
  return (
    <section data-slot="form-section" className={cn("flex min-w-0 flex-col gap-4", className)} {...props}>
      <div className="flex flex-col gap-3 border-b border-line-subtle pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="text-title font-medium text-fg-primary">{title}</h3>
          {description ? <p className="max-w-[68ch] text-caption text-fg-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      <div
        data-slot="form-section-body"
        className={cn(
          "grid gap-x-5 gap-y-4",
          columns === 1 && "grid-cols-1",
          columns === 2 && "grid-cols-1 md:grid-cols-2",
          columns === 3 && "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
        )}
      >
        {children}
      </div>
    </section>
  );
}

export interface FieldArrayProps extends React.ComponentPropsWithRef<"div"> {
  /** Row label, e.g. `(index) => `Attendee ${index + 1}``. */
  legend: ReactNode;
  description?: ReactNode;
  /** Current row count. The array itself lives in the consumer's form engine. */
  count: number;
  onAdd?: () => void;
  /** Omit to make the group fixed-length. */
  onRemove?: (index: number) => void;
  /** Reordering is deliberately button-driven — no drag-and-drop in V0.4. */
  onMove?: (from: number, to: number) => void;
  addLabel?: string;
  /** Rows are rendered by the caller with its own engine's bindings. */
  children: ReactNode;
  minRows?: number;
}

/**
 * The chrome around repeating rows: numbering, remove, move, add.
 *
 * It renders no inputs and holds no array. Products wire it to
 * `useFieldArray` (React Hook Form), a store slice, or plain `useState` — the
 * point is that add/remove/move look and behave the same everywhere.
 */
export function FieldArray({
  legend,
  description,
  count,
  onAdd,
  onRemove,
  onMove,
  addLabel = "Add row",
  minRows = 1,
  children,
  className,
  ...props
}: FieldArrayProps) {
  const rows = Children.toArray(children);

  return (
    <div data-slot="field-array" className={cn("flex min-w-0 flex-col gap-3", className)} {...props}>
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-label font-medium text-fg-secondary">{legend}</p>
          {description ? <p className="max-w-[68ch] text-caption text-fg-muted">{description}</p> : null}
        </div>
        {onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            className={cn(
              "inline-flex h-control-sm items-center gap-1.5 rounded-sm px-2.5 text-label font-medium",
              "text-fg-accent luc-transition luc-focus",
              "hover:bg-accent-soft",
            )}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5">
              <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </svg>
            {addLabel}
          </button>
        ) : null}
      </div>

      <ol data-slot="field-array-rows" className="flex flex-col gap-2">
        {rows.map((row, index) => (
          <li
            key={index}
            data-slot="field-array-row"
            className="group/row flex items-start gap-3 rounded-lg border border-line-subtle bg-surface-canvas p-3"
          >
            <span
              aria-hidden="true"
              className="mt-2 grid size-5 shrink-0 place-items-center rounded-xs bg-surface-sunken text-micro text-fg-muted luc-numeric"
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">{row}</div>
            {(onRemove || onMove) && count > minRows ? (
              <div className="flex shrink-0 items-center gap-0.5 pt-0.5">
                {onMove ? (
                  <>
                    <IconButton
                      label={`Move row ${index + 1} up`}
                      size="sm"
                      variant="ghost"
                      disabled={index === 0}
                      onClick={() => onMove(index, index - 1)}
                      icon={
                        <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5">
                          <path
                            d="M8 12.5V4m0 0L4.5 7.5M8 4l3.5 3.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                          />
                        </svg>
                      }
                    />
                    <IconButton
                      label={`Move row ${index + 1} down`}
                      size="sm"
                      variant="ghost"
                      disabled={index === count - 1}
                      onClick={() => onMove(index, index + 1)}
                      icon={
                        <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5">
                          <path
                            d="M8 3.5V12m0 0 3.5-3.5M8 12 4.5 8.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                          />
                        </svg>
                      }
                    />
                  </>
                ) : null}
                {onRemove ? (
                  <IconButton
                    label={`Remove row ${index + 1}`}
                    size="sm"
                    variant="ghost"
                    onClick={() => onRemove(index)}
                    icon={
                      <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5">
                        <path
                          d="M4.5 4.5l7 7m0-7l-7 7"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          fill="none"
                        />
                      </svg>
                    }
                  />
                ) : null}
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
