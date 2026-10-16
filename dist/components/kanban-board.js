"use client";
import { cn } from "../utils/cn.js";
import { SortableAnnouncer } from "./sortable-list.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId, useState } from "react";
import { RiDragMove2Line } from "@remixicon/react";
//#region src/components/kanban-board.tsx
function KanbanBoard({ columns, onMove, label = "Board", disabled = false, className, ...props }) {
	const [lifted, setLifted] = useState(null);
	const [dragging, setDragging] = useState(null);
	const [over, setOver] = useState(null);
	const [message, setMessage] = useState("");
	const labelId = useId();
	const locate = (cardId) => {
		for (const column of columns) if (column.cards.some((card) => card.id === cardId)) return {
			cardId,
			columnId: column.id
		};
		return null;
	};
	const titleOf = (cardId) => {
		for (const column of columns) {
			const card = column.cards.find((entry) => entry.id === cardId);
			if (card && typeof card.title === "string") return card.title;
		}
		return cardId;
	};
	const columnName = (column) => typeof column.title === "string" ? column.title : column.id;
	const handleKeyDown = (event, card, columnIndex, index) => {
		if (disabled) return;
		const column = columns[columnIndex];
		if (!column) return;
		const isLifted = lifted?.cardId === card.id;
		const carry = (delta) => {
			const target = columns[columnIndex + delta];
			if (!target) return;
			onMove({
				cardId: card.id,
				from: column.id,
				to: target.id,
				index: Math.min(index, target.cards.length)
			});
			setMessage(`${titleOf(card.id)} moved to ${columnName(target)}.`);
		};
		const reorder = (to) => {
			if (to < 0 || to >= column.cards.length) return;
			onMove({
				cardId: card.id,
				from: column.id,
				to: column.id,
				index: to
			});
			setMessage(`${titleOf(card.id)} moved to position ${to + 1} in ${columnName(column)}.`);
		};
		switch (event.key) {
			case " ":
			case "Enter":
				event.preventDefault();
				if (isLifted) {
					setLifted(null);
					setMessage(`${titleOf(card.id)} dropped.`);
				} else {
					setLifted({
						cardId: card.id,
						columnId: column.id
					});
					setMessage(`${titleOf(card.id)} picked up. Arrow keys move it, Space drops it, Escape cancels.`);
				}
				break;
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
		}
	};
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "kanban-board",
		"aria-label": label,
		className: cn("flex gap-3 overflow-x-auto pb-1", className),
		...props,
		children: [/* @__PURE__ */ jsx(SortableAnnouncer, { message }), columns.map((column, columnIndex) => /* @__PURE__ */ jsxs("section", {
			"aria-labelledby": `${labelId}-${column.id}`,
			className: "flex w-64 shrink-0 flex-col gap-2 rounded-lg border border-line-subtle bg-surface-sunken p-2.5 luc-well",
			children: [/* @__PURE__ */ jsxs("header", {
				className: "flex items-center justify-between gap-2 px-0.5",
				children: [/* @__PURE__ */ jsx("h3", {
					id: `${labelId}-${column.id}`,
					className: "text-label text-fg-primary",
					children: column.title
				}), /* @__PURE__ */ jsx("span", {
					"aria-hidden": "true",
					className: "text-micro text-fg-muted luc-numeric",
					children: column.cards.length
				})]
			}), /* @__PURE__ */ jsx("ul", {
				className: "flex min-h-16 flex-col gap-2",
				children: column.cards.map((card, index) => {
					const isLifted = lifted?.cardId === card.id;
					const isDragging = dragging?.cardId === card.id;
					const isOver = over?.columnId === column.id && over.index === index && dragging !== null;
					return /* @__PURE__ */ jsxs("li", {
						draggable: !disabled,
						onDragStart: (event) => {
							setDragging({
								cardId: card.id,
								columnId: column.id
							});
							event.dataTransfer.effectAllowed = "move";
							event.dataTransfer.setData("text/plain", card.id);
						},
						onDragEnd: () => {
							setDragging(null);
							setOver(null);
						},
						onDragOver: (event) => {
							if (disabled) return;
							event.preventDefault();
							setOver({
								columnId: column.id,
								index
							});
						},
						onDrop: (event) => {
							event.preventDefault();
							const cardId = event.dataTransfer.getData("text/plain") || dragging?.cardId;
							const origin = cardId ? locate(cardId) : null;
							setOver(null);
							setDragging(null);
							if (cardId && origin) {
								onMove({
									cardId,
									from: origin.columnId,
									to: column.id,
									index
								});
								setMessage(`${titleOf(cardId)} moved to ${columnName(column)}.`);
							}
						},
						className: cn("luc-transition flex items-start gap-2 rounded-md border border-line-subtle bg-surface-default p-2.5 luc-rest", "hover:luc-hover hover:border-line-strong", isLifted && "border-line-accent bg-surface-selected", isDragging && "opacity-60", isOver && "border-line-accent"),
						children: [/* @__PURE__ */ jsx("button", {
							type: "button",
							disabled,
							"aria-pressed": isLifted,
							"aria-label": `Move ${typeof card.title === "string" ? card.title : card.id}`,
							onKeyDown: (event) => handleKeyDown(event, card, columnIndex, index),
							className: cn("luc-transition luc-focus -ml-0.5 grid size-6 shrink-0 cursor-grab place-items-center rounded-sm", "text-fg-muted hover:bg-surface-interactive-hover hover:text-fg-primary", isLifted && "cursor-grabbing bg-surface-selected text-fg-accent"),
							children: /* @__PURE__ */ jsx(RiDragMove2Line, {
								"aria-hidden": "true",
								className: "size-4"
							})
						}), /* @__PURE__ */ jsxs("span", {
							className: "flex min-w-0 flex-1 flex-col gap-0.5",
							children: [
								/* @__PURE__ */ jsx("span", {
									className: "text-label text-fg-primary",
									children: card.title
								}),
								card.description ? /* @__PURE__ */ jsx("span", {
									className: "text-caption text-fg-muted",
									children: card.description
								}) : null,
								card.meta ? /* @__PURE__ */ jsx("span", {
									className: "text-micro text-fg-muted",
									children: card.meta
								}) : null
							]
						})]
					}, card.id);
				})
			})]
		}, column.id))]
	});
}
//#endregion
export { KanbanBoard };

//# sourceMappingURL=kanban-board.js.map