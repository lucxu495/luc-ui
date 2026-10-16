"use client";
import { cn } from "../utils/cn.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useState } from "react";
import { RiDragMove2Line } from "@remixicon/react";
//#region src/components/sortable-list.tsx
/** The polite live region both sortables narrate through. */
function SortableAnnouncer({ message }) {
	return /* @__PURE__ */ jsx("span", {
		"aria-live": "polite",
		"aria-atomic": "true",
		className: "sr-only",
		children: message
	});
}
function SortableList({ items, onReorder, label = "Reorderable list", disabled = false, className, ...props }) {
	const [lifting, setLifting] = useState(null);
	const [dragging, setDragging] = useState(null);
	const [over, setOver] = useState(null);
	const [message, setMessage] = useState("");
	const ids = items.map((item) => item.id);
	const nameOf = (id) => {
		const item = items.find((entry) => entry.id === id);
		return typeof item?.label === "string" ? item.label : id;
	};
	const move = useCallback((from, to) => {
		if (from === to || from < 0 || to < 0 || from >= ids.length || to >= ids.length) return;
		const next = [...ids];
		const [removed] = next.splice(from, 1);
		if (removed === void 0) return;
		next.splice(to, 0, removed);
		onReorder(next);
	}, [ids, onReorder]);
	const onHandleKeyDown = (event, id, index) => {
		if (disabled) return;
		const total = items.length;
		switch (event.key) {
			case " ":
			case "Enter":
				event.preventDefault();
				if (lifting === id) {
					setLifting(null);
					setMessage(`${nameOf(id)} dropped at position ${index + 1} of ${total}.`);
				} else {
					setLifting(id);
					setMessage(`${nameOf(id)} picked up. Use the arrow keys to move it, Space to drop, Escape to cancel.`);
				}
				break;
			case "ArrowUp":
				if (lifting !== id) return;
				event.preventDefault();
				move(index, index - 1);
				setMessage(`${nameOf(id)} moved to position ${Math.max(index, 1)} of ${total}.`);
				break;
			case "ArrowDown":
				if (lifting !== id) return;
				event.preventDefault();
				move(index, index + 1);
				setMessage(`${nameOf(id)} moved to position ${Math.min(index + 2, total)} of ${total}.`);
				break;
			case "Home":
				if (lifting !== id) return;
				event.preventDefault();
				move(index, 0);
				setMessage(`${nameOf(id)} moved to the top.`);
				break;
			case "End":
				if (lifting !== id) return;
				event.preventDefault();
				move(index, total - 1);
				setMessage(`${nameOf(id)} moved to the bottom.`);
				break;
			case "Escape":
				if (lifting !== id) return;
				event.preventDefault();
				setLifting(null);
				setMessage("Move cancelled.");
		}
	};
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "sortable-list",
		className: cn("flex flex-col", className),
		...props,
		children: [/* @__PURE__ */ jsx(SortableAnnouncer, { message }), /* @__PURE__ */ jsx("ul", {
			"aria-label": label,
			className: "flex flex-col gap-1.5",
			children: items.map((item, index) => {
				const isLifting = lifting === item.id;
				const isDragging = dragging === item.id;
				const isOver = over === item.id && dragging !== null && dragging !== item.id;
				return /* @__PURE__ */ jsxs("li", {
					draggable: !disabled && !item.disabled,
					onDragStart: (event) => {
						setDragging(item.id);
						event.dataTransfer.effectAllowed = "move";
						event.dataTransfer.setData("text/plain", item.id);
					},
					onDragEnd: () => {
						setDragging(null);
						setOver(null);
					},
					onDragOver: (event) => {
						if (disabled) return;
						event.preventDefault();
						setOver(item.id);
					},
					onDrop: (event) => {
						event.preventDefault();
						const sourceId = event.dataTransfer.getData("text/plain") || dragging;
						const from = ids.indexOf(sourceId ?? "");
						setOver(null);
						setDragging(null);
						if (from !== -1) {
							move(from, index);
							setMessage(`${nameOf(sourceId ?? "")} moved to position ${index + 1} of ${items.length}.`);
						}
					},
					"data-lifting": isLifting ? "true" : void 0,
					className: cn("luc-transition flex items-center gap-2.5 rounded-md border border-line-subtle bg-surface-default px-3 py-2 luc-rest", !disabled && !item.disabled && "hover:luc-hover hover:border-line-strong", isLifting && "border-line-accent bg-surface-selected", isDragging && "opacity-60", isOver && "border-line-accent shadow-[inset_0_0_0_1px_var(--line-accent)]", item.disabled && "opacity-60"),
					children: [
						/* @__PURE__ */ jsx("button", {
							type: "button",
							disabled: disabled || item.disabled,
							"aria-pressed": isLifting,
							"aria-label": `Reorder ${typeof item.label === "string" ? item.label : item.id}`,
							onKeyDown: (event) => onHandleKeyDown(event, item.id, index),
							className: cn("luc-transition luc-focus -ml-1 grid size-6 shrink-0 cursor-grab place-items-center rounded-sm", "text-fg-muted hover:bg-surface-interactive-hover hover:text-fg-primary", "disabled:cursor-not-allowed disabled:opacity-50", isLifting && "cursor-grabbing bg-surface-selected text-fg-accent"),
							children: /* @__PURE__ */ jsx(RiDragMove2Line, {
								"aria-hidden": "true",
								className: "size-4"
							})
						}),
						/* @__PURE__ */ jsxs("span", {
							className: "flex min-w-0 flex-1 flex-col",
							children: [/* @__PURE__ */ jsx("span", {
								className: "truncate text-label text-fg-primary",
								children: item.label
							}), item.description ? /* @__PURE__ */ jsx("span", {
								className: "truncate text-caption text-fg-muted",
								children: item.description
							}) : null]
						}),
						/* @__PURE__ */ jsx("span", {
							"aria-hidden": "true",
							className: "shrink-0 text-micro text-fg-muted luc-numeric",
							children: index + 1
						})
					]
				}, item.id);
			})
		})]
	});
}
//#endregion
export { SortableAnnouncer, SortableList };

//# sourceMappingURL=sortable-list.js.map