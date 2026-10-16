import { ReactNode } from "react";
//#region src/components/result.d.ts
/**
 * LUC Result — the surface a flow ends on.
 *
 * `EmptyState` answers "there is nothing here", which is a state a page sits in.
 * A Result answers "this is what happened when you pressed the button" — a
 * submitted form, a finished import, a failed payment — and it is usually the
 * *whole* content of the page rather than a block inside one. Those two needs
 * look similar and are not: an empty table wants a compact, in-place invitation,
 * while a completed import wants a title the reader can read from across the
 * room, one paragraph of what to do next, and the two actions that follow from
 * it.
 *
 * Three decisions worth stating, because they are where this could have been
 * worse than a plain `div`:
 *
 *  1. **The title is required and has no default.** A library that ships
 *     `"Something went wrong"` inside itself ships an English string to every
 *     consumer that cannot translate it — the message a user reads when the
 *     product fails is the last copy that should be untranslatable. The caller
 *     writes the outcome; this component owns only the mark, the rhythm and the
 *     tone.
 *  2. **No implicit live region.** A Result is normally the page's own content,
 *     and `role="alert"` on the main content of a page announces it twice. When
 *     it *does* arrive after mount, the caller says so — `role="status"` is a
 *     prop pass-through like any other, and the reason is documented rather than
 *     guessed at.
 *  3. **`status` sets a tone, not a colour scheme.** The mark is the semantic
 *     part; the title and the body stay the page's own type colours, so a
 *     success page does not turn into a green wall next to a green chart.
 */
export type ResultStatus = "success" | "error" | "warning" | "info" | "empty";
export interface ResultProps extends Omit<React.ComponentPropsWithRef<"div">, "title"> {
  /** What happened. Drives the mark and its tone; the copy stays the caller's. */
  status: ResultStatus;
  title: ReactNode;
  description?: ReactNode;
  /**
   * Override the status mark. Pass `null` for a text-only outcome — a 404 does
   * not always want a red circle above it.
   */
  icon?: ReactNode;
  /** What the reader can do next: one primary action, optionally a second. */
  extra?: ReactNode;
  /** Body content for an outcome that owes the reader more than a paragraph. */
  children?: ReactNode;
  /** `md` fills a page; `sm` sits inside a card, a dialog or a pane. */
  size?: "sm" | "md";
  /**
   * Heading level for the title. Defaults to `h1`, because the usual job is to
   * be the heading of the page this outcome replaced.
   */
  titleAs?: "h1" | "h2" | "h3" | "p";
}
export declare function Result({ className, status, title, description, icon, extra, children, size, titleAs: TitleTag, ...props }: ResultProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=result.d.ts.map