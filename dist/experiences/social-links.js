import { cn } from "../utils/cn.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/experiences/social-links.tsx
function SocialLinks({ links, orientation = "row", withHandles = true, size = "md", label = "Profiles and contact", className, ...props }) {
	return /* @__PURE__ */ jsx("ul", {
		"data-slot": "social-links",
		"data-orientation": orientation,
		"aria-label": label,
		className: cn("flex list-none gap-2", orientation === "row" ? "flex-wrap items-center" : "flex-col items-stretch", className),
		...props,
		children: links.map((link) => {
			const external = link.external ?? /^https?:\/\//i.test(link.href);
			const name = link.handle ? `${link.label}, ${link.handle}` : link.label;
			return /* @__PURE__ */ jsx("li", {
				className: cn(orientation === "column" && "w-full"),
				children: /* @__PURE__ */ jsxs("a", {
					href: link.href,
					...external ? {
						target: "_blank",
						rel: "noreferrer noopener"
					} : {},
					"aria-label": external ? `${name} — ${link.externalHint ?? "opens in a new tab"}` : name,
					className: cn("luc-rest luc-hover luc-settle group flex items-center gap-2", "rounded-sm border border-line-subtle bg-surface-raised text-fg-secondary", "hover:text-fg-primary", size === "sm" ? "h-8 px-2.5 text-caption" : "h-9 px-3 text-label", orientation === "column" && "w-full"),
					children: [
						link.icon ? /* @__PURE__ */ jsx("span", {
							"aria-hidden": "true",
							className: "shrink-0 text-fg-muted group-hover:text-fg-accent",
							children: link.icon
						}) : null,
						/* @__PURE__ */ jsx("span", {
							className: "truncate font-medium",
							children: link.label
						}),
						withHandles && link.handle ? /* @__PURE__ */ jsx("span", {
							className: "truncate text-fg-muted luc-numeric",
							children: link.handle
						}) : null
					]
				})
			}, link.id);
		})
	});
}
//#endregion
export { SocialLinks };

//# sourceMappingURL=social-links.js.map