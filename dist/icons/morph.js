"use client";
import { jsx } from "react/jsx-runtime";
import { MorphIcon } from "morphicons/react";
import { PanelLeftClose, PanelLeftOpen } from "lucide";
//#region src/icons/morph.tsx
/** MorphIcons uses Lucide's *shape nodes*, without the outer SVG element.
* Lucide's plain data package exposes ["svg", attrs, children]. Passing the
* wrapper to MorphIcons causes an SSR prerender crash (.for is not iterable).
*/
function morphNodes(tree) {
	if (!Array.isArray(tree) || tree[0] !== "svg" || !Array.isArray(tree[2])) throw new Error("Expected Lucide icon-node data");
	return tree[2];
}
const CLOSED = morphNodes(PanelLeftClose);
const OPEN = morphNodes(PanelLeftOpen);
/** Collapsing/expanding a panel is a stateful change, not a decorative hover. */
function SidebarStateMorphIcon({ collapsed }) {
	return /* @__PURE__ */ jsx(MorphIcon, {
		"data-slot": "sidebar-state-morph",
		icon: collapsed ? OPEN : CLOSED,
		size: 16,
		className: "size-4",
		reducedMotion: "user"
	});
}
//#endregion
export { SidebarStateMorphIcon };

//# sourceMappingURL=morph.js.map