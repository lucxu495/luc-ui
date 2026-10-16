import { ReactNode } from "react";
//#region src/forms/sections.d.ts
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
export declare function FormSection({ title, description, actions, columns, children, className, ...props }: FormSectionProps): import("react").JSX.Element;
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
export declare function FieldArray({ legend, description, count, onAdd, onRemove, onMove, addLabel, minRows, children, className, ...props }: FieldArrayProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=sections.d.ts.map