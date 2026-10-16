import { cn } from "../utils/cn.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
//#region src/experiences/experience-timeline.tsx
function ExperienceTimeline({ items, variant = "rail", density = "default", currentLabel = "Present", className, ...props }) {
	return /* @__PURE__ */ jsx("ol", {
		"data-slot": "experience-timeline",
		"data-variant": variant,
		className: cn("flex list-none flex-col", className),
		...props,
		children: items.map((entry, index) => {
			const last = index === items.length - 1;
			return /* @__PURE__ */ jsxs("li", {
				className: "relative flex gap-4 pb-8 last:pb-0 sm:gap-6",
				children: [variant === "rail" ? /* @__PURE__ */ jsxs("div", {
					"aria-hidden": "true",
					className: "relative flex w-4 shrink-0 flex-col items-center",
					children: [/* @__PURE__ */ jsx("span", { className: cn("mt-1.5 size-2.5 shrink-0 rounded-full border", entry.current ? "border-line-accent bg-accent-default" : "border-line-strong bg-surface-raised") }), !last ? /* @__PURE__ */ jsx("span", { className: "mt-1 w-px flex-1 bg-line-subtle" }) : null]
				}) : null, /* @__PURE__ */ jsxs("div", {
					className: "flex min-w-0 flex-1 flex-col gap-2",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex flex-wrap items-baseline gap-x-3 gap-y-1",
							children: [/* @__PURE__ */ jsx("h3", {
								className: "text-heading-sm font-semibold text-fg-primary text-balance",
								children: entry.role
							}), entry.current ? /* @__PURE__ */ jsx("span", {
								className: "rounded-full border border-line-accent bg-accent-soft px-2 py-0.5 text-micro font-medium text-fg-accent",
								children: entry.currentLabel ?? currentLabel
							}) : null]
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "flex flex-wrap items-baseline gap-x-2 gap-y-1 text-label text-fg-secondary",
							children: [
								/* @__PURE__ */ jsx("span", {
									className: "font-medium",
									children: entry.org
								}),
								entry.location ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("span", {
									"aria-hidden": "true",
									className: "text-fg-muted",
									children: "·"
								}), /* @__PURE__ */ jsx("span", {
									className: "text-fg-muted",
									children: entry.location
								})] }) : null,
								/* @__PURE__ */ jsx("span", {
									"aria-hidden": "true",
									className: "text-fg-muted",
									children: "·"
								}),
								/* @__PURE__ */ jsxs("time", {
									dateTime: entry.to ? `${entry.from}/${entry.to}` : entry.from,
									className: "text-fg-muted luc-numeric tabular-nums",
									children: [
										entry.from,
										" — ",
										entry.to ?? entry.currentLabel ?? currentLabel
									]
								})
							]
						}),
						entry.summary ? /* @__PURE__ */ jsx("div", {
							className: "max-w-[68ch] text-body text-fg-secondary text-pretty",
							children: entry.summary
						}) : null,
						density === "default" && entry.highlights && entry.highlights.length > 0 ? /* @__PURE__ */ jsx("ul", {
							className: "flex list-disc flex-col gap-1 pl-5 text-body text-fg-secondary marker:text-fg-muted",
							children: entry.highlights.map((highlight) => /* @__PURE__ */ jsx("li", {
								className: "text-pretty",
								children: highlight
							}, highlight))
						}) : null,
						density === "default" && entry.tags && entry.tags.length > 0 ? /* @__PURE__ */ jsx("ul", {
							className: "flex list-none flex-wrap gap-1.5 pt-1",
							children: entry.tags.map((tag) => /* @__PURE__ */ jsx("li", {
								className: "rounded-xs border border-line-subtle bg-surface-interactive px-2 py-0.5 text-micro text-fg-muted",
								children: tag
							}, tag))
						}) : null
					]
				})]
			}, entry.id);
		})
	});
}
//#endregion
export { ExperienceTimeline };

//# sourceMappingURL=experience-timeline.js.map