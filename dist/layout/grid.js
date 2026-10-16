import { cn } from "../utils/cn.js";
import { gapClass } from "./stack.js";
import { jsx } from "react/jsx-runtime";
//#region src/layout/grid.tsx
const columnsClass = {
	1: "grid-cols-1",
	2: "grid-cols-1 sm:grid-cols-2",
	3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
	4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
	5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
	6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
	8: "grid-cols-2 sm:grid-cols-4 lg:grid-cols-8",
	12: "grid-cols-4 sm:grid-cols-6 lg:grid-cols-12"
};
const minWidthClass = {
	none: "",
	sm: "[grid-template-columns:repeat(auto-fill,minmax(12rem,1fr))]",
	md: "[grid-template-columns:repeat(auto-fill,minmax(16rem,1fr))]",
	lg: "[grid-template-columns:repeat(auto-fill,minmax(20rem,1fr))]",
	xl: "[grid-template-columns:repeat(auto-fill,minmax(26rem,1fr))]"
};
/** Responsive grid. Picks a sane breakpoint stack per column count. */
function Grid({ className, columns = 3, minItemWidth = "none", gap = "md", ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "grid",
		className: cn("grid", minItemWidth === "none" ? columnsClass[columns] : minWidthClass[minItemWidth], gapClass[gap], className),
		...props
	});
}
//#endregion
export { Grid };

//# sourceMappingURL=grid.js.map