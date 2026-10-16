import { ReactNode } from "react";
//#region src/components/kanban-board.d.ts
/**
 * LUC KanbanBoard — a two-axis sortable.
 *
 * Up/Down reorders inside a column; Left/Right carries the lifted card into the
 * neighbouring column at the same depth. Pointer dragging uses the same native
 * drag protocol as `SortableList`, so there is exactly one mental model for
 * "move a thing" across the library.
 *
 * The board is **controlled**: `columns` is the model and `onMove` reports the
 * intent (`cardId`, `from`, `to`, `index`). Nothing is reordered internally,
 * which is what lets an application persist the move, roll it back on failure,
 * or animate the result itself.
 */
export interface KanbanCard {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
}
export interface KanbanColumn {
  id: string;
  title: ReactNode;
  cards: readonly KanbanCard[];
}
export interface KanbanMove {
  cardId: string;
  from: string;
  to: string;
  /** Index inside the destination column, after removal. */
  index: number;
}
export interface KanbanBoardProps extends Omit<React.ComponentPropsWithRef<"div">, "onDragStart"> {
  columns: readonly KanbanColumn[];
  onMove: (move: KanbanMove) => void;
  label?: string;
  disabled?: boolean;
}
export declare function KanbanBoard({ columns, onMove, label, disabled, className, ...props }: KanbanBoardProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=kanban-board.d.ts.map