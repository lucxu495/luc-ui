"use client";

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { RiArrowRightSLine } from "@remixicon/react";
import { cn } from "../utils/cn";
import { useControllableState } from "../hooks/use-controllable-state";

/**
 * LUC TreeView — a hierarchical list you can walk with the keyboard.
 *
 * A tree is one of the few structures where ARIA actually has a complete
 * answer, so this follows the `tree`/`treeitem` pattern exactly instead of
 * approximating it with nested lists:
 *
 *   · one Tab stop for the whole tree (roving `tabindex`), never one per row
 *   · Up/Down walk the *visible* rows, Home/End jump to the ends
 *   · Right expands a closed branch, then steps into its first child
 *   · Left collapses an open branch, then steps out to the parent
 *   · Enter/Space selects; `*` expands every closed sibling of the focused row
 *   · `aria-level`/`aria-setsize`/`aria-posinset` state the shape, so a screen
 *     reader announces "3 of 8, level 2" rather than an indentation nobody can
 *     see
 *
 * That roving Tab stop is an invariant, not a detail: **exactly one visible row
 * carries `tabIndex={0}`**. The Navigation review measured the case that broke
 * it — collapsing a branch while one of its children held the stop left
 * `activeId` pointing at a row that was no longer rendered, so *no* row was
 * focusable and the tree could only be re-entered with a pointer. The stop now
 * falls back to the selection and then to the first row (see `focusId` below),
 * and collapsing with the chevron hands it back to the branch itself.
 *
 * The surface is the spatial one: a selected row settles into the panel with
 * the same well the Slider thumb and a selected Table row use, so depth means
 * the same thing here as it does everywhere else.
 */

export interface TreeNode {
  id: string;
  label: ReactNode;
  children?: readonly TreeNode[];
  disabled?: boolean;
  /** Leading glyph — a folder, a file type, a product icon. */
  icon?: ReactNode;
  /** Trailing metadata: a count, a status badge, a shortcut. */
  meta?: ReactNode;
}

export interface TreeViewProps extends Omit<React.ComponentPropsWithRef<"div">, "onSelect"> {
  nodes: readonly TreeNode[];
  /** Controlled set of open ids. */
  expandedIds?: readonly string[];
  defaultExpandedIds?: readonly string[];
  onExpandedChange?: (ids: string[]) => void;
  /** Controlled selection. `null` means "nothing is selected". */
  selectedId?: string | null;
  defaultSelectedId?: string | null;
  onSelect?: (id: string, node: TreeNode) => void;
  /** Move the selection with the arrow keys, not only the focus. Default `true`. */
  selectionFollowsFocus?: boolean;
  /** Accessible name for the tree. Required — a tree with no name is a puzzle. */
  label?: string;
  /** Indentation per level, in pixels. Default 16. */
  indent?: number;
}

interface Row {
  node: TreeNode;
  level: number;
  parentId: string | null;
  posInSet: number;
  setSize: number;
  hasChildren: boolean;
  expanded: boolean;
}

function flatten(
  nodes: readonly TreeNode[],
  expanded: ReadonlySet<string>,
  level = 1,
  parentId: string | null = null,
  out: Row[] = [],
): Row[] {
  /*
   * Every node is a row, including a disabled leaf.
   *
   * This used to drop disabled nodes that had no children, which made the
   * `disabled` prop a delete button: `/components/tree-view`'s own fixture ends
   * in `{ id: "archive", disabled: true }` and it rendered nothing at all, while
   * the row below it was already written to style, announce and refuse to select a
   * disabled node — `aria-disabled`, `cursor-not-allowed`, `text-fg-disabled`,
   * and a click handler that returns early. The reader was told the branch
   * existed and could not see it. The keyboard walk still skips these rows (see
   * `focusable` in the key handler): visible and inert, which is what `disabled`
   * means everywhere else in the library.
   */
  const visible = [...nodes];
  visible.forEach((node, index) => {
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const isExpanded = expanded.has(node.id);
    out.push({
      node,
      level,
      parentId,
      posInSet: index + 1,
      setSize: visible.length,
      hasChildren,
      expanded: hasChildren && isExpanded,
    });
    if (hasChildren && isExpanded) {
      flatten(node.children ?? [], expanded, level + 1, node.id, out);
    }
  });
  return out;
}

