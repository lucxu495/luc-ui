"use client";

import { useCallback, useState, type ReactNode } from "react";
import { RiDragMove2Line } from "@remixicon/react";
import { cn } from "../utils/cn";

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
export function SortableAnnouncer({ message }: { message: string }) {
  return (
    <span aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </span>
  );
}

export function SortableList({
  items,
  onReorder,
  label = "Reorderable list",
  disabled = false,
  className,
  ...props
}: SortableListProps) {
  const [lifting, setLifting] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const ids = items.map((item) => item.id);

  const nameOf = (id: string) => {
    const item = items.find((entry) => entry.id === id);
    return typeof item?.label === "string" ? item.label : id;
  };

  const move = useCallback(
    (from: number, to: number) => {
      if (from === to || from < 0 || to < 0 || from >= ids.length || to >= ids.length) return;
      const next = [...ids];
      const [removed] = next.splice(from, 1);
      if (removed === undefined) return;
      next.splice(to, 0, removed);
      onReorder(next);
    },
    [ids, onReorder],
  );

  const onHandleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, id: string, index: number) => {
    if (disabled) return;
    const total = items.length;
    switch (event.key) {
      case " ":
      case "Enter": {
        event.preventDefault();
        if (lifting === id) {
          setLifting(null);
          setMessage(`${nameOf(id)} dropped at position ${index + 1} of ${total}.`);
        } else {
          setLifting(id);
          setMessage(`${nameOf(id)} picked up. Use the arrow keys to move it, Space to drop, Escape to cancel.`);
        }
        break;
      }
      case "ArrowUp": {
        if (lifting !== id) return;
        event.preventDefault();
        move(index, index - 1);
        setMessage(`${nameOf(id)} moved to position ${Math.max(index, 1)} of ${total}.`);
        break;
      }
      case "ArrowDown": {
        if (lifting !== id) return;
        event.preventDefault();
        move(index, index + 1);
        setMessage(`${nameOf(id)} moved to position ${Math.min(index + 2, total)} of ${total}.`);
        break;
      }
      case "Home": {
        if (lifting !== id) return;
        event.preventDefault();
        move(index, 0);
        setMessage(`${nameOf(id)} moved to the top.`);
        break;
      }
      case "End": {
        if (lifting !== id) return;
        event.preventDefault();
        move(index, total - 1);
        setMessage(`${nameOf(id)} moved to the bottom.`);
        break;
      }
      case "Escape": {
        if (lifting !== id) return;
        event.preventDefault();
        setLifting(null);
        setMessage("Move cancelled.");
        break;
      }
      default:
        break;
    }
  };

  return (
    <div data-slot="sortable-list" className={cn("flex flex-col", className)} {...props}>
      <SortableAnnouncer message={message} />
      <ul aria-label={label} className="flex flex-col gap-1.5">
        {items.map((item, index) => {
          const isLifting = lifting === item.id;
          const isDragging = dragging === item.id;
          const isOver = over === item.id && dragging !== null && dragging !== item.id;
          return (
            <li
              key={item.id}
              draggable={!disabled && !item.disabled}
              onDragStart={(event) => {
                setDragging(item.id);
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", item.id);
              }}
              onDragEnd={() => {
                setDragging(null);
                setOver(null);
              }}
              onDragOver={(event) => {
                if (disabled) return;
                event.preventDefault();
                setOver(item.id);
              }}
              onDrop={(event) => {
                event.preventDefault();
                const sourceId = event.dataTransfer.getData("text/plain") || dragging;
                const from = ids.indexOf(sourceId ?? "");
                setOver(null);
                setDragging(null);
                if (from !== -1) {
                  move(from, index);
                  setMessage(`${nameOf(sourceId ?? "")} moved to position ${index + 1} of ${items.length}.`);
                }
              }}
              data-lifting={isLifting ? "true" : undefined}
              className={cn(
                "luc-transition flex items-center gap-2.5 rounded-md border border-line-subtle bg-surface-default px-3 py-2 luc-rest",
                !disabled && !item.disabled && "hover:luc-hover hover:border-line-strong",
                isLifting && "border-line-accent bg-surface-selected",
                isDragging && "opacity-60",
                isOver && "border-line-accent shadow-[inset_0_0_0_1px_var(--line-accent)]",
                item.disabled && "opacity-60",
              )}
            >
              <button
                type="button"
                disabled={disabled || item.disabled}
                aria-pressed={isLifting}
                aria-label={`Reorder ${typeof item.label === "string" ? item.label : item.id}`}
                onKeyDown={(event) => onHandleKeyDown(event, item.id, index)}
                className={cn(
                  "luc-transition luc-focus -ml-1 grid size-6 shrink-0 cursor-grab place-items-center rounded-sm",
                  "text-fg-muted hover:bg-surface-interactive-hover hover:text-fg-primary",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  isLifting && "cursor-grabbing bg-surface-selected text-fg-accent",
                )}
              >
                <RiDragMove2Line aria-hidden="true" className="size-4" />
              </button>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-label text-fg-primary">{item.label}</span>
                {item.description ? (
                  <span className="truncate text-caption text-fg-muted">{item.description}</span>
                ) : null}
              </span>
              <span aria-hidden="true" className="shrink-0 text-micro text-fg-muted luc-numeric">
                {index + 1}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
