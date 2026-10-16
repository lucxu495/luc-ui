import { cn } from "../utils/cn.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
//#region src/experiences/reading-shelf.tsx
const DEFAULT_STATUS_ORDER = [
	"reading",
	"queued",
	"finished"
];
const DEFAULT_STATUS_LABELS = {
	reading: "Reading now",
	queued: "Up next",
	finished: "Finished",
	paused: "Paused",
	abandoned: "Set aside"
};
function ReadingShelf({ items, statuses = DEFAULT_STATUS_ORDER, statusLabels, layout = "list", label = "Reading shelf", emptyGroupText = null, className, ...props }) {
	const groups = statuses.map((status) => ({
		status,
		entries: items.filter((item) => item.status === status)
	})).filter((group) => group.entries.length > 0 || emptyGroupText !== null);
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "reading-shelf",
		"data-layout": layout,
		"aria-label": label,
		className: cn("flex flex-col gap-8", className),
		...props,
		children: groups.map((group) => /* @__PURE__ */ jsxs("section", {
			"aria-label": statusLabels?.[group.status] ?? DEFAULT_STATUS_LABELS[group.status],
			className: "flex flex-col gap-3",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex items-baseline justify-between gap-4 border-b border-line-subtle pb-2",
				children: [/* @__PURE__ */ jsx("h3", {
					className: "text-label font-semibold text-fg-primary",
					children: statusLabels?.[group.status] ?? DEFAULT_STATUS_LABELS[group.status]
				}), /* @__PURE__ */ jsx("span", {
					className: "text-micro text-fg-muted luc-numeric",
					children: group.entries.length
				})]
			}), group.entries.length === 0 ? /* @__PURE__ */ jsx("p", {
				className: "text-body text-fg-muted",
				children: emptyGroupText
			}) : /* @__PURE__ */ jsx("ul", {
				className: cn("grid list-none gap-4", layout === "grid" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"),
				children: group.entries.map((item) => /* @__PURE__ */ jsxs("li", {
					className: cn("min-w-0", layout === "grid" ? "flex flex-col gap-2" : "luc-rest flex flex-row items-start gap-4 rounded-sm border border-line-subtle bg-surface-raised p-3"),
					children: [item.cover ? /* @__PURE__ */ jsx("div", {
						className: cn("shrink-0 overflow-hidden rounded-xs bg-surface-sunken", layout === "grid" ? "aspect-[2/3] w-full" : "aspect-[2/3] w-14"),
						children: item.cover
					}) : null, /* @__PURE__ */ jsxs("div", {
						className: "flex min-w-0 flex-1 flex-col gap-1.5",
						children: [
							/* @__PURE__ */ jsx("p", {
								className: "text-title font-semibold text-fg-primary text-pretty",
								children: item.url ? /* @__PURE__ */ jsx("a", {
									href: item.url,
									target: "_blank",
									rel: "noreferrer noopener",
									className: "luc-focus rounded-xs underline decoration-line-subtle underline-offset-4 hover:decoration-accent-default",
									children: item.title
								}) : item.title
							}),
							/* @__PURE__ */ jsxs("p", {
								className: "text-caption text-fg-secondary",
								children: [item.author, item.edition ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("span", {
									"aria-hidden": "true",
									className: "px-1.5 text-fg-muted",
									children: "·"
								}), /* @__PURE__ */ jsx("span", {
									className: "text-fg-muted",
									children: item.edition
								})] }) : null]
							}),
							item.progress !== void 0 && (item.status === "reading" || item.status === "paused") ? /* @__PURE__ */ jsxs("div", {
								className: "flex flex-col gap-1 pt-0.5",
								children: [/* @__PURE__ */ jsx("div", {
									role: "progressbar",
									"aria-valuemin": 0,
									"aria-valuemax": 100,
									"aria-valuenow": Math.round(Math.min(1, Math.max(0, item.progress)) * 100),
									"aria-label": `${item.title} — progress`,
									className: "luc-well h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken",
									children: /* @__PURE__ */ jsx("div", {
										className: "h-full rounded-full bg-accent-default",
										style: { width: `${Math.min(1, Math.max(0, item.progress)) * 100}%` }
									})
								}), item.progressLabel ? /* @__PURE__ */ jsx("p", {
									className: "text-micro text-fg-muted luc-numeric",
									children: item.progressLabel
								}) : null]
							}) : null,
							item.note ? /* @__PURE__ */ jsx("p", {
								className: "max-w-[62ch] text-caption text-fg-secondary text-pretty",
								children: item.note
							}) : null
						]
					})]
				}, item.id))
			})]
		}, group.status))
	});
}
//#endregion
export { ReadingShelf };

//# sourceMappingURL=reading-shelf.js.map