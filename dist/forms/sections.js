"use client";
import { cn } from "../utils/cn.js";
import { IconButton } from "../components/icon-button.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Children } from "react";
//#region src/forms/sections.tsx
/**
* A named block of fields. The heading is a real `<h3>` inside a `<section>`, so
* a long settings page keeps a navigable document outline.
*/
function FormSection({ title, description, actions, columns = 2, children, className, ...props }) {
	return /* @__PURE__ */ jsxs("section", {
		"data-slot": "form-section",
		className: cn("flex min-w-0 flex-col gap-4", className),
		...props,
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex flex-col gap-3 border-b border-line-subtle pb-3 sm:flex-row sm:items-start sm:justify-between",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex min-w-0 flex-col gap-1",
				children: [/* @__PURE__ */ jsx("h3", {
					className: "text-title font-medium text-fg-primary",
					children: title
				}), description ? /* @__PURE__ */ jsx("p", {
					className: "max-w-[68ch] text-caption text-fg-muted",
					children: description
				}) : null]
			}), actions ? /* @__PURE__ */ jsx("div", {
				className: "flex shrink-0 items-center gap-2",
				children: actions
			}) : null]
		}), /* @__PURE__ */ jsx("div", {
			"data-slot": "form-section-body",
			className: cn("grid gap-x-5 gap-y-4", columns === 1 && "grid-cols-1", columns === 2 && "grid-cols-1 md:grid-cols-2", columns === 3 && "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"),
			children
		})]
	});
}
/**
* The chrome around repeating rows: numbering, remove, move, add.
*
* It renders no inputs and holds no array. Products wire it to
* `useFieldArray` (React Hook Form), a store slice, or plain `useState` — the
* point is that add/remove/move look and behave the same everywhere.
*/
function FieldArray({ legend, description, count, onAdd, onRemove, onMove, addLabel = "Add row", minRows = 1, children, className, ...props }) {
	const rows = Children.toArray(children);
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "field-array",
		className: cn("flex min-w-0 flex-col gap-3", className),
		...props,
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-end justify-between gap-3",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex flex-col gap-1",
				children: [/* @__PURE__ */ jsx("p", {
					className: "text-label font-medium text-fg-secondary",
					children: legend
				}), description ? /* @__PURE__ */ jsx("p", {
					className: "max-w-[68ch] text-caption text-fg-muted",
					children: description
				}) : null]
			}), onAdd ? /* @__PURE__ */ jsxs("button", {
				type: "button",
				onClick: onAdd,
				className: cn("inline-flex h-control-sm items-center gap-1.5 rounded-sm px-2.5 text-label font-medium", "text-fg-accent luc-transition luc-focus", "hover:bg-accent-soft"),
				children: [/* @__PURE__ */ jsx("svg", {
					viewBox: "0 0 16 16",
					"aria-hidden": "true",
					className: "size-3.5",
					children: /* @__PURE__ */ jsx("path", {
						d: "M8 3.5v9M3.5 8h9",
						stroke: "currentColor",
						strokeWidth: "1.5",
						strokeLinecap: "round",
						fill: "none"
					})
				}), addLabel]
			}) : null]
		}), /* @__PURE__ */ jsx("ol", {
			"data-slot": "field-array-rows",
			className: "flex flex-col gap-2",
			children: rows.map((row, index) => /* @__PURE__ */ jsxs("li", {
				"data-slot": "field-array-row",
				className: "group/row flex items-start gap-3 rounded-lg border border-line-subtle bg-surface-canvas p-3",
				children: [
					/* @__PURE__ */ jsx("span", {
						"aria-hidden": "true",
						className: "mt-2 grid size-5 shrink-0 place-items-center rounded-xs bg-surface-sunken text-micro text-fg-muted luc-numeric",
						children: index + 1
					}),
					/* @__PURE__ */ jsx("div", {
						className: "min-w-0 flex-1",
						children: row
					}),
					(onRemove || onMove) && count > minRows ? /* @__PURE__ */ jsxs("div", {
						className: "flex shrink-0 items-center gap-0.5 pt-0.5",
						children: [onMove ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(IconButton, {
							label: `Move row ${index + 1} up`,
							size: "sm",
							variant: "ghost",
							disabled: index === 0,
							onClick: () => onMove(index, index - 1),
							icon: /* @__PURE__ */ jsx("svg", {
								viewBox: "0 0 16 16",
								"aria-hidden": "true",
								className: "size-3.5",
								children: /* @__PURE__ */ jsx("path", {
									d: "M8 12.5V4m0 0L4.5 7.5M8 4l3.5 3.5",
									stroke: "currentColor",
									strokeWidth: "1.5",
									strokeLinecap: "round",
									strokeLinejoin: "round",
									fill: "none"
								})
							})
						}), /* @__PURE__ */ jsx(IconButton, {
							label: `Move row ${index + 1} down`,
							size: "sm",
							variant: "ghost",
							disabled: index === count - 1,
							onClick: () => onMove(index, index + 1),
							icon: /* @__PURE__ */ jsx("svg", {
								viewBox: "0 0 16 16",
								"aria-hidden": "true",
								className: "size-3.5",
								children: /* @__PURE__ */ jsx("path", {
									d: "M8 3.5V12m0 0 3.5-3.5M8 12 4.5 8.5",
									stroke: "currentColor",
									strokeWidth: "1.5",
									strokeLinecap: "round",
									strokeLinejoin: "round",
									fill: "none"
								})
							})
						})] }) : null, onRemove ? /* @__PURE__ */ jsx(IconButton, {
							label: `Remove row ${index + 1}`,
							size: "sm",
							variant: "ghost",
							onClick: () => onRemove(index),
							icon: /* @__PURE__ */ jsx("svg", {
								viewBox: "0 0 16 16",
								"aria-hidden": "true",
								className: "size-3.5",
								children: /* @__PURE__ */ jsx("path", {
									d: "M4.5 4.5l7 7m0-7l-7 7",
									stroke: "currentColor",
									strokeWidth: "1.5",
									strokeLinecap: "round",
									fill: "none"
								})
							})
						}) : null]
					}) : null
				]
			}, index))
		})]
	});
}
//#endregion
export { FieldArray, FormSection };

//# sourceMappingURL=sections.js.map