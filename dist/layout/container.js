import { cn } from "../utils/cn.js";
import { jsx } from "react/jsx-runtime";
//#region src/layout/container.tsx
/** Page-level width constraint. The only component allowed to set max-width. */
function Container({ className, width = "content", gutter = true, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "container",
		className: cn("mx-auto w-full", width === "content" && "max-w-[var(--container-content)]", width === "prose" && "max-w-[var(--container-prose)]", gutter && "px-5 sm:px-7 lg:px-9", className),
		...props
	});
}
//#endregion
export { Container };

//# sourceMappingURL=container.js.map