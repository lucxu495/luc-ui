"use client";
import { useControllableState } from "../hooks/use-controllable-state.js";
import { cn } from "../utils/cn.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/experiences/project-showcase.tsx
function ProjectShowcase({ projects, renderMedia, renderDetail, value, defaultValue, onValueChange, defaultOpenFirst = false, label = "Projects", columns = 2, className, ...props }) {
	const [openId, setOpenId] = useControllableState({
		value,
		defaultValue: defaultValue ?? (defaultOpenFirst ? projects[0]?.id ?? null : null),
		onChange: onValueChange
	});
	const open = projects.find((project) => project.id === openId) ?? null;
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "project-showcase",
		"data-open": open ? "true" : "false",
		className: cn("flex flex-col gap-6", open && "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start lg:gap-8", className),
		...props,
		children: [/* @__PURE__ */ jsx("ul", {
			"aria-label": label,
			className: cn("grid list-none gap-4", columns === 1 && "sm:grid-cols-1", columns === 2 && "sm:grid-cols-2", columns === 3 && "sm:grid-cols-2 xl:grid-cols-3", open && "sm:grid-cols-1"),
			children: projects.map((project) => {
				const isOpen = project.id === openId;
				return /* @__PURE__ */ jsx("li", {
					className: "min-w-0",
					children: /* @__PURE__ */ jsxs("button", {
						type: "button",
						"aria-expanded": isOpen,
						onClick: () => setOpenId(isOpen ? null : project.id),
						className: cn("luc-rest luc-hover luc-settle luc-focus group flex w-full flex-col overflow-hidden text-left", "rounded-md border bg-surface-raised", isOpen ? "border-line-accent" : "border-line-subtle hover:border-line-default"),
						children: [/* @__PURE__ */ jsx("span", {
							className: "relative block aspect-[4/3] w-full overflow-hidden bg-surface-sunken",
							children: renderMedia ? renderMedia(project) : /* @__PURE__ */ jsx("span", {
								className: "flex size-full items-center justify-center bg-gradient-to-br from-accent-soft to-surface-sunken",
								children: /* @__PURE__ */ jsx("span", {
									className: "px-4 text-center font-display text-heading font-semibold text-fg-accent",
									children: project.title
								})
							})
						}), /* @__PURE__ */ jsxs("span", {
							className: "flex min-w-0 flex-col gap-1 p-4",
							children: [/* @__PURE__ */ jsxs("span", {
								className: "flex items-baseline justify-between gap-3",
								children: [/* @__PURE__ */ jsx("span", {
									className: "truncate text-title font-semibold text-fg-primary",
									children: project.title
								}), project.status ? /* @__PURE__ */ jsx("span", {
									className: "shrink-0 text-micro text-fg-muted",
									children: project.status
								}) : null]
							}), project.summary ? /* @__PURE__ */ jsx("span", {
								className: "text-caption text-fg-secondary",
								children: project.summary
							}) : null]
						})]
					})
				}, project.id);
			})
		}), open ? /* @__PURE__ */ jsxs("section", {
			"aria-label": open.title,
			className: "luc-float flex flex-col gap-4 rounded-md border border-line-subtle bg-surface-overlay p-5 lg:sticky lg:top-24",
			children: [
				/* @__PURE__ */ jsxs("header", {
					className: "flex flex-col gap-2",
					children: [/* @__PURE__ */ jsx("h3", {
						className: "font-display text-heading-sm font-semibold text-fg-primary text-balance",
						children: open.title
					}), open.summary ? /* @__PURE__ */ jsx("p", {
						className: "text-body text-fg-secondary text-pretty",
						children: open.summary
					}) : null]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "flex flex-col gap-3 text-body text-fg-secondary",
					children: renderDetail(open)
				}),
				open.meta && open.meta.length > 0 ? /* @__PURE__ */ jsx("dl", {
					className: "grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line-subtle pt-4",
					children: open.meta.map((fact) => /* @__PURE__ */ jsxs("div", {
						className: "flex min-w-0 flex-col gap-0.5",
						children: [/* @__PURE__ */ jsx("dt", {
							className: "text-micro text-fg-muted",
							children: fact.label
						}), /* @__PURE__ */ jsx("dd", {
							className: "truncate text-label text-fg-primary",
							children: fact.value
						})]
					}, fact.id))
				}) : null,
				open.links && open.links.length > 0 ? /* @__PURE__ */ jsx("ul", {
					className: "flex list-none flex-wrap gap-3 border-t border-line-subtle pt-4",
					children: open.links.map((link) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", {
						href: link.href,
						className: "text-label font-medium text-fg-accent underline decoration-line-accent underline-offset-4 hover:decoration-accent-default",
						.../^https?:\/\//i.test(link.href) ? {
							target: "_blank",
							rel: "noreferrer noopener"
						} : {},
						children: link.label
					}) }, link.id))
				}) : null,
				open.tags && open.tags.length > 0 ? /* @__PURE__ */ jsx("ul", {
					className: "flex list-none flex-wrap gap-1.5",
					children: open.tags.map((tag) => /* @__PURE__ */ jsx("li", {
						className: "rounded-xs border border-line-subtle bg-surface-interactive px-2 py-0.5 text-micro text-fg-muted",
						children: tag
					}, tag))
				}) : null
			]
		}, open.id) : null]
	});
}
//#endregion
export { ProjectShowcase };

//# sourceMappingURL=project-showcase.js.map