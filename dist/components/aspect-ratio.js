"use client";
import { cn } from "../utils/cn.js";
import { jsx } from "react/jsx-runtime";
import { AspectRatio } from "radix-ui";
//#region src/components/aspect-ratio.tsx
const presetRatio = {
	square: 1,
	video: 16 / 9,
	photo: 4 / 3,
	wide: 21 / 9,
	portrait: 3 / 4,
	ultrawide: 32 / 9
};
function AspectRatio$1({ className, ratio = "square", ...props }) {
	const resolved = typeof ratio === "number" ? ratio : presetRatio[ratio] ?? 1;
	return /* @__PURE__ */ jsx(AspectRatio.Root, {
		"data-slot": "aspect-ratio",
		ratio: resolved,
		className: cn("relative w-full overflow-hidden", className),
		...props
	});
}
//#endregion
export { AspectRatio$1 as AspectRatio };

//# sourceMappingURL=aspect-ratio.js.map