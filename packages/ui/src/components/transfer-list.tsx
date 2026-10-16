"use client";

import { useCallback, useId, useMemo, useState, type ReactNode } from "react";
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";
import { cn } from "../utils/cn";
import { useControllableState } from "../hooks/use-controllable-state";
import { Button } from "./button-base";
import { Text } from "./typography";

/**
 * LUC TransferList — move items between two sets without losing sight of either.
 *
 * The whole reason this exists rather than a multi-select Combobox is
 * *visibility*: an operator assigning columns, permissions or instruments needs
 * to see what is excluded as clearly as what is included.
 *
 * Both panes are `listbox`es with a roving active option
 * (`aria-activedescendant`) so the list is a single Tab stop per pane;
 * Space/Enter toggles the active option, `Ctrl/Cmd+A` selects everything in the
 * focused pane, and the four buttons move the current selection either way.
 * `value` is the right-hand set — the only state a form usually needs.
 */

export interface TransferItem {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export interface TransferListProps extends Omit<React.ComponentPropsWithRef<"div">, "onChange" | "defaultValue"> {
  items: readonly TransferItem[];
  /** Ids on the right-hand side. */
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (ids: string[]) => void;
  sourceLabel?: string;
  targetLabel?: string;
  /** Pane height in pixels. Default 240. */
  height?: number;
}

export function TransferList({
  items,
  value,
  defaultValue = [],
  onValueChange,
  sourceLabel = "Available",
  targetLabel = "Selected",
  height = 240,
  className,
  ...props
}: TransferListProps) {
  const [chosen, setChosen] = useControllableState<string[]>({
    value: value ? [...value] : undefined,
    defaultValue: [...defaultValue],
    onChange: onValueChange,
  });
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  // `useId` (not a random string) so the server and the client agree on the ids.
  const listId = useId();

  const chosenSet = useMemo(() => new Set(chosen), [chosen]);
  const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const source = items.filter((item) => !chosenSet.has(item.id));
  const target = items.filter((item) => chosenSet.has(item.id));

  const toggleSelected = useCallback((id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const move = useCallback(
    (direction: "right" | "left") => {
      if (selected.size === 0) return;
      const ids = [...selected].filter((id) => byId.has(id));
      const next =
        direction === "right"
          ? [...chosen, ...ids.filter((id) => !chosenSet.has(id))]
          : chosen.filter((id) => !selected.has(id));
      setChosen(next);
      setSelected(new Set());
    },
    [byId, chosen, chosenSet, selected, setChosen],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLUListElement>, pane: TransferItem[]) => {
      const index = pane.findIndex((item) => item.id === activeId);
      switch (event.key) {
        case "ArrowDown": {
          event.preventDefault();
          const next = pane[Math.min(index + 1, pane.length - 1)];
          if (next) setActiveId(next.id);
          break;
        }
        case "ArrowUp": {
          event.preventDefault();
          const previous = pane[Math.max(index - 1, 0)];
          if (previous) setActiveId(previous.id);
          break;
        }
        case "Home": {
          event.preventDefault();
          if (pane[0]) setActiveId(pane[0].id);
          break;
        }
        case "End": {
          event.preventDefault();
          const last = pane[pane.length - 1];
          if (last) setActiveId(last.id);
          break;
        }
        case " ":
        case "Enter": {
          event.preventDefault();
          if (activeId) toggleSelected(activeId);
          break;
        }
        case "a": {
          if (!(event.metaKey || event.ctrlKey)) break;
          event.preventDefault();
          setSelected(new Set(pane.map((item) => item.id)));
          break;
        }
        case "ArrowRight": {
          if (pane === source) {
            event.preventDefault();
            move("right");
          }
          break;
        }
        case "ArrowLeft": {
          if (pane === target) {
            event.preventDefault();
            move("left");
          }
          break;
        }
        default:
          break;
      }
    },
    [activeId, move, source, target, toggleSelected],
  );

  const pane = (paneItems: readonly TransferItem[], paneLabel: string, side: "source" | "target") => {
    const localId = `${listId}-${side}`;
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Text variant="micro" tone="muted" id={`${localId}-label`}>
          {paneLabel}
        </Text>
        <ul
          role="listbox"
          aria-multiselectable="true"
          aria-labelledby={`${localId}-label`}
          aria-activedescendant={activeId ? `${localId}-${activeId}` : undefined}
          tabIndex={0}
          onKeyDown={(event) => handleKeyDown(event, [...paneItems])}
          onFocus={() => {
            if (!activeId && paneItems[0]) setActiveId(paneItems[0].id);
          }}
          style={{ height }}
          className={cn(
            "luc-focus-inset luc-well overflow-y-auto rounded-md border border-line-subtle bg-surface-sunken p-1",
          )}
        >
          {paneItems.length === 0 ? (
            <li className="px-2 py-3 text-caption text-fg-muted">Nothing here.</li>
          ) : null}
          {paneItems.map((item) => {
            const isSelected = selected.has(item.id);
            const isActive = activeId === item.id;
            return (
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- the pane's listbox owns the keydown handler (roving aria-activedescendant)
              <li
                key={item.id}
                id={`${localId}-${item.id}`}
                role="option"
                aria-selected={isSelected}
                aria-disabled={item.disabled || undefined}
                onClick={() => {
                  setActiveId(item.id);
                  if (!item.disabled) toggleSelected(item.id);
                }}
                className={cn(
                  "luc-transition flex cursor-pointer flex-col gap-0.5 rounded-sm px-2 py-1.5 text-label",
                  "text-fg-secondary hover:bg-surface-interactive-hover",
                  isSelected && "bg-surface-selected text-fg-primary shadow-well",
                  isActive && !isSelected && "bg-surface-interactive",
                  item.disabled && "cursor-not-allowed text-fg-disabled",
                )}
              >
                <span className="truncate">{item.label}</span>
                {item.description ? <span className="truncate text-caption text-fg-muted">{item.description}</span> : null}
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <div data-slot="transfer-list" className={cn("flex flex-col gap-3 sm:flex-row sm:items-end", className)} {...props}>
      {pane(source, sourceLabel, "source")}
      <div className="flex shrink-0 flex-row items-center justify-center gap-1.5 sm:flex-col sm:pb-1">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={selected.size === 0 || ![...selected].some((id) => !chosenSet.has(id))}
          onClick={() => move("right")}
          aria-label={`Move selected to ${targetLabel}`}
        >
          <RiArrowRightSLine aria-hidden="true" className="size-4" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={selected.size === 0 || ![...selected].some((id) => chosenSet.has(id))}
          onClick={() => move("left")}
          aria-label={`Move selected to ${sourceLabel}`}
        >
          <RiArrowLeftSLine aria-hidden="true" className="size-4" />
        </Button>
      </div>
      {pane(target, targetLabel, "target")}
    </div>
  );
}
