"use client";

import { useRef } from "react";

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
export function useDialogFocusRestore(
  handlers: {
    onOpenAutoFocus?: (event: Event) => void;
    onCloseAutoFocus?: (event: Event) => void;
  } = {},
) {
  const previouslyFocused = useRef<HTMLElement | null>(null);

  return {
    onOpenAutoFocus: (event: Event) => {
      /*
       * Runs before Radix's own handler, which is what makes the capture
       * correct: at this point the active element is still whatever the user
       * activated, not the dialog.
       */
      const active = typeof document === "undefined" ? null : document.activeElement;
      previouslyFocused.current = active instanceof HTMLElement ? active : null;
      handlers.onOpenAutoFocus?.(event);
    },
    onCloseAutoFocus: (event: Event) => {
      handlers.onCloseAutoFocus?.(event);
      const target = previouslyFocused.current;
      if (!target) return;
      /*
       * Deferred by one task so it cannot race Radix's own restore, which is
       * composed after this handler. If Radix focused the trigger, focus is on
       * a real element and this does nothing.
       */
      window.setTimeout(() => {
        const active = document.activeElement;
        const lost = !active || active === document.body || !active.isConnected;
        if (lost && target.isConnected) target.focus({ preventScroll: true });
      }, 0);
    },
  };
}
