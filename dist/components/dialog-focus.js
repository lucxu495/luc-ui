"use client";
import { useRef } from "react";
//#region src/components/dialog-focus.ts
/**
* Focus restore for a modal overlay, including the controlled case.
*
* Radix moves focus into the content on open and, on close, restores it to
* `triggerRef.current` — the element registered by `DialogTrigger`. A modal
* that a product opens itself (the image lightbox, a tour, a command palette
* driven by a keyboard shortcut, a sheet opened from a table row's action)
* renders no `DialogTrigger`, so `triggerRef` is null, Radix calls
* `preventDefault()` and focuses nothing, and the browser drops focus onto
* `<body>`. A keyboard user closing that overlay lands at the top of the
* document with no way back to what they were doing.
*
* This is the missing half of the same contract: remember what was focused when
* the overlay opened, and put focus back there if Radix did not already handle
* it. Radix's own handler still runs first and still wins when there is a
* trigger to return to.
*
* Returns the two props to spread onto the modal content element.
*/
function useDialogFocusRestore(handlers = {}) {
	const previouslyFocused = useRef(null);
	return {
		onOpenAutoFocus: (event) => {
			const active = typeof document === "undefined" ? null : document.activeElement;
			previouslyFocused.current = active instanceof HTMLElement ? active : null;
			handlers.onOpenAutoFocus?.(event);
		},
		onCloseAutoFocus: (event) => {
			handlers.onCloseAutoFocus?.(event);
			const target = previouslyFocused.current;
			if (!target) return;
			window.setTimeout(() => {
				const active = document.activeElement;
				if ((!active || active === document.body || !active.isConnected) && target.isConnected) target.focus({ preventScroll: true });
			}, 0);
		}
	};
}
//#endregion
export { useDialogFocusRestore };

//# sourceMappingURL=dialog-focus.js.map