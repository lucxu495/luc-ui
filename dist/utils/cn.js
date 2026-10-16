import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
//#region src/utils/cn.ts
const twMerge = extendTailwindMerge({ extend: { classGroups: { "font-size": [{ text: [
	"micro",
	"caption",
	"label",
	"body",
	"body-lg",
	"title",
	"heading-sm",
	"heading",
	"display-sm",
	"display"
] }] } } });
/**
* Merge conditional class names and de-duplicate conflicting Tailwind
* utilities (last one wins). Every LUC component funnels `className` here so
* consumer overrides behave predictably.
*/
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
//#endregion
export { cn };

//# sourceMappingURL=cn.js.map