/**
 * Every id that has children.
 *
 * The helper a consumer needs for an "expand all" control of its own: the tree's
 * keyboard `*` is the level-scoped APG binding, so a caller that really wants the
 * whole hierarchy open calls this and hands the ids back as `expandedIds`.
 */
export function treeBranchIds(nodes: readonly TreeNode[]): string[] {
  const ids: string[] = [];
  const walk = (list: readonly TreeNode[]) => {
    for (const node of list) {
      if (node.children && node.children.length > 0) {
        ids.push(node.id);
        walk(node.children);
      }
    }
  };
  walk(nodes);
  return ids;
}

/** Depth-first search by id. Exported because callers need the node, not the row. */
export function findTreeNode(nodes: readonly TreeNode[], id: string): TreeNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const hit = node.children ? findTreeNode(node.children, id) : undefined;
    if (hit) return hit;
  }
  return undefined;
}

export function TreeView({
  nodes,
  expandedIds,
  defaultExpandedIds = [],
  onExpandedChange,
  selectedId,
  defaultSelectedId = null,
  onSelect,
  selectionFollowsFocus = true,
  label,
  indent = 16,
  className,
  ...props
}: TreeViewProps) {
  const [open, setOpen] = useControllableState<string[]>({
    value: expandedIds ? [...expandedIds] : undefined,
    defaultValue: [...defaultExpandedIds],
    onChange: onExpandedChange,
  });
  const [selected, setSelected] = useControllableState<string | null>({
    value: selectedId,
    defaultValue: defaultSelectedId,
    onChange: (id) => {
      if (id) {
        const node = findTreeNode(nodes, id);
        if (node) onSelect?.(id, node);
      }
    },
  });

  const openSet = useMemo(() => new Set(open), [open]);
  const rows = useMemo(() => flatten(nodes, openSet), [nodes, openSet]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /*
   * The roving Tab stop, and it has to be a row the reader can see.
   *
   * `activeId` is the row they last touched; a collapse — theirs, or a
   * controlled `expandedIds` from the caller — can leave it pointing into a
   * branch that is no longer rendered. `isActive` would then be true of nothing,
   * no row would carry `tabIndex={0}`, and the tree would have no keyboard way
   * back in. So the stop lands on the first of: the row they were on, the row
   * they selected, the first visible row.
   */
  const visible = useMemo(() => new Set(rows.map((entry) => entry.node.id)), [rows]);
  const focused = activeId ?? selected ?? null;
  const focusId =
    focused !== null && visible.has(focused)
      ? focused
      : selected !== null && visible.has(selected)
        ? selected
        : (rows[0]?.node.id ?? null);

  const commitSelection = useCallback(
    (id: string) => {
      setSelected(id);
    },
    [setSelected],
  );

  const toggle = useCallback(
    (id: string, next: boolean) => {
      setOpen((current) => (next ? [...new Set([...current, id])] : current.filter((item) => item !== id)));
    },
    [setOpen],
  );

  /** Move the stop and the DOM focus to a row, without touching the selection. */
  const focusRow = useCallback((id: string) => {
    setActiveId(id);
    const target = containerRef.current?.querySelector<HTMLElement>(`[data-tree-row="${CSS.escape(id)}"]`);
    target?.focus();
  }, []);

  const moveFocus = useCallback(
    (id: string) => {
      focusRow(id);
      if (selectionFollowsFocus) commitSelection(id);
    },
    [commitSelection, focusRow, selectionFollowsFocus],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!focusId) return;
      const index = rows.findIndex((row) => row.node.id === focusId);
      if (index === -1) return;
      const row = rows[index];
      if (!row) return;
      const focusable = rows.filter((entry) => !entry.node.disabled);
      const focusIndex = focusable.findIndex((entry) => entry.node.id === focusId);

      switch (event.key) {
        case "ArrowDown": {
          event.preventDefault();
          const next = focusable[Math.min(focusIndex + 1, focusable.length - 1)];
          if (next) moveFocus(next.node.id);
          break;
        }
        case "ArrowUp": {
          event.preventDefault();
          const previous = focusable[Math.max(focusIndex - 1, 0)];
          if (previous) moveFocus(previous.node.id);
          break;
        }
        case "ArrowRight": {
          event.preventDefault();
          if (row.hasChildren && !row.expanded) toggle(row.node.id, true);
          else if (row.hasChildren) {
            const child = rows[index + 1];
            if (child) moveFocus(child.node.id);
          }
          break;
        }
        case "ArrowLeft": {
          event.preventDefault();
          if (row.hasChildren && row.expanded) toggle(row.node.id, false);
          else if (row.parentId) moveFocus(row.parentId);
          break;
        }
        case "Home": {
          event.preventDefault();
          if (focusable[0]) moveFocus(focusable[0].node.id);
          break;
        }
        case "End": {
          event.preventDefault();
          const last = focusable[focusable.length - 1];
          if (last) moveFocus(last.node.id);
          break;
        }
        case "Enter":
        case " ": {
          event.preventDefault();
          if (!row.node.disabled) commitSelection(row.node.id);
          break;
        }
        case "*": {
          event.preventDefault();
          /*
           * APG's level-scoped binding: every closed sibling of the focused row,
           * so its whole next level becomes visible. This used to expand every
           * branch in the tree, which is neither what ARIA defines nor what this
           * module and the CHANGELOG have always said it does.
           */
          const ids = rows
            .filter(
              (entry) =>
                entry.parentId === row.parentId && entry.hasChildren && !entry.node.disabled,
            )
            .map((entry) => entry.node.id);
          setOpen([...new Set([...open, ...ids])]);
          break;
        }
        default:
          break;
      }
    },
    [commitSelection, focusId, moveFocus, open, rows, setOpen, toggle],
  );

  return (
    <div
      ref={containerRef}
      role="tree"
      aria-label={label}
      // The rows carry the roving tab stop; the tree itself only needs to be
      // programmatically focusable so a click can move focus into it.
      tabIndex={-1}
      data-slot="tree-view"
      onKeyDown={handleKeyDown}
      className={cn("flex flex-col gap-0.5", className)}
      {...props}
    >
      {rows.map((row) => {
        const isSelected = selected === row.node.id;
        const isActive = focusId === row.node.id;
        return (
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- the tree container owns the keydown handler (roving tabindex)
          <div
            key={row.node.id}
            role="treeitem"
            data-tree-row={row.node.id}
            data-slot="tree-view-row"
            aria-level={row.level}
            aria-setsize={row.setSize}
            aria-posinset={row.posInSet}
            aria-expanded={row.hasChildren ? row.expanded : undefined}
            aria-selected={isSelected}
            aria-disabled={row.node.disabled || undefined}
            tabIndex={isActive ? 0 : -1}
            style={{ paddingInlineStart: `${(row.level - 1) * indent}px` }}
            onClick={() => {
              if (row.node.disabled) return;
              setActiveId(row.node.id);
              commitSelection(row.node.id);
            }}
            onFocus={() => setActiveId(row.node.id)}
            className={cn(
              "luc-transition luc-focus flex min-h-8 cursor-pointer items-center gap-1.5 rounded-sm px-2 text-label",
              "text-fg-secondary hover:bg-surface-interactive-hover hover:text-fg-primary",
              isSelected && "bg-surface-selected text-fg-primary shadow-well",
              row.node.disabled && "cursor-not-allowed text-fg-disabled hover:bg-transparent",
            )}
          >
            {row.hasChildren ? (
              <button
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                onClick={(event) => {
                  event.stopPropagation();
                  toggle(row.node.id, !row.expanded);
                  /*
                   * The chevron is `aria-hidden` and outside the tab order, so
                   * the click must leave the stop where it belongs — on the
                   * branch, which is the row APG keeps focus on after a
                   * collapse — rather than on a control no keyboard can reach.
                   */
                  focusRow(row.node.id);
                }}
                className="luc-transition -ml-0.5 grid size-4 shrink-0 place-items-center rounded-xs text-fg-muted hover:text-fg-primary"
              >
                <RiArrowRightSLine
                  className={cn("size-4 luc-transition", row.expanded && "rotate-90")}
                />
              </button>
            ) : (
              <span aria-hidden="true" className="size-4 shrink-0" />
            )}
            {row.node.icon ? (
              <span aria-hidden="true" className="grid size-4 shrink-0 place-items-center text-fg-muted [&_svg]:size-4">
                {row.node.icon}
              </span>
            ) : null}
            <span className="min-w-0 flex-1 truncate">{row.node.label}</span>
            {row.node.meta ? (
              <span className="shrink-0 text-caption text-fg-muted">{row.node.meta}</span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
