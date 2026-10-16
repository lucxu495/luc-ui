import { cn } from "../utils/cn.js";
import { jsx } from "react/jsx-runtime";
//#region src/layout/stack.tsx
const gapClass = {
	none: "gap-0",
	"2xs": "gap-1",
	xs: "gap-1.5",
	sm: "gap-2",
	md: "gap-3",
	lg: "gap-4",
	xl: "gap-6",
	"2xl": "gap-8"
};
const alignClass = {
	start: "items-start",
	center: "items-center",
	end: "items-end",
	stretch: "items-stretch",
	baseline: "items-baseline"
};
const justifyClass = {
	start: "justify-start",
	center: "justify-center",
	end: "justify-end",
	between: "justify-between",
	around: "justify-around"
};
/** Vertical rhythm primitive. One direction, one gap, no surprises. */
function Stack({ className, gap = "md", align, justify, as = "div", ...props }) {
	return /* @__PURE__ */ jsx(as, {
		"data-slot": "stack",
		className: cn("flex flex-col", gapClass[gap], align && alignClass[align], justify && justifyClass[justify], className),
		...props
	});
}
//#endregion
export { Stack, alignClass, gapClass, justifyClass };

//# sourceMappingURL=stack.js.map