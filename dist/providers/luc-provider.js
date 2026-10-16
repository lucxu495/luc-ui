"use client";
import { ThemeProvider } from "./theme-provider.js";
import { jsx } from "react/jsx-runtime";
import { Tooltip } from "radix-ui";
//#region src/providers/luc-provider.tsx
/**
* LUC UI root provider.
*
* Wraps the theme and the shared tooltip timing. Render it once, as high in the
* tree as possible — a product should not have to remember which Radix
* provider each primitive needs.
*/
function LucProvider({ children, defaultTheme = "system", storageKey = "luc-ui-theme", tooltipDelayDuration = 220 }) {
	return /* @__PURE__ */ jsx(ThemeProvider, {
		defaultTheme,
		storageKey,
		children: /* @__PURE__ */ jsx(Tooltip.Provider, {
			delayDuration: tooltipDelayDuration,
			skipDelayDuration: 300,
			children
		})
	});
}
//#endregion
export { LucProvider };

//# sourceMappingURL=luc-provider.js.map