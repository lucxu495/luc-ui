"use client";

import { useId, useState, type ReactNode } from "react";
import { RiDragMove2Line } from "@remixicon/react";
import { cn } from "../utils/cn";
import { SortableAnnouncer } from "./sortable-list";

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

interface HeldCard {
  cardId: string;
  columnId: string;
}

export function KanbanBoard({
  columns,
  onMove,
  label = "Board",
  disabled = false,
  className,
  ...props
}: KanbanBoardProps) {
  const [lifted, setLifted] = useState<HeldCard | null>(null);
  const [dragging, setDragging] = useState<HeldCard | null>(null);
  const [over, setOver] = useState<{ columnId: string; index: number } | null>(null);
  const [message, setMessage] = useState("");
  const labelId = useId();

  const locate = (cardId: string): HeldCard | null => {
    for (const column of columns) {
      if (column.cards.some((card) => card.id === cardId)) return { cardId, columnId: column.id };
    }
    return null;
  };

  const titleOf = (cardId: string) => {
    for (const column of columns) {
      const card = column.cards.find((entry) => entry.id === cardId);
      if (card && typeof card.title === "string") return card.title;
    }
    return cardId;
  };

  const columnName = (column: KanbanColumn) => (typeof column.title === "string" ? column.title : column.id);

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    card: KanbanCard,
    columnIndex: number,
    index: number,
  ) => {
    if (disabled) return;
    const column = columns[columnIndex];
    if (!column) return;
    const isLifted = lifted?.cardId === card.id;

    const carry = (delta: number) => {
      const target = columns[columnIndex + delta];
      if (!target) return;
      onMove({ cardId: card.id, from: column.id, to: target.id, index: Math.min(index, target.cards.length) });
      setMessage(`${titleOf(card.id)} moved to ${columnName(target)}.`);
    };
    const reorder = (to: number) => {
      if (to < 0 || to >= column.cards.length) return;
      onMove({ cardId: card.id, from: column.id, to: column.id, index: to });
      setMessage(`${titleOf(card.id)} moved to position ${to + 1} in ${columnName(column)}.`);
    };

    switch (event.key) {
      case " ":
      case "Enter": {
        event.preventDefault();
        if (isLifted) {
          setLifted(null);
          setMessage(`${titleOf(card.id)} dropped.`);
        } else {
          setLifted({ cardId: card.id, columnId: column.id });
          setMessage(`${titleOf(card.id)} picked up. Arrow keys move it, Space drops it, Escape cancels.`);
        }
        break;
      }
      case "ArrowUp":
        if (!isLifted) return;
        event.preventDefault();
        reorder(index - 1);
        break;
      case "ArrowDown":
        if (!isLifted) return;
        event.preventDefault();
        reorder(index + 1);
        break;
      case "ArrowLeft":
        if (!isLifted) return;
        event.preventDefault();
        carry(-1);
        break;
      case "ArrowRight":
        if (!isLifted) return;
        event.preventDefault();
        carry(1);
        break;
      case "Escape":
        if (!isLifted) return;
        event.preventDefault();
        setLifted(null);
        setMessage("Move cancelled.");
        break;
      default:
        break;
    }
  };

  return (
    <div
      data-slot="kanban-board"
      aria-label={label}
      className={cn("flex gap-3 overflow-x-auto pb-1", className)}
      {...props}
    >
      <SortableAnnouncer message={message} />
      {columns.map((column, columnIndex) => (
        <section
          key={column.id}
          aria-labelledby={`${labelId}-${column.id}`}
          className="flex w-64 shrink-0 flex-col gap-2 rounded-lg border border-line-subtle bg-surface-sunken p-2.5 luc-well"
        >
          <header className="flex items-center justify-between gap-2 px-0.5">
            <h3 id={`${labelId}-${column.id}`} className="text-label text-fg-primary">
              {column.title}
            </h3>
            <span aria-hidden="true" className="text-micro text-fg-muted luc-numeric">
              {column.cards.length}
            </span>
          </header>
          <ul className="flex min-h-16 flex-col gap-2">
            {column.cards.map((card, index) => {
              const isLifted = lifted?.cardId === card.id;
              const isDragging = dragging?.cardId === card.id;
              const isOver = over?.columnId === column.id && over.index === index && dragging !== null;
              return (
                <li
                  key={card.id}
                  draggable={!disabled}
                  onDragStart={(event) => {
                    setDragging({ cardId: card.id, columnId: column.id });
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", card.id);
                  }}
                  onDragEnd={() => {
                    setDragging(null);
                    setOver(null);
                  }}
                  onDragOver={(event) => {
                    if (disabled) return;
                    event.preventDefault();
                    setOver({ columnId: column.id, index });
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const cardId = event.dataTransfer.getData("text/plain") || dragging?.cardId;
                    const origin = cardId ? locate(cardId) : null;
                    setOver(null);
                    setDragging(null);
                    if (cardId && origin) {
                      onMove({ cardId, from: origin.columnId, to: column.id, index });
                      setMessage(`${titleOf(cardId)} moved to ${columnName(column)}.`);
                    }
                  }}
                  className={cn(
                    "luc-transition flex items-start gap-2 rounded-md border border-line-subtle bg-surface-default p-2.5 luc-rest",
                    "hover:luc-hover hover:border-line-strong",
                    isLifted && "border-line-accent bg-surface-selected",
                    isDragging && "opacity-60",
                    isOver && "border-line-accent",
                  )}
                >
                  <button
                    type="button"
                    disabled={disabled}
                    aria-pressed={isLifted}
                    aria-label={`Move ${typeof card.title === "string" ? card.title : card.id}`}
                    onKeyDown={(event) => handleKeyDown(event, card, columnIndex, index)}
                    className={cn(
                      "luc-transition luc-focus -ml-0.5 grid size-6 shrink-0 cursor-grab place-items-center rounded-sm",
                      "text-fg-muted hover:bg-surface-interactive-hover hover:text-fg-primary",
                      isLifted && "cursor-grabbing bg-surface-selected text-fg-accent",
                    )}
                  >
                    <RiDragMove2Line aria-hidden="true" className="size-4" />
                  </button>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-label text-fg-primary">{card.title}</span>
                    {card.description ? (
                      <span className="text-caption text-fg-muted">{card.description}</span>
                    ) : null}
                    {card.meta ? <span className="text-micro text-fg-muted">{card.meta}</span> : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
