"use client";
import { useControllableState } from "../hooks/use-controllable-state.js";
import { cn } from "../utils/cn.js";
import { Text } from "../typography.js";
import { Button } from "./button-base.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useId, useMemo, useState } from "react";
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";
//#region src/components/transfer-list.tsx
function TransferList({ items, value, defaultValue = [], onValueChange, sourceLabel = "Available", targetLabel = "Selected", height = 240, className, ...props }) {
	const [chosen, setChosen] = useControllableState({
		value: value ? [...value] : void 0,
		defaultValue: [...defaultValue],
		onChange: onValueChange
	});
	const [selected, setSelected] = useState(() => /* @__PURE__ */ new Set());
	const [activeId, setActiveId] = useState(null);
	const listId = useId();
	const chosenSet = useMemo(() => new Set(chosen), [chosen]);
	const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
	const source = items.filter((item) => !chosenSet.has(item.id));
	const target = items.filter((item) => chosenSet.has(item.id));
	const toggleSelected = useCallback((id) => {
		setSelected((current) => {
			const next = new Set(current);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}, []);
	const move = useCallback((direction) => {
		if (selected.size === 0) return;
		const ids = [...selected].filter((id) => byId.has(id));
		const next = direction === "right" ? [...chosen, ...ids.filter((id) => !chosenSet.has(id))] : chosen.filter((id) => !selected.has(id));
		setChosen(next);
		setSelected(/* @__PURE__ */ new Set());
	}, [
		byId,
		chosen,
		chosenSet,
		selected,
		setChosen
	]);
	const handleKeyDown = useCallback((event, pane) => {
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
			case "Home":
				event.preventDefault();
				if (pane[0]) setActiveId(pane[0].id);
				break;
			case "End": {
				event.preventDefault();
				const last = pane[pane.length - 1];
				if (last) setActiveId(last.id);
				break;
			}
			case " ":
			case "Enter":
				event.preventDefault();
				if (activeId) toggleSelected(activeId);
				break;
			case "a":
				if (!(event.metaKey || event.ctrlKey)) break;
				event.preventDefault();
				setSelected(new Set(pane.map((item) => item.id)));
				break;
			case "ArrowRight":
				if (pane === source) {
					event.preventDefault();
					move("right");
				}
				break;
			case "ArrowLeft": if (pane === target) {
				event.preventDefault();
				move("left");
			}
		}
	}, [
		activeId,
		move,
		source,
		target,
		toggleSelected
	]);
	const pane = (paneItems, paneLabel, side) => {
		const localId = `${listId}-${side}`;
		return /* @__PURE__ */ jsxs("div", {
			className: "flex min-w-0 flex-1 flex-col gap-1.5",
			children: [/* @__PURE__ */ jsx(Text, {
				variant: "micro",
				tone: "muted",
				id: `${localId}-label`,
				children: paneLabel
			}), /* @__PURE__ */ jsxs("ul", {
				role: "listbox",
				"aria-multiselectable": "true",
				"aria-labelledby": `${localId}-label`,
				"aria-activedescendant": activeId ? `${localId}-${activeId}` : void 0,
				tabIndex: 0,
				onKeyDown: (event) => handleKeyDown(event, [...paneItems]),
				onFocus: () => {
					if (!activeId && paneItems[0]) setActiveId(paneItems[0].id);
				},
				style: { height },
				className: cn("luc-focus-inset luc-well overflow-y-auto rounded-md border border-line-subtle bg-surface-sunken p-1"),
				children: [paneItems.length === 0 ? /* @__PURE__ */ jsx("li", {
					className: "px-2 py-3 text-caption text-fg-muted",
					children: "Nothing here."
				}) : null, paneItems.map((item) => {
					const isSelected = selected.has(item.id);
					const isActive = activeId === item.id;
					return /* @__PURE__ */ jsxs("li", {
						id: `${localId}-${item.id}`,
						role: "option",
						"aria-selected": isSelected,
						"aria-disabled": item.disabled || void 0,
						onClick: () => {
							setActiveId(item.id);
							if (!item.disabled) toggleSelected(item.id);
						},
						className: cn("luc-transition flex cursor-pointer flex-col gap-0.5 rounded-sm px-2 py-1.5 text-label", "text-fg-secondary hover:bg-surface-interactive-hover", isSelected && "bg-surface-selected text-fg-primary shadow-well", isActive && !isSelected && "bg-surface-interactive", item.disabled && "cursor-not-allowed text-fg-disabled"),
						children: [/* @__PURE__ */ jsx("span", {
							className: "truncate",
							children: item.label
						}), item.description ? /* @__PURE__ */ jsx("span", {
							className: "truncate text-caption text-fg-muted",
							children: item.description
						}) : null]
					}, item.id);
				})]
			})]
		});
	};
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "transfer-list",
		className: cn("flex flex-col gap-3 sm:flex-row sm:items-end", className),
		...props,
		children: [
			pane(source, sourceLabel, "source"),
			/* @__PURE__ */ jsxs("div", {
				className: "flex shrink-0 flex-row items-center justify-center gap-1.5 sm:flex-col sm:pb-1",
				children: [/* @__PURE__ */ jsx(Button, {
					type: "button",
					variant: "secondary",
					size: "sm",
					disabled: selected.size === 0 || ![...selected].some((id) => !chosenSet.has(id)),
					onClick: () => move("right"),
					"aria-label": `Move selected to ${targetLabel}`,
					children: /* @__PURE__ */ jsx(RiArrowRightSLine, {
						"aria-hidden": "true",
						className: "size-4"
					})
				}), /* @__PURE__ */ jsx(Button, {
					type: "button",
					variant: "secondary",
					size: "sm",
					disabled: selected.size === 0 || ![...selected].some((id) => chosenSet.has(id)),
					onClick: () => move("left"),
					"aria-label": `Move selected to ${sourceLabel}`,
					children: /* @__PURE__ */ jsx(RiArrowLeftSLine, {
						"aria-hidden": "true",
						className: "size-4"
					})
				})]
			}),
			pane(target, targetLabel, "target")
		]
	});
}
//#endregion
export { TransferList };

//# sourceMappingURL=transfer-list.js.map