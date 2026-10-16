"use client";

import {
  RiAlertFill,
  RiCheckboxCircleFill,
  RiErrorWarningFill,
  RiInformationFill,
  RiLoader4Line,
} from "@remixicon/react";
import { Toaster as SonnerToaster, toast, type ToasterProps } from "sonner";
import { useOptionalTheme } from "../providers/theme-provider";

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
  success: <RiCheckboxCircleFill style={{ color: "var(--fg-positive)" }} />,
  info: <RiInformationFill style={{ color: "var(--fg-info)" }} />,
  warning: <RiAlertFill style={{ color: "var(--fg-warning)" }} />,
  error: <RiErrorWarningFill style={{ color: "var(--fg-negative)" }} />,
  // A frozen spinner reads as a broken toast, so this is one of the few
  // indicators allowed to keep moving under reduced motion (as a slow pulse).
  loading: <RiLoader4Line className="luc-spinner size-4 text-fg-accent" data-motion-essential="" />,
};

export interface ToasterComponentProps extends Omit<ToasterProps, "theme" | "className"> {
  /** Extra classes for the toast viewport. */
  className?: string;
}

/**
 * Mount once, at the app root. The theme is taken from `LucProvider` so the
 * toasts follow an explicit theme choice rather than the OS preference.
 */
export function Toaster({ position = "bottom-right", className, ...props }: ToasterComponentProps) {
  const theme = useOptionalTheme()?.resolvedTheme;

  return (
    <SonnerToaster
      {...props}
      theme={theme ?? "dark"}
      position={position}
      className={className ? `luc-toaster ${className}` : "luc-toaster"}
      icons={icons}
      gap={10}
      offset={20}
      mobileOffset={16}
      visibleToasts={4}
      closeButton
      toastOptions={{
        closeButtonAriaLabel: "Dismiss notification",
        classNames: {
          toast: "luc-toast",
          title: "luc-toast__title",
          description: "luc-toast__description",
          content: "luc-toast__content",
          icon: "luc-toast__icon",
          actionButton: "luc-toast__action",
          cancelButton: "luc-toast__cancel",
          closeButton: "luc-toast__close",
        },
      }}
    />
  );
}

export { toast };
export type { ToasterProps };
