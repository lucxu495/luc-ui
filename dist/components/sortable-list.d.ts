import { ReactNode } from "react";
//#region src/components/sortable-list.d.ts
/**
 * LUC SortableList — reordering without a drag library.
 *
 * Adding `dnd-kit` (or a similar toolkit) to the base package would put a
 * dependency on every consumer who never reorders anything, and the browser
 * already ships a drag protocol. So the pointer path is native HTML drag events
 * and the keyboard path is the one screen readers have supported for years:
 * pick up, move, drop, with a polite live region narrating each step.
 *
 *   · **Pointer** — grab the handle, drop the row on a target.
 *   · **Keyboard** — Space picks up, Arrow keys move, Space drops, Escape
 *     cancels. Focus never leaves the handle, because the row keeps its key.
 *   · **Both** go through one `onReorder` callback carrying the complete id
 *     order, so the application owns the model and any optimistic update.
 *
 * The lift is the shared spatial one: the grabbed surface rises and the drop
 * target takes the accent ring, so depth communicates the gesture exactly where
 * the pointer expects it.
 */
export interface SortableItem {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}
export interface SortableListProps extends Omit<React.ComponentPropsWithRef<"div">, "onDragStart"> {
  items: readonly SortableItem[];
  /** The complete id order after the move — never a delta. */
  onReorder: (ids: string[]) => void;
  label?: string;
  disabled?: boolean;
}
/** The polite live region both sortables narrate through. */
export declare function SortableAnnouncer({ message }: {
  message: string;
}): import("react").JSX.Element;
export declare function SortableList({ items, onReorder, label, disabled, className, ...props }: SortableListProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=sortable-list.d.ts.map