import { cn } from "../utils/cn.js";
import { Kbd } from "../typography.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/kbd.tsx
function KbdGroup({ className, keys, size = "md", ...props }) {
	return /* @__PURE__ */ jsx("span", {
		"data-slot": "kbd-group",
		className: cn("inline-flex items-center gap-1", className),
		...props,
		children: keys.map((key, index) => /* @__PURE__ */ jsxs("span", {
			className: "contents",
			children: [index > 0 ? /* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				className: "text-micro text-fg-muted",
				children: "+"
			}) : null, /* @__PURE__ */ jsx(Kbd, {
				size,
				children: key
			})]
		}, `${key}-${index}`))
	});
}
//#endregion
export { KbdGroup };

//# sourceMappingURL=kbd.js.map