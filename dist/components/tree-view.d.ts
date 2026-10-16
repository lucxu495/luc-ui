import { ReactNode } from "react";
//#region src/components/tree-view.d.ts
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
/**
 * Every id that has children.
 *
 * The helper a consumer needs for an "expand all" control of its own: the tree's
 * keyboard `*` is the level-scoped APG binding, so a caller that really wants the
 * whole hierarchy open calls this and hands the ids back as `expandedIds`.
 */
export declare function treeBranchIds(nodes: readonly TreeNode[]): string[];
/** Depth-first search by id. Exported because callers need the node, not the row. */
export declare function findTreeNode(nodes: readonly TreeNode[], id: string): TreeNode | undefined;
export declare function TreeView({ nodes, expandedIds, defaultExpandedIds, onExpandedChange, selectedId, defaultSelectedId, onSelect, selectionFollowsFocus, label, indent, className, ...props }: TreeViewProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=tree-view.d.ts.map