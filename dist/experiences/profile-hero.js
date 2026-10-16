import { cn } from "../utils/cn.js";
import { SocialLinks } from "./social-links.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/experiences/profile-hero.tsx
function ProfileHero({ name, title, lead, eyebrow, portrait, facts, links, actions, align = "portrait-end", variant = "editorial", className, ...props }) {
	const centered = align === "centered";
	return /* @__PURE__ */ jsxs("header", {
		"data-slot": "profile-hero",
		"data-variant": variant,
		"data-align": align,
		className: cn("flex flex-col gap-8", !centered && "sm:flex-row sm:items-start sm:gap-10", !centered && align === "portrait-start" && "sm:flex-row-reverse", centered && "items-center text-center", className),
		...props,
		children: [/* @__PURE__ */ jsxs("div", {
			className: cn("flex min-w-0 flex-1 flex-col gap-4", centered && "items-center"),
			children: [
				eyebrow ? /* @__PURE__ */ jsx("p", {
					className: "text-micro font-medium text-fg-accent",
					children: eyebrow
				}) : null,
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-col gap-2",
					children: [/* @__PURE__ */ jsx("h1", {
						className: cn("font-display font-semibold text-fg-primary text-balance", variant === "editorial" ? "text-display tracking-[-0.03em]" : "text-display-sm tracking-[-0.02em]"),
						children: name
					}), title ? /* @__PURE__ */ jsx("p", {
						className: "text-body-lg text-fg-secondary text-pretty",
						children: title
					}) : null]
				}),
				lead ? /* @__PURE__ */ jsx("div", {
					className: cn("max-w-[62ch] text-body text-fg-secondary text-pretty", variant === "editorial" && "leading-[1.7]"),
					children: lead
				}) : null,
				facts && facts.length > 0 ? /* @__PURE__ */ jsx("dl", {
					className: "flex flex-wrap gap-x-8 gap-y-3",
					children: facts.map((fact) => /* @__PURE__ */ jsxs("div", {
						className: "flex min-w-0 flex-col gap-0.5",
						children: [/* @__PURE__ */ jsx("dt", {
							className: "text-micro text-fg-muted",
							children: fact.label
						}), /* @__PURE__ */ jsx("dd", {
							className: "text-label text-fg-primary luc-numeric",
							children: fact.value
						})]
					}, fact.id))
				}) : null,
				links && links.length > 0 ? /* @__PURE__ */ jsx(SocialLinks, {
					links,
					orientation: "row",
					size: "sm",
					withHandles: false
				}) : null,
				actions ? /* @__PURE__ */ jsx("div", {
					className: cn("flex flex-wrap items-center gap-2 pt-1", centered && "justify-center"),
					children: actions
				}) : null
			]
		}), portrait ? /* @__PURE__ */ jsx("div", {
			className: cn("shrink-0", centered ? "order-first" : "", variant === "editorial" ? "luc-float" : "luc-rest"),
			children: portrait
		}) : null]
	});
}
//#endregion
export { ProfileHero };

//# sourceMappingURL=profile-hero.js.map