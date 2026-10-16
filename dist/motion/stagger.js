"use client";
import { cn } from "../utils/cn.js";
import { distance } from "./tokens.js";
import { Reveal } from "./reveal.js";
import { jsx } from "react/jsx-runtime";
import { createContext, useContext } from "react";
//#region src/motion/stagger.tsx
const StaggerContext = createContext({
	step: .045,
	delay: 0,
	maxItems: 8
});
function StaggerGroup({ className, children, step = .045, delay = 0, maxItems = 8, ...props }) {
	return /* @__PURE__ */ jsx(StaggerContext.Provider, {
		value: {
			step,
			delay,
			maxItems
		},
		children: /* @__PURE__ */ jsx("div", {
			"data-slot": "stagger-group",
			className: cn("min-w-0", className),
			...props,
			children
		})
	});
}
/**
* One item in a `StaggerGroup`.
*
* The explicit `index` is deliberate: an implicit counter breaks as soon as an
* item is conditionally rendered, and a stagger that shifts when one card is
* hidden is worse than no stagger.
*/
function StaggerItem({ className, children, index, distance: travel = distance.sm, ...props }) {
	const group = useContext(StaggerContext);
	const position = Math.min(index, group.maxItems);
	return /* @__PURE__ */ jsx(Reveal, {
		"data-slot": "stagger-item",
		className,
		delay: group.delay + position * group.step,
		distance: travel,
		...props,
		children
	});
}
//#endregion
export { StaggerGroup, StaggerItem };

//# sourceMappingURL=stagger.js.map