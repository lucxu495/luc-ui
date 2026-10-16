"use client";
import { useOptionalTheme } from "../providers/theme-provider.js";
import { jsx } from "react/jsx-runtime";
import { RiAlertFill, RiCheckboxCircleFill, RiErrorWarningFill, RiInformationFill, RiLoader4Line } from "@remixicon/react";
import { Toaster as Toaster$1, toast } from "sonner";
//#region src/components/toast.tsx
/**
* LUC Toast.
*
* Behaviour is Sonner's — stacking, swipe-to-dismiss, hover pause, promise
* transitions and the live-region announcements are all mature and battle
* tested, so none of it is re-implemented here. What LUC owns is everything a
* user can see: the surface, the border, the type rail, the icon language,
* the type scale and the z-index layer.
*
* `sonner`'s default skin is replaced through its documented theming surface
* (CSS custom properties + injected `luc-toast*` class names, see
* `styles/toast.css`) rather than by fighting its stylesheet with overrides.
*
*   app root:  <Toaster />
*   anywhere:  toast.success("Saved", { description: "3 rows updated" })
*/
/** Tone-coloured icons. Inline color is the one thing that always wins. */
const icons = {
	success: /* @__PURE__ */ jsx(RiCheckboxCircleFill, { style: { color: "var(--fg-positive)" } }),
	info: /* @__PURE__ */ jsx(RiInformationFill, { style: { color: "var(--fg-info)" } }),
	warning: /* @__PURE__ */ jsx(RiAlertFill, { style: { color: "var(--fg-warning)" } }),
	error: /* @__PURE__ */ jsx(RiErrorWarningFill, { style: { color: "var(--fg-negative)" } }),
	loading: /* @__PURE__ */ jsx(RiLoader4Line, {
		className: "luc-spinner size-4 text-fg-accent",
		"data-motion-essential": ""
	})
};
/**
* Mount once, at the app root. The theme is taken from `LucProvider` so the
* toasts follow an explicit theme choice rather than the OS preference.
*/
function Toaster({ position = "bottom-right", className, ...props }) {
	const theme = useOptionalTheme()?.resolvedTheme;
	return /* @__PURE__ */ jsx(Toaster$1, {
		...props,
		theme: theme ?? "dark",
		position,
		className: className ? `luc-toaster ${className}` : "luc-toaster",
		icons,
		gap: 10,
		offset: 20,
		mobileOffset: 16,
		visibleToasts: 4,
		closeButton: true,
		toastOptions: {
			closeButtonAriaLabel: "Dismiss notification",
			classNames: {
				toast: "luc-toast",
				title: "luc-toast__title",
				description: "luc-toast__description",
				content: "luc-toast__content",
				icon: "luc-toast__icon",
				actionButton: "luc-toast__action",
				cancelButton: "luc-toast__cancel",
				closeButton: "luc-toast__close"
			}
		}
	});
}
//#endregion
export { Toaster, toast };

//# sourceMappingURL=toast.js.map