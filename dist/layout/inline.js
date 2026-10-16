import { cn } from "../utils/cn.js";
import { alignClass, gapClass, justifyClass } from "./stack.js";
import { jsx } from "react/jsx-runtime";
//#region src/layout/inline.tsx
/** Horizontal cluster: toolbars, meta rows, label+value pairs. */
function Inline({ className, gap = "sm", align = "center", justify, wrap = true, as = "div", ...props }) {
	return /* @__PURE__ */ jsx(as, {
		"data-slot": "inline",
		className: cn("flex", wrap ? "flex-wrap" : "flex-nowrap", gapClass[gap], alignClass[align], justify && justifyClass[justify], className),
		...props
	});
}
//#endregion
export { Inline };

//# sourceMappingURL=inline.js.map