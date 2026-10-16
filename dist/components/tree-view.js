"use client";
import { useControllableState } from "../hooks/use-controllable-state.js";
import { cn } from "../utils/cn.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useMemo, useRef, useState } from "react";
import { RiArrowRightSLine } from "@remixicon/react";
//#region src/components/tree-view.tsx
function flatten(nodes, expanded, level = 1, parentId = null, out = []) {
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
			expanded: hasChildren && isExpanded
		});
		if (hasChildren && isExpanded) flatten(node.children ?? [], expanded, level + 1, node.id, out);
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
function treeBranchIds(nodes) {
	const ids = [];
	const walk = (list) => {
		for (const node of list) if (node.children && node.children.length > 0) {
			ids.push(node.id);
			walk(node.children);
		}
	};
	walk(nodes);
	return ids;
}
/** Depth-first search by id. Exported because callers need the node, not the row. */
function findTreeNode(nodes, id) {
	for (const node of nodes) {
		if (node.id === id) return node;
		const hit = node.children ? findTreeNode(node.children, id) : void 0;
		if (hit) return hit;
	}
}
function TreeView({ nodes, expandedIds, defaultExpandedIds = [], onExpandedChange, selectedId, defaultSelectedId = null, onSelect, selectionFollowsFocus = true, label, indent = 16, className, ...props }) {
	const [open, setOpen] = useControllableState({
		value: expandedIds ? [...expandedIds] : void 0,
		defaultValue: [...defaultExpandedIds],
		onChange: onExpandedChange
	});
	const [selected, setSelected] = useControllableState({
		value: selectedId,
		defaultValue: defaultSelectedId,
		onChange: (id) => {
			if (id) {
				const node = findTreeNode(nodes, id);
				if (node) onSelect?.(id, node);
			}
		}
	});
	const openSet = useMemo(() => new Set(open), [open]);
	const rows = useMemo(() => flatten(nodes, openSet), [nodes, openSet]);
	const [activeId, setActiveId] = useState(null);
	const containerRef = useRef(null);
	const visible = useMemo(() => new Set(rows.map((entry) => entry.node.id)), [rows]);
	const focused = activeId ?? selected ?? null;
	const focusId = focused !== null && visible.has(focused) ? focused : selected !== null && visible.has(selected) ? selected : rows[0]?.node.id ?? null;
	const commitSelection = useCallback((id) => {
		setSelected(id);
	}, [setSelected]);
	const toggle = useCallback((id, next) => {
		setOpen((current) => next ? [.../* @__PURE__ */ new Set([...current, id])] : current.filter((item) => item !== id));
	}, [setOpen]);
	/** Move the stop and the DOM focus to a row, without touching the selection. */
	const focusRow = useCallback((id) => {
		setActiveId(id);
		(containerRef.current?.querySelector(`[data-tree-row="${CSS.escape(id)}"]`))?.focus();
	}, []);
	const moveFocus = useCallback((id) => {
		focusRow(id);
		if (selectionFollowsFocus) commitSelection(id);
	}, [
		commitSelection,
		focusRow,
		selectionFollowsFocus
	]);
	const handleKeyDown = useCallback((event) => {
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
			case "ArrowRight":
				event.preventDefault();
				if (row.hasChildren && !row.expanded) toggle(row.node.id, true);
				else if (row.hasChildren) {
					const child = rows[index + 1];
					if (child) moveFocus(child.node.id);
				}
				break;
			case "ArrowLeft":
				event.preventDefault();
				if (row.hasChildren && row.expanded) toggle(row.node.id, false);
				else if (row.parentId) moveFocus(row.parentId);
				break;
			case "Home":
				event.preventDefault();
				if (focusable[0]) moveFocus(focusable[0].node.id);
				break;
			case "End": {
				event.preventDefault();
				const last = focusable[focusable.length - 1];
				if (last) moveFocus(last.node.id);
				break;
			}
			case "Enter":
			case " ":
				event.preventDefault();
				if (!row.node.disabled) commitSelection(row.node.id);
				break;
			case "*": {
				event.preventDefault();
				const ids = rows.filter((entry) => entry.parentId === row.parentId && entry.hasChildren && !entry.node.disabled).map((entry) => entry.node.id);
				setOpen([.../* @__PURE__ */ new Set([...open, ...ids])]);
				break;
			}
		}
	}, [
		commitSelection,
		focusId,
		moveFocus,
		open,
		rows,
		setOpen,
		toggle
	]);
	return /* @__PURE__ */ jsx("div", {
		ref: containerRef,
		role: "tree",
		"aria-label": label,
		tabIndex: -1,
		"data-slot": "tree-view",
		onKeyDown: handleKeyDown,
		className: cn("flex flex-col gap-0.5", className),
		...props,
		children: rows.map((row) => {
			const isSelected = selected === row.node.id;
			const isActive = focusId === row.node.id;
			return /* @__PURE__ */ jsxs("div", {
				role: "treeitem",
				"data-tree-row": row.node.id,
				"data-slot": "tree-view-row",
				"aria-level": row.level,
				"aria-setsize": row.setSize,
				"aria-posinset": row.posInSet,
				"aria-expanded": row.hasChildren ? row.expanded : void 0,
				"aria-selected": isSelected,
				"aria-disabled": row.node.disabled || void 0,
				tabIndex: isActive ? 0 : -1,
				style: { paddingInlineStart: `${(row.level - 1) * indent}px` },
				onClick: () => {
					if (row.node.disabled) return;
					setActiveId(row.node.id);
					commitSelection(row.node.id);
				},
				onFocus: () => setActiveId(row.node.id),
				className: cn("luc-transition luc-focus flex min-h-8 cursor-pointer items-center gap-1.5 rounded-sm px-2 text-label", "text-fg-secondary hover:bg-surface-interactive-hover hover:text-fg-primary", isSelected && "bg-surface-selected text-fg-primary shadow-well", row.node.disabled && "cursor-not-allowed text-fg-disabled hover:bg-transparent"),
				children: [
					row.hasChildren ? /* @__PURE__ */ jsx("button", {
						type: "button",
						tabIndex: -1,
						"aria-hidden": "true",
						onClick: (event) => {
							event.stopPropagation();
							toggle(row.node.id, !row.expanded);
							focusRow(row.node.id);
						},
						className: "luc-transition -ml-0.5 grid size-4 shrink-0 place-items-center rounded-xs text-fg-muted hover:text-fg-primary",
						children: /* @__PURE__ */ jsx(RiArrowRightSLine, { className: cn("size-4 luc-transition", row.expanded && "rotate-90") })
					}) : /* @__PURE__ */ jsx("span", {
						"aria-hidden": "true",
						className: "size-4 shrink-0"
					}),
					row.node.icon ? /* @__PURE__ */ jsx("span", {
						"aria-hidden": "true",
						className: "grid size-4 shrink-0 place-items-center text-fg-muted [&_svg]:size-4",
						children: row.node.icon
					}) : null,
					/* @__PURE__ */ jsx("span", {
						className: "min-w-0 flex-1 truncate",
						children: row.node.label
					}),
					row.node.meta ? /* @__PURE__ */ jsx("span", {
						className: "shrink-0 text-caption text-fg-muted",
						children: row.node.meta
					}) : null
				]
			}, row.node.id);
		})
	});
}
//#endregion
export { TreeView, findTreeNode, treeBranchIds };

//# sourceMappingURL=tree-view.js.map